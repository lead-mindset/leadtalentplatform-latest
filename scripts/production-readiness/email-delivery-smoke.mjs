#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import nodemailer from 'nodemailer'
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

const mode = args.get('mode') ?? 'local-auth'
const envName = args.get('env') ?? process.env.NODE_ENV ?? 'development'
process.env.NODE_ENV = envName

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

loadEnvFiles()

const outputPath =
  args.get('output') ?? path.join('outputs', 'production-readiness', 'email-delivery-results.json')
const mailpitApiUrl = args.get('mailpit-url') ?? process.env.MAILPIT_API_URL ?? 'http://127.0.0.1:54390'
const timeoutMs = Number(args.get('timeout-ms') ?? process.env.EMAIL_QA_TIMEOUT_MS ?? 20_000)

function nowIso() {
  return new Date().toISOString()
}

function makeEmail(prefix) {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  return `${prefix}-${suffix}@example.test`
}

function isLocalUrl(value) {
  try {
    const url = new URL(value)
    return ['127.0.0.1', 'localhost', '::1'].includes(url.hostname)
  } catch {
    return false
  }
}

function redactEmail(value) {
  const [local, domain] = value.split('@')
  if (!domain) return '[redacted-email]'
  return `${local.slice(0, 5)}...@${domain}`
}

function messageId(message) {
  return String(message.ID ?? message.Id ?? message.id ?? message.MessageID ?? '')
}

function messageSubject(message) {
  return String(message.Subject ?? message.subject ?? '')
}

function messageContainsRecipient(message, email) {
  return JSON.stringify(message).toLowerCase().includes(email.toLowerCase())
}

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed ${response.status} ${url}`)
  }
  return response.json()
}

async function listMailpitMessages() {
  const data = await fetchJson(`${mailpitApiUrl.replace(/\/$/, '')}/api/v1/messages`)
  return Array.isArray(data.messages) ? data.messages : []
}

async function getMailpitMessage(id) {
  if (!id) return null
  try {
    return await fetchJson(`${mailpitApiUrl.replace(/\/$/, '')}/api/v1/message/${encodeURIComponent(id)}`)
  } catch {
    return null
  }
}

async function waitForMailpitMessage(email, beforeIds) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    const messages = await listMailpitMessages()
    const match = messages.find((message) => {
      const id = messageId(message)
      return id && !beforeIds.has(id) && messageContainsRecipient(message, email)
    })

    if (match) {
      const detail = await getMailpitMessage(messageId(match))
      return { summary: match, detail }
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000))
  }

  throw new Error(`No Mailpit message found for ${redactEmail(email)} within ${timeoutMs}ms`)
}

function findLinks(message) {
  const text = [
    message?.detail?.Text,
    message?.detail?.HTML,
    message?.summary?.Snippet,
    message?.summary?.Text,
    message?.summary?.HTML,
  ]
    .filter(Boolean)
    .join('\n')

  return Array.from(text.matchAll(/https?:\/\/[^\s"'<>]+/g)).map((match) => match[0])
}

async function runLocalAuthChecks(checks) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error('Local auth email smoke requires NEXT_PUBLIC_SUPABASE_URL, anon/publishable key, and SUPABASE_SERVICE_ROLE_KEY.')
  }

  if (!isLocalUrl(supabaseUrl) && args.get('allow-remote-supabase') !== 'true') {
    throw new Error('Refusing to create auth smoke users against a non-local Supabase URL. Pass --allow-remote-supabase only for a reviewed staging environment.')
  }

  const anon = createClient(supabaseUrl, anonKey)
  const admin = createClient(supabaseUrl, serviceRoleKey)
  const redirectTo = process.env.AUTH_EMAIL_REDIRECT_TO ?? 'http://localhost:3000/es/auth/confirm'
  const beforeMessages = await listMailpitMessages()
  const beforeIds = new Set(beforeMessages.map(messageId).filter(Boolean))
  const createdUserIds = []

  const inviteEmail = makeEmail('qa-invite')
  const inviteResult = await admin.auth.admin.inviteUserByEmail(inviteEmail, { redirectTo })
  if (inviteResult.error) {
    throw new Error(`Supabase invite email failed: ${inviteResult.error.message}`)
  }
  if (inviteResult.data?.user?.id) createdUserIds.push(inviteResult.data.user.id)

  const inviteMessage = await waitForMailpitMessage(inviteEmail, beforeIds)
  checks.push({
    name: 'local auth invite email',
    status: 'pass',
    environment: 'local-mailpit',
    recipient: redactEmail(inviteEmail),
    subject: messageSubject(inviteMessage.summary),
    linksFound: findLinks(inviteMessage).length,
  })

  const resetEmail = makeEmail('qa-reset')
  const createUser = await admin.auth.admin.createUser({
    email: resetEmail,
    password: 'password123',
    email_confirm: true,
  })
  if (createUser.error) {
    throw new Error(`Supabase reset test user creation failed: ${createUser.error.message}`)
  }
  if (createUser.data?.user?.id) createdUserIds.push(createUser.data.user.id)

  const resetResult = await anon.auth.resetPasswordForEmail(resetEmail, { redirectTo })
  if (resetResult.error) {
    throw new Error(`Supabase password reset email failed: ${resetResult.error.message}`)
  }

  const resetMessage = await waitForMailpitMessage(resetEmail, beforeIds)
  checks.push({
    name: 'local auth password reset email',
    status: 'pass',
    environment: 'local-mailpit',
    recipient: redactEmail(resetEmail),
    subject: messageSubject(resetMessage.summary),
    linksFound: findLinks(resetMessage).length,
  })

  for (const userId of createdUserIds) {
    await admin.auth.admin.deleteUser(userId).catch(() => undefined)
  }
}

async function runSmtpSmoke(checks) {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'QA_EMAIL_TO']
  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    checks.push({
      name: 'provider SMTP smoke',
      status: 'not_testable',
      environment: envName,
      missing,
      notes: 'Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and QA_EMAIL_TO to send one controlled provider-backed smoke email.',
    })
    return
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.verify()
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `LEAD Talent Platform <${process.env.SMTP_USER}>`,
    to: process.env.QA_EMAIL_TO,
    subject: `LEAD production-readiness email smoke ${nowIso()}`,
    html: '<p>This is a controlled LEAD Talent Platform production-readiness smoke email.</p>',
    text: 'This is a controlled LEAD Talent Platform production-readiness smoke email.',
  })

  checks.push({
    name: 'provider SMTP smoke',
    status: 'pass',
    environment: envName,
    recipient: redactEmail(process.env.QA_EMAIL_TO),
    acceptedCount: info.accepted?.length ?? 0,
    rejectedCount: info.rejected?.length ?? 0,
    messageIdPresent: Boolean(info.messageId),
  })
}

const checks = []
const result = {
  generatedAt: nowIso(),
  mode,
  env: envName,
  mailpitApiUrl,
  outputPath,
  checks,
}

try {
  if (mode === 'local-auth' || mode === 'all') {
    await runLocalAuthChecks(checks)
  }

  if (mode === 'smtp' || mode === 'all') {
    await runSmtpSmoke(checks)
  }

  result.status = checks.every((check) => check.status === 'pass') ? 'pass' : 'pass_with_not_testable'
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`)
  console.log(`Email delivery smoke complete: ${result.status}`)
  console.log(`Evidence written to ${outputPath}`)
} catch (error) {
  result.status = 'fail'
  result.error = error instanceof Error ? error.message : String(error)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`)
  console.error(result.error)
  process.exitCode = 1
}
