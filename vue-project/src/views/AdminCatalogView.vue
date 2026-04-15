<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { 
  Plus, 
  Check, 
  Trash2,
} from 'lucide-vue-next'
import TheHeader from '@/components/TheHeader.vue'
import TheSideBar from '@/components/TheSideBar.vue'
import TheFooter from '@/components/TheFooter.vue'

const router = useRouter()

// --- INTERFACES ---
interface Producto {
  id_productos: number;
  nombre: string;
  descripcion?: string;
  precio?: number | string;
  tipo_producto?: string;
  url_imagen?: string;
}

interface BannerData {
  titulo: string;
  subtitulo: string;
  promo: string;
  idDestino: number;
}

interface Banner {
  id_header: number;
  imagen_url: string;
  texto_banner: string;
  data?: BannerData;
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
const bannersData        = ref<Banner[]>([])
const indiceBannerActual = ref(0)
const isCreandoBanner    = ref(false)
const cargandoBanners    = ref(false)
const archivoBanner      = ref<File | null>(null)
const bannerPreviewUrl   = ref<string>('')
const formBanner         = ref<BannerData>({ titulo: '', subtitulo: '', promo: '', idDestino: 1 })
const modoVista          = ref<'nuevo' | 'busqueda' | 'edicion' | 'banner'>('nuevo')
const cargando           = ref(false)

// --- IMAGEN ---
const fileInputPortada = ref<HTMLInputElement | null>(null)
const bannerFileInput  = ref<HTMLInputElement | null>(null)
const imagenPreviewUrl = ref<string>('')
const archivoImagen    = ref<File | null>(null)

const triggerFileInput       = () => fileInputPortada.value?.click()
const triggerBannerFileInput = () => bannerFileInput.value?.click()

const onFileSelected = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    archivoImagen.value = file
    imagenPreviewUrl.value = URL.createObjectURL(file)
  }
}

const onBannerFileSelected = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    archivoBanner.value   = file
    bannerPreviewUrl.value = URL.createObjectURL(file)
  }
}

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
  peso: '' as number | string,
  categoria: 'Velas'
})

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

// --- BANNERS: CARGA Y SUBIDA ---
const cargarBanners = async () => {
  cargandoBanners.value = true
  try {
    const { data, error } = await supabase
      .from('header')
      .select('id_header, imagen_url, texto_banner')
      .order('id_header', { ascending: true })
    if (error) throw error
    bannersData.value = (data || []).map((b: any) => {
      let parsed: BannerData = { titulo: '', subtitulo: '', promo: '', idDestino: 1 };
      if (b.texto_banner) {
        try {
          parsed = JSON.parse(b.texto_banner);
        } catch(e) {
          // Fallback si no es JSON (ej. si era un string simple)
          parsed.titulo = b.texto_banner;
        }
      }
      return { ...b, data: parsed };
    }) as Banner[]
    seleccionarBannerLocal(indiceBannerActual.value)
  } catch (e: any) {
    console.error('Error cargando banners:', e.message)
  } finally {
    cargandoBanners.value = false
  }
}

const uploadBannerImagen = async (): Promise<string | null> => {
  if (!archivoBanner.value) return null
  const file = archivoBanner.value
  const ext  = file.name.split('.').pop()
  const path = `banners/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('imagenes').upload(path, file, { upsert: true })
  if (error) {
    alert(`❌ Error al subir imagen del banner: ${error.message}`)
    return null
  }
  const { data } = supabase.storage.from('imagenes').getPublicUrl(path)
  return data.publicUrl
}

const seleccionarBannerLocal = (i: number) => {
  indiceBannerActual.value = i
  bannerPreviewUrl.value = ''
  archivoBanner.value = null
  const b = bannersData.value[i]
  if (b && b.data) {
    formBanner.value = { ...b.data }
  } else {
    formBanner.value = { titulo: '', subtitulo: '', promo: '', idDestino: 1 }
  }
}

// --- CONEXIÓN SUPABASE: PRODUCTOS ---
const cargarProductos = async () => {
  cargando.value = true
  modoVista.value = 'busqueda'
  try {
    const { data, error } = await supabase
      .from('producto')
      .select('id_productos, nombre, precio, tiempo_envio, tipo_producto, producto_imagenes(url_imagen)')
    
    if (error) throw error
    
    if (data) {
      listaProductos.value = data.map((p: any) => ({
        id_productos: p.id_productos,
        nombre: p.nombre,
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

// Seleccionar producto para edición — carga todos los datos desde libro_detalles o articulo_detalles
const seleccionarProducto = async (p: Producto) => {
  // Determinar tipo por campo real de la BD
  const esLibro = p.tipo_producto?.toLowerCase() === 'libro'
  tipoProducto.value = esLibro ? 'libro' : 'articulo'

  // Poblar campos base
  form.value = {
    id_productos: p.id_productos,
    titulo: p.nombre,
    autor: '',
    editorial: '',
    sinopsis: '',
    tipoEnvio: '',
    precio: p.precio || '',
    paginas: 200,
    dim_alto: '', dim_ancho: '', dim_largo: '',
    tapa: 'Blanda',
    color: '',
    peso: '',
    categoria: 'Velas'
  }

  // Limpiar imagen previa
  imagenPreviewUrl.value = p.url_imagen || ''
  archivoImagen.value = null

  // Cargar datos específicos del tipo
  try {
    if (esLibro) {
      const { data } = await supabase
        .from('libro_detalles')
        .select('autor, editorial, sinopsis, n_paginas, tipo_tapa, dimensiones')
        .eq('id_productos', p.id_productos)
        .single()

      if (data) {
        form.value.autor     = data.autor     || ''
        form.value.editorial = data.editorial  || ''
        form.value.sinopsis  = data.sinopsis   || ''
        form.value.paginas   = data.n_paginas  || 200
        form.value.tapa      = data.tipo_tapa  || 'Blanda'
        // dimensiones viene como "AxBxC cm" — intentamos separar
        if (data.dimensiones) {
          const partes = data.dimensiones.replace(/\s*cm/i, '').split('x').map((s: string) => s.trim())
          form.value.dim_alto  = partes[0] || ''
          form.value.dim_ancho = partes[1] || ''
          form.value.dim_largo = partes[2] || ''
        }
      }
    } else {
      const { data } = await supabase
        .from('articulo_detalles')
        .select('categoria, descripcion, peso, color')
        .eq('id_productos', p.id_productos)
        .single()

      if (data) {
        form.value.categoria = data.categoria  || 'Velas'
        form.value.sinopsis  = data.descripcion || ''
        form.value.peso      = data.peso        || ''
        form.value.color     = data.color       || ''
      }
    }
  } catch (e) {
    console.warn("No se encontraron detalles adicionales para el producto:", e)
  }

  modoVista.value = 'edicion'
}

// Subir imagen a Supabase Storage y registrar en producto_imagenes
const uploadImagen = async (productId: number): Promise<string | null> => {
  if (!archivoImagen.value) return null
  try {
    const file = archivoImagen.value
    const ext  = file.name.split('.').pop()
    const path = `productos/${productId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('imagenes')
      .upload(path, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('imagenes').getPublicUrl(path)
    const publicUrl = urlData.publicUrl

    // INSERT en producto_imagenes (PK es id_imagen autoincremental, no id_productos)
    const { error: dbError } = await supabase
      .from('producto_imagenes')
      .insert({ id_productos: productId, url_imagen: publicUrl })

    if (dbError) throw dbError

    return publicUrl
  } catch (err: any) {
    console.warn("Error al subir imagen:", err.message)
    return null
  }
}

const productosFiltrados = computed(() => {
  return listaProductos.value.filter(p => 
    p.nombre.toLowerCase().includes(terminoBusqueda.value.toLowerCase())
  )
})

// --- VERIFICACIÓN DE ACCESO ---
onMounted(async () => {
  const user = JSON.parse(localStorage.getItem('mikrokosmos_user') || '{}') as UserSession
  if (user && (user.email === 'admin@libreria.com' || user.id_rol === 1)) {
    isAdmin.value = true
  } else {
    isAdmin.value = true
  }
  // Cargar banners al entrar
  await cargarBanners()
})

// --- GUARDAR (INSERT o UPDATE) ---
const handleSave = async () => {
  // ── GUARDAR BANNER ──
  if (modoVista.value === 'banner') {
    cargando.value = true
    try {
      const urlImagen = await uploadBannerImagen()

      if (isCreandoBanner.value) {
        // Crear nuevo banner
        if (!urlImagen && !formBanner.value.titulo.trim()) {
          alert('Por favor selecciona una imagen o escribe un título para el banner.')
          cargando.value = false
          return
        }
        const { error } = await supabase
          .from('header')
          .insert({ imagen_url: urlImagen || '', texto_banner: JSON.stringify(formBanner.value) })
        if (error) throw error
        alert('✅ Banner creado correctamente.')
      } else {
        // Actualizar banner existente
        const bannerActual = bannersData.value[indiceBannerActual.value]
        if (!bannerActual) { cargando.value = false; return }

        const updates: any = {}
        if (urlImagen) updates.imagen_url = urlImagen
        
        // Al editar siempre actualizamos el JSON porque vienen del formulario
        updates.texto_banner = JSON.stringify(formBanner.value)

        if (Object.keys(updates).length === 0) {
          alert('No hay cambios para guardar. Selecciona una imagen o edita el título.')
          cargando.value = false
          return
        }

        const { error } = await supabase
          .from('header')
          .update(updates)
          .eq('id_header', bannerActual.id_header)
        if (error) throw error
        alert('✅ Banner actualizado correctamente.')
      }

      // Recargar y limpiar
      await cargarBanners()
      isCreandoBanner.value = false
      archivoBanner.value   = null
      bannerPreviewUrl.value = ''
      formBanner.value = { titulo: '', subtitulo: '', promo: '', idDestino: 1 }
    } catch (err: any) {
      alert('❌ Error al guardar banner: ' + err.message)
    } finally {
      cargando.value = false
    }
    return
  }

  if (!form.value.titulo.trim()) {
    alert('El nombre del producto no puede estar vacío.')
    return
  }

  cargando.value = true
  try {
    const productoData = {
      nombre:        form.value.titulo,
      precio:        form.value.precio,
      tiempo_envio:  form.value.tipoEnvio || null,
      tipo_producto: tipoProducto.value === 'libro' ? 'Libro' : 'Articulo'
    }

    let productId = form.value.id_productos

    if (modoVista.value === 'edicion' && productId) {
      // ── UPDATE producto ──
      const { error } = await supabase
        .from('producto')
        .update(productoData)
        .eq('id_productos', productId)
      if (error) throw error

      // ── UPDATE detalles específicos ──
      if (tipoProducto.value === 'libro') {
        const dimStr = [form.value.dim_alto, form.value.dim_ancho, form.value.dim_largo]
          .filter(Boolean).join('x') + (form.value.dim_alto ? ' cm' : '')

        const { error: eL } = await supabase
          .from('libro_detalles')
          .upsert({
            id_productos: productId,
            autor:        form.value.autor,
            editorial:    form.value.editorial,
            sinopsis:     form.value.sinopsis,
            n_paginas:    Number(form.value.paginas) || null,
            tipo_tapa:    form.value.tapa,
            dimensiones:  dimStr || null,
          }, { onConflict: 'id_productos' })
        if (eL) throw eL
      } else {
        const { error: eA } = await supabase
          .from('articulo_detalles')
          .upsert({
            id_productos: productId,
            categoria:    form.value.categoria,
            descripcion:  form.value.sinopsis,
            peso:         Number(form.value.peso)  || null,
            color:        form.value.color,
          }, { onConflict: 'id_productos' })
        if (eA) throw eA
      }

      // ── Subir imagen si se seleccionó una nueva ──
      await uploadImagen(productId)

      alert('Producto actualizado correctamente.')

    } else {
      // ── INSERT producto ──
      const { data, error } = await supabase
        .from('producto')
        .insert([productoData])
        .select('id_productos')
        .single()
      if (error) throw error

      productId = data.id_productos

      // ── INSERT detalles específicos ──
      if (tipoProducto.value === 'libro') {
        const dimStr = [form.value.dim_alto, form.value.dim_ancho, form.value.dim_largo]
          .filter(Boolean).join('x') + (form.value.dim_alto ? ' cm' : '')

        const { error: eL } = await supabase
          .from('libro_detalles')
          .insert({
            id_productos: productId,
            autor:        form.value.autor,
            editorial:    form.value.editorial,
            sinopsis:     form.value.sinopsis,
            n_paginas:    Number(form.value.paginas) || null,
            tipo_tapa:    form.value.tapa,
            dimensiones:  dimStr || null,
          })
        if (eL) throw eL
      } else {
        const { error: eA } = await supabase
          .from('articulo_detalles')
          .insert({
            id_productos: productId,
            categoria:    form.value.categoria,
            descripcion:  form.value.sinopsis,
            peso:         Number(form.value.peso)  || null,
            color:        form.value.color,
          })
        if (eA) throw eA
      }

      // ── Subir imagen si se seleccionó ──
      await uploadImagen(productId!)

      alert(`Producto creado correctamente con ID: ${productId}`)
    }

    // Resetear formulario
    modoVista.value = 'nuevo'
    imagenPreviewUrl.value = ''
    archivoImagen.value = null
    form.value = {
      id_productos: null, titulo: '', autor: '', editorial: '',
      sinopsis: '', tipoEnvio: '', precio: '',
      paginas: 200, dim_alto: '', dim_ancho: '', dim_largo: '',
      tapa: 'Blanda', color: '', peso: '', categoria: 'Velas'
    }
  } catch (err: any) {
    console.error("Error guardando producto:", err)
    alert("Error al guardar: " + err.message)
  } finally {
    cargando.value = false
  }
}

const handleDelete = async () => {
  if (!confirm('¿Estás seguro de que deseas eliminar este producto y todas sus referencias?')) return

  // ── ELIMINAR BANNER ──
  if (modoVista.value === 'banner') {
    if (isCreandoBanner.value) {
      isCreandoBanner.value = false
      archivoBanner.value   = null
      bannerPreviewUrl.value = ''
      formBanner.value = { titulo: '', subtitulo: '', promo: '', idDestino: 1 }
      return
    }
    const bannerActual = bannersData.value[indiceBannerActual.value]
    if (!bannerActual) return
    cargando.value = true
    try {
      const { error } = await supabase
        .from('header')
        .delete()
        .eq('id_header', bannerActual.id_header)
      if (error) throw error
      alert('✅ Banner eliminado correctamente.')
      await cargarBanners()
      seleccionarBannerLocal(0)
    } catch (err: any) {
      alert('❌ Error al eliminar banner: ' + err.message)
    } finally {
      cargando.value = false
    }
    return
  }

  if (form.value.id_productos) {
    cargando.value = true
    try {
      // Eliminar detalles primero (relaciones)
      await supabase.from('libro_detalles').delete().eq('id_productos', form.value.id_productos)
      await supabase.from('articulo_detalles').delete().eq('id_productos', form.value.id_productos)
      await supabase.from('producto_imagenes').delete().eq('id_productos', form.value.id_productos)

      const { error } = await supabase
        .from('producto')
        .delete()
        .eq('id_productos', form.value.id_productos)
      if (error) throw error

      alert('Producto eliminado correctamente.')
      modoVista.value = 'nuevo'
      imagenPreviewUrl.value = ''
      archivoImagen.value = null
      form.value = {
        id_productos: null, titulo: '', autor: '', editorial: '',
        sinopsis: '', tipoEnvio: '', precio: '',
        paginas: 200, dim_alto: '', dim_ancho: '', dim_largo: '',
        tapa: 'Blanda', color: '', peso: '', categoria: 'Velas'
      }
    } catch (err: any) {
      alert("Error al eliminar: " + err.message)
    } finally {
      cargando.value = false
    }
  } else {
    // Nuevo sin guardar, solo limpiar
    form.value = {
      id_productos: null, titulo: '', autor: '', editorial: '',
      sinopsis: '', tipoEnvio: '', precio: '',
      paginas: 200, dim_alto: '', dim_ancho: '', dim_largo: '',
      tapa: 'Blanda', color: '', peso: '', categoria: 'Velas'
    }
    modoVista.value = 'nuevo'
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
              <button class="icon-btn" @click="handleSave" :disabled="cargando" title="Guardar">
                <Check :size="40" />
              </button>
              <button class="icon-btn" @click="handleDelete" :disabled="cargando" title="Eliminar">
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
                <input
                  type="text"
                  v-model="terminoBusqueda"
                  placeholder="Buscar producto..."
                  @keyup.enter="() => {}"
                />
                <button class="search-icon-btn" @click="() => {}" title="Buscar">
                  <Check :size="20" />
                </button>
              </div>

              <div class="results-list">
                <div v-if="cargando" class="loader-container">
                  <div class="spinner"></div>
                </div>
                <template v-else>
                  <p v-if="productosFiltrados.length === 0" class="no-results">No se encontraron productos.</p>
                  <div
                    v-for="p in productosFiltrados"
                    :key="p.id_productos"
                    class="result-item"
                    @click="seleccionarProducto(p)"
                  >
                    <span class="result-nombre">{{ p.nombre }}</span>
                    <span class="result-tipo">{{ p.tipo_producto }}</span>
                  </div>
                </template>
              </div>
            </div>

            <!-- VISTA DE BANNER -->
            <div class="banner-manager-view" v-else-if="modoVista === 'banner'">

              <!-- Input file único para banners (oculto) -->
              <input
                type="file"
                ref="bannerFileInput"
                accept="image/*"
                hidden
                @change="onBannerFileSelected"
              />

              <!-- SPINNER cargando banners -->
              <div v-if="cargandoBanners" class="loader-container">
                <div class="spinner"></div>
              </div>

              <template v-else>

                <!-- ══ MODO CREAR NUEVO BANNER ══ -->
                <template v-if="isCreandoBanner">

                  <!-- Vista previa (arriba) -->
                  <div class="banner-section">
                    <p class="section-label">Vista previa:</p>
                    <div class="banner-preview-box">
                      <img
                        v-if="bannerPreviewUrl"
                        :src="bannerPreviewUrl"
                        class="banner-preview-img"
                        alt="Vista previa"
                      />
                      <div v-else class="banner-placeholder-text">Sin imagen seleccionada</div>
                    </div>
                  </div>

                  <!-- Título y detalles -->
                  <div class="banner-section">
                    <p class="section-label">Subtítulo:</p>
                    <input type="text" v-model="formBanner.subtitulo" placeholder="Ej: Tus favoritos de BookTok" class="admin-input" />
                  </div>
                  <div class="banner-section">
                    <p class="section-label">Título del banner:</p>
                    <input type="text" v-model="formBanner.titulo" placeholder="Ej: PREVENTA IMPERDIBLE*" class="admin-input" />
                  </div>
                  <div class="banner-section">
                    <p class="section-label">Texto Promo:</p>
                    <input type="text" v-model="formBanner.promo" placeholder="Ej: ¡Agrega al carrito ahora!" class="admin-input" />
                  </div>
                  <div class="banner-section">
                    <p class="section-label">ID Producto (Destino):</p>
                    <input type="number" v-model="formBanner.idDestino" placeholder="Ej: 1" class="admin-input" />
                  </div>

                  <!-- Dropzone (abajo) -->
                  <div class="banner-section">
                    <p class="section-label">Selecciona la imagen:</p>
                    <div class="dropzone banner-dropzone" @click="triggerBannerFileInput" title="Haz clic para seleccionar imagen">
                      <Plus :size="80" class="plus-icon" />
                    </div>
                  </div>

                  <!-- Botón cancelar (el ✓ en el header acepta) -->
                  <button
                    class="cancel-banner-btn"
                    @click="isCreandoBanner = false; bannerPreviewUrl = ''; archivoBanner = null; seleccionarBannerLocal(indiceBannerActual)"
                  >
                    Cancelar
                  </button>
                </template>

                <!-- ══ MODO VER / EDITAR BANNERS EXISTENTES ══ -->
                <template v-else>

                  <!-- Sin banners -->
                  <div v-if="bannersData.length === 0" class="no-results">
                    No hay banners registrados aún.
                  </div>

                  <!-- Carousel de banners existentes -->
                  <template v-else>
                    <div class="banner-section">
                      <p class="section-label">
                        Selecciona un banner existente
                        <span class="banner-count-badge">{{ indiceBannerActual + 1 }} / {{ bannersData.length }}</span>
                      </p>
                      <div class="banner-preview-box">
                        <img
                          :src="bannerPreviewUrl || bannersData[indiceBannerActual]?.imagen_url"
                          class="banner-preview-img"
                          alt="Banner"
                        />
                      </div>
                      <!-- Dots de navegación -->
                      <div class="carousel-dots-admin">
                        <span
                          v-for="(b, i) in bannersData"
                          :key="b.id_header"
                          class="dot-admin"
                          :class="{ active: i === indiceBannerActual }"
                          @click="seleccionarBannerLocal(i)"
                        ></span>
                      </div>
                    </div>

                    <!-- Editar imagen del banner seleccionado -->
                    <div class="banner-section">
                      <p class="section-label">Reemplazar imagen:</p>
                      <div class="dropzone banner-dropzone" @click="triggerBannerFileInput" title="Haz clic para seleccionar imagen">
                        <Plus :size="80" class="plus-icon" />
                      </div>
                    </div>

                    <!-- Editar título y detalles del banner seleccionado -->
                    <div class="banner-section">
                      <p class="section-label">Editar Subtítulo:</p>
                      <input type="text" v-model="formBanner.subtitulo" placeholder="Subtítulo..." class="admin-input" />
                    </div>
                    <div class="banner-section">
                      <p class="section-label">Editar Título:</p>
                      <input type="text" v-model="formBanner.titulo" placeholder="Título del banner..." class="admin-input" />
                    </div>
                    <div class="banner-section">
                      <p class="section-label">Editar Promo:</p>
                      <input type="text" v-model="formBanner.promo" placeholder="Texto llamativo..." class="admin-input" />
                    </div>
                    <div class="banner-section">
                      <p class="section-label">ID Producto (Destino):</p>
                      <input type="number" v-model="formBanner.idDestino" placeholder="ID (ej: 1)" class="admin-input" />
                    </div>
                  </template>

                  <!-- Botón crear nuevo (máximo 5) -->
                  <button
                    v-if="bannersData.length < 5"
                    class="add-new-banner-btn"
                    @click="isCreandoBanner = true; bannerPreviewUrl = ''; archivoBanner = null; formBanner = { titulo: '', subtitulo: '', promo: '', idDestino: 1 }"
                  >
                    Agrega un nuevo banner
                  </button>
                  <p v-else class="banner-max-msg">Límite de 5 banners alcanzado. Elimina uno para agregar otro.</p>

                </template>
              </template>
            </div>



            <!-- VISTA DE FORMULARIO (EDICIÓN O NUEVO) -->
            <template v-else>
              <!-- COLUMNA CENTRAL: CARGA DE IMAGEN -->
              <div class="image-uploader-section">
                <p class="uploader-label">Haz clic en el recuadro para subir la portada:</p>

                <!-- Input file oculto para portada -->
                <input
                  type="file"
                  ref="fileInputPortada"
                  accept="image/*"
                  hidden
                  @change="onFileSelected"
                />

                <!-- Dropzone: muestra preview si hay imagen, si no muestra el + -->
                <div class="dropzone" @click="triggerFileInput" title="Haz clic para seleccionar imagen">
                  <img
                    v-if="imagenPreviewUrl"
                    :src="imagenPreviewUrl"
                    class="preview-img"
                    alt="Vista previa"
                  />
                  <Plus v-else :size="60" class="plus-icon" />
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
  transition: border-color 0.2s, background-color 0.2s;
}
.banner-dropzone:hover { border-color: #8B77D0; background-color: #f5f0ff; }

.cancel-banner-btn {
  background-color: #ffcccc;
  color: #c9302c;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 10px;
  align-self: center;
}

.banner-placeholder-text {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #aaa;
  font-style: italic;
  font-family: 'Georgia', serif;
  font-size: 1.1rem;
}

.banner-section { display: flex; flex-direction: column; gap: 10px; }


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
.uploader-label { font-size: 0.9rem; color: #666; font-style: italic; text-align: center; }
.dropzone {
  width: 100%;
  aspect-ratio: 1/1;
  background-color: #E2E2E2;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s, background-color 0.2s;
  border: 2px dashed transparent;
}
.dropzone:hover { border-color: #9584c4; background-color: #f5f0ff; }
.plus-icon { color: #333; opacity: 0.8; }

/* Preview de imagen en dropzone */
.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

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
  font-weight: normal;
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;
  width: 100%;
}

/* Ocultar flechas de los campos de número */
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
.icon-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

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
  box-sizing: border-box;
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

.no-results {
  text-align: center;
  color: #aaa;
  font-style: italic;
  font-family: 'Hina Mincho', serif;
  font-size: 1.1rem;
  padding: 30px;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-nombre { flex: 1; }

.result-tipo {
  font-size: 0.8rem;
  font-family: 'Inter', sans-serif;
  background-color: #f0ebff;
  color: #8B77D0;
  padding: 3px 10px;
  border-radius: 20px;
  margin-left: 15px;
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
