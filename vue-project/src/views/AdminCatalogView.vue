<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { 
  Plus, 
  Check, 
  Trash2, 
  ChevronDown, 
  ChevronsUpDown,
  Image as ImageIcon 
} from 'lucide-vue-next'
import TheHeader from '@/components/TheHeader.vue'
import TheSideBar from '@/components/TheSideBar.vue'
import TheFooter from '@/components/TheFooter.vue'

const router = useRouter()

// --- INTERFACES ---
interface Producto {
  id_productosCol?: number; // Internal logic if needed, but DB uses id_productos
  id_productos: number;
  nombre: string;
  descripcion?: string;
  precio?: number | string;
  tipo_producto?: string;
  url_imagen?: string;
}

interface Banner {
  imagen: string;
  titulo: string;
}

interface UserSession {
  email?: string;
  id_rol?: number;
  nombre?: string;
}

// --- ESTADO ---
const sidebarOpen = ref(true)
const tipoProducto = ref<'libro' | 'articulo'>('libro')
const isAdmin = ref(false)

// Búsqueda
const listaProductos = ref<Producto[]>([])
const terminoBusqueda = ref('')

// Banners
const bannersData = ref<Banner[]>([
  { imagen: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200", titulo: 'PREVENTA IMPERDIBLE*' },
  { imagen: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=1200", titulo: 'ADÉNTRATE EN LA FANTASÍA' },
  { imagen: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200", titulo: 'TENDENCIAS DEL MES' }
])
const indiceBannerActual = ref(0)
const ordenBannerActual = ref(1)
const isCreandoBanner = ref(false)
const modoVista = ref<'nuevo' | 'busqueda' | 'edicion' | 'banner'>('nuevo')
const cargando = ref(false)

// Campos del formulario
const form = ref({
  id_productos: null as number | null,
  titulo: '',
  autor: '',
  editorial: '',
  sinopsis: '',
  tipoEnvio: '',
  precio: '' as string | number,
  paginas: 200 as number | string,
  dim_alto: '' as number | string,
  dim_ancho: '' as number | string,
  dim_largo: '' as number | string,
  tapa: 'Blanda',
  color: '',
  weight: '' as number | string,
  categoria: 'Velas'
})

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

// --- CONEXIÓN SUPABASE ---
const cargarProductos = async () => {
  cargando.value = true
  modoVista.value = 'busqueda'
  try {
    const { data, error } = await supabase
      .from('producto')
      .select('id_productos, nombre, descripcion, precio, tipo_producto, producto_imagenes(url_imagen)')
    
    if (error) throw error
    
    if (data) {
      listaProductos.value = data.map((p: any) => ({
        id_productos: p.id_productos,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: p.precio,
        tipo_producto: p.tipo_producto,
        url_imagen: p.producto_imagenes?.[0]?.url_imagen || ''
      })) as Producto[]
    }
  } catch (e) {
    console.error("Error cargando productos:", e)
  } finally {
    cargando.value = false
  }
}

const seleccionarProducto = (p: Producto) => {
  form.value = {
    id_productos: p.id_productos,
    titulo: p.nombre,
    autor: '', 
    editorial: '',
    sinopsis: p.descripcion || '',
    tipoEnvio: '',
    precio: p.precio || '',
    paginas: 200, dim_alto: '', dim_ancho: '', dim_largo: '', tapa: 'Blanda',
    color: '', weight: '', categoria: 'Velas'
  }
  
  // Detección mejorada: si el nombre sugiere un accesorio o si viene de la tabla/lógica de artículos
  const esAccesorio = 
    p.nombre.toLowerCase().includes('vela') || 
    p.nombre.toLowerCase().includes('lámpara') || 
    p.nombre.toLowerCase().includes('funda') || 
    p.nombre.toLowerCase().includes('separador')

  tipoProducto.value = esAccesorio ? 'articulo' : 'libro'
  modoVista.value = 'edicion'
}

const productosFiltrados = computed(() => {
  return listaProductos.value.filter(p => 
    p.nombre.toLowerCase().includes(terminoBusqueda.value.toLowerCase())
  )
})

// --- VERIFICACIÓN DE ACCESO ---
onMounted(() => {
  const user = JSON.parse(localStorage.getItem('mikrokosmos_user') || '{}') as UserSession
  if (user && (user.email === 'admin@libreria.com' || user.id_rol === 1)) {
    isAdmin.value = true 
  } else {
    // Para propósitos de desarrollo dejamos que se vea pero podrías redirigir
    isAdmin.value = true
  }
})

const handleSave = async () => {
  if (modoVista.value === 'banner') {
    alert('Banner guardado/actualizado (Simulación)')
    isCreandoBanner.value = false
    return
  }

  cargando.value = true
  try {
    const formData = {
      nombre: form.value.titulo,
      descripcion: form.value.sinopsis,
      precio: form.value.precio,
      tipo_producto: tipoProducto.value === 'libro' ? 'Libro' : 'Articulo'
    }

    if (modoVista.value === 'edicion' && form.value.id_productos) {
      // UPDATE
      const { error } = await supabase
        .from('producto')
        .update(formData)
        .eq('id_productos', form.value.id_productos)
      
      if (error) throw error
      alert(`Producto actualizado correctamente.`)
    } else {
      // INSERT
      const { data, error } = await supabase
        .from('producto')
        .insert([formData])
        .select('id_productos')
        .single()
        
      if (error) throw error
      alert(`Producto creado correctamente con ID: ${data?.id_productos}`)
    }
    
    modoVista.value = 'nuevo'
    form.value = { ...form.value, titulo: '', sinopsis: '', precio: '', id_productos: null }
  } catch (err: any) {
    console.error("Error guardando producto:", err)
    alert("Error al guardar: " + err.message)
  } finally {
    cargando.value = false
  }
}

const handleDelete = async () => {
  if (confirm('¿Estás seguro de que deseas eliminar este producto (y todas sus referencias)?')) {
    if (modoVista.value === 'banner') {
      alert('Banner eliminado (Simulación)')
      isCreandoBanner.value = false
      return
    }

    if (form.value.id_productos) {
      cargando.value = true
      try {
        const { error } = await supabase
          .from('producto')
          .delete()
          .eq('id_productos', form.value.id_productos)
          
        if (error) throw error
        alert('Producto eliminado correctamente.')
        modoVista.value = 'nuevo'
      } catch (err: any) {
        alert("Error al eliminar: " + err.message)
      } finally {
        cargando.value = false
      }
    } else {
      form.value = { ...form.value, titulo: '', sinopsis: '', precio: '', id_productos: null }
      modoVista.value = 'nuevo'
    }
  }
}

const prepareNuevoBanner = () => {
  isCreandoBanner.value = true
}
</script>

<template>
  <div class="page-layout">
    <TheHeader />

    <div class="main-wrapper">
      <TheSideBar :is-open="sidebarOpen" @toggle-menu="toggleSidebar" />
      
      <main class="content-area" v-if="isAdmin">
        <div class="admin-container">
          <header class="admin-view-header">
            <h1 class="view-title">Edición de Catálogo</h1>
            <div class="header-actions">
              <button class="icon-btn" @click="handleSave">
                <Check :size="40" />
              </button>
              <button class="icon-btn" @click="handleDelete">
                <Trash2 :size="40" />
              </button>
            </div>
          </header>

          <div class="editor-grid">
            <!-- COLUMNA IZQUIERDA: BOTONES DE ACCIÓN -->
            <div class="action-sidebar">
              <button class="admin-btn" :class="{ active: modoVista === 'nuevo' || modoVista === 'edicion' }" @click="modoVista = 'nuevo'">Nuevo</button>
              <button class="admin-btn" :class="{ active: (modoVista === 'busqueda') }" @click="cargarProductos">Editar</button>
              <button class="admin-btn" :class="{ active: modoVista === 'banner' }" @click="modoVista = 'banner'; isCreandoBanner = false">Banner</button>
            </div>

            <!-- VISTA DE BÚSQUEDA -->
            <div class="search-overlay" v-if="modoVista === 'busqueda'">
              <div class="search-box-admin">
                <input type="text" v-model="terminoBusqueda" placeholder="Value" />
                <button class="search-icon-btn"><Check :size="20" /></button>
              </div>

              <div class="results-list">
                <div v-if="cargando" class="loader-container">
                  <div class="spinner"></div>
                </div>
                <div v-else
                  v-for="p in productosFiltrados" 
                  :key="p.id_productos" 
                  class="result-item"
                  @click="seleccionarProducto(p)"
                >
                  {{ p.nombre }}
                </div>
              </div>
            </div>

            <!-- VISTA DE BANNER -->
            <div class="banner-manager-view" v-else-if="modoVista === 'banner'">
              <!-- SUB-VISTA: CREAR NUEVO -->
              <template v-if="isCreandoBanner">
                <div class="banner-section">
                  <p class="section-label">Vista previa:</p>
                  <div class="banner-preview-box">
                    <!-- Imagen de ejemplo del mockup -->
                    <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800" class="banner-preview-img-square" />
                  </div>
                  <div class="carousel-dots-admin">
                    <span class="dot-admin active"></span>
                    <span class="dot-admin"></span>
                    <span class="dot-admin"></span>
                  </div>
                </div>

                <div class="banner-section">
                  <p class="section-label">Selecciona la imagen para reemplazar:</p>
                  <div class="dropzone banner-dropzone">
                    <Plus :size="80" class="plus-icon" />
                  </div>
                </div>

                <div class="order-selector-section">
                  <p class="section-label">Selecciona el orden:</p>
                  <div class="order-boxes">
                    <div 
                      v-for="n in 4" 
                      :key="n" 
                      class="order-box"
                      :class="{ active: n === ordenBannerActual }"
                      @click="ordenBannerActual = n"
                    >
                      {{ n }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- SUB-VISTA: LISTA EXISTENTE -->
              <template v-else>
                <div class="banner-section">
                  <p class="section-label">Selecciona un banner existente:</p>
                  <div class="banner-preview-box" v-if="bannersData[indiceBannerActual]">
                    <img :src="bannersData[indiceBannerActual].imagen" class="banner-preview-img" />
                  </div>
                  <div class="carousel-dots-admin">
                    <span 
                      v-for="(_, i) in bannersData" 
                      :key="i" 
                      class="dot-admin"
                      :class="{ active: i === indiceBannerActual }"
                      @click="indiceBannerActual = i"
                    ></span>
                  </div>
                </div>

                <div class="banner-section">
                  <p class="section-label">Selecciona la imagen para reemplazar:</p>
                  <div class="dropzone banner-dropzone">
                    <Plus :size="80" class="plus-icon" />
                  </div>
                </div>

                <button class="add-new-banner-btn" @click="prepareNuevoBanner">Agrega un nuevo banner</button>
              </template>
            </div>

            <!-- VISTA DE FORMULARIO (EDICIÓN O NUEVO) -->
            <template v-else>
              <!-- COLUMNA CENTRAL: CARGA DE IMAGEN -->
              <div class="image-uploader-section">
                <p class="uploader-label">Arrastra la portada aquí o haz clic para subir:</p>
                <div class="dropzone">
                  <Plus :size="60" class="plus-icon" />
                </div>
                
                <!-- SELECTORES DINÁMICOS -->
                <div class="specs-selectors" v-if="tipoProducto === 'libro'">
                  <div class="spec-select no-hover">
                    <input type="number" v-model="form.paginas" class="spec-input-num" title="Páginas" />
                    <span class="spec-label">Páginas</span>
                  </div>
                  <div class="spec-select dimensions-box no-hover">
                    <div class="dim-inputs">
                      <input type="number" v-model="form.dim_alto" placeholder="Al" />
                      <span>x</span>
                      <input type="number" v-model="form.dim_ancho" placeholder="An" />
                      <span>x</span>
                      <input type="number" v-model="form.dim_largo" placeholder="Pr" />
                      <span class="unit">cm</span>
                    </div>
                  </div>
                  <div class="spec-select no-hover">
                    <select v-model="form.tapa" class="spec-dropdown">
                      <option value="Blanda">Blanda</option>
                      <option value="Dura">Dura</option>
                    </select>
                  </div>
                </div>

                <div class="specs-selectors" v-else>
                  <div class="spec-select no-hover">
                    <input type="text" v-model="form.color" placeholder="Color" class="spec-input-text" />
                  </div>
                  <div class="spec-select no-hover">
                    <input type="number" v-model="form.peso" class="spec-input-num" />
                    <span class="spec-label">gramos</span>
                  </div>
                  <div class="spec-select no-hover">
                    <select v-model="form.categoria" class="spec-dropdown">
                      <option value="Velas">Velas</option>
                      <option value="Complementos">Complementos</option>
                      <option value="Papelería">Papelería</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- COLUMNA DERECHA: FORMULARIO -->
              <div class="form-section">
                <div class="form-top-actions">
                  <div class="radio-group" v-if="modoVista !== 'edicion'">
                    <label class="radio-item">
                      <input type="radio" value="libro" v-model="tipoProducto" />
                      <span class="radio-dot"></span>
                      Libro
                    </label>
                    <label class="radio-item">
                      <input type="radio" value="articulo" v-model="tipoProducto" />
                      <span class="radio-dot"></span>
                      Artículo
                    </label>
                  </div>
                  <div class="radio-style-text" v-else>
                    {{ tipoProducto === 'libro' ? 'Libro' : 'Artículo' }}
                  </div>
                </div>

                <div class="inputs-stack">
                  <input type="text" v-model="form.titulo" :placeholder="tipoProducto === 'libro' ? 'Título del libro' : 'Nombre del artículo'" class="admin-input" />
                  
                  <template v-if="tipoProducto === 'libro'">
                    <input type="text" v-model="form.autor" placeholder="Autor" class="admin-input" />
                    <input type="text" v-model="form.editorial" placeholder="Editorial" class="admin-input" />
                  </template>

                  <textarea v-model="form.sinopsis" :placeholder="tipoProducto === 'libro' ? 'Sinopsis' : 'Descripción del producto'" class="admin-textarea"></textarea>
                  <input type="text" v-model="form.tipoEnvio" placeholder="Tipo de envío" class="admin-input" />
                  <input type="text" v-model="form.precio" placeholder="Precio" class="admin-input" />
                </div>
              </div>
            </template>
          </div>
        </div>
      </main>
      
      <main class="content-area access-denied" v-else>
        <h2>Acceso Restringido</h2>
        <p>Esta sección es solo para administradores.</p>
        <button @click="router.push('/')">Volver al Inicio</button>
      </main>
    </div>

    <TheFooter />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Hina+Mincho&family=Inter:wght@300;400;500;600;700&display=swap');

.hina-mincho-font { font-family: 'Hina Mincho', serif; }

.page-layout { display: flex; flex-direction: column; height: 100vh; background-color: #fff; font-family: 'Inter', sans-serif; }
.main-wrapper { display: flex; flex: 1; overflow: hidden; }
.content-area { flex: 1; padding: 40px; overflow-y: auto; background-color: #fdfdfd; }

.admin-container { max-width: 1200px; margin: 0 auto; }
.admin-view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}
.header-actions { display: flex; gap: 30px; align-items: center; }

.view-title { font-family: 'Hina Mincho', serif; font-size: 2.8rem; color: #333; font-weight: normal; }

/* SPINNER CARGA */
.loader-container { display: flex; justify-content: center; align-items: center; padding: 40px; }
.spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #9584c4; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.editor-grid {
  display: grid;
  grid-template-columns: 180px 1fr 1fr;
  gap: 40px;
  align-items: start;
}

/* GESTIÓN DE BANNERS */
.banner-manager-view {
  grid-column: 2 / span 2;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.section-label {
  font-family: 'Georgia', serif;
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 15px;
}

.banner-preview-box {
  width: 100%;
  aspect-ratio: 21/9;
  background-color: #E2E2E2;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.banner-preview-img { width: 100%; height: 100%; object-fit: cover; }
.banner-preview-img-square {
  height: 100%;
  aspect-ratio: 1/1;
  object-fit: contain;
  margin: 0 auto;
  display: block;
}

.carousel-dots-admin {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 15px;
}

.dot-admin {
  width: 10px;
  height: 10px;
  background-color: #D1C4E9;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
}

.dot-admin.active { background-color: #8B77D0; transform: scale(1.2); }

/* SELECTOR DE ORDEN */
.order-selector-section {
  display: flex;
  flex-direction: column;
}

.order-boxes {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.order-box {
  width: 40px;
  height: 40px;
  background-color: #E0E0E0;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  font-family: 'Georgia', serif;
  font-size: 1.1rem;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.order-box:hover { background-color: #D1C4E9; }
.order-box.active { background-color: #C1B4E7; color: #000; font-weight: bold; }

.banner-dropzone {
  width: 100%;
  aspect-ratio: 21/9;
  background-color: #E2E2E2;
  border: 2px dashed #D1C4E9;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.add-new-banner-btn {
  background-color: #C1B4E7;
  color: #333;
  border: none;
  padding: 15px 40px;
  border-radius: 12px;
  font-family: 'Georgia', serif;
  font-size: 1.3rem;
  align-self: center;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 20px;
}
.add-new-banner-btn:hover { background-color: #A294DF; }

/* COLUMNA IZQUIERDA */
.action-sidebar { display: flex; flex-direction: column; gap: 30px; margin-top: 50px; }
.admin-btn {
  background-color: #A294DF;
  color: #333;
  border: none;
  padding: 15px 25px;
  border-radius: 15px;
  font-size: 1.2rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}
.admin-btn.active { background-color: #8B77D0; color: #fff; transform: scale(1.05); }
.admin-btn:hover { background-color: #8B77D0; color: #fff; }

/* COLUMNA CENTRAL */
.image-uploader-section { display: flex; flex-direction: column; align-items: center; gap: 15px; }
.uploader-label { font-size: 0.9rem; color: #666; font-style: italic; }
.dropzone {
  width: 100%;
  aspect-ratio: 1/1;
  background-color: #E2E2E2;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
.plus-icon { color: #333; opacity: 0.8; }

.specs-selectors { display: flex; gap: 10px; width: 100%; margin-top: 20px; }
.spec-select {
  flex: 1;
  background-color: #C1B4E7;
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.85rem;
  color: #333;
  transition: background-color 0.2s;
}
.spec-select.no-hover { cursor: default; }

.spec-input-num, .spec-input-text {
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(0,0,0,0.2);
  font-weight: normal;
  text-align: center;
  outline: none;
  font-family: inherit;
}
.spec-input-num { width: 50px; margin-right: 5px; }
.spec-input-text { width: 100%; font-size: 0.9rem; }

.spec-label { opacity: 0.8; font-weight: normal; }

.dim-inputs { display: flex; align-items: center; gap: 4px; }
.dim-inputs input {
  width: 30px;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(0,0,0,0.2);
  text-align: center;
  outline: none;
  font-size: 0.8rem;
  font-weight: normal;
}
.dim-inputs .unit { margin-left: 2px; font-weight: normal; }

.spec-dropdown {
  background: transparent;
  border: none;
  font-weight: normal; /* Texto sin negritas */
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;
  width: 100%;
}

/* Ocultar flechas de los campos de número para que parezcan de texto */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
}

/* COLUMNA DERECHA */
.form-section { display: flex; flex-direction: column; gap: 20px; }
.form-top-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }

.radio-group { display: flex; gap: 20px; }
.radio-item { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 1.4rem; font-family: serif; }
.radio-item input { display: none; }
.radio-dot { width: 18px; height: 18px; border: 2px solid #ccc; border-radius: 50%; position: relative; }
.radio-item input:checked + .radio-dot { border-color: #8B77D0; }
.radio-item input:checked + .radio-dot::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 10px; height: 10px;
  background-color: #8B77D0;
  border-radius: 50%;
}

.icon-actions { display: flex; gap: 25px; }
.icon-btn { background: none; border: none; cursor: pointer; color: #9584c4; transition: transform 0.2s, color 0.3s; }
.icon-btn:hover { transform: scale(1.15); color: #7a69ab; }

.inputs-stack { display: flex; flex-direction: column; gap: 15px; }
.admin-input, .admin-textarea {
  width: 100%;
  padding: 12px 20px;
  border: 1px solid #e0d8f0;
  border-radius: 12px;
  font-size: 1.1rem;
  font-family: 'Inter', sans-serif;
  outline: none;
  background-color: #fafafa;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.admin-input:focus, .admin-textarea:focus { border-color: #9584c4; box-shadow: 0 0 0 3px rgba(149, 132, 196, 0.15); background-color: #fff; }
.admin-textarea { height: 120px; resize: none; }
.admin-input::placeholder, .admin-textarea::placeholder { color: #aaa; font-style: italic; font-family: 'Hina Mincho', serif;}

.access-denied { text-align: center; margin-top: 100px; }
.access-denied button { margin-top: 20px; padding: 10px 20px; background: #6A5ACD; color: white; border: none; border-radius: 5px; cursor: pointer; }

/* ESTILOS DE BÚSQUEDA */
.search-overlay {
  grid-column: 2 / span 2;
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.search-box-admin {
  display: flex;
  background: white;
  border: 1px solid #e0d8f0;
  border-radius: 25px;
  overflow: hidden;
  max-width: 600px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
}

.search-box-admin input {
  flex: 1;
  border: none;
  padding: 15px 25px;
  font-size: 1.1rem;
  outline: none;
  font-family: 'Inter', sans-serif;
}

.search-icon-btn {
  background: transparent;
  border: none;
  padding: 0 20px;
  color: #9584c4;
  cursor: pointer;
  transition: transform 0.2s;
}
.search-icon-btn:hover { transform: scale(1.1); }

.results-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
}

.result-item {
  background: white;
  border: 1px solid #e0d8f0;
  color: #444;
  padding: 18px 30px;
  border-radius: 12px;
  font-size: 1.2rem;
  font-family: 'Hina Mincho', serif;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}

.result-item:hover {
  background-color: #fcfaff;
  border-color: #9584c4;
  transform: translateX(8px);
  box-shadow: 0 5px 15px rgba(149, 132, 196, 0.1);
  color: #222;
}

.loader { text-align: center; color: #9584c4; font-style: italic; margin-top: 20px; font-family: 'Hina Mincho', serif;}

/* Scrollbar personalizado */
.results-list::-webkit-scrollbar { width: 6px; }
.results-list::-webkit-scrollbar-track { background: #f1f1f1; }
.results-list::-webkit-scrollbar-thumb { background: #D1C4E9; border-radius: 10px; }
.radio-style-text {
  color: #333;
  font-size: 1.4rem;
  font-family: 'Georgia', serif;
  font-style: italic;
  padding-left: 10px;
}
</style>
