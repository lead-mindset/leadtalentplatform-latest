import { describe, expect, it } from 'vitest'
import { RESUME_ACCESS_COPY } from './resume-access-button'

describe('RESUME_ACCESS_COPY', () => {
  it('keeps company resume access copy Spanish on active company routes', () => {
    expect(RESUME_ACCESS_COPY.open).toBe('Abrir CV')
    expect(RESUME_ACCESS_COPY.success).toBe('CV abierto en una nueva pestaña')
    expect(Object.values(RESUME_ACCESS_COPY)).not.toContain('Open Resume')
    expect(Object.values(RESUME_ACCESS_COPY)).not.toContain('Resume opened in a new tab')
  })
})
