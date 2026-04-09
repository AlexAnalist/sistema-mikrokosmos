<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import TheHeader from '@/components/TheHeader.vue'
import TheSidebar from '@/components/TheSideBar.vue'
import TheFooter from '@/components/TheFooter.vue'

// --- DEFINICIÓN DE TIPOS ---
interface Banner {
  imagen: string;
  subtitulo: string;
  titulo: string;
  promo: string;
}

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
const indiceActual = ref(0)
const banners = ref<Banner[]>([])
const productos = ref<ProductoHome[]>([])
const cargando = ref(true)
let intervalo: any = null

const toggleSidebar = () => {
  sidebarExpandido.value = !sidebarExpandido.value
}

// --- PETICIONES CON FETCH ---
const obtenerDatosHome = async () => {
  try {
    cargando.value = true
    
    // Consultamos la tabla 'producto' y traemos la 'url_imagen' de la tabla relacionada
    // Nota: Supabase usa el formato ?select=columna,tabla_relacionada(columna)
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/producto?select=id_productos,nombre,precio,producto_imagenes(url_imagen)`

    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    const res = await fetch(url, {
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

    // Simulamos banners estáticos ya que pediste no tocarlos
    banners.value = [
      {
        imagen: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200",
        subtitulo: '¿Encontrarte a ti misma?',
        titulo: 'PREVENTA IMPERDIBLE*',
        promo: '¡Asegura tu libro hoy!'
      }
    ]

  } catch (error) {
    console.error("Error en la conexión:", error)
  } finally {
    cargando.value = false
  }
}

// --- LÓGICA DEL CARRUSEL ---
const bannerActivo = computed<Banner | null>(() => {
  if (banners.value.length === 0) return null
  return banners.value[indiceActual.value] as Banner
})

const siguienteBanner = () => {
  if (banners.value.length > 0) {
    indiceActual.value = (indiceActual.value + 1) % banners.value.length
  }
}

onMounted(() => {
  obtenerDatosHome()
  intervalo = setInterval(siguienteBanner, 10000)
})

onUnmounted(() => {
  if (intervalo) clearInterval(intervalo)
})
</script>

<template>
  <div class="page-layout">
    <TheHeader />

    <div class="main-wrapper">
      <TheSidebar :is-open="sidebarExpandido" @toggle-menu="toggleSidebar" />

      <main class="content-area">
        <div v-if="cargando" class="loader-container">
          <div class="spinner"></div>
        </div>

        <template v-else>
          <section v-if="banners.length > 0" class="banner-section">
            <div class="banner-slider">
              <transition name="fade" mode="out-in">
                <div v-if="bannerActivo" :key="indiceActual" class="banner-container">
                  <img :src="bannerActivo.imagen" class="banner-img" />
                  <div class="banner-text-overlay">
                    <p class="subtitle">{{ bannerActivo.subtitulo }}</p>
                    <h2 class="title">{{ bannerActivo.titulo }}</h2>
                    <p class="promo">{{ bannerActivo.promo }}</p>
                  </div>
                </div>
              </transition>
            </div>
          </section>

          <section class="book-grid-section">
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
</style>