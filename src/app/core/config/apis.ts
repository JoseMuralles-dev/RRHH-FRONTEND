
export const API = {
  baseUrl: 'http://162.35.126.94/api',

  auth: {
    login: '/auth/login'
  },

  usuarios: {
    base: '/user',
    byId: (id: number) => `/user/${id}`,
    cambiarPassword: (id: number) => `/user/${id}/password`,
    deactivate: (id: number) => `/user/${id}/desactivar`
  },

  roles: {
    base: '/roles',
    byId: (id: number) => `/roles/${id}`
  },

  empleados: {
    base: '/empleados',
    byId: (id: number) => `/empleados/${id}`
  },

  departamentos: {
    base: '/departamentos',
    byId: (id: number) => `/departamentos/${id}`
  },
  solicitudes: {
    base: '/solicitudes',
    tipos: '/solicitudes/tipos-incidencia',
    mias: '/solicitudes/mis-solicitudes',
    pendientes: '/solicitudes/pendientes-aprobacion',
    aprobadas: '/solicitudes/aprobadas',
  },
  expedientes: {
    base: '/expedientes',
    // Habilitar solo cuando las rutas protegidas est?n implementadas en el backend.
    capacidades: { descargar: true, previsualizar: true, editar: true, eliminar: true },
  },
  vacaciones: { base: '/vacaciones' },
  kpi: {

      miDashboard: '/kpi/mi-dashboard',
      miEquipo: '/kpi/mi-equipo'

  },
  notificaciones: {
    mias: `/notificaciones/mias`,

    noLeidas:
    `/notificaciones/no-leidas/count`,

    marcarLeida: (id: number) =>
    `/notificaciones/${id}/leida`,

  marcarTodas:
    `/notificaciones/marcar-todas/leidas`,
},
};
