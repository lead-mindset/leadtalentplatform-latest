export type MatchConfidence = 'high' | 'medium' | 'low'
export type ChapterMatchConfidence = MatchConfidence | 'none'
export type NormalizedEboardStatus = 'ready' | 'needs_review' | 'blocked'
export type ProposedEboardAppRole = 'member' | 'editor'

export type ChapterMappingConfig = {
  version: number
  source: string
  noFallback: boolean
  chapters: Array<{
    canonicalChapterId: string
    canonicalName: string
    university?: string
    aliases: string[]
    notes?: string
  }>
}

export type RoleMappingConfig = {
  version: number
  source: string
  allowedProposedAppRoles: ProposedEboardAppRole[]
  default: RoleMappingResult
  mappings: RoleMappingRule[]
}

export type RoleMappingRule = RoleMappingResult & {
  id: string
  match: string[]
}

export type RoleMappingResult = {
  roleLevel: string
  functionalArea: string
  proposedAppRole: ProposedEboardAppRole
  proposedMembershipPosition: string
  proposedIdentityType: string
  confidence: MatchConfidence
  requiresReview: boolean
  reviewReason?: string
}

export type MajorMappingConfig = {
  version: number
  source: string
  default: MajorMappingResult
  mappings: MajorMappingRule[]
}

export type MajorMappingRule = MajorMappingResult & {
  id: string
  match: string[]
}

export type MajorMappingResult = {
  standardizedMajor: string
  majorFamily: string
  confidence: MatchConfidence
  requiresReview: boolean
}

export type RawEboardRow = {
  sourceRowNumber: number
  name: string
  email: string
  confirmEmail: string
  chapter: string
  roleTitle: string
  major: string
  phone: string
}

export type NormalizedEboardRow = {
  sourceRowNumber: number
  sourceRowNumbers: number[]
  status: NormalizedEboardStatus
  reviewReasons: string[]
  raw: Omit<RawEboardRow, 'sourceRowNumber'>
  normalized: {
    name: string
    email: string
    phone: string | null
    canonicalChapterId: string | null
    canonicalChapterName: string | null
    roleLevel: string
    functionalArea: string
    proposedAppRole: ProposedEboardAppRole
    proposedMembershipPosition: string
    proposedIdentityType: string
    standardizedMajor: string
    majorFamily: string
    isRecruiterVisible: false
    memberIdStrategy: 'generate_on_import'
  }
  mapping: {
    chapterConfidence: ChapterMatchConfidence
    roleConfidence: MatchConfidence
    majorConfidence: MatchConfidence
    proposedEditorRequiresReview: boolean
  }
}

export type DuplicateGroup = {
  email: string
  sourceRowNumbers: number[]
  hasConflict: boolean
  reasons: string[]
}

export type NormalizeCsvInput = {
  csvText: string
  chapterMapping: ChapterMappingConfig
  roleMapping: RoleMappingConfig
  majorMapping: MajorMappingConfig
}

export type NormalizeRowsInput = {
  rows: Record<string, string>[]
  chapterMapping: ChapterMappingConfig
  roleMapping: RoleMappingConfig
  majorMapping: MajorMappingConfig
}

export type NormalizeCsvResult = {
  rows: NormalizedEboardRow[]
  readyRows: NormalizedEboardRow[]
  reviewRows: NormalizedEboardRow[]
  blockedRows: NormalizedEboardRow[]
  duplicates: DuplicateGroup[]
  summary: {
    totalRows: number
    readyCount: number
    reviewCount: number
    blockedCount: number
    duplicateEmailCount: number
  }
}

type FieldKey = keyof Omit<RawEboardRow, 'sourceRowNumber'>
type HeaderLookup = Record<FieldKey, string>

const REQUIRED_FIELDS: FieldKey[] = ['name', 'email', 'chapter', 'roleTitle', 'major']
const ALLOWED_APP_ROLES: ProposedEboardAppRole[] = ['member', 'editor']

function normalizeTextForMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\uFFFD/g, '')
    .replace(/[�]/g, '')
    .replace(/Ã¡|Ã|á/g, 'a')
    .replace(/Ã©|é/g, 'e')
    .replace(/Ã­|í/g, 'i')
    .replace(/Ã³|ó/g, 'o')
    .replace(/Ãº|ú/g, 'u')
    .replace(/Ã±|ñ/g, 'n')
    .replace(/["'`]/g, '')
    .replace(/[;]+/g, '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"'
        index++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(field)
      field = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index++
      row.push(field)
      if (row.some((cell) => cell.trim().length > 0)) rows.push(row)
      row = []
      field = ''
      continue
    }

    field += char
  }

  row.push(field)
  if (row.some((cell) => cell.trim().length > 0)) rows.push(row)
  return rows
}

function headerIncludes(header: string, ...needles: string[]): boolean {
  return needles.every((needle) => header.includes(needle))
}

function detectHeaderLookup(headers: string[]): HeaderLookup {
  const normalizedHeaders = headers.map((header) => normalizeTextForMatch(header))

  const findHeader = (field: FieldKey): string | null => {
    const index = normalizedHeaders.findIndex((header) => {
      switch (field) {
        case 'name':
          return headerIncludes(header, 'nombres') || header === 'name'
        case 'email':
          return header.includes('email') && !header.includes('confirm')
        case 'confirmEmail':
          return header.includes('confirm') && header.includes('email')
        case 'chapter':
          return header.includes('chapter')
        case 'roleTitle':
          return header.includes('cargo') || header.includes('role') || header.includes('title')
        case 'major':
          return header.includes('carrera') || header.includes('major')
        case 'phone':
          return header.includes('telefono') || header.includes('phone') || header.includes('contacto')
      }
    })
    return index >= 0 ? headers[index] : null
  }

  const lookup = {
    name: findHeader('name'),
    email: findHeader('email'),
    confirmEmail: findHeader('confirmEmail'),
    chapter: findHeader('chapter'),
    roleTitle: findHeader('roleTitle'),
    major: findHeader('major'),
    phone: findHeader('phone'),
  }

  const missing = REQUIRED_FIELDS.filter((field) => !lookup[field])
  if (missing.length > 0) {
    throw new Error(`Missing required e-board CSV header(s): ${missing.join(', ')}`)
  }

  return {
    name: lookup.name!,
    email: lookup.email!,
    confirmEmail: lookup.confirmEmail ?? '',
    chapter: lookup.chapter!,
    roleTitle: lookup.roleTitle!,
    major: lookup.major!,
    phone: lookup.phone ?? '',
  }
}

function csvToRecords(csvRows: string[][]): Record<string, string>[] {
  const [headers, ...rows] = csvRows
  if (!headers) return []

  return rows.map((row) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = row[index] ?? ''
    })
    return record
  })
}

function extractRawRows(records: Record<string, string>[]): RawEboardRow[] {
  if (records.length === 0) return []
  const lookup = detectHeaderLookup(Object.keys(records[0]))
  const emailHeaders = Object.keys(records[0]).filter((header) => {
    const normalizedHeader = normalizeTextForMatch(header)
    return normalizedHeader.includes('email') && !normalizedHeader.includes('confirm')
  })
  const bestEmailHeader = emailHeaders
    .map((header) => ({
      header,
      validCount: records.filter((record) => isValidEmail(normalizeEmail(record[header] ?? ''))).length,
    }))
    .sort((left, right) => right.validCount - left.validCount)[0]
  const emailHeader = bestEmailHeader && bestEmailHeader.validCount > 0 ? bestEmailHeader.header : lookup.email

  return records.map((record, index) => ({
    sourceRowNumber: index + 2,
    name: (record[lookup.name] ?? '').trim(),
    email: (record[emailHeader] ?? '').trim(),
    confirmEmail: lookup.confirmEmail ? (record[lookup.confirmEmail] ?? '').trim() : '',
    chapter: (record[lookup.chapter] ?? '').trim(),
    roleTitle: (record[lookup.roleTitle] ?? '').trim(),
    major: (record[lookup.major] ?? '').trim(),
    phone: lookup.phone ? (record[lookup.phone] ?? '').trim() : '',
  }))
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function matchChapter(rawChapter: string, config: ChapterMappingConfig) {
  const normalizedRaw = normalizeTextForMatch(rawChapter)
  if (!normalizedRaw) return null

  return (
    config.chapters.find((chapter) =>
      [chapter.canonicalName, chapter.canonicalChapterId, chapter.university ?? '', ...chapter.aliases]
        .map(normalizeTextForMatch)
        .some((alias) => alias === normalizedRaw)
    ) ?? null
  )
}

function matchMappingRule<T extends { match: string[] }>(rawValue: string, mappings: T[]): T | null {
  const normalizedRaw = normalizeTextForMatch(rawValue)
  if (!normalizedRaw) return null

  const matches = mappings
    .map((mapping) => {
      const matchedLength = Math.max(
        0,
        ...mapping.match
          .map(normalizeTextForMatch)
          .filter((candidate) => candidate.length > 0 && normalizedRaw.includes(candidate))
          .map((candidate) => candidate.length)
      )

      return { mapping, matchedLength }
    })
    .filter((match) => match.matchedLength > 0)
    .sort((left, right) => right.matchedLength - left.matchedLength)

  return matches[0]?.mapping ?? null
}

function normalizeStatus(reasons: string[], blocked: boolean): NormalizedEboardStatus {
  if (blocked) return 'blocked'
  return reasons.length > 0 ? 'needs_review' : 'ready'
}

function pushUnique(target: string[], reason: string): void {
  if (!target.includes(reason)) target.push(reason)
}

function roleMappingIsSafe(role: RoleMappingResult): role is RoleMappingResult {
  return ALLOWED_APP_ROLES.includes(role.proposedAppRole)
}

function normalizeRawRow(
  rawRow: RawEboardRow,
  config: {
    chapterMapping: ChapterMappingConfig
    roleMapping: RoleMappingConfig
    majorMapping: MajorMappingConfig
  }
): NormalizedEboardRow {
  const reviewReasons: string[] = []
  let blocked = false
  const normalizedEmail = normalizeEmail(rawRow.email)
  const normalizedConfirmEmail = normalizeEmail(rawRow.confirmEmail)

  if (!isValidEmail(normalizedEmail)) {
    blocked = true
    pushUnique(reviewReasons, 'Invalid or missing email')
  }

  if (normalizedConfirmEmail && normalizedEmail !== normalizedConfirmEmail) {
    pushUnique(reviewReasons, 'Confirm email does not match email')
  }

  const chapter = matchChapter(rawRow.chapter, config.chapterMapping)
  if (!chapter) {
    blocked = true
    pushUnique(reviewReasons, 'Unmapped chapter')
  }

  const roleRule = matchMappingRule(rawRow.roleTitle, config.roleMapping.mappings)
  const roleResult = roleRule ?? config.roleMapping.default

  if (!roleRule || roleResult.requiresReview || roleResult.confidence === 'low') {
    pushUnique(reviewReasons, roleResult.reviewReason ?? 'Role requires review')
  }

  if (!roleMappingIsSafe(roleResult)) {
    blocked = true
    pushUnique(reviewReasons, 'Disallowed proposed app role')
  }

  if (roleResult.proposedAppRole === 'editor') {
    pushUnique(reviewReasons, 'Editor access requires human approval')
  }

  const majorRule = matchMappingRule(rawRow.major, config.majorMapping.mappings)
  const majorResult = majorRule ?? config.majorMapping.default

  if (!majorRule || majorResult.requiresReview || majorResult.confidence === 'low') {
    pushUnique(reviewReasons, 'Major requires review')
  }

  return {
    sourceRowNumber: rawRow.sourceRowNumber,
    sourceRowNumbers: [rawRow.sourceRowNumber],
    status: normalizeStatus(reviewReasons, blocked),
    reviewReasons,
    raw: {
      name: rawRow.name,
      email: rawRow.email,
      confirmEmail: rawRow.confirmEmail,
      chapter: rawRow.chapter,
      roleTitle: rawRow.roleTitle,
      major: rawRow.major,
      phone: rawRow.phone,
    },
    normalized: {
      name: rawRow.name.trim(),
      email: normalizedEmail,
      phone: rawRow.phone.trim() || null,
      canonicalChapterId: chapter?.canonicalChapterId ?? null,
      canonicalChapterName: chapter?.canonicalName ?? null,
      roleLevel: roleResult.roleLevel,
      functionalArea: roleResult.functionalArea,
      proposedAppRole: roleMappingIsSafe(roleResult) ? roleResult.proposedAppRole : 'member',
      proposedMembershipPosition: roleResult.proposedMembershipPosition,
      proposedIdentityType: roleResult.proposedIdentityType,
      standardizedMajor: majorResult.standardizedMajor,
      majorFamily: majorResult.majorFamily,
      isRecruiterVisible: false,
      memberIdStrategy: 'generate_on_import',
    },
    mapping: {
      chapterConfidence: chapter ? 'high' : 'none',
      roleConfidence: roleResult.confidence,
      majorConfidence: majorResult.confidence,
      proposedEditorRequiresReview: roleResult.proposedAppRole === 'editor',
    },
  }
}

function duplicateComparable(row: NormalizedEboardRow): string {
  return JSON.stringify({
    name: normalizeTextForMatch(row.raw.name),
    chapter: row.normalized.canonicalChapterId,
    roleTitle: normalizeTextForMatch(row.raw.roleTitle),
    major: normalizeTextForMatch(row.raw.major),
    phone: normalizeTextForMatch(row.raw.phone),
  })
}

function applyDedupe(rows: NormalizedEboardRow[]): {
  rows: NormalizedEboardRow[]
  duplicates: DuplicateGroup[]
} {
  const groups = new Map<string, NormalizedEboardRow[]>()

  for (const row of rows) {
    const key = row.normalized.email || `invalid-row-${row.sourceRowNumber}`
    groups.set(key, [...(groups.get(key) ?? []), row])
  }

  const dedupedRows: NormalizedEboardRow[] = []
  const duplicates: DuplicateGroup[] = []

  for (const [email, groupRows] of groups.entries()) {
    if (groupRows.length === 1 || email.startsWith('invalid-row-')) {
      dedupedRows.push(groupRows[0])
      continue
    }

    const canonical = { ...groupRows[0] }
    const sourceRowNumbers = groupRows.map((row) => row.sourceRowNumber)
    canonical.sourceRowNumbers = sourceRowNumbers

    const hasConflict = new Set(groupRows.map(duplicateComparable)).size > 1
    const reasons: string[] = []

    if (hasConflict) {
      pushUnique(reasons, 'Duplicate email has conflicting row data')
      pushUnique(canonical.reviewReasons, 'Duplicate email has conflicting row data')
      canonical.status = canonical.status === 'blocked' ? 'blocked' : 'needs_review'
    } else {
      pushUnique(reasons, 'Duplicate email rows are identical')
    }

    duplicates.push({
      email,
      sourceRowNumbers,
      hasConflict,
      reasons,
    })

    dedupedRows.push(canonical)
  }

  return { rows: dedupedRows, duplicates }
}

function buildResult(rows: NormalizedEboardRow[], duplicates: DuplicateGroup[], totalRows: number): NormalizeCsvResult {
  const readyRows = rows.filter((row) => row.status === 'ready')
  const reviewRows = rows.filter((row) => row.status === 'needs_review')
  const blockedRows = rows.filter((row) => row.status === 'blocked')

  return {
    rows,
    readyRows,
    reviewRows,
    blockedRows,
    duplicates,
    summary: {
      totalRows,
      readyCount: readyRows.length,
      reviewCount: reviewRows.length,
      blockedCount: blockedRows.length,
      duplicateEmailCount: duplicates.length,
    },
  }
}

export const ChapterEboardImportService = {
  parseCsv,
  normalizeTextForMatch,

  normalizeCsv(input: NormalizeCsvInput): NormalizeCsvResult {
    const records = csvToRecords(parseCsv(input.csvText))
    return this.normalizeRows({
      rows: records,
      chapterMapping: input.chapterMapping,
      roleMapping: input.roleMapping,
      majorMapping: input.majorMapping,
    })
  },

  normalizeRows(input: NormalizeRowsInput): NormalizeCsvResult {
    const rawRows = extractRawRows(input.rows)
    const normalizedRows = rawRows.map((row) =>
      normalizeRawRow(row, {
        chapterMapping: input.chapterMapping,
        roleMapping: input.roleMapping,
        majorMapping: input.majorMapping,
      })
    )
    const deduped = applyDedupe(normalizedRows)
    return buildResult(deduped.rows, deduped.duplicates, rawRows.length)
  },
}
