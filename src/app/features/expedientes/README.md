# Expedientes digitales — frontend

Angular standalone y rutas lazy, sin nuevas dependencias ni reorganización del feature. Se reutilizan AuthService, authGuard, permisoEmpleado, EmpleadoService, el interceptor JWT y los estilos base de empleados.

## Archivos

Se completaron los archivos existentes de `models/expediente.model.ts`, `services/expediente.service.ts`, `expedientes.routes.ts`, las tres páginas (`expedientes-list`, `expediente-detalle`, `subir-documento`) y los dos componentes (`documento-card`, `expediente-resumen`), con sus plantillas, estilos y pruebas.

Se añadieron `utils/documento-utils.ts` y sus pruebas, `styles/expedientes.css`, pruebas del servicio y `testing/fixtures.ts`. La configuración específica de pruebas está en `features/expedientes/tsconfig.spec.json`, no en la raíz.

Fuera del feature se modificaron únicamente `core/config/apis.ts` (base y capacidades), `app.routes.ts` (ruta lazy) y `layout/sidebar/sidebar.html` (entrada visible desde nivel 3). Los cambios previos de vacaciones/solicitudes se conservaron.

## Rutas de pantalla

- `/expedientes`: empleados, búsqueda por nombre/ID, paginación visual de 12 tarjetas e indicador de expediente.
- `/expedientes/empleado/:idEmpleado`: expediente, creación si no hay uno activo, resumen, filtros, documentos y tipos obligatorios faltantes.
- `/expedientes/:idExpediente/subir-documento?idEmpleado=:idEmpleado`: formulario de carga. Se accede desde el detalle; la página comprueba que el expediente realmente corresponde a ese empleado. El parámetro sirve para validar el contexto y volver al detalle, no como autorización.

Las rutas usan los guards existentes y están limitadas visualmente a RRHH/Admin (nivel 3/4). El backend debe aplicar sus propias autorizaciones; el controlador inspeccionado actualmente solo tiene JwtAuthGuard, sin controles de rol/alcance adicionales. El frontend no sustituye esa validación.

## HTTP

El backend actual devuelve directamente la entidad Expediente con `documentos`, no un objeto envoltorio. El nombre del empleado se obtiene de su relación opcional o de `EmpleadoService.obtener()`.

| Método | Endpoint | Uso |
| --- | --- | --- |
| GET | `/empleados/select` | Selector/listado existente de empleados |
| GET | `/empleados/:id` | Nombre del empleado en detalle |
| GET | `/expedientes/empleado/:idEmpleado` | Expediente y documentos |
| GET | `/expedientes/tipos-documento` | Catálogo y obligatoriedad |
| POST | `/expedientes` | Apertura explícita del expediente |
| POST | `/expedientes/:idExpediente/documentos` | Carga multipart |
| GET | `/expedientes/documentos/:idDocumento/descargar` | Contrato preparado, respuesta Blob |
| PATCH | `/expedientes/documentos/:idDocumento` | Contrato preparado para metadata |
| DELETE | `/expedientes/documentos/:idDocumento` | Contrato preparado para desactivación |

No hay endpoint global de expedientes: la lista consulta exclusivamente los empleados visibles, con máximo tres comprobaciones simultáneas. Una ausencia HTTP 404 se distingue de errores 403/500. Cambiar la búsqueda cancela las comprobaciones anteriores. No se usa localStorage para persistir documentos o archivos.

Las últimas tres rutas NO están implementadas en el controlador backend inspeccionado. Sus métodos HTTP y eventos de componentes están preparados, pero las capacidades `descargar`, `editar`, `eliminar` en `API.expedientes.capacidades` están en false y los botones permanecen deshabilitados. Activarlas únicamente cuando existan los endpoints con autorización real. La descarga nunca usa `rutaArchivo` ni URLs `/uploads`; utiliza Blob, una URL temporal y revokeObjectURL. En la futura edición, omitir una fecha vacía conserva la fecha anterior: no se presupone soporte de borrado de fechas mediante null.

La subida envía únicamente `archivo`, `idTipoDocumento` y las fechas/observaciones presentes. No establece Content-Type; el navegador crea el boundary. El token lo agrega el interceptor existente. El archivo seleccionado se mantiene solo en memoria durante el formulario y se libera después de una carga exitosa.

## Reglas visuales

- Archivos PDF/JPG/JPEG/PNG con MIME compatible, no vacíos y máximo 10 × 1024 × 1024 bytes.
- Vencimiento obligatorio según `requiereVencimiento`, validado en el formulario y antes de enviar.
- Fechas DATE comparadas en calendario, usando el día actual de Guatemala. Vencido: antes de hoy. Próximo: hoy a 30 días inclusive. No se actualiza el estado oficial del documento por este cálculo.
- Los resúmenes y faltantes usan documentos activos. Los tipos obligatorios se cuentan una vez aunque haya varios archivos del mismo tipo. “Cargado” indica existencia, no certificación ni vigencia: el vencimiento se presenta por separado.
- Los documentos sin fecha de vencimiento solo entran en Vigentes si su tipo no exige vencimiento. Todos muestra también casos sin fecha o con fecha inválida.
- Un error del catálogo no impide consultar documentos ni se presenta como “0 documentos obligatorios”.
- Los errores de creación/subida conservan los datos para reintentar y terminan el estado de carga. Se previenen dobles envíos.

## Probar el flujo

1. Iniciar el backend actualizado (`npm run start:dev` dentro de rrhh-backend) y el frontend (`npm start`). El API configurado es `http://localhost:3000`.
2. Iniciar sesión con un usuario RRHH o administrador. Abrir **Expedientes digitales** desde el menú lateral.
3. Buscar un empleado y pulsar **Ver expediente**.
4. Si no tiene expediente activo, elegir fecha de apertura, agregar observaciones opcionales y pulsar **Crear expediente**. Un expediente inactivo previo puede producir conflicto; no se crea automáticamente otro.
5. Pulsar **+ Subir documento**. Seleccionar un tipo del catálogo y un PDF/JPG/PNG de hasta 10 MB. Completar vencimiento si el tipo lo exige.
6. Pulsar **Guardar documento** una sola vez. Al responder el POST correctamente se vuelve al empleado y se consulta de nuevo el expediente: el documento aparece en su tarjeta.
7. Comprobar los filtros y la lista de tipos obligatorios. Los indicadores son exclusivamente visuales.

Si el catálogo está vacío, se muestra un estado vacío y no se permite subir. Si se entra a la URL de carga sin `idEmpleado`, se indica volver a abrirla desde el detalle.

## Verificación realizada

```powershell
npm run build -- --configuration development
npm test -- --watch=false --ts-config=src/app/features/expedientes/tsconfig.spec.json --include=src/app/features/expedientes/**/*.spec.ts
```

Compilación de desarrollo correcta. Siete archivos de pruebas, 27 pruebas aprobadas. Cubren contratos HTTP, interceptor JWT, multipart sin Content-Type manual, validación dinámica, errores, retorno al detalle, faltantes, Blob y liberación de URL, y vencimientos con zona horaria.

Las pruebas HTTP simulan las respuestas del servidor. No se subieron archivos a expedientes reales ni se validó el flujo completo con una sesión autenticada. Las rutas de descarga, edición y desactivación siguen pendientes del backend y no se presentan como funcionales.
