# Informe de preparacion para piloto controlado QA

Fecha: 2026-06-03

Alcance: estabilizacion posterior a la revision QA para el primer piloto controlado de LEAD Talent Platform.

## Veredicto

**Proceder con piloto controlado, no con apertura amplia.**

La plataforma queda lista para una activacion limitada con operadores centrales y un grupo pequeno de liderazgo de capitulo, siempre que se mantenga el alcance definido:

- Public Participant
- Member
- Chapter Editor / President / Vice President
- Admin
- Staff

Recruiter/company y Alumni permanecen como flujos diferidos para producto, salvo validacion de guardrails y rutas seguras. La evidencia de esta ronda soporta el piloto controlado, no una liberacion general sin entrenamiento, monitoreo y soporte.

## Cambios validados

| Area | Resultado | Evidencia |
| --- | --- | --- |
| Contrato UI de lanzamiento | Pass | `docs/handbook/LAUNCH_UI_STANDARD.md` publicado y enlazado a PRD/sintesis. |
| Autorizacion segura | Pass | Sesiones validas ya no se destruyen por falta de permisos; redireccionan a frontera segura. |
| Integridad perfil/membresia | Pass | El perfil no modifica afiliacion oficial de capitulo. |
| Elegibilidad de eventos | Pass | Validacion de active-member-only en servicio y UI. |
| Admin usuarios | Pass | Fallas de carga se muestran como error real; vacio real no oculta errores. |
| Liderazgo de capitulo | Pass | Asignacion usa responsabilidad/permisos de capitulo, no mutacion global de rol. |
| UI de eventos de capitulo | Pass | Acciones criticas visibles en desktop/mobile. |
| Auth/contacto en espanol | Pass | Politica de password fortalecida; formulario de contacto captura email obligatorio. |
| Limpieza Spanish-first | Pass | Rutas activas y errores criticos usan copy en espanol. |
| QA seeded personas | Pass segmentado | Playwright paso en desktop y mobile para public/student, chapter y admin/recruiter. |

## Validacion automatizada

### TypeScript

Comando:

```bash
pnpm exec tsc --noEmit
```

Resultado: pass.

### Unit/service/action tests

Comando:

```bash
pnpm exec vitest run lib/auth-redirects.test.ts lib/auth.test.ts lib/actions/student/profile.test.ts lib/services/__tests__/student.service.test.ts lib/services/__tests__/person-profile.service.test.ts lib/services/__tests__/event.service.test.ts lib/actions/events/__tests__/register.test.ts lib/services/__tests__/admin.service.test.ts lib/auth-password-policy.test.ts
```

Resultado: pass.

Resumen:

- 9 test files passed.
- 185 tests passed.

### Browser QA seeded personas

Ambiente:

- Local Next.js dev server.
- Local Supabase Docker levantado.
- Personas deterministicas de QA.
- Screenshots/resultados crudos generados en `outputs/launch-qa/` y no incluidos en este reporte para evitar publicar informacion sensible.

Comandos:

```bash
$env:LAUNCH_QA_SCOPE='public-student'
pnpm exec playwright test tests/e2e/launch-qa-report.spec.ts --project=desktop-chromium --project=mobile-chromium --reporter=line
```

Resultado: pass.

```bash
$env:LAUNCH_QA_SCOPE='chapter'
pnpm exec playwright test tests/e2e/launch-qa-report.spec.ts --project=desktop-chromium --project=mobile-chromium --reporter=line
```

Resultado: pass.

```bash
$env:LAUNCH_QA_SCOPE='admin-recruiter'
pnpm exec playwright test tests/e2e/launch-qa-report.spec.ts --project=desktop-chromium --project=mobile-chromium --reporter=line
```

Resultado: pass.

Resumen Playwright:

| Scope | Desktop | Mobile | Steps | Findings |
| --- | --- | --- | ---: | ---: |
| public-student | Pass | Pass | 48 | 0 |
| chapter | Pass | Pass | 64 | 0 |
| admin-recruiter | Pass | Pass | 54 | 0 |
| Total segmentado | Pass | Pass | 166 | 0 |

Nota: se intento correr la matriz completa en un solo comando, pero excedio la ventana de ejecucion. Por eso la validacion final se ejecuto por scopes segmentados, que es equivalente para cobertura y mas estable operacionalmente.

## Guardrails de roles diferidos

### Recruiter/company

Estado: diferido para producto, con rutas protegidas.

Validado:

- El acceso de recruiter no se trata como membresia de capitulo.
- Rutas administrativas o de capitulo para recruiter terminan en una frontera segura de autorizacion.
- El scope admin-recruiter paso en desktop y mobile.

Pendiente:

- Definicion completa del portal company/recruiter.
- Reglas finales de visibilidad, guardado, descarga y comunicacion con talento.

### Alumni

Estado: diferido para producto, con proteccion de elegibilidad.

Validado:

- Alumni no debe recibir acceso operativo de capitulo por defecto.
- Eventos active-member-only se protegen desde servicio/UI.
- El scope public-student incluye la frontera de alumni en rutas de capitulo.

Pendiente:

- Definir experiencia alumni dedicada.
- Definir si alumni puede registrarse a eventos publicos, alumni-only o ciertos eventos de miembro.

## Decision de lanzamiento

Recomendacion:

1. Activar un piloto controlado con un grupo pequeno de presidentes/vicepresidentes y operadores centrales.
2. Mantener recruiter/company y alumni fuera del lanzamiento funcional principal.
3. Usar este reporte como gate de entrada al entrenamiento de lideres de capitulo.
4. Antes de ampliar acceso, repetir la matriz Playwright segmentada contra el ambiente objetivo de QA/staging.

## Riesgos residuales

- El reporte valida un ambiente local sembrado; staging debe repetir la misma matriz antes de una activacion real.
- El piloto requiere entrenamiento corto para explicar fronteras de permisos, especialmente Admin vs Staff y liderazgo de capitulo.
- El diseno ahora tiene contrato de lanzamiento, pero no reemplaza un sistema de diseno completo a largo plazo.

## Evidencia relacionada

- PRD: `.github/PRDs/qa-launch-readiness-controlled-rollout.prd.md`
- Issue list: `.github/issues/qa-launch-readiness-controlled-rollout-issues.md`
- Synthesis QA: `docs/proposals/qa-validation-synthesis-2026-06-03.md`
- UI contract: `docs/handbook/LAUNCH_UI_STANDARD.md`
- Playwright results: `outputs/launch-qa/`
