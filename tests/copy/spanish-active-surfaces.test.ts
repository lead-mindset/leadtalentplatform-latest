import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const SOURCE_ROOTS = ['app', 'components', path.join('lib', 'events')]
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx'])
const FORBIDDEN_UNACCENTED_WORDS = [
  'capitulo',
  'Capitulo',
  'postulacion',
  'Postulacion',
  'codigo',
  'codigos',
  'pagina',
  'proximo',
  'proximos',
  'accion',
  'aprobacion',
  'revision',
  'contrasena',
  'limite',
  'aqui',
  'despues',
  'sera',
  'quedara',
  'recuperara',
  'cambiara',
]

function listSourceFiles(root: string): string[] {
  if (!fs.existsSync(root)) return []

  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name)
    if (entry.isDirectory()) return listSourceFiles(entryPath)
    if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) return []
    return [entryPath]
  })
}

describe('active Spanish launch copy', () => {
  it('keeps common active-surface Spanish words accented', () => {
    const files = SOURCE_ROOTS.flatMap(listSourceFiles)
    const forbiddenPattern = new RegExp(`\\b(${FORBIDDEN_UNACCENTED_WORDS.join('|')})\\b`, 'g')
    const matches = files.flatMap((file) => {
      const content = fs.readFileSync(file, 'utf8')
      return Array.from(content.matchAll(forbiddenPattern), (match) => `${file}: ${match[0]}`)
    })

    expect(matches).toEqual([])
  })
})
