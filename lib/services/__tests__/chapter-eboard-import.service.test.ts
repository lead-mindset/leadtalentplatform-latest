import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ChapterEboardImportService } from '../chapter-eboard-import.service'
import type {
  ChapterMappingConfig,
  MajorMappingConfig,
  RoleMappingConfig,
} from '../chapter-eboard-import.service'
import chapterMappingJson from '../../../docs/data-import/chapter-eboard-chapter-mapping.json'
import roleMappingJson from '../../../docs/data-import/chapter-eboard-role-mapping.json'
import majorMappingJson from '../../../docs/data-import/chapter-eboard-major-mapping.json'

const chapterMapping = chapterMappingJson as ChapterMappingConfig
const roleMapping = roleMappingJson as RoleMappingConfig
const majorMapping = majorMappingJson as MajorMappingConfig

function normalize(csvText: string) {
  return ChapterEboardImportService.normalizeCsv({
    csvText,
    chapterMapping,
    roleMapping,
    majorMapping,
  })
}

function csvRow(values: string[]): string {
  return values
    .map((value) => {
      if (!/[",\n\r]/.test(value)) return value
      return `"${value.replace(/"/g, '""')}"`
    })
    .join(',')
}

const header = csvRow([
  'Id',
  'Nombres y Apellidos',
  'Email',
  'Confirmar Email',
  'Chapter',
  'Cargo que desempena (Ej: Presidente, Director(a) de .......)',
  'Carrera',
  'Telefono de Contacto',
])

describe('ChapterEboardImportService', () => {
  it('parses quoted CSV and detects expected e-board headers', () => {
    const result = normalize(
      [
        header,
        csvRow([
          '1',
          'Maria Leader',
          'MARIA@EXAMPLE.COM',
          'maria@example.com',
          'UPN-Trujillo',
          'Directora de Marketing, Comunicaciones',
          'Administracion y Marketing',
          '+51 999 111 222',
        ]),
      ].join('\n')
    )

    expect(result.summary.totalRows).toBe(1)
    expect(result.rows[0].normalized.email).toBe('maria@example.com')
    expect(result.rows[0].normalized.canonicalChapterId).toBe('leadupntrujillo')
    expect(result.rows[0].normalized.functionalArea).toBe('marketing_communications')
    expect(result.rows[0].normalized.standardizedMajor).toBe('Administracion y Marketing')
    expect(result.rows[0].normalized.phone).toBe('+51 999 111 222')
  })

  it('maps chapters, leadership roles, and editor recommendations without granting final approval', () => {
    const result = normalize(
      [
        header,
        csvRow([
          '1',
          'Ana Presidenta',
          'ana@example.com',
          'ana@example.com',
          'UNFV',
          'Presidenta',
          'Ingenieria Industrial',
          '',
        ]),
        csvRow([
          '2',
          'Luis VP',
          'luis@example.com',
          'luis@example.com',
          'UP',
          'VP',
          'Computer Science',
          '',
        ]),
        csvRow([
          '3',
          'Caro Staff',
          'caro@example.com',
          'caro@example.com',
          'PUCP',
          'Chief of Staff / Jefe de personal',
          'Derecho',
          '',
        ]),
      ].join('\n')
    )

    expect(result.rows.map((row) => row.normalized.canonicalChapterId)).toEqual([
      'leadvillareal',
      'leadpacifico',
      'leadpucp',
    ])
    expect(result.rows.every((row) => row.normalized.proposedAppRole === 'editor')).toBe(true)
    expect(result.rows.every((row) => row.mapping.proposedEditorRequiresReview)).toBe(true)
    expect(result.rows.every((row) => row.status === 'needs_review')).toBe(true)
    expect(result.rows.every((row) => row.reviewReasons.includes('Editor access requires human approval'))).toBe(true)
  })

  it('maps functional areas and high-priority major variants', () => {
    const result = normalize(
      [
        header,
        csvRow([
          '1',
          'Lead Academia',
          'academia@example.com',
          'academia@example.com',
          'UTEC',
          'Director de Lead Academia',
          'Ing. Sistemas',
          '',
        ]),
        csvRow([
          '2',
          'Impacto',
          'impacto@example.com',
          'impacto@example.com',
          'UCSUR',
          'Directora de Impacto Comunitario',
          'Ciencia de la Computacion',
          '',
        ]),
        csvRow([
          '3',
          'STEM',
          'stem@example.com',
          'stem@example.com',
          'UNSA',
          'Directora de Mujeres en STEM',
          'Diseno y Desarrollo de Software',
          '',
        ]),
      ].join('\n')
    )

    expect(result.rows.map((row) => row.normalized.functionalArea)).toEqual([
      'academic_excellence',
      'community_impact',
      'women_in_stem',
    ])
    expect(result.rows.map((row) => row.normalized.standardizedMajor)).toEqual([
      'Ingenieria de Sistemas',
      'Ciencia de la Computacion',
      'Diseno y Desarrollo de Software',
    ])
  })

  it('detects confirm-email mismatches and keeps the primary normalized email', () => {
    const result = normalize(
      [
        header,
        csvRow([
          '1',
          'Mismatch',
          'person@example.com',
          'other@example.com',
          'UNI',
          'Voluntario',
          'Marketing',
          '',
        ]),
      ].join('\n')
    )

    expect(result.rows[0].normalized.email).toBe('person@example.com')
    expect(result.rows[0].status).toBe('needs_review')
    expect(result.rows[0].reviewReasons).toContain('Confirm email does not match email')
  })

  it('blocks invalid emails and unmapped chapters', () => {
    const result = normalize(
      [
        header,
        csvRow([
          '1',
          'Broken',
          'not-an-email',
          'not-an-email',
          'Unknown Chapter',
          'Voluntario',
          'Marketing',
          '',
        ]),
      ].join('\n')
    )

    expect(result.blockedRows).toHaveLength(1)
    expect(result.rows[0].reviewReasons).toEqual(
      expect.arrayContaining(['Invalid or missing email', 'Unmapped chapter'])
    )
  })

  it('dedupes identical email rows without double-counting ready rows', () => {
    const row = csvRow([
      '1',
      'Ready Member',
      'ready@example.com',
      'ready@example.com',
      'UTP',
      'Voluntario',
      'Marketing',
      '',
    ])
    const result = normalize([header, row, row.replace('1,', '2,')].join('\n'))

    expect(result.summary.totalRows).toBe(2)
    expect(result.rows).toHaveLength(1)
    expect(result.readyRows).toHaveLength(1)
    expect(result.duplicates).toEqual([
      {
        email: 'ready@example.com',
        sourceRowNumbers: [2, 3],
        hasConflict: false,
        reasons: ['Duplicate email rows are identical'],
      },
    ])
  })

  it('marks conflicting duplicate emails for review', () => {
    const result = normalize(
      [
        header,
        csvRow([
          '1',
          'Duplicate One',
          'dupe@example.com',
          'dupe@example.com',
          'UPN',
          'Voluntario',
          'Marketing',
          '',
        ]),
        csvRow([
          '2',
          'Duplicate Two',
          'DUPE@example.com',
          'dupe@example.com',
          'UPC',
          'Voluntario',
          'Marketing',
          '',
        ]),
      ].join('\n')
    )

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].status).toBe('needs_review')
    expect(result.rows[0].reviewReasons).toContain('Duplicate email has conflicting row data')
    expect(result.duplicates[0]).toMatchObject({
      email: 'dupe@example.com',
      sourceRowNumbers: [2, 3],
      hasConflict: true,
    })
  })

  it('defaults company visibility off and member ID generation to later import', () => {
    const result = normalize(
      [
        header,
        csvRow([
          '1',
          'Safe Defaults',
          'safe@example.com',
          'safe@example.com',
          'USIL',
          'Voluntario',
          'Marketing',
          '',
        ]),
      ].join('\n')
    )

    expect(result.rows[0].normalized.isRecruiterVisible).toBe(false)
    expect(result.rows[0].normalized.memberIdStrategy).toBe('generate_on_import')
    expect(result.rows[0].normalized).not.toHaveProperty('memberId')
  })

  it('blocks unsafe mapping configs that try to propose a disallowed app role', () => {
    const unsafeRoleMapping = {
      ...roleMapping,
      mappings: [
        {
          ...roleMapping.mappings[0],
          proposedAppRole: 'administrator',
        },
      ],
    } as unknown as RoleMappingConfig

    const result = ChapterEboardImportService.normalizeCsv({
      csvText: [
        header,
        csvRow([
          '1',
          'Unsafe',
          'unsafe@example.com',
          'unsafe@example.com',
          'UNI',
          'Presidenta',
          'Marketing',
          '',
        ]),
      ].join('\n'),
      chapterMapping,
      roleMapping: unsafeRoleMapping,
      majorMapping,
    })

    expect(result.rows[0].status).toBe('blocked')
    expect(result.rows[0].reviewReasons).toContain('Disallowed proposed app role')
    expect(result.rows[0].normalized.proposedAppRole).toBe('member')
  })

  it('parses the current real Sheet1 CSV without database access', () => {
    const csvText = readFileSync(
      join(process.cwd(), 'docs/Registro de Junta Ejecutiva(Sheet1).csv'),
      'utf8'
    )

    const result = normalize(csvText)

    expect(result.summary.totalRows).toBeGreaterThan(100)
    expect(result.rows.length).toBeGreaterThan(0)
    expect(result.rows.every((row) => row.normalized.isRecruiterVisible === false)).toBe(true)
    expect(result.rows.every((row) => row.normalized.memberIdStrategy === 'generate_on_import')).toBe(true)
  })
})
