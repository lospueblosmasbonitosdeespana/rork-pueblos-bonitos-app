export const API_BASE_URL = 'https://lospueblosmasbonitosdeespana.org/wp-json';

export const API_ENDPOINTS = {
  auth: {
    login: '/lpbe/v1/login',
    profile: '/lpbe/v1/profile',
    validate: '/jwt-auth/v1/token/validate',
    me: '/wp/v2/users/me',
  },
  um: {
    login: '/um-api/login',
    register: '/um-api/register',
    profile: '/um-api/profile',
    updateProfile: '/um-api/update-profile',
  },
  cct: {
    lugares: '/jet-cct/lugar',
    semaforos: '/jet-cct/semaforos',
    notificaciones: '/jet-cct/notificaciones',
    multiexperiencias: '/jet-cct/multiexperiencias',
    provincias: '/jet-cct/provincia',
    comunidades: '/jet-cct/comunidad_autonoma',
    idiomas: '/jet-cct/idioma',
    visitas: '/jet-cct/visita',
    puntos: '/jet-cct/puntos_visita',
    puntuacion: '/jet-cct/puntuacion',
  },
  lpbe: {
    pueblos: '/lpbe/v1/pueblos-lite',
    multiexperiencias: '/lpbe/v1/multiexperiencias-lite',
  },
  posts: {
    noticias: '/wp/v2/posts?categories=49&per_page=5',
    alertas: '/wp/v2/posts?category_name=alertas&per_page=5',
  },
} as const;
