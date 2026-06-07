import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

const ACTIVE_GROWTH_REFLECTION_FILES = [
  'app/[locale]/student/page.tsx',
  'app/[locale]/student/growth-reflection/page.tsx',
  'app/[locale]/chapter/events/_components/event-form.tsx',
]

const FORBIDDEN_ACTIVE_COPY = [
  'skill or mindset',
  'Capturar reflexion',
  'reflexion privada',
  'Preparacion para oportunidades',
  'Actualizacion de LinkedIn',
  'Actualizar resume',
]

describe('growth reflection launch copy', () => {
  it('positions the active flow as localized private learning evidence', () => {
    const content = ACTIVE_GROWTH_REFLECTION_FILES.map((file) => fs.readFileSync(file, 'utf8')).join('\n')

    expect(content).toContain('evidencia privada de aprendizaje')
    expect(content).toContain('Capturar reflexión')
    expect(content).toContain('Reflexión privada')

    const matches = FORBIDDEN_ACTIVE_COPY.filter((copy) => content.includes(copy))
    expect(matches).toEqual([])
  })
})
