
export const API = {
  baseUrl: 'http://localhost:3000',

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
  kpi: {

      miDashboard: '/kpi/mi-dashboard',
      miEquipo: '/kpi/mi-equipo'

  }
};
