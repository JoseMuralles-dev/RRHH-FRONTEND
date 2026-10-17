# Ventas en el frontend

Ruta: /kpis/ventas. Acceso en el menu KPI de Ventas dentro del layout autenticado.
Empleado consulta su propio dashboard; encargado consulta sus subordinados; RRHH/admin
consulta vendedores y configura metas. El backend valida permisos desde la base de datos.
La UI no deduce el departamento por rol ni relaciona vendedores por nombre.

- Mes actual en America/Guatemala; selector impide evaluaciones futuras.
- Filtro por vendedor; la seleccion individual muestra una ficha a ancho completo.
- Medidor semicircular y cinco aportes. Nota null se presenta como pendiente, nunca cero.
- Metas faltantes, reglas pendientes, codigos SAP y denominadores tienen mensajes propios.
- Criterios de cartera historica visibles en un desplegable.
- Formularios disponibles solo al seleccionar un vendedor del equipo.
- Captura diaria precarga el total de la fecha; guardar lo reemplaza. Encargado/RRHH/admin.
- Metas con montos decimales enviados como texto, edicion solo RRHH/admin.
- Guardar evaluacion llama POST; GET no persiste. No permite guardar notas incompletas o cerradas.
- Backend bloquea cambios en periodos cerrados y acumulados cerrados afectados.
- Errores SAP no impiden cargar vendedores, metas ni capturar clientes manualmente.
- Al cambiar empleado o consulta se cancelan solicitudes anteriores. Signals actualiza carga y errores sin otro clic.

API.baseUrl y el interceptor JWT existentes se reutilizan. Requiere desplegar la version
backend de Ventas, incluyendo GET /kpi/ventas/empleados y GET /kpi/ventas/nuevos-clientes,
ademas de aplicar la migracion previamente revisada y configurar el procedimiento SAP.
No incluye un editor de reglas NC/cartera: siguen pendientes de aprobacion comercial.
No publicar una nota completa sin esas reglas y las metas reales.

Verificacion:
node node_modules/@angular/cli/bin/ng.js test --watch=false --ts-config=tsconfig.ventas.spec.json --include=src/app/features/kpi/pages/ventas/**/*.spec.ts
npm run build

Las pruebas usan HttpTestingController; no representan una prueba contra SAP real.
