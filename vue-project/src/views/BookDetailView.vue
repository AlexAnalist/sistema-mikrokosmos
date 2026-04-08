<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import TheHeader from '@/components/TheHeader.vue'
import TheSidebar from '@/components/TheSideBar.vue'
import TheFooter from '@/components/TheFooter.vue'
import { Star, MessageSquare } from 'lucide-vue-next'

// Definimos la interfaz para evitar errores de TypeScript
interface LibroDetalle {
  titulo: string;
  autor: string;
  editorial: string;
  precio: string;
  portada: string;
  sinopsis: string;
  paginas: string;
  dimensiones: string;
  tapa: string;
}

const props = defineProps<{
  id: string
}>()

// --- ESTADO DE NAVEGACIÓN ---
const sidebarExpandido = ref(true)
const toggleSidebar = () => {
  sidebarExpandido.value = !sidebarExpandido.value
}

// --- DATOS DE PRUEBA (MOCKS) ---
// Como aún no hay conexión a base de datos, usamos este objeto estático
const libro = ref<LibroDetalle>({
  titulo: 'Percy Jackson y el ladrón del rayo',
  autor: 'Rick Riordan',
  editorial: 'Salamandra',
  precio: '15$',
  portada: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1681930211i/28187.jpg',
  sinopsis: 'Acompaña a Percy a través de esta apasionante serie de aventuras.',
  paginas: '400',
  dimensiones: '12 x 19 cm',
  tapa: 'Tapa blanda'
})

const imagenesProducto = ref([libro.value.portada, libro.value.portada, libro.value.portada])
const imagenActualIndex = ref(0)

// --- LÓGICA DE EXPANSIÓN DE SINOPSIS ---
const expandido = ref(false)

const toggleLeerMas = () => {
  expandido.value = !expandido.value
}

// Actualizamos el mock con un texto más largo para probar
libro.value.sinopsis = 'Acompaña a Percy a través de esta apasionante serie de aventuras. Tras descubrir que es un semidiós hijo de Poseidón, Percy debe viajar al Olimpo para evitar una guerra entre los dioses. En su camino enfrentará monstruos mitológicos, descubrirá el valor de la amistad en el Campamento Mestizo y aprenderá que el destino no está escrito en piedra, sino que se forja con cada decisión.'

const comentarios = ref([
  { usuario: '@felicita_perez', texto: 'Ame este libro, super recomendado!' },
  { usuario: '@Alejandro_Carrera', texto: 'Me llegó ayer y es igual a las fotos' }
])
</script>

<template>
  <div class="page-layout">
    <TheHeader />

    <div class="main-wrapper">
      <TheSidebar :is-open="sidebarExpandido" @toggle-menu="toggleSidebar" />

      <main class="content-area">
        <div class="product-container">
          
          <div class="left-column">
            <div class="main-image-wrapper">
              <img :src="imagenesProducto[imagenActualIndex]" :alt="libro.titulo" class="product-image" />
              <div class="carousel-dots">
                <span 
                  v-for="(_, index) in imagenesProducto" 
                  :key="index"
                  :class="['dot', { active: index === imagenActualIndex }]"
                  @click="imagenActualIndex = index"
                ></span>
              </div>
            </div>

            <div class="rating-section">
              <h3>Reseñas</h3>
              <div class="stars">
                <span class="rating-placeholder">☆☆☆☆☆</span>
              </div>
              <button class="rankea-btn">Rankea</button>
            </div>

            <div class="tech-specs">
              <div class="spec-block"><span>{{ libro.paginas }} Páginas</span></div>
              <div class="spec-block"><span>{{ libro.dimensiones }}</span></div>
              <div class="spec-block"><span>{{ libro.tapa }}</span></div>
              <div class="spec-block ship-info"><span>Envío entre 5 a 8 días</span></div>
            </div>

            <div class="comments-section">
              <div class="comment-input-wrapper">
                <MessageSquare class="comment-icon" />
                <input type="text" placeholder="Agrega un comentario..." class="comment-input" />
              </div>
              <div class="comments-list">
                <div v-for="(comment, index) in comentarios" :key="index" class="comment-item">
                  <span class="comment-user">{{ comment.usuario }}:</span>
                  <p class="comment-text">{{ comment.texto }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="right-column">
            <h1 class="product-title">{{ libro.titulo }}</h1>
            
            <div class="main-meta">
              <p>
                <span class="autor-text">{{ libro.autor }}</span> 
                <span class="price">Precio {{ libro.precio }}</span>
              </p>
              <p class="editorial-text">{{ libro.editorial }}</p>
            </div>

            <div class="synopsis-section">
                <p>
                    <strong>Sinopsis:</strong> 
                    <span :class="['sinopsis-texto', { 'truncado': !expandido }]">
                      {{ libro.sinopsis }}
                    </span>
                </p>
                <button class="leer-mas-btn" @click="toggleLeerMas">
                    {{ expandido ? 'Leer menos ↑' : 'Leer más...' }}
                </button>
            </div>

            <div class="action-section">
              <button class="add-to-cart-btn">Añadir al carrito</button>
            </div>
          </div>

        </div>
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
  padding: 40px;
  background-color: #fff;
  border: 3px solid #00BFFF; /* Borde cian característico */
  overflow-y: auto;
}

.product-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  max-width: 1100px;
  margin: 0 auto;
}

.synopsis-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 100%;
}

.sinopsis-texto {
  display: block; 
  line-height: 1.5;
  transition: all 0.3s ease;
}

/* Corregido: Ahora el nombre coincide con el del template */
.truncado {
  display: -webkit-box;
  -webkit-line-clamp: 3; 
  -webkit-box-orient: vertical;  
  overflow: hidden;
  text-overflow: ellipsis;
}

.leer-mas-btn {
  align-self: flex-start;
  background: #6A5ACD; 
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
}

.leer-mas-btn:hover {
  background: #9370DB;
}

/* IZQUIERDA */
.main-image-wrapper {
  width: 100%;
  aspect-ratio: 1/1;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 1px solid #eee;
  border-radius: 8px;
}
.product-image { max-height: 85%; object-fit: contain; }
.carousel-dots { position: absolute; bottom: 10px; display: flex; gap: 5px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #ccc; cursor: pointer; }
.dot.active { background: #6A5ACD; }

.rating-section { display: flex; align-items: center; gap: 10px; margin: 15px 0; }
.rankea-btn { background: #9370DB; color: #fff; border: none; padding: 5px 15px; border-radius: 5px; cursor: pointer; }

.tech-specs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.spec-block { background: #E6E6FA; padding: 10px; border-radius: 5px; text-align: center; font-size: 0.9rem; color: #444; }
.ship-info { background: #f8f8f8; border: 1px dashed #ccc; }

.comments-section { margin-top: 20px; display: flex; flex-direction: column; gap: 10px; }
.comment-input-wrapper { display: flex; align-items: center; gap: 10px; border: 1px solid #ddd; border-radius: 20px; padding: 5px 15px; }
.comment-input { border: none; flex: 1; outline: none; }
.comment-item { background: #E6E6FA; padding: 10px; border-radius: 10px; font-size: 0.85rem; }
.comment-user { font-weight: bold; margin-right: 5px; }

/* DERECHA */
.product-title { font-size: 2.2rem; font-weight: 800; line-height: 1.2; margin-bottom: 10px; }
.main-meta { font-size: 1.1rem; margin-bottom: 20px; }
.price { font-size: 1.8rem; font-weight: 900; float: right; }
.synopsis-section { line-height: 1.5; color: #555; margin-bottom: 30px; }
.leer-mas { background: none; border: none; color: #6A5ACD; font-weight: bold; cursor: pointer; }

.add-to-cart-btn {
  width: 100%;
  background: #6A5ACD; /* Morado corporativo */
  color: white;
  border: none;
  padding: 15px;
  font-size: 1.4rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(106, 90, 205, 0.2);
}
</style>