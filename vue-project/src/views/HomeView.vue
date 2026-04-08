<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import TheHeader from '@/components/TheHeader.vue'
import TheSidebar from '@/components/TheSideBar.vue'
import TheFooter from '@/components/TheFooter.vue'

// Importación del banner local
import banner1 from '/assets/banner_mock.webp'

// --- DEFINICIÓN DE TIPOS ---
interface Banner {
  imagen: string;
  subtitulo: string;
  titulo: string;
  promo: string;
}

// --- LÓGICA DE NAVEGACIÓN ---
const sidebarExpandido = ref(true)
const toggleSidebar = () => {
  sidebarExpandido.value = !sidebarExpandido.value
}

// --- LÓGICA DEL CARRUSEL ---
const indiceActual = ref(0)
let intervalo: any = null

const banners = ref<Banner[]>([
  {
    imagen: banner1,
    subtitulo: '¿Encontrarte a ti misma?',
    titulo: 'PREVENTA IMPERDIBLE*',
    promo: '¡Asegura tu libro hoy! Incluye manilla que cambia de color'
  },
  {
    imagen: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=1200",
    subtitulo: 'Nuevas aventuras literarias',
    titulo: 'DESCUBRE EL MIKROKOSMOS',
    promo: 'Explora nuestra selección mensual de novelas gráficas'
  }
])

/** * SOLUCIÓN AL ERROR DE LA IMAGEN: 
 * Agregamos "as Banner" al final para asegurar a TS que siempre habrá un dato.
 */
const bannerActivo = computed<Banner>(() => {
  return (banners.value[indiceActual.value] || banners.value[0]) as Banner
})

const siguienteBanner = () => {
  indiceActual.value = (indiceActual.value + 1) % banners.value.length
}

// Cambio automático cada 10 segundos
onMounted(() => {
  intervalo = setInterval(siguienteBanner, 10000)
})

onUnmounted(() => {
  if (intervalo) clearInterval(intervalo)
})

// --- DATOS DE LIBROS ---
const librosPrueba = ref(
  Array.from({ length: 15 }, (_, i) => ({
    id: i,
    titulo: `Libro ${i + 1}`,
    portada: `https://picsum.photos/seed/${i + 40}/200/300` 
  }))
)
</script>

<template>
  <div class="page-layout">
    <TheHeader />

    <div class="main-wrapper">
      <TheSidebar 
        :is-open="sidebarExpandido" 
        @toggle-menu="toggleSidebar" 
      />

      <main class="content-area">
        <section class="banner-section">
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

            <div class="slider-dots">
              <span 
                v-for="(_, i) in banners" 
                :key="i" 
                :class="['dot', { active: i === indiceActual }]"
                @click="indiceActual = i"
              ></span>
            </div>
          </div>
        </section>

        <section class="book-grid-section">
  <div class="book-grid">
    <RouterLink 
      v-for="libro in librosPrueba" 
      :key="libro.id" 
      :to="{ name: 'book-detail', params: { id: libro.id }}"
      class="book-link-wrapper"
    >
      <div class="book-card">
        <img :src="libro.portada" :alt="libro.titulo" class="book-cover" />
        <div class="card-overlay">
          <span>Ver detalles</span>
        </div>
      </div>
    </RouterLink>
  </div>
</section>
      </main>
    </div>

    <TheFooter />
  </div>
</template>

<style scoped>
.page-layout { display: flex; flex-direction: column; height: 100vh; }
.main-wrapper { display: flex; flex: 1; overflow: hidden; }

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-left: 2px solid #00BFFF; /* Borde cian del diseño */
  background-color: #fff;
  overflow-y: auto;
  transition: all 0.3s ease;
}

/* src/views/HomeView.vue (Style) */
.book-link-wrapper {
  text-decoration: none;
  color: inherit; /* Mantiene los colores originales */
  display: block; /* Para que ocupe todo el espacio de la card */
}

/* SLIDER */
.banner-section { width: 100%; padding: 20px; box-sizing: border-box; }
.banner-slider { 
  width: 100%; 
  height: 300px; 
  position: relative; 
  border-radius: 8px; 
  overflow: hidden;
  background-color: #000;
}

.banner-container { width: 100%; height: 100%; position: relative; }
.banner-img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.8); }

.banner-text-overlay {
  position: absolute;
  top: 50%;
  left: 40px;
  transform: translateY(-50%);
  color: white;
  text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
}

.title {
  font-size: 3rem;
  font-weight: 900;
  color: #00FFFF; /* Turquesa del banner */
  margin: 5px 0;
  line-height: 1.1;
}

.slider-dots { position: absolute; bottom: 15px; width: 100%; display: flex; justify-content: center; gap: 8px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255, 255, 255, 0.4); cursor: pointer; transition: 0.3s; }
.dot.active { background: #00FFFF; transform: scale(1.2); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.8s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* GRILLA */
.book-grid-section { padding: 20px 40px 40px; }
.book-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 30px; }
.book-card { position: relative; aspect-ratio: 2/3; border-radius: 5px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: transform 0.3s; }
.book-card:hover { transform: translateY(-8px); }

.card-overlay { 
  position: absolute; 
  bottom: 0; 
  width: 100%; 
  background: rgba(106, 90, 205, 0.9); /* Morado de los bloques */
  color: white; 
  padding: 12px; 
  text-align: center; 
  opacity: 0; 
  transition: opacity 0.3s; 
}
.book-card:hover .card-overlay { opacity: 1; }

.content-area::-webkit-scrollbar { width: 8px; }
.content-area::-webkit-scrollbar-thumb { background: #6A5ACD; border-radius: 10px; }
</style>