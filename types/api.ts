export interface Lugar {
  _ID: string;
  nombre: string;
  descripcion: string;
  provincia: string;
  comunidad_autonoma: string;
  latitud: number;
  longitud: number;
  multimedia: string[];
  imagen_principal: string | null;
  bandera?: string;
  multiexperiencias_pueblos?: string[];
  tipo?: string;
  cct_slug: string;
  cct_modified: string;
  cct_created: string;
}

export interface Semaforo {
  _ID: string;
  pueblo: string;
  estado: 'verde' | 'amarillo' | 'rojo';
  descripcion: string;
  fecha_actualizacion: string;
  motivo?: string;
  cct_slug: string;
  cct_modified: string;
}

export interface Notificacion {
  id: number;
  tipo: 'noticia' | 'alerta' | 'semaforo' | 'nieve';
  titulo: string;
  mensaje: string;
  enlace: string;
  motivo?: string;
}

export interface Noticia {
  id: number;
  date: string;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  featured_media: number;
  link: string;
  _embedded?: {
    'wp:featuredmedia'?: {
      source_url: string;
      alt_text: string;
    }[];
  };
}

export interface Provincia {
  _ID: string;
  nombre: string;
  comunidad_autonoma: string;
  cct_slug: string;
}

export interface ComunidadAutonoma {
  _ID: string;
  nombre: string;
  codigo: string;
  cct_slug: string;
}

export interface Multiexperiencia {
  _ID: string;
  nombre: string;
  descripcion?: string;
  tipo?: 'ruta' | 'experiencia' | 'punto_interes';
  multiexperiencias_pueblos?: string[];
  duracion?: string;
  dificultad?: string;
  multimedia?: string[];
  foto?: string;
  pueblo_nombre?: string;
  provincia?: string;
  comunidad_autonoma?: string;
  tiempo?: string;
  kilometros?: string;
  cct_slug?: string;
  cct_modified?: string;
}

export interface PuntoVisita {
  _ID: string;
  nombre: string;
  descripcion?: string;
  multiexperiencias?: string[];
  latitud?: number;
  longitud?: number;
  cct_slug?: string;
  cct_modified?: string;
}

export interface Visita {
  _ID: string;
  usuario: string;
  pueblo: string;
  fecha_visita: string;
  puntos_obtenidos: number;
  verificado: boolean;
}

export interface Usuario {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  roles: string[];
  puntos?: number;
  rol?: string;
  nombre?: string;
  apellidos?: string;
}

export interface AuthResponse {
  token: string;
  user: Usuario;
}

export interface ApiError {
  code: string;
  message: string;
  data?: {
    status: number;
  };
}
