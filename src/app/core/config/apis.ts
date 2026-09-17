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
  }
};
