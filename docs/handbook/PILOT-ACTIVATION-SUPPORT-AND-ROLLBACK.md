# LEAD Talent Platform - Pilot Activation Support and Rollback

Este documento define el soporte, la comunicacion de visibilidad, los owners y el rollback minimo antes de invitar miembros reales a LEAD Talent Platform.

No reemplaza la Politica de Privacidad ni Terminos de Servicio. La copia legal final debe ser revisada por Legal/Compliance antes de usarse como texto legal formal. Este documento es una guia operativa para una activacion controlada.

## Objetivo

Antes de activar miembros reales, LEAD necesita poder responder tres preguntas:

1. Que entiende el miembro sobre su perfil y visibilidad ante empresas.
2. Que pasa si una persona no puede ingresar o ve datos incorrectos.
3. Quien puede pausar, corregir o revertir la activacion si algo sale mal.

## Principios

- La visibilidad ante empresas es opt-in, no automatica.
- Ningun miembro debe aparecer ante empresas por defecto.
- Los representantes de empresas deben tener acceso invite-only.
- La activacion debe hacerse por waves controladas, no con una invitacion masiva sin soporte.
- P0 findings bloquean invitaciones reales hasta que se resuelvan o sean aceptados explicitamente por leadership.
- No se debe publicar evidencia con PII de miembros reales en GitHub o capturas compartidas.

## Owners propuestos

| Area | Owner propuesto | Responsabilidad |
| --- | --- | --- |
| Technical rollback | Abigail | Pausar cambios tecnicos, revisar datos, corregir access/membership rows, coordinar fixes. |
| Executive go/no-go | Luis, Antonny, Nicole, Abigail | Aprobar, pausar o pedir fixes antes de invitar miembros reales. |
| Data/import | Nikole | Mantener activation sheet/import artifact limpio y versionado. |
| Chapter validation/support | Christopher | Coordinar validacion con presidents/eboard y canalizar errores de chapter/roles. |
| Member consent language | Xiomara | Revisar que la comunicacion de visibilidad sea clara para miembros. |
| Communications/support instructions | Kiara | Preparar instrucciones para email/announcement y tono hacia miembros. |
| QA support/reproduction | Angela | Ayudar a reproducir bugs y validar flows por rol. |

Si algun owner no esta disponible, leadership debe nombrar reemplazo antes de iniciar la wave.

## Copia draft para visibilidad ante empresas

Texto corto para checkbox o perfil:

> Hacer visible mi perfil a representantes de empresas invitadas por LEAD.

Descripcion corta:

> Es opcional. Si lo activas, representantes de empresas o partners aprobados por LEAD podran ver tu perfil profesional. Puedes cambiar esta preferencia luego. Activarlo no garantiza entrevistas ni oportunidades.

Texto para activation email o instrucciones:

> Tu perfil es privado por defecto. LEAD Talent Platform te permite decidir si quieres que tu perfil profesional sea visible para representantes de empresas o partners aprobados por LEAD. Esta visibilidad es opcional y puedes cambiarla mas adelante desde tu perfil. Activarla no garantiza entrevistas, ofertas ni contacto directo; simplemente permite que empresas invitadas por LEAD revisen perfiles autorizados dentro de la plataforma.

Nota de revision:

- Esta copia es operacional y approval-ready, pero no reemplaza legal review.
- Legal/Compliance debe revisar si se va a usar como texto contractual o politica legal.

## Support path

Durante la wave piloto, cada mensaje de soporte debe incluir:

- Nombre completo.
- Email usado para la plataforma.
- Chapter esperado, si aplica.
- Rol esperado: Public Participant, Member, Chapter Editor, Admin, Staff/Founder, Company Representative, Alumni.
- Link o pantalla donde ocurre el problema.
- Captura sin informacion sensible, si aplica.
- Fecha y hora aproximada.
- Resultado esperado vs resultado actual.

Canales propuestos:

| Canal | Uso |
| --- | --- |
| Help page | Punto visible para usuarios que necesitan orientacion general. |
| Activation email | Instrucciones directas para miembros invitados. |
| Internal escalation thread | Priorizacion entre Abigail, Angela, Christopher, Nikole, Kiara y owner correspondiente. |
| GitHub issue | Solo para bugs tecnicos reproducibles sin PII real. |

## Severidad

| Severidad | Significado | Ejemplos |
| --- | --- | --- |
| P0 | Bloquea activacion o crea riesgo de seguridad/datos. | Perfil visible sin consentimiento, editor ve otro chapter, company portal expone miembros no aprobados. |
| P1 | Bloquea una wave, rol o chapter, pero puede contenerse. | Lideres no pueden entrar, import de un chapter esta mal, check-in falla para evento piloto. |
| P2 | Confunde o afecta experiencia, pero existe workaround. | Texto poco claro, perfil editable con friccion, estado de registro no suficientemente evidente. |
| P3 | Mejora futura o polish. | Copy menor, layout, informacion adicional no critica. |

## Categorias de soporte

| Categoria | Que reporta la persona | First triage | Evidencia minima | Severidad guia | Bloquea invitaciones? |
| --- | --- | --- | --- | --- | --- |
| Login/auth problem | No puede entrar, reset no llega, Google/email falla. | Abigail / Angela | Email, metodo usado, captura, URL. | P0 si afecta a muchos; P1 si es individual. | Si afecta auth principal o una wave completa, si. |
| Wrong email | Su invitacion o cuenta esta ligada a otro correo. | Nikole / Abigail | Email correcto, email incorrecto, chapter. | P1 | Puede bloquear esa persona o chapter. |
| Wrong chapter | Aparece en chapter equivocado o falta su chapter. | Christopher / Nikole | Nombre, email, chapter esperado, evidencia de eboard/member. | P1 | Si afecta roster/chapter completo, si. |
| Missing member | Miembro real no aparece o no puede activar cuenta. | Nikole / Christopher | Nombre, email, chapter, status esperado. | P1 | Si es masivo, si; individual puede corregirse. |
| Duplicate person/member | Hay dos registros para la misma persona. | Abigail / Nikole | Emails duplicados, chapter, registro correcto. | P1 | Si afecta permisos o visibilidad, si. |
| Wrong role or chapter editor access | Tiene permisos incorrectos o no tiene editor access esperado. | Abigail / Christopher | Email, chapter, rol esperado, captura. | P0 si concede permisos de mas; P1 si falta acceso. | Si hay permisos de mas, si. |
| Profile edit problem | No puede guardar universidad, carrera, LinkedIn, portfolio, skills o visibilidad. | Abigail / Angela | Campo afectado, error, captura, navegador. | P1/P2 | Bloquea si afecta visibilidad/consentimiento. |
| Company visibility or consent question | No entiende visibilidad, quiere apagarla, o aparece sin querer. | Xiomara / Abigail | Email, estado de visibilidad, pregunta o captura. | P0 si aparece sin opt-in; P2 si es duda. | Si hay exposicion sin consentimiento, si. |
| Event registration/application problem | No puede registrarse, aplicar, ver preguntas o estado. | Angela / Abigail | Evento, email, accion, error, captura. | P1/P2 | Si afecta evento piloto critico, si. |
| Check-in problem | QR no funciona, persona registrada no aparece, asistencia no queda marcada. | Angela / Abigail / Chapter editor | Evento, email, status, captura, hora. | P1 | Si afecta evento en vivo sin workaround, si. |

## Intake template

```text
Categoria:
Severidad sugerida:
Nombre:
Email:
Chapter esperado:
Rol esperado:
Ambiente: Production / QA / Local
URL o pantalla:
Que estaba intentando hacer:
Que paso:
Que esperaba que pasara:
Captura/evidencia:
Owner asignado:
Decision: fix now / workaround / wait / no-go
```

## Rollback owner

Owner tecnico propuesto: Abigail.

Backup operativo recomendado: Angela para QA/reproduccion y Nikole para data/import artifact.

Executive escalation: Luis, Antonny, Nicole, Abigail.

## Rollback triggers

Activar rollback o pause si ocurre cualquiera de estos casos:

- Miembros aparecen visibles a empresas sin opt-in.
- Company portal muestra public participants, alumni no aprobados o miembros no autorizados.
- Chapter editors pueden ver o modificar datos de otro chapter.
- Produccion auth falla para una parte significativa de la wave.
- Import asigna chapter, rol o email incorrecto de forma masiva.
- No existe forma rapida de corregir un error de permisos o membresia.
- El equipo no puede responder soporte dentro del periodo de activacion acordado.

## Rollback options

| Opcion | Cuando usarla | Owner |
| --- | --- | --- |
| Pause invites | Hay P0/P1 abierto antes de ampliar la wave. | Executive go/no-go + Abigail |
| Hide/pause company portal access | Hay riesgo de exposicion de perfiles o company access. | Abigail |
| Disable member/company visibility | Se detecta confusion o visibilidad incorrecta. | Abigail |
| Correct access rows | Recruiter/company access, revoked access o invite status esta mal. | Abigail |
| Correct membership/chapter rows | Chapter, status, position o member ID esta mal. | Abigail + Nikole |
| Re-send clarification | El problema es comunicacion, instrucciones o expectativa. | Kiara + Xiomara |
| Stop wave and reduce scope | La wave es demasiado amplia para el soporte disponible. | Executive go/no-go |

## Go/no-go minimum before invitations

Go para pilot invitations solo si:

- Production auth principal esta verificado.
- Import artifact aprobado esta listo.
- Company visibility default off esta confirmado.
- Support path esta comunicado.
- Rollback owner esta confirmado.
- Admin/technical owner puede corregir datos y permisos.
- No hay P0 abierto sin decision ejecutiva.

No-go si:

- Google OAuth o auth principal esta roto.
- Hay exposicion de perfiles sin consentimiento.
- Company access no es invite-only.
- Editors tienen acceso a chapters incorrectos.
- No hay owner de soporte o rollback.

## Activation email support block

Bloque recomendado para incluir en email de activacion:

```text
Si tienes problemas para ingresar, ves un chapter incorrecto, no aparece tu membresia, no puedes editar tu perfil o tienes dudas sobre visibilidad ante empresas, responde a este correo con:

- Nombre completo
- Email usado en la plataforma
- Chapter esperado
- Captura del problema, si aplica
- Breve descripcion de lo que intentabas hacer

La visibilidad ante empresas es opcional y esta apagada por defecto. Puedes activarla o desactivarla desde tu perfil.
```

## Estado actual

- Event operations readiness local paso en #132.
- Human review de e-board/import artifact sigue pendiente en #131.
- Actual local Docker member import depende del approved artifact en #134.
- Production auth/data issues se siguen por separado en #119, #120, #121 y #123.

## Decision pendiente

Leadership debe confirmar:

- Owner final de rollback.
- Canal oficial de soporte para la primera wave.
- Si la copia de visibilidad requiere revision legal antes del email de activacion.
- Tamano y fecha de la primera pilot wave.
