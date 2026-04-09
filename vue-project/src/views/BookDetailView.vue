<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TheHeader from '@/components/TheHeader.vue'
import TheSidebar from '@/components/TheSideBar.vue'
import TheFooter from '@/components/TheFooter.vue'
import { MessageSquare } from 'lucide-vue-next'

// 1. Interfaz Híbrida: Acoplada a tu SQL (producto + libro_detalles + articulo_detalles)
interface LibroDetalle {
  id_productos: number;
  nombre: string;
  precio: number;
  tipo_producto: 'Libro' | 'Articulo';
  estrellas?: number;

  // Campos de Libro
  autor?: string;
  editorial?: string;
  sinopsis?: string;
  n_paginas?: number | string;
  tipo_tapa?: string;

  // Campos de Artículo
  descripcion?: string;
  categoria?: string;
  peso?: number | string;
  color?: string;

  dimensiones?: string;
}

const props = defineProps<{
  id: string
}>()

// --- ESTADOS ---
const sidebarExpandido = ref(true)
const libro = ref<LibroDetalle | null>(null) 
const imagenesProducto = ref<string[]>([])
const imagenActualIndex = ref(0)
const comentarios = ref<any[]>([])
const cargando = ref(true)
const expandido = ref(false)

const toggleSidebar = () => {
  sidebarExpandido.value = !sidebarExpandido.value
}

const toggleLeerMas = () => {
  expandido.value = !expandido.value
}

// --- FUNCIONES DE CARGA ---

const obtenerComentarios = async () => {
  try {
    const URL_BASE = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`;
    const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const query = 'select=comentario,fecha,usuario(nombre)';
    const url = `${URL_BASE}/comentarios?id_productos=eq.${props.id}&${query}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) throw new Error('Error en comentarios');
    const data = await res.json();

    comentarios.value = data.map((c: any) => ({
      usuario: c.usuario?.nombre || 'Usuario Anónimo',
      texto: c.comentario,
      fecha: new Date(c.fecha).toLocaleDateString()
    }));
  } catch (error) {
    console.log("Error en comentarios:", error);
  }
};

const obtenerDetalles = async () => {
  try {
    cargando.value = true;
    const SUPABASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`;
    const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const query = 'select=*,libro_detalles(*),articulo_detalles(*),producto_imagenes(url_imagen)';
    const endpoint = `${SUPABASE_URL}/producto?id_productos=eq.${props.id}&${query}`;

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) throw new Error(`Fallo de red: ${res.status}`);
    const data = await res.json();

    if (data && data.length > 0) {
      const p = data[0];
      const esLibro = p.tipo_producto === 'Libro';
      const dL = p.libro_detalles;
      const dA = p.articulo_detalles;

      // Mapeo dinámico para que el HTML funcione con ambos tipos
      libro.value = {
        id_productos: p.id_productos,
        nombre: p.nombre,
        precio: Number(p.precio), // Corregido el error de tipo string -> number
        tipo_producto: p.tipo_producto as 'Libro' | 'Articulo',

        // Lógica para que el diseño no se rompa si es un artículo
        autor: esLibro ? (dL?.autor || 'Autor desconocido') : (dA?.categoria || 'Accesorio'),
        editorial: esLibro ? (dL?.editorial || 'S/E') : 'Mikrokosmos Artículos',
        sinopsis: esLibro ? (dL?.sinopsis || 'Sin sinopsis.') : (dA?.descripcion || 'Sin descripción.'),
        
        n_paginas: esLibro ? (dL?.n_paginas || 0) : (dA?.peso ? `${dA.peso}g` : 'N/A'),
        dimensiones: esLibro ? (dL?.dimensiones || 'N/A') : (dA?.color || 'Original'),
        tipo_tapa: esLibro ? (dL?.tipo_tapa || 'Tapa blanda') : 'Producto Físico'
      };

      imagenesProducto.value = p.producto_imagenes?.map((img: any) => img.url_imagen) || [];
      if (imagenesProducto.value.length === 0) {
        imagenesProducto.value = ['https://via.placeholder.com/400x600?text=Sin+Imagen'];
      }
    } else {
      libro.value = null;
    }
  } catch (error) {
    console.error("Error crítico:", error);
    libro.value = null;
  } finally {
    cargando.value = false;
  }
};

onMounted(async () => {
  // Ejecutamos ambas para asegurar que la página se llene completa
  await obtenerDetalles();
  await obtenerComentarios();
});
</script>

<template>
  <div class="page-layout">
    <TheHeader />

    <div class="main-wrapper">
      <TheSidebar :is-open="sidebarExpandido" @toggle-menu="toggleSidebar" />

      <main class="content-area">
        <div v-if="cargando" class="loader-placeholder">Cargando libro...</div>

        <div v-else-if="libro" class="product-container">
          
          <div class="left-column">
            <div class="main-image-wrapper">
              <img :src="imagenesProducto[imagenActualIndex]" :alt="libro.nombre" class="product-image" />
              <div v-if="imagenesProducto.length > 1" class="carousel-dots">
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
              <div class="spec-block"><span>{{ libro.n_paginas }} Páginas</span></div>
              <div class="spec-block"><span>{{ libro.dimensiones }}</span></div>
              <div class="spec-block"><span>{{ libro.tipo_tapa }}</span></div>
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
            <h1 class="product-title">{{ libro.nombre }}</h1>
            
            <div class="main-meta">
              <p>
                <span class="autor-text">{{ libro.autor }}</span> 
                <span class="price">Precio {{ libro.precio }}$</span>
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
        <div v-else>Producto no encontrado.</div>
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

.loader-placeholder { display: flex; justify-content: center; align-items: center; height: 100%; font-weight: bold; color: #6A5ACD; }

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
/* ... (El resto de tus estilos .page-layout, .product-container, etc) */
</style>