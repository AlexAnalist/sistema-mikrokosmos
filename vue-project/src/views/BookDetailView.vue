<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import TheHeader from '@/components/TheHeader.vue'
import TheSidebar from '@/components/TheSideBar.vue'
import TheFooter from '@/components/TheFooter.vue'
import { MessageSquare } from 'lucide-vue-next'
import { supabase } from '@/supabase'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()
const router = useRouter()
const route = useRoute()

// 1. Interfaces Estrictas SQL
interface LibroDetalles {
  id_productos: number;
  autor: string;
  editorial: string;
  sinopsis: string;
  n_paginas: number;
}

interface LibroDetalle {
  id_productos: number;
  nombre: string;
  precio: number;
  tipo_producto: 'Libro' | 'Articulo';
  autor?: string;
  editorial?: string;
  sinopsis?: string;
  n_paginas?: number | string;
  tipo_tapa?: string;
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
const nuevoComentario = ref('')

const toggleSidebar = () => {
  sidebarExpandido.value = !sidebarExpandido.value
}

const toggleLeerMas = () => {
  expandido.value = !expandido.value
}

const agregarComentario = () => {
  if (!nuevoComentario.value.trim()) return

  // Obtenemos el nombre del usuario logueado o anónimo
  const userLocal = JSON.parse(localStorage.getItem('mikrokosmos_user') || '{}')
  const nombreUsuario = userLocal.nombre || 'Yo'

  // Agregamos al arreglo local (mecánica simulada)
  comentarios.value.unshift({
    usuario: nombreUsuario,
    texto: nuevoComentario.value,
    fecha: new Date().toLocaleDateString()
  })

  nuevoComentario.value = ''
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
    const productId = Number(props.id);
    const endpoint = `${SUPABASE_URL}/producto?id_productos=eq.${productId}&${query}`;

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
      const dL = p.libro_detalles?.[0] || p.libro_detalles;
      const dA = p.articulo_detalles?.[0] || p.articulo_detalles;

      // Mapeo dinámico para que el HTML funcione con ambos tipos
      libro.value = {
        id_productos: p.id_productos,
        nombre: p.nombre,
        precio: Number(p.precio),
        tipo_producto: p.tipo_producto as 'Libro' | 'Articulo',

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

const handleAddToCart = async () => {
  const { data } = await supabase.auth.getSession()
  const userManual = localStorage.getItem('mikrokosmos_user')
  
  if (!data.session && !userManual) {
    alert("Debes iniciar sesión para añadir productos al carrito.")
    router.push('/login')
    return
  }

  if (libro.value) {
    cartStore.agregarAlCarrito({
      id_producto: libro.value.id_productos,
      titulo: libro.value.nombre,
      precio: libro.value.precio,
      cantidad: 1,
      imagen_url: imagenesProducto.value[0]
    })
    alert("¡Producto añadido al carrito!")
  }
}

onMounted(async () => {
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
              <img :src="imagenesProducto[imagenActualIndex]" :alt="libro?.nombre" class="product-image" />
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
              <h3 class="hina-mincho-font">Reseñas</h3>
              <div class="stars">
                <span class="rating-placeholder">☆☆☆☆☆</span>
              </div>
              <button class="rankea-btn">Rankea</button>
            </div>

            <div class="tech-specs">
              <div class="spec-block"><span>{{ libro?.n_paginas || 'N/A' }} Páginas</span></div>
              <div class="spec-block"><span>{{ libro?.dimensiones || 'N/A' }}</span></div>
              <div class="spec-block"><span>{{ libro?.tipo_tapa || 'S/E' }}</span></div>
              <div class="spec-block ship-info"><span>Envío entre 5 a 8 días</span></div>
            </div>

            <div class="comments-section">
              <div class="comment-input-wrapper">
                <MessageSquare class="comment-icon" />
                <input 
                  type="text" 
                  placeholder="Agrega un comentario..." 
                  class="comment-input" 
                  v-model="nuevoComentario"
                  @keyup.enter="agregarComentario"
                />
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
            <h1 class="product-title hina-mincho-font">{{ libro?.nombre }}</h1>
            
            <div class="main-meta">
              <p>
                <span class="autor-text">{{ libro?.autor }}</span> 
                <span class="price">Precio {{ libro?.precio }}$</span>
              </p>
              <p class="editorial-text">{{ libro?.editorial }}</p>
            </div>

            <div class="synopsis-section">
                <p>
                    <strong>Sinopsis:</strong> 
                    <span :class="['sinopsis-texto', { 'truncado': !expandido }]">
                      {{ libro?.sinopsis || 'Cargando información...' }}
                    </span>
                </p>
                <button class="leer-mas-btn" @click="toggleLeerMas">
                    {{ expandido ? 'Leer menos ↑' : 'Leer más...' }}
                </button>
            </div>

            <div class="action-section">
              <button class="add-to-cart-btn" @click="handleAddToCart">Añadir al carrito</button>
            </div>
          </div>

        </div>
        <div v-else class="not-found hina-mincho-font">Producto no encontrado.</div>
      </main>
    </div>

    <TheFooter />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Hina+Mincho&family=Inter:wght@300;400;500;600&display=swap');

.hina-mincho-font { font-family: 'Hina Mincho', serif; }

.page-layout { display: flex; flex-direction: column; min-height: 100vh; background: #fff; }
.main-wrapper { display: flex; flex: 1; overflow: hidden; }

.content-area {
  flex: 1;
  padding: 40px;
  background-color: #fff;
  overflow-y: auto;
}

.loader-placeholder { display: flex; justify-content: center; align-items: center; height: 100%; font-weight: bold; color: #6A5ACD; font-family: 'Hina Mincho', serif; font-size: 1.5rem; }

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
  line-height: 1.6;
  transition: all 0.3s ease;
  color: #444;
}

.truncado {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;  
  overflow: hidden;
  text-overflow: ellipsis;
}

.leer-mas-btn {
  align-self: flex-start;
  background: transparent;
  color: #6A5ACD;
  border: 1px solid #6A5ACD;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.leer-mas-btn:hover {
  background: #6A5ACD;
  color: white;
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
  border: 1px solid #f0f0f0;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

.product-image { 
  width: 90%; 
  height: 90%; 
  object-fit: contain; 
}

.carousel-dots { position: absolute; bottom: 15px; display: flex; gap: 8px; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: #ddd; cursor: pointer; transition: background 0.3s; }
.dot.active { background: #6A5ACD; }

.rating-section { display: flex; align-items: center; gap: 15px; margin: 20px 0; }
.stars { color: #FFD700; font-size: 1.2rem; }
.rankea-btn { background: #E6E6FA; color: #6A5ACD; border: none; padding: 6px 18px; border-radius: 8px; cursor: pointer; font-weight: 500; transition: background 0.3s; }
.rankea-btn:hover { background: #dcdcf7; }

.tech-specs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
.spec-block { background: #fdfdfd; padding: 12px; border: 1px solid #f0f0f0; border-radius: 10px; text-align: center; font-size: 0.9rem; color: #666; }
.ship-info { background: #fdf7ff; border: 1px dashed #9584c4; color: #9584c4; }

.comments-section { margin-top: 30px; display: flex; flex-direction: column; gap: 15px; }
.comment-input-wrapper { display: flex; align-items: center; gap: 12px; border: 1px solid #eee; border-radius: 25px; padding: 8px 20px; background: #fafafa; }
.comment-icon { color: #aaa; width: 18px; }
.comment-input { border: none; flex: 1; outline: none; background: transparent; font-size: 0.95rem; }

.comments-list { display: flex; flex-direction: column; gap: 12px; }
.comment-item { background: #fff; padding: 15px; border: 1px solid #f5f5f5; border-radius: 12px; font-size: 0.9rem; }
.comment-user { font-weight: 700; color: #333; margin-bottom: 4px; display: block; }

/* DERECHA */
.product-title { font-size: 2.8rem; font-weight: normal; line-height: 1.1; margin-bottom: 15px; color: #222; }
.main-meta { margin-bottom: 25px; border-bottom: 1px solid #f0f0f0; padding-bottom: 20px; }
.autor-text { font-size: 1.3rem; color: #666; font-style: italic; }
.price { font-size: 2.2rem; font-weight: 700; color: #9584c4; float: right; font-family: 'Hina Mincho', serif; }
.editorial-text { font-size: 1rem; color: #aaa; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px; }

.action-section { margin-top: 40px; }
.add-to-cart-btn {
  width: 100%;
  background: #9584c4;
  color: white;
  border: none;
  padding: 18px;
  font-size: 1.4rem;
  font-weight: bold;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 10px 20px rgba(149, 132, 196, 0.2);
}
.add-to-cart-btn:hover { background: #7f6eac; transform: translateY(-2px); box-shadow: 0 15px 30px rgba(149, 132, 196, 0.3); }

.not-found { text-align: center; padding: 100px; font-size: 2rem; color: #888; }

@media (max-width: 900px) {
  .product-container { grid-template-columns: 1fr; }
}
</style>