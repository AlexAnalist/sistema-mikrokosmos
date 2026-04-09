<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import TheHeader from '@/components/TheHeader.vue'
import TheSidebar from '@/components/TheSideBar.vue'
import TheFooter from '@/components/TheFooter.vue'
import DynamicBanner from '@/components/DynamicBanner.vue'

// --- DEFINICIÓN DE TIPOS ---
// Interfaz ajustada a tu tabla 'public.producto'
interface ProductoHome {
  id_productos: number; // Coincide con tu PK
  nombre: string;
  precio: number;
  // La imagen vendrá de la relación con producto_imagenes
  portada?: string; 
}

// --- ESTADOS ---
const sidebarExpandido = ref(true)
const productos = ref<ProductoHome[]>([])
const cargando = ref(true)
const filtroActivo = ref<{ categoria: string, valor: string } | null>(null)

const toggleSidebar = () => {
  sidebarExpandido.value = !sidebarExpandido.value
}

const aplicarFiltro = (filtro: { categoria: string, valor: string }) => {
  filtroActivo.value = filtro
  obtenerDatosHome()
}

const limpiarFiltro = () => {
  filtroActivo.value = null
  obtenerDatosHome()
}

// --- PETICIONES CON FETCH ---
const obtenerDatosHome = async () => {
  try {
    cargando.value = true
    
    // Base de la URL
    let baseUrl = `https://qqzqtxfykfmauujsqgoy.supabase.co/rest/v1/producto?select=id_productos,nombre,precio,producto_imagenes(url_imagen)`
    
    // Aplicar filtros dinámicos según la categoría del Sidebar
    if (filtroActivo.value) {
      const { categoria, valor } = filtroActivo.value
      
      if (categoria === 'Géneros') {
        baseUrl += `,libro_detalles!inner(genero)&libro_detalles.genero=eq.${valor}`
      } else if (categoria === 'Editoriales') {
        baseUrl += `,libro_detalles!inner(editorial)&libro_detalles.editorial=eq.${valor}`
      } else if (categoria === 'Accesorios literarios') {
        baseUrl += `,articulo_detalles!inner(categoria)&articulo_detalles.categoria=eq.${valor}`
      } else if (categoria === 'Sagas/Estuches') {
        // Asumimos que también están en libro_detalles bajo una lógica similar si aplica
        baseUrl += `,libro_detalles!inner(genero)&libro_detalles.genero=eq.${valor}`
      }
    }

    const supabaseKey = 'sb_publishable_URWKs3wjsKY0qg-GvXbHjg_CeLMSw25'

    const res = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) throw new Error('Error al conectar con Supabase')

    const data = await res.json()

    // Mapeamos los datos de Supabase a tu componente
    productos.value = data.map((p: any) => ({
      id_productos: p.id_productos,
      nombre: p.nombre,
      precio: p.precio,
      // Supabase devuelve las relaciones como un array: producto_imagenes[0]
      portada: p.producto_imagenes?.[0]?.url_imagen || 'https://via.placeholder.com/200x300'
    }))

  } catch (error) {
    console.error("Error en la conexión:", error)
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  obtenerDatosHome()
})
</script>

<template>
  <div class="page-layout">
    <TheHeader />

    <div class="main-wrapper">
      <TheSidebar 
        :is-open="sidebarExpandido" 
        @toggle-menu="toggleSidebar" 
        @filtrar="aplicarFiltro"
      />

      <main class="content-area">
        <div v-if="cargando" class="loader-container">
          <div class="spinner"></div>
        </div>

        <template v-else>
          <DynamicBanner v-if="!filtroActivo" />
          
          <section class="book-grid-section">
            <div v-if="filtroActivo" class="filter-header">
              <span class="active-filter">
                Filtrando por: <strong>{{ filtroActivo.valor }}</strong>
              </span>
              <button class="btn-clear" @click="limpiarFiltro">Limpiar Filtros</button>
            </div>

            <div v-if="productos.length === 0" class="no-results">
              <p>No se encontraron libros para esta categoría.</p>
              <button class="btn-clear" @click="limpiarFiltro">Ver todo el catálogo</button>
            </div>
            <div class="book-grid">
              <RouterLink 
                v-for="prod in productos" 
                :key="prod.id_productos" 
                :to="{ name: 'book-detail', params: { id: prod.id_productos }}"
                class="book-link-wrapper"
              >
                <div class="book-card">
                  <img :src="prod.portada" :alt="prod.nombre" class="book-cover" />
                  <div class="card-overlay">
                    <span>{{ prod.nombre }}</span>
                    <p>${{ prod.precio }}</p>
                  </div>
                </div>
              </RouterLink>
            </div>
          </section>
        </template>
      </main>
    </div>

    <TheFooter />
  </div>
</template>

<style scoped>
/* Se mantienen tus estilos de diseño (cian, morado, scrollbar) */
.page-layout { display: flex; flex-direction: column; height: 100vh; }
.main-wrapper { display: flex; flex: 1; overflow: hidden; }
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-left: 2px solid #00BFFF; 
  background-color: #fff;
  overflow-y: auto;
}
.loader-container { flex: 1; display: flex; align-items: center; justify-content: center; }
.spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #6A5ACD; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.book-grid-section { padding: 20px 40px 40px; }
.book-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 30px; }
.book-card { position: relative; aspect-ratio: 2/3; border-radius: 5px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: 0.3s; }
.book-card:hover { transform: translateY(-8px); }

.card-overlay { 
  position: absolute; bottom: 0; width: 100%; background: rgba(106, 90, 205, 0.9); 
  color: white; padding: 12px; text-align: center; opacity: 0; transition: 0.3s; 
}
.book-card:hover .card-overlay { opacity: 1; }
.book-link-wrapper { text-decoration: none; color: inherit; display: block; }

/* Estilos de Filtrado */
.filter-header {
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #6A5ACD;
}
.active-filter { color: #333; font-size: 1.1rem; }
.active-filter strong { color: #6A5ACD; }
.btn-clear {
  background: none;
  border: 1px solid #6A5ACD;
  color: #6A5ACD;
  padding: 5px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: 0.3s;
}
.btn-clear:hover { background: #6A5ACD; color: white; }

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}
.no-results p { font-size: 1.2rem; margin-bottom: 20px; }
</style>