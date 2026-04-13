<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import TheHeader from '@/components/TheHeader.vue'
import TheSidebar from '@/components/TheSideBar.vue'
import TheFooter from '@/components/TheFooter.vue'

const router = useRouter()
const sidebarExpandido = ref(true)

const toggleSidebar = () => {
  sidebarExpandido.value = !sidebarExpandido.value
}

const cargando = ref(true)
const pedidos = ref<any[]>([])

// --- Filtros ---
const filtroFecha = ref<'recent' | 'oldest'>('recent')
const filtroPrecioMaximo = ref<number | null>(null)
const filtroCategoria = ref<string>('all')

const fetchPedidos = async () => {
  try {
    cargando.value = true
    const userLocal = localStorage.getItem('mikrokosmos_user')
    if (!userLocal) { return router.push('/login') }

    const { id_usuario } = JSON.parse(userLocal)
    if (!id_usuario) { return router.push('/login') }

    // --- ESTRATEGIA: FETCH POR SEPARADO (CERO JOINS) ---

    // 1. Obtener Pedidos (Cabecera)
    const { data: rawPedidos, error: errPed } = await supabase
      .from('pedido')
      .select('id_pedido, fecha, estado_pago, estado_envio')
      .eq('id_usuario', id_usuario)

    if (errPed || !rawPedidos || rawPedidos.length === 0) {
      if (errPed) console.error("Error en tabla pedido:", errPed)
      generarMockData()
      return
    }

    const pedidoIds = rawPedidos.map(p => p.id_pedido)

    // 2. Obtener Detalles de todos esos pedidos
    const { data: rawDetalles, error: errDet } = await supabase
      .from('detalles_pedidos')
      .select('id_pedido, id_productos, cantidad, precio_venta')
      .in('id_pedido', pedidoIds)

    if (errDet || !rawDetalles) {
      console.error("Error en detalles_pedidos:", errDet)
      generarMockData()
      return
    }

    const productoIds = Array.from(new Set(rawDetalles.map(d => d.id_productos)))

    // 3. Obtener Productos (Info básica)
    const { data: rawProductos, error: errProd } = await supabase
      .from('producto')
      .select('id_productos, nombre')
      .in('id_productos', productoIds)

    // 4. Obtener Libro Detalles (Géneros/Autores)
    const { data: rawLibros, error: errLib } = await supabase
      .from('libro_detalles')
      .select('id_productos, genero, autor')
      .in('id_productos', productoIds)

    // --- LÓGICA DE UNIÓN MANUAL (FRONTEND JOIN) ---
    const pedidosFinales = rawPedidos.map(pedido => {
      const susDetalles = rawDetalles.filter(d => d.id_pedido === pedido.id_pedido)
      
      let totalPedido = 0
      const categoriasSet = new Set<string>()

      const productosMapeados = susDetalles.map(det => {
        totalPedido += (det.cantidad || 0) * (det.precio_venta || 0)
        
        // Buscar el producto por id_productos
        const prodInfo = rawProductos?.find(p => p.id_productos === det.id_productos)
        
        // Buscar detalles del libro si existen
        const libroInfo = rawLibros?.find(l => l.id_productos === det.id_productos)
        
        if (libroInfo && libroInfo.genero) {
          categoriasSet.add(libroInfo.genero)
        } else {
          categoriasSet.add('Artículos')
        }

        return {
          nombre: prodInfo?.nombre || 'Cargando nombre...',
          cantidad: det.cantidad,
          precio_venta: det.precio_venta,
          genero: libroInfo?.genero || 'Artículos'
        }
      })

      return {
        ...pedido,
        total: totalPedido,
        categorias: categoriasSet.size > 0 ? Array.from(categoriasSet) : ['General'],
        productos: productosMapeados // Nombre solicitado por el usuario
      }
    })

    pedidos.value = pedidosFinales

  } catch (err) {
    console.error("Error en Fetch Manual:", err)
    generarMockData()
  } finally {
    cargando.value = false
  }
}

/**
 * Requerimiento 3: Genera datos de prueba si la base de datos falla
 */
const generarMockData = () => {
  console.warn("Usando datos de prueba (Mock Data) debido a error en consulta.")
  pedidos.value = [
    {
      id_pedido: 101,
      fecha: new Date().toISOString(),
      estado_pago: 'Aprobado',
      estado_envio: 'En camino',
      total: 45000,
      categorias: ['Ficción', 'Artículos'],
      productos: [
        {
          nombre: 'Cazadores de Sombras: Ciudad de Hueso',
          cantidad: 1,
          precio_venta: 25000,
          genero: 'Ficción'
        },
        {
          nombre: 'Marca páginas Mikrokosmos',
          cantidad: 2,
          precio_venta: 10000,
          genero: 'Artículos'
        }
      ]
    }
  ]
}

// --- Categorías Dinámicas Disponibles ---
const categoriasDisponibles = computed(() => {
  const cats = new Set<string>()
  pedidos.value.forEach(p => {
    p.categorias.forEach((c: string) => cats.add(c))
  })
  return Array.from(cats).sort()
})

// --- Computed para Filtros ---
const pedidosFiltrados = computed(() => {
  let result = [...pedidos.value]

  // Filtro Categoría
  if (filtroCategoria.value !== 'all') {
    result = result.filter(p => p.categorias.includes(filtroCategoria.value))
  }

  // Filtro Precio Máximo
  if (filtroPrecioMaximo.value && filtroPrecioMaximo.value > 0) {
    result = result.filter(p => p.total <= filtroPrecioMaximo.value!)
  }

  // Ordenamiento Fecha
  result.sort((a, b) => {
    const dateA = new Date(a.fecha).getTime()
    const dateB = new Date(b.fecha).getTime()
    if (filtroFecha.value === 'recent') {
      return dateB - dateA
    } else {
      return dateA - dateB
    }
  })

  return result
})

const formatearMoneda = (valor: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor)
}
const formatearFecha = (fechaStr: string) => {
  return new Date(fechaStr).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })
}

onMounted(() => {
  fetchPedidos()
})
</script>

<template>
  <div class="page-layout">
    <TheHeader />

    <div class="main-wrapper">
      <TheSidebar :is-open="sidebarExpandido" @toggle-menu="toggleSidebar" />

      <main class="content-area">
        <div class="orders-layout">
          <!-- Header Interno -->
          <header class="inner-header">
            <button class="back-button" @click="router.back()">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <h1 class="header-title">Mis Pedidos</h1>
            <div class="spacer"></div>
          </header>

          <main class="inner-content">
            <div v-if="cargando" class="loader-container">
              <div class="spinner"></div>
            </div>

            <div v-else class="orders-container">
              <!-- Zona de Filtros -->
              <div class="filters-panel">
                <div class="filter-group">
                  <label>Ordenar por</label>
                  <select v-model="filtroFecha" class="filter-input">
                    <option value="recent">Más recientes primero</option>
                    <option value="oldest">Más antiguos primero</option>
                  </select>
                </div>

                <div class="filter-group">
                  <label>Precio Máximo</label>
                  <input type="number" v-model="filtroPrecioMaximo" class="filter-input" placeholder="Ej: 50000" min="0" />
                </div>

                <div class="filter-group">
                  <label>Categoría (Género)</label>
                  <select v-model="filtroCategoria" class="filter-input">
                    <option value="all">Todas las categorías</option>
                    <option v-for="cat in categoriasDisponibles" :key="cat" :value="cat">{{ cat }}</option>
                  </select>
                </div>
              </div>

              <!-- Lista de Pedidos -->
              <div v-if="pedidosFiltrados.length === 0" class="empty-state">
                No tienes pedidos que coincidan con estos filtros.
              </div>

              <div v-else class="orders-grid">
                <div 
                  v-for="pedido in pedidosFiltrados" 
                  :key="pedido.id_pedido" 
                  class="order-card clickable"
                  @click="router.push(`/mis-pedidos/${pedido.id_pedido}`)"
                >
                  <div class="order-header">
                    <span class="order-id">Pedido #{{ pedido.id_pedido }}</span>
                    <span class="order-date">{{ formatearFecha(pedido.fecha) }}</span>
                  </div>
                  
                  <div class="order-body">
                    <div class="order-items">
                      <div v-for="(producto, idx) in pedido.productos" :key="idx" class="item">
                        <div class="item-info">
                          <span class="item-name">{{ producto.nombre || 'Cargando...' }}</span> 
                          <span class="item-qty">x{{ producto.cantidad }}</span>
                        </div>
                        <span class="item-price">{{ formatearMoneda(producto.precio_venta) }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="order-footer">
                    <div class="order-badges">
                      <span v-for="cat in pedido.categorias" :key="cat" class="badge-category">{{ cat }}</span>
                      <span class="badge-status">{{ pedido.estado_envio || 'Procesando' }}</span>
                    </div>
                    <div class="order-total">
                      Total: <strong>{{ formatearMoneda(pedido.total) }}</strong>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </main>
        </div>
      </main>
    </div>

    <TheFooter />
  </div>
</template>

<style scoped>
/* Layout Principal */
.page-layout { display: flex; flex-direction: column; height: 100vh; }
.main-wrapper { display: flex; flex: 1; overflow: hidden; }

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f9fdfa; /* Slightly tinted white */
  overflow-y: auto;
}

/* Base View */
.orders-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  color: #2D2D2D;
  font-family: 'Inter', -apple-system, sans-serif;
}

.inner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background-color: #ffffff;
  border-bottom: 1px solid #EEEEEE;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  transition: transform 0.2s;
}
.back-button:hover { transform: translateX(-4px); }
.header-title { font-size: 1.3rem; font-weight: 600; margin: 0; }
.spacer { width: 40px; }

/* Contenido Interno */
.inner-content {
  flex: 1;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.orders-container {
  width: 100%;
  max-width: 900px; /* Ancho cómodo para lista de cards */
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Panel de Filtros */
.filters-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #EEEEEE;
  box-shadow: 0 4px 10px rgba(0,0,0,0.02);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1 1 200px;
}

.filter-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #777777;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-input {
  padding: 10px 14px;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  background-color: #FAFAFA;
  font-size: 0.95rem;
  color: #333;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.filter-input:focus {
  border-color: #9584c4;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(149, 132, 196, 0.15);
}

/* Loader Base */
.loader-container { display: flex; justify-content: center; align-items: center; height: 200px; }
.spinner { width: 32px; height: 32px; border: 4px solid #f3f3f3; border-top: 4px solid #9584c4; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* Tarjetas de Pedidos */
.orders-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #EEEEEE;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
  transition: transform 0.2s, box-shadow 0.2s;
}
.order-card.clickable {
  cursor: pointer;
}
.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
}

.order-header {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #F0F0F0;
  padding-bottom: 12px;
  margin-bottom: 16px;
}
.order-id { font-weight: 700; color: #9584c4; font-size: 1.1rem; }
.order-date { color: #888888; font-size: 0.9rem; }

.order-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.item-info { display: flex; gap: 8px; align-items: baseline; }
.item-name { font-weight: 500; color: #333333; }
.item-qty { font-size: 0.85rem; color: #9584c4; font-weight: 600; background: rgba(149, 132, 196, 0.1); padding: 2px 6px; border-radius: 4px; }
.item-price { color: #555555; }

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dotted #EEEEEE;
}

.order-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.badge-category {
  background-color: #9584c4;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
}
.badge-status {
  background-color: #EEEEEE;
  color: #555555;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
}

.order-total { font-size: 1.1rem; color: #111111; }
.order-total strong { color: #9584c4; font-size: 1.25rem; }

.empty-state { text-align: center; color: #888888; margin-top: 40px; padding: 40px; background: #ffffff; border-radius: 12px; border: 1px dashed #DDDDDD; }
</style>
