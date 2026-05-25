#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const projectDir = process.cwd()
const args = new Map()

for (let index = 2; index < process.argv.length; index += 1) {
  const value = process.argv[index]
  if (!value.startsWith('--')) continue
  const [key, inlineValue] = value.slice(2).split('=')
  if (inlineValue !== undefined) {
    args.set(key, inlineValue)
  } else {
    const next = process.argv[index + 1]
    if (next && !next.startsWith('--')) {
      args.set(key, next)
      index += 1
    } else {
      args.set(key, 'true')
    }
  }
}

const envName = args.get('env') ?? process.env.NODE_ENV ?? 'development'
process.env.NODE_ENV = envName
const outputPath =
  args.get('output') ?? path.join('outputs', 'production-readiness', 'storage-upload-results.json')
const PASSWORD = 'password123'

function parseEnvLine(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return null
  const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
  if (!match) return null

  let value = match[2].trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  return [match[1], value]
}

function loadEnvFiles() {
  const candidates = [
    `.env.${envName}.local`,
    '.env.local',
    `.env.${envName}`,
    '.env',
  ]

  for (const fileName of candidates) {
    const filePath = path.join(projectDir, fileName)
    if (!fs.existsSync(filePath)) continue
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
    for (const line of lines) {
      const parsed = parseEnvLine(line)
      if (!parsed) continue
      const [key, value] = parsed
      if (process.env[key] === undefined) process.env[key] = value
    }
  }
}

function isLocalUrl(value) {
  try {
    const url = new URL(value)
    return ['127.0.0.1', 'localhost', '::1'].includes(url.hostname)
  } catch {
    return false
  }
}

function nowIso() {
  return new Date().toISOString()
}

function makeBlob(text, type) {
  return new Blob([text], { type })
}

function checkStatus(checks, name, status, details = {}) {
  checks.push({ name, status, ...details })
}

async function signInClient(supabaseUrl, anonKey, email) {
  const client = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data, error } = await client.auth.signInWithPassword({ email, password: PASSWORD })
  if (error || !data.user) {
    throw new Error(`Could not sign in ${email}: ${error?.message ?? 'missing user'}`)
  }

  return { client, user: data.user }
}

async function publicFetchStatus(url) {
  const response = await fetch(url)
  return response.status
}

async function removeObjects(service, bucket, objectPaths) {
  const filtered = objectPaths.filter(Boolean)
  if (filtered.length === 0) return
  await service.storage.from(bucket).remove(filtered).catch(() => undefined)
}

async function main() {
  loadEnvFiles()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error('Storage smoke requires NEXT_PUBLIC_SUPABASE_URL, anon/publishable key, and SUPABASE_SERVICE_ROLE_KEY.')
  }

  if (!isLocalUrl(supabaseUrl) && args.get('allow-remote-supabase') !== 'true') {
    throw new Error('Refusing to run storage smoke against a non-local Supabase URL. Pass --allow-remote-supabase only for a reviewed staging environment.')
  }

  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
  const checks = []
  const cleanup = {
    eventCovers: [],
    resumes: [],
  }

  const result = {
    generatedAt: nowIso(),
    env: envName,
    supabaseHost: new URL(supabaseUrl).host,
    outputPath,
    checks,
  }

  const { data: buckets, error: bucketsError } = await service.storage.listBuckets()
  if (bucketsError) throw new Error(`Bucket inspection failed: ${bucketsError.message}`)

  const bucketById = new Map((buckets ?? []).map((bucket) => [bucket.id, bucket]))
  const eventCoversBucket = bucketById.get('event-covers')
  const resumesBucket = bucketById.get('resumes')

  checkStatus(checks, 'event-covers bucket exists', eventCoversBucket ? 'pass' : 'fail', {
    expected: 'event-covers bucket exists for event images',
    public: eventCoversBucket?.public ?? null,
    fileSizeLimit: eventCoversBucket?.file_size_limit ?? null,
  })

  checkStatus(checks, 'resumes bucket exists', resumesBucket ? 'pass' : 'fail', {
    expected: 'resumes bucket exists for resume uploads',
    public: resumesBucket?.public ?? null,
    fileSizeLimit: resumesBucket?.file_size_limit ?? null,
  })

  const president = await signInClient(supabaseUrl, anonKey, 'president@test.com')
  const editor = await signInClient(supabaseUrl, anonKey, 'editor@test.com')
  const member = await signInClient(supabaseUrl, anonKey, 'member@test.com')
  const recruiter = await signInClient(supabaseUrl, anonKey, 'recruiter@test.com')

  const coverBlob = makeBlob('not-a-real-image-but-valid-storage-smoke', 'image/png')

  async function tryEventCoverUpload(label, actor, expectedPass) {
    const objectPath = `${actor.user.id}/qa-cover-${Date.now()}-${Math.random().toString(16).slice(2)}.png`
    const { data, error } = await actor.client.storage
      .from('event-covers')
      .upload(objectPath, coverBlob, {
        contentType: 'image/png',
        upsert: false,
      })

    if (!error && data?.path) cleanup.eventCovers.push(data.path)

    const publicUrl = actor.client.storage.from('event-covers').getPublicUrl(objectPath).data.publicUrl
    const publicStatus = !error ? await publicFetchStatus(publicUrl).catch(() => null) : null
    const passedExpectation = expectedPass ? !error && publicStatus === 200 : Boolean(error)

    checkStatus(checks, label, passedExpectation ? 'pass' : 'fail', {
      expected: expectedPass ? 'upload succeeds and public URL returns 200' : 'upload is denied',
      actual: error ? error.message : `uploaded; public HTTP ${publicStatus}`,
      publicStatus,
    })
  }

  if (eventCoversBucket) {
    await tryEventCoverUpload('president event cover upload', president, true)
    await tryEventCoverUpload('legacy editor event cover upload', editor, true)
  }

  if (resumesBucket) {
    const resumeBlob = makeBlob('%PDF-1.4\nstorage smoke\n', 'application/pdf')
    const ownPath = `${member.user.id}/qa-resume-${Date.now()}.pdf`
    const crossPath = `${recruiter.user.id}/qa-cross-user-resume-${Date.now()}.pdf`

    const ownUpload = await member.client.storage.from('resumes').upload(ownPath, resumeBlob, {
      contentType: 'application/pdf',
      upsert: false,
    })
    if (!ownUpload.error) cleanup.resumes.push(ownPath)

    checkStatus(checks, 'member own resume upload', ownUpload.error ? 'fail' : 'pass', {
      expected: 'member can upload resume under own user folder',
      actual: ownUpload.error?.message ?? 'uploaded',
    })

    const publicUrl = member.client.storage.from('resumes').getPublicUrl(ownPath).data.publicUrl
    const anonStatus = !ownUpload.error ? await publicFetchStatus(publicUrl).catch(() => null) : null
    checkStatus(checks, 'anonymous public resume URL blocked', anonStatus === 200 ? 'fail' : 'pass', {
      expected: 'anonymous direct public URL should not expose private resume',
      actual: ownUpload.error ? 'not tested because upload failed' : `HTTP ${anonStatus}`,
    })

    const crossUpload = await member.client.storage.from('resumes').upload(crossPath, resumeBlob, {
      contentType: 'application/pdf',
      upsert: false,
    })
    if (!crossUpload.error) cleanup.resumes.push(crossPath)

    checkStatus(checks, 'cross-user resume upload denied', crossUpload.error ? 'pass' : 'fail', {
      expected: 'member cannot upload a resume under another user folder',
      actual: crossUpload.error?.message ?? 'cross-user upload succeeded',
    })
  } else {
    checkStatus(checks, 'resume upload/access checks', 'not_testable', {
      reason: 'resumes bucket is missing, so upload and authorization checks cannot run.',
    })
  }

  await removeObjects(service, 'event-covers', cleanup.eventCovers)
  await removeObjects(service, 'resumes', cleanup.resumes)

  const failures = checks.filter((check) => check.status === 'fail')
  result.status = failures.length > 0 ? 'fail' : 'pass'
  result.failureCount = failures.length

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`)

  console.log(`Storage upload smoke complete: ${result.status}`)
  console.log(`Evidence written to ${outputPath}`)

  if (failures.length > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  const failure = {
    generatedAt: nowIso(),
    status: 'fail',
    error: error instanceof Error ? error.message : String(error),
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(failure, null, 2)}\n`)
  console.error(failure.error)
  process.exitCode = 1
})

