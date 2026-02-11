// src/navigation/routes.ts
export const ROUTES = {
  AUTH: {
    name: 'Auth',
    requiresAuth: false,
  },

  MAIN: {
    name: 'Main',
    requiresAuth: true,
  },

  DOCTOR_STACK: {
    name: 'DoctorStack',
    requiresAuth: true,
  },

  PHARMACY_STACK: {
    name: 'PharmacyStack',
    requiresAuth: true,
  },

  SEARCH_STACK: {
    name: 'SearchStack',
    requiresAuth: true,
  },
} as const;
