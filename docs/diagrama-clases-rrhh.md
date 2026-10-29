# Diagrama de clases del sistema RRHH

## Métodos y patrones: complemento de implementación

Actualización: 24 de octubre de 2026. Los seis diagramas de entidades de este documento representan el modelo persistente. Un diagrama UML de clases también puede mostrar operaciones, interfaces, clases abstractas y dependencias. En esta aplicación los métodos de negocio se encuentran principalmente en servicios; no deben añadirse métodos ficticios a las entidades.

Ejemplo real del módulo KPI, con operaciones seleccionadas. Las firmas se abrevian para facilitar la lectura; no es el inventario completo de métodos. `+` significa público y `-` privado. `Repository` es una clase genérica de TypeORM, no una clase propia del proyecto. Las flechas representan dependencias, no herencia.

```mermaid
classDiagram
direction TB
class KpiController {
  <<Controller>>
  -KpiService kpiService
  +obtenerMiDashboard(request, consulta)
  +obtenerDashboardEquipo(request, consulta)
}
class KpiService {
  <<Service>>
  +obtenerDashboard(idEmpleado, anio, mes)
  +obtenerDashboardEquipo(idEmpleadoEncargado, nivel, anio, mes)
}
class PerformanceService {
  <<Service>>
  -SapService sapService
  +procesarMetricasBodega(fecha)
}
class EvaluacionKpiService {
  <<Service>>
  +procesarEvaluacionesDepartamento(idDepartamento, anio, mes)
  +procesarEvaluacionMensual(idEmpleado, idDepartamento, anio, mes)
  +calcularEvaluacionMensual(idEmpleado, idDepartamento, anio, mes)
  -calcularValorMensual()
  -buscarRango()
}
class SapService {
  <<Service>>
  +obtenerMetricasBodega(fechaInicial, fechaFinal)
  +obtenerKpiVentas(fechaInicio, fechaFin, slpCode)
  -getConnection()
}
class Repository~T~ {
  <<TypeORM>>
  +find()
  +findOne()
  +save()
}
KpiController --> KpiService : inyeccion por constructor
KpiService ..> Repository : consultas mediante repositorios
PerformanceService --> SapService : extrae datos
PerformanceService ..> Repository : carga diaria
EvaluacionKpiService ..> Repository : calcula y persiste
```

`buscarRango()` permanece en el código, pero no participa en el cálculo porcentual actual de bodega. Los tres servicios KPI realizan tareas diferentes: consulta, importación y evaluación. No forman una jerarquía base/concreta.

| Patrón o mecanismo | Evidencia en el proyecto | Clasificación |
|---|---|---|
| Arquitectura por capas / Service Layer | Controladores delegan en servicios; los servicios acceden a repositorios | Organización arquitectónica; no es un patrón GoF |
| Repository | `Repository<Empleado>`, `Repository<MetricaKpi>` y otros repositorios inyectados | Patrón de acceso a datos proporcionado por TypeORM |
| Inyección de dependencias | Dependencias en constructores, `@Injectable`, proveedores registrados en módulos | Mecanismo de inversión de control de NestJS y Angular |
| Strategy en autenticación | `JwtStrategy extends PassportStrategy(Strategy)` y `JwtAuthGuard` selecciona `jwt` | Uso del mecanismo de estrategias de Passport; no hay varias estrategias propias evidenciadas |
| Observer / programación reactiva | Componentes Angular se suscriben a `valueChanges` y observables HTTP con RxJS | Uso del mecanismo de observación de RxJS |
| DTO | Clases como `ConsultarDashboardKpiDto` y `LoginDto` | Objetos de transferencia y validación de entradas |
| Proveedor con fábrica | `JwtModule.registerAsync` usa `useFactory` | Función fábrica de configuración; no prueba el patrón GoF Factory Method |

No se identificó una implementación propia de Template Method en las clases revisadas. Ese patrón requiere una operación que fije la secuencia de un algoritmo en una clase base y delegue pasos a subclases. Tener un servicio o una clase que usa `extends` no basta. Las extensiones de Passport ofrecen puntos de personalización del framework, pero no implican que los servicios de negocio implementen Template Method.

`<<Service>>` indica el rol de una clase en el diagrama; no significa que sea abstracta. Una clase abstracta se marca como tal cuando el código realmente declara esa abstracción. Los patrones se documentan mediante las clases participantes y sus relaciones, no agregando cuadros base/concretos que no existen.

Fuentes principales: `rrhh-backend/src/modules/kpi/kpi.controller.ts`, `kpi/service/kpi.service.ts`, `performance/services/performance.service.ts`, `performance/services/evaluacion-kpi.service.ts`, `integrations/sap/sap.service.ts`, `auth/strategies/jwt.strategy.ts`, `auth/auth.module.ts`; frontend: `src/app/features/kpi/pages/kpi-equipo/kpi-equipo.ts`.

Generado a partir de las entidades TypeORM del backend local, revisadas el 23 de octubre de 2026.

## Alcance y lectura

Este es el modelo de clases de dominio persistentes de la aplicación. Incluye todas las clases encontradas en archivos `*.entity.ts`; no es un inventario de todos los componentes Angular, controladores, DTO y servicios. Las entidades actuales contienen atributos y relaciones, sin métodos de negocio propios.

- Línea continua: asociación declarada mediante decoradores de TypeORM.
- Flecha discontinua: referencia lógica por identificador; no afirma que exista una clave foránea en la base instalada.
- `1`: uno; `0..1`: opcional y único; `0..*`: cero o muchos.
- Se omiten atributos de navegación duplicados porque aparecen como líneas. Las clases sin atributos en un diagrama están detalladas en otro módulo.
- Se conservan los tipos TypeScript: varios decimales de MySQL son `string`. El sufijo `Nullable` representa unión con `null` o `undefined`; `Array` y `Object` simplifican tipos complejos.
- Las multiplicidades representan el modelo y las claves declaradas; no sustituyen una inspección del esquema MySQL desplegado.

## Organización y acceso

```mermaid
classDiagram
direction LR
class Departamento {
  +number idDepartamento
  +string nombreDepartamento
  +stringNullable descripcion
  +boolean isActive
  +Date createdAt
  +Date updatedAt
}
class Puesto {
  +number idPuesto
  +number idDepartamento
  +string nombrePuesto
  +string salarioBase
  +boolean isActive
  +Date createdAt
  +Date updatedAt
}
class Empleado {
  +number idEmpleado
  +numberNullable codigoSapEmpleado
  +number idPuesto
  +numberNullable idJefeDirecto
  +string primerNombre
  +stringNullable segundoNombre
  +string primerApellido
  +stringNullable segundoApellido
  +string dpi
  +string igss
  +string fechaNacimiento
  +string fechaIngreso
  +string sueldoActual
  +stringNullable telefono
  +stringNullable direccion
  +boolean isActive
  +Date createdAt
  +Date updatedAt
}
class Usuario {
  +number idUsuario
  +numberNullable idEmpleado
  +number idRol
  +string correo
  +string passwordHash
  +EstadoUsuario estado
  +boolean isActive
  +Date createdAt
  +Date updatedAt
}
class Rol {
  +numberNullable idRol
  +stringNullable codigoRol
  +stringNullable nombreRol
  +numberNullable nivelJerarquico
  +stringNullable descripcion
  +booleanNullable isActive
  +DateNullable createdAt
  +DateNullable updatedAt
}
Departamento "1" -- "0..*" Puesto : agrupa
Puesto "1" -- "0..*" Empleado : asignado
Empleado "0..1" -- "0..*" Empleado : jefe / subordinados
Empleado "0..1" -- "0..1" Usuario : cuenta
Rol "1" -- "0..*" Usuario : permisos
```

| Clase | Tabla | Fuente |
|---|---|---|
| `Departamento` | `departamentos` | [Entidad](../../rrhh-backend/src/modules/organization/departamentos/entities/departamento.entity.ts) |
| `Puesto` | `puestos` | [Entidad](../../rrhh-backend/src/modules/organization/puestos/entities/puesto.entity.ts) |
| `Empleado` | `empleados` | [Entidad](../../rrhh-backend/src/modules/organization/empleados/entities/empleado.entity.ts) |
| `Usuario` | `usuarios` | [Entidad](../../rrhh-backend/src/modules/user/entities/user.entity.ts) |
| `Rol` | `roles` | [Entidad](../../rrhh-backend/src/modules/roles/entities/rol.entity.ts) |

## Solicitudes y vacaciones

```mermaid
classDiagram
direction LR
class TipoIncidencia {
  +number idTipoIncidencia
  +string nombre
  +boolean requierePeriodo
  +boolean esRemunerado
  +boolean descuentaVacaciones
  +boolean isActive
  +Date createdAt
  +Date updatedAt
}
class SolicitudIncidencia {
  +number idSolicitud
  +number idEmpleado
  +number idTipoIncidencia
  +stringNullable fechaInicio
  +stringNullable fechaFin
  +numberNullable diasSolicitados
  +string motivo
  +EstadoSolicitud estado
  +DateNullable fechaResolucion
  +boolean isActive
  +Date createdAt
  +Date updatedAt
}
class AprobacionIncidencia {
  +number idAprobacion
  +number idSolicitud
  +number idUsuarioAprobador
  +number nivelAprobacion
  +EstadoAprobacion estado
  +stringNullable comentario
  +DateNullable fechaRespuesta
  +boolean isActive
  +Date createdAt
  +Date updatedAt
}
class VacacionesPeriodo {
  +number idPeriodo
  +number idEmpleado
  +string fechaInicio
  +string fechaFin
  +string diasAsignados
  +string diasUtilizadosIniciales
  +stringNullable fechaCorteInicial
  +stringNullable observaciones
  +Date createdAt
  +Date updatedAt
}
class VacacionesMovimiento {
  +number idMovimiento
  +number idPeriodo
  +numberNullable idSolicitud
  +TipoMovimientoVacaciones tipoMovimiento
  +string dias
  +string motivo
  +number idEmpleadoRegistro
  +Date createdAt
}
Empleado "1" -- "0..*" SolicitudIncidencia : solicita
TipoIncidencia "1" -- "0..*" SolicitudIncidencia : clasifica
SolicitudIncidencia "1" -- "0..*" AprobacionIncidencia : aprobaciones
Usuario "1" -- "0..*" AprobacionIncidencia : responde
Empleado "1" -- "0..*" VacacionesPeriodo : periodos
VacacionesPeriodo "1" -- "0..*" VacacionesMovimiento : movimientos
SolicitudIncidencia "0..1" -- "0..*" VacacionesMovimiento : origina
Empleado "1" -- "0..*" VacacionesMovimiento : registra
```

| Clase | Tabla | Fuente |
|---|---|---|
| `TipoIncidencia` | `tipos_incidencia` | [Entidad](../../rrhh-backend/src/modules/solicitudes/entities/tipo-incidencia.entity.ts) |
| `SolicitudIncidencia` | `solicitudes_incidencia` | [Entidad](../../rrhh-backend/src/modules/solicitudes/entities/solicitud-incidencia.entity.ts) |
| `AprobacionIncidencia` | `aprobaciones_incidencia` | [Entidad](../../rrhh-backend/src/modules/solicitudes/entities/aprobacion-incidencia.entity.ts) |
| `VacacionesPeriodo` | `vacaciones_periodos` | [Entidad](../../rrhh-backend/src/modules/vacaciones/entities/vacaciones-periodo.entity.ts) |
| `VacacionesMovimiento` | `vacaciones_movimientos` | [Entidad](../../rrhh-backend/src/modules/vacaciones/entities/vacaciones-movimiento.entity.ts) |

## Expedientes

```mermaid
classDiagram
direction LR
class Expediente {
  +number idExpediente
  +number idEmpleado
  +string fechaApertura
  +string estado
  +stringNullable observaciones
  +boolean isActive
  +Date createdAt
  +Date updatedAt
}
class DocumentoExpediente {
  +number idDocumento
  +number idExpediente
  +number idTipoDocumento
  +string nombreOriginal
  +string nombreArchivo
  +string rutaArchivo
  +stringNullable mimeType
  +stringNullable tamanoBytes
  +stringNullable fechaDocumento
  +stringNullable fechaVencimiento
  +string estado
  +stringNullable observaciones
  +numberNullable idUsuarioCarga
  +boolean isActive
  +Date createdAt
  +Date updatedAt
}
class TipoDocumentoExpediente {
  +number idTipoDocumento
  +string codigo
  +string nombre
  +stringNullable descripcion
  +boolean esObligatorio
  +boolean requiereVencimiento
  +boolean isActive
  +Date createdAt
  +Date updatedAt
}
Empleado "1" -- "0..1" Expediente : expediente
Expediente "1" -- "0..*" DocumentoExpediente : documentos
TipoDocumentoExpediente "1" -- "0..*" DocumentoExpediente : clasifica
Usuario "0..1" -- "0..*" DocumentoExpediente : carga
```

| Clase | Tabla | Fuente |
|---|---|---|
| `Expediente` | `expedientes` | [Entidad](../../rrhh-backend/src/modules/expedientes/entities/expediente.entity.ts) |
| `DocumentoExpediente` | `documentos_expediente` | [Entidad](../../rrhh-backend/src/modules/expedientes/entities/documento-expediente.entity.ts) |
| `TipoDocumentoExpediente` | `tipos_documento_expediente` | [Entidad](../../rrhh-backend/src/modules/expedientes/entities/tipo-documento-expediente.entity.ts) |

## KPI y evaluación

```mermaid
classDiagram
direction LR
class MetricaKpi {
  +number idMetrica
  +number idDepartamento
  +string codigoKpi
  +string nombreKpi
  +stringNullable descripcion
  +string unidadMedida
  +string pesoPorcentaje
  +string tipoCalculo
  +string fuenteDatos
  +stringNullable origenDatos
  +string penalizacionPorEvento
  +boolean isActive
  +Date createdAt
  +Date updatedAt
  +stringNullable metaObjetivo
}
class MetricaKpiDiaria {
  +number idRegistro
  +number idEmpleado
  +number idMetrica
  +string fecha
  +string valor
  +string fuente
  +ArrayNullable desgloseOrigen
  +Date createdAt
  +Date updatedAt
}
class EvaluacionDesempeno {
  +number idEvaluacionDesempeno
  +number idEmpleado
  +number idDepartamento
  +number periodoAnio
  +number periodoMes
  +string puntajeBase
  +string penalizacionTotal
  +string notaFinal
  +string metaGlobal
  +string estado
  +boolean isActive
  +Date createdAt
  +Date updatedAt
}
class ResultadoKpi {
  +number idResultado
  +number idEvaluacionDesempeno
  +number idMetrica
  +string valorObtenido
  +stringNullable metaAplicada
  +stringNullable porcentajeCumplimiento
  +string puntosObtenidos
  +number cantidadEventos
  +string penalizacionGenerada
  +stringNullable observacion
  +boolean isActive
  +Date createdAt
  +Date updatedAt
}
class DetalleResultadoKpi {
  +number idDetalle
  +number idResultado
  +string origen
  +string valor
  +stringNullable descripcion
  +Date createdAt
}
class RangoKpi {
  +number idRango
  +number idMetrica
  +string valorMinimo
  +string valorMaximo
  +string porcentajeCumplimiento
  +string puntosOtorgados
  +number orden
  +boolean isActive
}
class InspeccionCincoS {
  +number idInspeccion
  +number idDepartamento
  +number anio
  +number mes
  +number numero
  +string fecha
  +string sucursal
  +string encargado
  +number idUsuarioInspector
  +string inspector
  +number versionFormato
  +Array puntos
  +number total
  +stringNullable observaciones
  +Date createdAt
}
Departamento "1" -- "0..*" MetricaKpi : configura
Empleado "1" -- "0..*" MetricaKpiDiaria : mediciones
MetricaKpi "1" -- "0..*" MetricaKpiDiaria : define
Empleado "1" -- "0..*" EvaluacionDesempeno : evaluaciones
EvaluacionDesempeno "1" -- "0..*" ResultadoKpi : resultados
MetricaKpi "1" -- "0..*" ResultadoKpi : evaluada
ResultadoKpi "1" -- "0..*" DetalleResultadoKpi : desglose
MetricaKpi "1" -- "0..*" RangoKpi : rangos
EvaluacionDesempeno ..> Departamento : idDepartamento
InspeccionCincoS ..> Departamento : idDepartamento
InspeccionCincoS ..> Usuario : idUsuarioInspector
```

| Clase | Tabla | Fuente |
|---|---|---|
| `MetricaKpi` | `metricas_kpi` | [Entidad](../../rrhh-backend/src/modules/performance/entities/metrica-kpi.entity.ts) |
| `MetricaKpiDiaria` | `metricas_kpi_diarias` | [Entidad](../../rrhh-backend/src/modules/performance/entities/metrica-kpi-diaria.entity.ts) |
| `EvaluacionDesempeno` | `evaluaciones_desempeno` | [Entidad](../../rrhh-backend/src/modules/performance/entities/evaluacion-desempeno.entity.ts) |
| `ResultadoKpi` | `resultados_kpi` | [Entidad](../../rrhh-backend/src/modules/performance/entities/resultado-kpi.entity.ts) |
| `DetalleResultadoKpi` | `detalle_resultado_kpi` | [Entidad](../../rrhh-backend/src/modules/performance/entities/detalle-resultado-kpi.entity.ts) |
| `RangoKpi` | `rangos_kpi` | [Entidad](../../rrhh-backend/src/modules/performance/entities/rango-kpi.entity.ts) |
| `InspeccionCincoS` | `inspecciones_cinco_s` | [Entidad](../../rrhh-backend/src/modules/kpi/cinco-s/inspeccion-cinco-s.entity.ts) |

## Extensiones de KPI de ventas

```mermaid
classDiagram
direction LR
class MetaKpiEmpleado {
  +number idMeta
  +number idEmpleado
  +number idMetrica
  +number periodoAnio
  +number periodoMes
  +string metaObjetivo
  +Date createdAt
  +Date updatedAt
}
class KpiVentasRegla {
  +number idMetrica
  +number version
  +Object configuracion
  +Date updatedAt
}
class KpiVentasAvance {
  +number idEmpleado
  +number periodoAnio
  +number periodoMes
  +string fechaCorte
  +Object datos
  +Date updatedAt
}
class KpiVentasCorte {
  +number idEmpleado
  +string fechaCorte
  +Object datos
  +Date updatedAt
}
class KpiVentasSnapshot {
  +number idEvaluacionDesempeno
  +Object datos
  +Date updatedAt
}
class KpiCambio {
  +number idCambio
  +number idUsuario
  +number idEmpleado
  +string operacion
  +Object anterior
  +Object nuevo
  +Date createdAt
}
Empleado "1" -- "0..*" MetaKpiEmpleado : metas
MetricaKpi "1" -- "0..*" MetaKpiEmpleado : objetivo
EvaluacionDesempeno "1" -- "0..1" KpiVentasSnapshot : snapshot
KpiVentasRegla ..> MetricaKpi : idMetrica
KpiVentasAvance ..> Empleado : idEmpleado
KpiVentasCorte ..> Empleado : idEmpleado
KpiCambio ..> Empleado : idEmpleado
KpiCambio ..> Usuario : idUsuario
```

| Clase | Tabla | Fuente |
|---|---|---|
| `MetaKpiEmpleado` | `metas_kpi_empleado` | [Entidad](../../rrhh-backend/src/modules/performance/entities/meta-kpi-empleado.entity.ts) |
| `KpiVentasRegla` | `kpi_ventas_reglas` | [Entidad](../../rrhh-backend/src/modules/performance/entities/kpi-ventas-regla.entity.ts) |
| `KpiVentasAvance` | `kpi_ventas_avance` | [Entidad](../../rrhh-backend/src/modules/performance/entities/kpi-ventas-avance.entity.ts) |
| `KpiVentasCorte` | `kpi_ventas_corte` | [Entidad](../../rrhh-backend/src/modules/performance/entities/kpi-ventas-avance.entity.ts) |
| `KpiVentasSnapshot` | `kpi_ventas_snapshot` | [Entidad](../../rrhh-backend/src/modules/performance/entities/kpi-ventas-snapshot.entity.ts) |
| `KpiCambio` | `kpi_cambios` | [Entidad](../../rrhh-backend/src/modules/performance/entities/kpi-cambio.entity.ts) |

## Notificaciones, IA y uso

```mermaid
classDiagram
direction LR
class Notificacion {
  +number idNotificacion
  +number idUsuarioDestinatario
  +string tipo
  +string titulo
  +string mensaje
  +stringNullable referenciaTipo
  +numberNullable referenciaId
  +boolean leida
  +DateNullable fechaLectura
  +boolean isActive
  +Date createdAt
}
class AiInforme {
  +number idInforme
  +number idUsuario
  +string alcance
  +number anio
  +number mes
  +Object origen
  +string pregunta
  +string respuesta
  +ArrayNullable puntosClave
  +ArrayNullable recomendaciones
  +ArrayNullable fuentes
  +stringNullable deduplicacion
  +Date createdAt
}
class UsoEvento {
  +string idEvento
  +number idUsuario
  +numberNullable nivelRol
  +string modulo
  +string accion
  +Object origen
  +string metodo
  +stringNullable ruta
  +number estadoHttp
  +boolean exito
  +number duracionMs
  +stringNullable eventoCliente
  +string fechaUtc
}
Notificacion ..> Usuario : idUsuarioDestinatario
AiInforme ..> Usuario : idUsuario
UsoEvento ..> Usuario : idUsuario
```

| Clase | Tabla | Fuente |
|---|---|---|
| `Notificacion` | `notificaciones` | [Entidad](../../rrhh-backend/src/modules/notificaciones/entities/notificacion.entity.ts) |
| `AiInforme` | `ai_informes` | [Entidad](../../rrhh-backend/src/modules/ai/entities/ai-informe.entity.ts) |
| `UsoEvento` | `uso_eventos` | [Entidad](../../rrhh-backend/src/modules/uso/uso-evento.entity.ts) |

## Observaciones del modelo actual

- `Empleado` se relaciona consigo mismo para representar jefe directo y subordinados. Un usuario puede existir sin empleado asociado.
- Un expediente pertenece a un empleado; `id_empleado` es único en `Expediente`.
- `VacacionesMovimiento` puede no tener solicitud asociada, por ejemplo en ajustes. El empleado que registra un movimiento es distinto conceptualmente del propietario del período.
- `vw_vacaciones_saldos` es una vista de consulta mencionada en el sistema, no una clase de entidad encontrada en este inventario.
- `RangoKpi` existe en el modelo aunque el cálculo actual de bodega usa porcentajes directos.
- `KpiVentasSnapshot` declara `ManyToOne`, pero su identificador de evaluación es también clave primaria, por lo que solo puede haber un snapshot por evaluación.
- `Notificacion.referenciaTipo` y `referenciaId` forman una referencia variable; no se dibuja una asociación fija a solicitudes u otro módulo.
- Las inspecciones 5S se relacionan lógicamente con evaluaciones por departamento y período; no tienen un `idEvaluacion` directo.
