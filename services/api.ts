import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import {
  ComunidadAutonoma,
  Lugar,
  Multiexperiencia,
  Noticia,
  Notificacion,
  Provincia,
  Semaforo,
} from '@/types/api';

async function fetchDescripcionForLugar(lugarId: string): Promise<string> {
  try {
    const url = `${API_BASE_URL}/jet-cct/descripcion?id_lugar=${lugarId}&id_idioma=2&tipo=Corta&nocache=1`;
    console.log(`🔍 Cargando descripción desde:`, url);
    
    const response = await fetch(url);
    console.log(`📊 Status descripción:`, response.status);
    
    if (!response.ok) {
      console.log(`⚠️ No se pudo cargar descripción para lugar ${lugarId}`);
      return '';
    }
    
    const data = await response.json();
    console.log(`📦 Descripción data recibida:`, Array.isArray(data) ? `Array con ${data.length} elementos` : typeof data);
    
    if (Array.isArray(data) && data.length > 0) {
      const descripcionObj = data[0];
      const descripcionText = descripcionObj.descripcion || '';
      
      if (descripcionText && !descripcionText.startsWith('http')) {
        const cleanText = descripcionText
          .replace(/<[^>]*>/g, '')
          .replace(/&[a-zA-Z0-9#]+;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        console.log(`✅ Descripción encontrada y limpiada (${cleanText.length} caracteres)`);
        return cleanText;
      }
    }
    
    console.log(`⚠️ Sin descripción válida para lugar ${lugarId}`);
    return '';
  } catch (e: any) {
    console.warn(`⚠️ Error cargando descripción:`, e.message);
    return '';
  }
}

async function fetchMultimediaForLugar(lugarId: string): Promise<string | null> {
  try {
    const url = `${API_BASE_URL}/jet-cct/multimedia?id_lugar=${lugarId}&nocache=1`;
    console.log(`🔍 Cargando multimedia desde:`, url);
    
    const response = await fetch(url);
    console.log(`📊 Status multimedia:`, response.status);
    
    if (!response.ok) {
      console.log(`⚠️ No se pudo cargar multimedia para lugar ${lugarId}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`📦 Multimedia data recibida:`, Array.isArray(data) ? `Array con ${data.length} elementos` : typeof data);
    
    if (Array.isArray(data) && data.length > 0) {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      
      for (const media of data) {
        const mediaUrl = media.media_url || media.url;
        
        if (mediaUrl && typeof mediaUrl === 'string') {
          const hasValidExtension = imageExtensions.some(ext => 
            mediaUrl.toLowerCase().includes(ext)
          );
          
          if (hasValidExtension) {
            console.log(`✅ Imagen válida encontrada:`, mediaUrl.substring(0, 80));
            return mediaUrl;
          }
        }
      }
    }
    
    console.log(`⚠️ Sin imagen válida para lugar ${lugarId}`);
    return null;
  } catch (e: any) {
    console.warn(`⚠️ Error cargando multimedia:`, e.message);
    return null;
  }
}

let lastFetchTime = 0;
const RATE_LIMIT_MS = 1000;

export async function fetchLugaresStable(): Promise<Lugar[]> {
  const now = Date.now();
  const timeSinceLastFetch = now - lastFetchTime;
  if (timeSinceLastFetch < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastFetch));
  }
  lastFetchTime = Date.now();

  console.log('\n🚀 INICIANDO fetchLugaresStable()');
  
  const url = 'https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/pueblos-lite';
  console.log(`🔍 Cargando desde: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('📊 Status:', response.status, 'OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText.substring(0, 200));
      throw new Error(`Error ${response.status}: No se pudieron cargar los pueblos`);
    }
    
    const data = await response.json();
    console.log('📦 Response length:', data.length);
    
    if (!Array.isArray(data)) {
      console.error('❌ Response is not an array:', typeof data);
      throw new Error('La respuesta no es un array válido');
    }
    
    if (data.length === 0) {
      console.warn('⚠️ API returned empty array');
      throw new Error('El servidor devolvió una lista vacía');
    }
    
    console.log('✅ Pueblos recibidos:', data.length);
    console.log('✅ Primer pueblo raw:', JSON.stringify(data[0], null, 2));
    
    const pueblos: Lugar[] = [];
    const nombresVistos = new Set<string>();
    
    for (const item of data) {
      if (nombresVistos.has(item.nombre)) {
        console.log(`⏭️ Saltando duplicado: ${item.nombre}`);
        continue;
      }
      
      if (!item.imagen || item.imagen.includes('default-pueblo.jpg')) {
        console.log(`⏭️ Saltando pueblo sin imagen válida: ${item.nombre}`);
        continue;
      }
      
      pueblos.push({
        _ID: String(item.id),
        nombre: item.nombre,
        provincia: item.provincia,
        comunidad_autonoma: item.comunidad_autonoma,
        imagen_principal: item.imagen,
        descripcion: '',
        multimedia: [],
        latitud: item.latitud || 0,
        longitud: item.longitud || 0,
        cct_slug: item.slug || '',
        cct_modified: item.modified || '',
        cct_created: item.created || '',
      });
      
      nombresVistos.add(item.nombre);
    }
    
    pueblos.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    console.log('✅ Pueblos procesados:', pueblos.length);
    console.log('✅ Primer pueblo procesado:', pueblos[0]?.nombre);
    
    return pueblos;
  } catch (error: any) {
    console.error('❌ Error cargando pueblos:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    if (error.message === 'Load failed' || error.message === 'Network request failed') {
      throw new Error('Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.');
    }
    
    throw error;
  }
}

export async function fetchLugares(): Promise<Lugar[]> {
  return fetchLugaresStable();
}

export async function fetchLugar(id: string): Promise<Lugar> {
  try {
    console.log('🔍 Buscando pueblo con ID:', id);
    
    const lugares = await fetchLugaresStable();
    const lugar = lugares.find(l => String(l._ID) === String(id));
    
    if (!lugar) {
      throw new Error(`Pueblo con ID ${id} no encontrado`);
    }
    
    console.log('✅ Pueblo encontrado:', lugar.nombre, 'ID:', lugar._ID);
    
    let descripcion: string = typeof lugar.descripcion === 'string' ? lugar.descripcion : '';
    let imagen: string | null = lugar.imagen_principal || null;
    
    const descripcionReal = await fetchDescripcionForLugar(lugar._ID);
    const imagenReal = await fetchMultimediaForLugar(lugar._ID);
    
    descripcion = (descripcionReal || descripcion || '')
      .replace(/<[^>]*>/g, '')
      .replace(/&[a-zA-Z0-9#]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    imagen = imagenReal || imagen;
    
    console.log('📝 Descripción:', descripcion ? descripcion.substring(0, 50) + '...' : 'Sin descripción');
    console.log('🖼️ Imagen principal para', lugar.nombre, ':', imagen ? imagen.substring(0, 50) : 'Sin imagen');
    
    return {
      ...lugar,
      descripcion,
      imagen_principal: imagen,
      multimedia: Array.isArray(lugar.multimedia) ? lugar.multimedia : [],
    };
  } catch (error) {
    console.error('Error fetching lugar:', error);
    throw error;
  }
}

export async function fetchSemaforos(): Promise<Semaforo[]> {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.cct.semaforos}`);
    if (!response.ok) {
      throw new Error('Error al cargar semáforos');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching semaforos:', error);
    throw error;
  }
}

export async function fetchSemaforoByPueblo(puebloId: string): Promise<Semaforo | null> {
  try {
    const semaforos = await fetchSemaforos();
    return semaforos.find((s) => s.pueblo === puebloId) || null;
  } catch (error) {
    console.error('Error fetching semaforo:', error);
    return null;
  }
}

export async function fetchNotificaciones(): Promise<Notificacion[]> {
  try {
    console.log('🔍 Fetching notificaciones from:', `${API_BASE_URL}${API_ENDPOINTS.cct.notificaciones}`);
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.cct.notificaciones}`);
    if (!response.ok) {
      console.error('❌ Error fetching notificaciones:', response.status);
      return [];
    }
    const data = await response.json();
    console.log('📦 Notificaciones received:', data.length);
    console.log('NOTIFS DEBUG (services/api)', Array.isArray(data), data?.[0]);
    return data;
  } catch (error) {
    console.error('❌ Error fetching notificaciones:', error);
    return [];
  }
}

export async function fetchNoticias(): Promise<Noticia[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.posts.noticias}&_embed=wp:featuredmedia`
    );
    if (!response.ok) {
      throw new Error('Error al cargar noticias');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching noticias:', error);
    throw error;
  }
}

export async function fetchAlertas(): Promise<Noticia[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.posts.alertas}&_embed=wp:featuredmedia`
    );
    if (!response.ok) {
      throw new Error('Error al cargar alertas');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching alertas:', error);
    throw error;
  }
}

export async function fetchProvincias(): Promise<Provincia[]> {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.cct.provincias}`);
    if (!response.ok) {
      throw new Error('Error al cargar provincias');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching provincias:', error);
    throw error;
  }
}

export async function fetchComunidades(): Promise<ComunidadAutonoma[]> {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.cct.comunidades}`);
    if (!response.ok) {
      throw new Error('Error al cargar comunidades');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching comunidades:', error);
    throw error;
  }
}

let lastMultiexperienciasFetchTime = 0;

export async function fetchMultiexperiencias(): Promise<Multiexperiencia[]> {
  const now = Date.now();
  const timeSinceLastFetch = now - lastMultiexperienciasFetchTime;
  if (timeSinceLastFetch < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastFetch));
  }
  lastMultiexperienciasFetchTime = Date.now();

  console.log('\n🚀 INICIANDO fetchMultiexperiencias()');
  
  const url = 'https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/multiexperiencias-lite';
  console.log(`🔍 Cargando desde: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('📊 Status:', response.status, 'OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText.substring(0, 200));
      throw new Error(`Error ${response.status}: No se pudieron cargar las multiexperiencias`);
    }
    
    const text = await response.text();
    console.log('📦 Response length:', text.length);
    console.log('📦 First 100 chars:', text.substring(0, 100));
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      throw new Error('La respuesta del servidor no es JSON válido');
    }
    
    if (!Array.isArray(data)) {
      console.error('❌ Response is not an array:', typeof data);
      throw new Error('La respuesta no es un array válido');
    }
    
    if (data.length === 0) {
      console.warn('⚠️ API returned empty array');
    }
    
    console.log('✅ Multiexperiencias cargadas:', data.length);
    
    return data;
  } catch (error: any) {
    console.error('❌ Error cargando multiexperiencias:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    if (error.message === 'Load failed' || error.message === 'Network request failed') {
      throw new Error('Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.');
    }
    
    throw error;
  }
}

const experienciasByPuebloCache = new Map<string, { data: Multiexperiencia[]; timestamp: number }>();
const CACHE_DURATION = 3600000;

export async function fetchExperienciasByPueblo(
  puebloId: string
): Promise<Multiexperiencia[]> {
  console.log(`\n🚀 INICIANDO fetchExperienciasByPueblo(${puebloId})`);
  
  const now = Date.now();
  const cached = experienciasByPuebloCache.get(puebloId);
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log('✅ Usando experiencias del cache');
    return cached.data;
  }
  
  const url = `https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/multiexperiencias-lite-pueblo?id=${puebloId}`;
  console.log(`🔍 Cargando desde: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('📊 Status:', response.status, 'OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText.substring(0, 200));
      throw new Error(`Error ${response.status}: No se pudieron cargar las experiencias`);
    }
    
    const data = await response.json();
    console.log('📦 Experiencias recibidas:', Array.isArray(data) ? data.length : typeof data);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('🔑 Primera experiencia campos disponibles:', Object.keys(data[0]));
      console.log('🔑 Primera experiencia sample:', {
        _ID: data[0]._ID,
        id: data[0].id,
        nombre: data[0].nombre
      });
    }
    
    if (!Array.isArray(data)) {
      console.error('❌ Response is not an array:', typeof data);
      experienciasByPuebloCache.set(puebloId, { data: [], timestamp: now });
      return [];
    }
    
    experienciasByPuebloCache.set(puebloId, { data, timestamp: now });
    
    console.log('✅ Experiencias cargadas y cacheadas:', data.length);
    return data;
  } catch (error: any) {
    console.error('❌ Error cargando experiencias:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    if (error.message === 'Load failed' || error.message === 'Network request failed') {
      throw new Error('Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.');
    }
    
    experienciasByPuebloCache.set(puebloId, { data: [], timestamp: now });
    return [];
  }
}

export async function fetchExperiencias(puebloId: string): Promise<Multiexperiencia[]> {
  return fetchExperienciasByPueblo(puebloId);
}

const multiexperienciaDetailCache = new Map<string, { data: Multiexperiencia; timestamp: number }>();

export async function fetchMultiexperienciaDetalle(
  experienciaId: string
): Promise<Multiexperiencia> {
  console.log(`\n🚀 INICIANDO fetchMultiexperienciaDetalle(${experienciaId})`);
  
  const now = Date.now();
  const cached = multiexperienciaDetailCache.get(experienciaId);
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log('✅ Usando detalle del cache');
    return cached.data;
  }
  
  const url = `https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/multiexperiencia-detalle?id=${experienciaId}`;
  console.log(`🔍 Cargando desde: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('📊 Status:', response.status, 'OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText.substring(0, 200));
      throw new Error(`Error ${response.status}: No se pudo cargar el detalle de la experiencia`);
    }
    
    const data = await response.json();
    console.log('📦 Detalle recibido:', Array.isArray(data) ? `Array con ${data.length} elementos` : typeof data);
    console.log('📦 detalle len=', Array.isArray(data) ? data.length : 1);
    
    if (Array.isArray(data)) {
      if (data.length === 0) {
        console.error('❌ API devolvió array vacío');
        throw new Error('No se ha encontrado información para esta experiencia');
      }
      const detalle = data[0];
      multiexperienciaDetailCache.set(experienciaId, { data: detalle, timestamp: now });
      console.log('✅ Detalle cargado y cacheado (de array)');
      return detalle;
    }
    
    if (!data || typeof data !== 'object') {
      console.error('❌ Response is not valid:', typeof data);
      throw new Error('La respuesta no es válida');
    }
    
    multiexperienciaDetailCache.set(experienciaId, { data, timestamp: now });
    
    console.log('✅ Detalle cargado y cacheado');
    return data;
  } catch (error: any) {
    console.error('❌ Error cargando detalle:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    if (error.message === 'Load failed' || error.message === 'Network request failed') {
      throw new Error('Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.');
    }
    
    throw error;
  }
}

export async function registrarVisita(
  idLugar: string,
  token?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const body = {
      id_lugar: idLugar,
      origen: 'qr',
      fecha_visita: new Date().toISOString(),
    };

    console.log('Registering visit:', body);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.cct.visitas}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error registering visit:', errorText);
      return {
        success: false,
        message: 'Error al registrar la visita',
      };
    }

    const data = await response.json();
    console.log('Visit registered:', data);

    return {
      success: true,
      message: 'Visita registrada correctamente',
    };
  } catch (error) {
    console.error('Error registering visit:', error);
    return {
      success: false,
      message: 'Error al registrar la visita',
    };
  }
}
