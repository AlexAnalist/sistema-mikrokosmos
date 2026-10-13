<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import TheHeader from '@/components/TheHeader.vue'
import TheSidebar from '@/components/TheSideBar.vue'
import TheFooter from '@/components/TheFooter.vue'

const route = useRoute()
const router = useRouter()
const sidebarExpandido = ref(true)

const toggleSidebar = () => {
  sidebarExpandido.value = !sidebarExpandido.value
}

const cargando = ref(true)
const orderId = route.params.id as string

// Datos reactivos
const pedido = ref<any>(null)
const entrega = ref<any>(null)
const itemsTotales = ref<any[]>([])

const formatearMoneda = (valor: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor)
}

const formatearFecha = (fechaStr: string) => {
  if (!fechaStr) return ''
  return new Date(fechaStr).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })
}

const fetchOrderDetails = async () => {
  try {
    cargando.value = true

    // 1. Obtener Pedido
    const { data: dataPedido, error: errPedido } = await supabase
      .from('pedido')
      .select('id_pedido, fecha, estado_pago, estado_envio')
      .eq('id_pedido', orderId)
      .single()

    if (errPedido || !dataPedido) throw new Error("Pedido no encontrado")
    pedido.value = dataPedido

    // 2. Obtener Info de Entrega (Simplificado para evitar 406 y con manejo robusto)
    try {
      const { data: dataEntrega, error: errEntrega } = await supabase
        .from('entrega')
        .select('*')
        .eq('id_pedido', orderId)
        .maybeSingle() // maybeSingle no arroja error si no hay registros

      if (errEntrega) {
        console.warn("Advertencia al cargar entrega:", errEntrega)
        throw errEntrega
      }

      entrega.value = dataEntrega || {
        direccion_envio: 'Dirección no disponible',
        ciudad_envio: 'N/A',
        empresa_envio: 'Pendiente',
        n_seguimiento: null,
        tipo_entrega: 'Local'
      }
    } catch (e) {
      console.error("Error recuperando entrega, usando valores por defecto.")
      entrega.value = {
        direccion_envio: 'Dirección no disponible',
        ciudad_envio: 'N/A',
        empresa_envio: 'Pendiente',
        n_seguimiento: null,
        tipo_entrega: 'Local'
      }
    }

    // 3. Obtener Detalles
    const { data: dataDetalles, error: errDetalles } = await supabase
      .from('detalles_pedidos')
      .select('id_productos, cantidad, precio_venta')
      .eq('id_pedido', orderId)

    if (errDetalles || !dataDetalles) throw new Error("Detalles no encontrados")

    const productIds = Array.from(new Set(dataDetalles.map(d => d.id_productos)))

    if (productIds.length > 0) {
      // Fetch separado para evitar PGRST200
      const [
        { data: rawProductos },
        { data: rawImagenes },
        { data: rawLibros }
      ] = await Promise.all([
        supabase.from('producto').select('id_productos, nombre').in('id_productos', productIds),
        supabase.from('producto_imagenes').select('id_productos, url_imagen').in('id_productos', productIds),
        supabase.from('libro_detalles').select('id_productos, genero, autor').in('id_productos', productIds)
      ])

      // Reconstrucción del objeto
      itemsTotales.value = dataDetalles.map(det => {
        const prodInfo = rawProductos?.find(p => p.id_productos === det.id_productos)
        const imgInfo = rawImagenes?.find(i => i.id_productos === det.id_productos)
        const libroInfo = rawLibros?.find(l => l.id_productos === det.id_productos)

        return {
          id_productos: det.id_productos,
          cantidad: det.cantidad,
          precio_venta: det.precio_venta,
          nombre: prodInfo?.nombre || 'Producto desconocido',
          url_imagen: imgInfo?.url_imagen || 'https://via.placeholder.com/150x200?text=Sin+Imagen',
          autor: libroInfo?.autor || '',
          genero: libroInfo?.genero || 'Artículos'
        }
      })
    }

  } catch (err: any) {
    console.error("Error al cargar detalles del pedido:", err)
    alert(err.message || "Error desconocido al cargar el pedido.")
    router.back()
  } finally {
    cargando.value = false
  }
}

// Resumen de costos
const subtotal = computed(() => {
  return itemsTotales.value.reduce((acc, item) => acc + (item.cantidad * item.precio_venta), 0)
})

const costoEnvio = computed(() => {
  if (entrega.value?.tipo_entrega === 'Nacional') return 5000
  if (entrega.value?.tipo_entrega === 'Local') return 2500
  return 0 // Por defecto o sin envío aún
})

const totalFinal = computed(() => subtotal.value )

onMounted(() => {
  fetchOrderDetails()
})
</script>

<template>
  <div class="page-layout">
    <TheHeader />

    <div class="main-wrapper">
      <TheSidebar :is-open="sidebarExpandido" @toggle-menu="toggleSidebar" />

      <main class="content-area">
        <div class="order-detail-layout">
          <!-- Header Interno -->
          <header class="inner-header">
            <button class="back-button" @click="router.back()">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              <span>Volver a mis pedidos</span>
            </button>
          </header>

          <main class="inner-content">
            <div v-if="cargando" class="loader-container">
              <div class="spinner"></div>
            </div>

            <div v-else-if="pedido" class="detail-container">
              
              <!-- Cabecera del Pedido -->
              <div class="section-card header-card">
                <div class="header-left">
                  <h1 class="order-title">Pedido #{{ pedido.id_pedido }}</h1>
                  <span class="order-date">{{ formatearFecha(pedido.fecha) }}</span>
                </div>
                <div class="header-right">
                  <span class="badge payment" :class="{ 'paid': pedido.estado_pago === 'Aprobado' }">
                    Pago: {{ pedido.estado_pago || 'Pendiente' }}
                  </span>
                  <span class="badge status">
                    Estado: {{ pedido.estado_envio || 'Procesando' }}
                  </span>
                </div>
              </div>

              <div class="grid-layout">
                <!-- Columna Izquierda: Artículos -->
                <div class="left-col">
                  <div class="section-card">
                    <h2 class="section-title">Artículos del Pedido</h2>
                    
                    <div class="items-list">
                      <div v-for="item in itemsTotales" :key="item.id_productos" class="item-row">
                        <img :src="item.url_imagen" alt="Imagen producto" class="item-img" />
                        
                        <div class="item-details">
                          <router-link :to="`/libro/${item.id_productos}`" class="item-link">
                            <h3 class="item-name">{{ item.nombre }}</h3>
                          </router-link>
                          <p class="item-meta" v-if="item.autor">{{ item.autor }} &bull; {{ item.genero }}</p>
                          <p class="item-meta" v-else>{{ item.genero }}</p>
                        </div>

                        <div class="item-price-wrapper">
                          <span class="item-qty">x{{ item.cantidad }}</span>
                          <span class="item-price">{{ formatearMoneda(item.precio_venta) }}</span>
                          <span class="item-sub">{{ formatearMoneda(item.cantidad * item.precio_venta) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Columna Derecha: Entrega y Costos -->
                <div class="right-col">
                  <!-- Info de Entrega -->
                  <div class="section-card">
                    <h2 class="section-title">Información de Entrega</h2>
                    <div v-if="entrega" class="info-block">
                      <p><strong>Dirección:</strong> {{ entrega.direccion_envio }}, {{ entrega.ciudad_envio }}</p>
                      <p><strong>Empresa:</strong> {{ entrega.empresa_envio || 'No asignada' }}</p>
                      <p v-if="entrega.n_seguimiento"><strong>Seguimiento:</strong> <span class="tracking">{{ entrega.n_seguimiento }}</span></p>
                    </div>
                    <div v-else class="info-block empty">
                      <p>Información de envío aún no generada o retiro en tienda.</p>
                    </div>
                  </div>

                  <!-- Resumen de Costos -->
                  <div class="section-card summary-card">
                    <h2 class="section-title">Resumen de Costos</h2>
                    <div class="summary-row">
                      <span>Subtotal</span>
                      <span>{{ formatearMoneda(subtotal) }}</span>
                    </div>
                    <!--<div class="summary-row">
                      <span>Costo de Envío</span>
                      <span>{{ costoEnvio > 0 ? formatearMoneda(costoEnvio) : 'Gratis / Pendiente' }}</span>
                    </div> -->
                    <div class="summary-row total-row">
                      <span>Total Final</span>
                      <span class="total-value">{{ formatearMoneda(totalFinal) }}</span>
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
.page-layout { display: flex; flex-direction: column; height: 100vh; }
.main-wrapper { display: flex; flex: 1; overflow: hidden; }

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f9fdfa;
  overflow-y: auto;
}

.order-detail-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  color: #2D2D2D;
  font-family: 'Inter', -apple-system, sans-serif;
}

.inner-header {
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
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9584c4;
  font-weight: 600;
  font-size: 1rem;
  transition: opacity 0.2s;
}
.back-button:hover { opacity: 0.8; }

.inner-content {
  flex: 1;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.detail-container {
  width: 100%;
  max-width: 1000px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Tarjetas base */
.section-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #EEEEEE;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  border-bottom: 1px solid #F0F0F0;
  padding-bottom: 12px;
}

/* Cabecera del pedido */
.header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left { display: flex; flex-direction: column; gap: 4px; }
.order-title { font-size: 1.8rem; font-weight: 700; color: #111; margin: 0; }
.order-date { color: #888; font-size: 0.95rem; }

.header-right { display: flex; gap: 12px; }
.badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}
.badge.payment { background: #fff3e0; color: #ef6c00; }
.badge.payment.paid { background: #e8f5e9; color: #2e7d32; }
.badge.status { background: #f3f0fb; color: #9584c4; }

/* Grid Layout */
.grid-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

@media(max-width: 768px) {
  .grid-layout { grid-template-columns: 1fr; }
}

.left-col { display: flex; flex-direction: column; gap: 24px; }
.right-col { display: flex; flex-direction: column; gap: 24px; }

/* Lista de Artículos */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.item-row {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #F0F0F0;
}
.item-row:last-child {
  border-bottom: none;
}

.item-img {
  width: 100px;
  height: 140px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #EEEEEE;
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
}

.item-details { flex: 1; display: flex; flex-direction: column; gap: 6px; }

.item-link {
  text-decoration: none;
  color: inherit;
}

.item-name { 
  font-size: 1.25rem; 
  font-weight: 700; 
  color: #111; 
  margin: 0; 
  line-height: 1.3;
  transition: color 0.2s;
}

.item-link:hover .item-name {
  color: #9584c4;
  text-decoration: underline;
}

.item-meta { font-size: 0.95rem; color: #777; margin: 0;}

.item-price-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  min-width: 120px;
}
.item-qty { font-size: 0.95rem; color: #888; font-weight: 500; }
.item-price { font-size: 1rem; color: #555; }
.item-sub { font-size: 1.2rem; font-weight: 700; color: #9584c4; }

/* Bloque Info */
.info-block p { margin: 8px 0; color: #444; font-size: 0.95rem; line-height: 1.5; }
.info-block.empty p { color: #888; font-style: italic; }
.tracking { background: #f0f0f0; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 1rem; color: #111; }

/* Resumen Costos */
.summary-card { background: #FAFAFA; }
.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  color: #555;
  font-size: 1rem;
}
.total-row {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #DDDDDD;
  font-weight: 700;
  color: #111;
  font-size: 1.1rem;
  align-items: center;
}
.total-value { font-size: 1.5rem; color: #9584c4; }

.loader-container { display: flex; justify-content: center; align-items: center; height: 300px; }
.spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #9584c4; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
