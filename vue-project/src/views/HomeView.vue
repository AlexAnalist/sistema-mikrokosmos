<script setup lang="ts">
import TheHeader from '@/components/TheHeader.vue'
import TheSidebar from '@/components/TheSideBar.vue'
import TheFooter from '@/components/TheFooter.vue'
import { ref } from 'vue'

// --- LÓGICA DE RETRACCIÓN ---
const sidebarExpandido = ref(true)

const toggleSidebar = () => {
  sidebarExpandido.value = !sidebarExpandido.value
}

// --- ESQUELETO DE DATOS ---
const librosPrueba = ref(
  Array.from({ length: 15 }, (_, i) => ({
    id: i,
    titulo: `Libro de Prueba ${i + 1}`,
    portada: `https://picsum.photos/seed/${i + 40}/200/300` 
  }))
)

// Solución al error de Vite: Asegúrate de que la ruta y extensión coincidan con tu VS Code
// Si en tu carpeta assets el archivo es .webp.png, ponlo así:
const bannerTemporal = "/assets/banner_mock.webp" 
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
          <div class="banner-carousel">
            <img :src="bannerTemporal" alt="Banner" class="banner-img" />
          </div>
        </section>

        <section class="book-grid-section">
          <div class="book-grid">
            <div v-for="libro in librosPrueba" :key="libro.id" class="book-card">
              <img :src="libro.portada" :alt="libro.titulo" class="book-cover" />
              <div class="card-overlay">
                <span>Ver detalles</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>

    <TheFooter />
  </div>
</template>

<style scoped>
/* Tu CSS está perfecto, solo asegúrate de mantener overflow: hidden en .main-wrapper 
   para que el sidebar no empuje el contenido hacia afuera al esconderse */
.main-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden; 
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 2px solid #00BFFF;
  background-color: #fff;
  overflow-y: auto;
  transition: all 0.3s ease; /* Esto hace que la grilla de libros se ensanche suavemente */
}

/* BANNER */

.banner-section {

  width: 100%;

  height: 280px;

  position: relative;

  overflow: hidden;

}



.banner-img {

  width: 100%;

  height: 100%;

  object-fit: cover;

  filter: brightness(0.7);

}



.banner-text-overlay {

  position: absolute;

  top: 50%;

  left: 50px;

  transform: translateY(-50%);

  color: white;

}



.subtitle { font-size: 1.2rem; font-style: italic; margin-bottom: 0; }

.title { font-size: 3rem; font-weight: 900; margin: 0; color: #00FFFF; }

.promo { font-size: 1.1rem; font-weight: bold; }



/* CUADRÍCULA DE LIBROS */

.book-grid-section {

  padding: 40px;

  background-color: #fff;

}



.book-grid {

  display: grid;

  /* Mantiene las 5 columnas, se ajustarán solas al crecer el área */

  grid-template-columns: repeat(5, 1fr);

  gap: 25px;

}



.book-card {

  position: relative;

  aspect-ratio: 2/3;

  background-color: #eee;

  border-radius: 8px;

  overflow: hidden;

  box-shadow: 0 4px 10px rgba(0,0,0,0.1);

  transition: all 0.3s ease;

  cursor: pointer;

}



.book-card:hover {

  transform: translateY(-10px);

  box-shadow: 0 10px 20px rgba(0,0,0,0.2);

}



.book-cover {

  width: 100%;

  height: 100%;

  object-fit: cover;

}



.card-overlay {

  position: absolute;

  bottom: 0;

  width: 100%;

  height: 40px;

  background: rgba(106, 90, 205, 0.8);

  color: white;

  display: flex;

  align-items: center;

  justify-content: center;

  font-size: 0.8rem;

  opacity: 0;

  transition: opacity 0.3s;

}



.book-card:hover .card-overlay {

  opacity: 1;

}



/* SCROLLBAR PERSONALIZADA */

.content-area::-webkit-scrollbar { width: 8px; }

.content-area::-webkit-scrollbar-thumb { background: #6A5ACD; border-radius: 10px; }
</style>