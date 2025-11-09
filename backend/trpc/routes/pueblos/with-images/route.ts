import { publicProcedure } from '../../../create-context';

const API_BASE_URL = 'https://lospueblosmasbonitosdeespana.org/wp-json';

async function fetchMultimediaForLugar(lugarId: string): Promise<string | null> {
  try {
    const url = `${API_BASE_URL}/jet-cct/multimedia?id_lugar=${lugarId}&nocache=1`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      
      for (const media of data) {
        const mediaUrl = media.media_url || media.url;
        
        if (mediaUrl && typeof mediaUrl === 'string') {
          const hasValidExtension = imageExtensions.some(ext => 
            mediaUrl.toLowerCase().includes(ext)
          );
          
          if (hasValidExtension) {
            return mediaUrl;
          }
        }
      }
    }
    
    return null;
  } catch (e: any) {
    console.warn(`⚠️ Error cargando multimedia para ${lugarId}:`, e.message);
    return null;
  }
}

export const pueblosWithImagesRoute = publicProcedure.query(async () => {
  console.log('\n🚀 [Backend] Cargando pueblos con imágenes...');
  
  const url = `${API_BASE_URL}/lpbe/v1/pueblos-lite`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: No se pudieron cargar los pueblos`);
    }
    
    const text = await response.text();
    console.log('📦 [Backend] Response length:', text.length);
    console.log('📦 [Backend] First 200 chars:', text.substring(0, 200));
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError: any) {
      console.error('❌ [Backend] JSON parse error:', parseError.message);
      throw new Error('La respuesta del servidor no es JSON válido');
    }
    
    if (!Array.isArray(data)) {
      throw new Error('La respuesta no es un array válido');
    }
    
    console.log(`📊 [Backend] ${data.length} pueblos recibidos, obteniendo imágenes...`);
    
    const pueblosConImagenes = await Promise.all(
      data.slice(0, 50).map(async (item: any) => {
        const imagen = await fetchMultimediaForLugar(String(item.id));
        
        return {
          id: item.id,
          nombre: item.nombre,
          provincia: item.provincia,
          comunidad_autonoma: item.comunidad_autonoma,
          latitud: item.latitud || 0,
          longitud: item.longitud || 0,
          slug: item.slug || '',
          modified: item.modified || '',
          created: item.created || '',
          imagen_principal: imagen,
        };
      })
    );
    
    console.log(`✅ [Backend] ${pueblosConImagenes.length} pueblos procesados con imágenes`);
    
    const conImagen = pueblosConImagenes.filter(p => p.imagen_principal !== null).length;
    console.log(`🖼️ [Backend] ${conImagen} pueblos tienen imagen`);
    
    return pueblosConImagenes;
  } catch (error: any) {
    console.error('❌ [Backend] Error:', error.message);
    throw error;
  }
});

export default pueblosWithImagesRoute;
