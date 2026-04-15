<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/supabase'
import TheHeader from '@/components/TheHeader.vue'
import TheSidebar from '@/components/TheSideBar.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const volverPerfil = () => {
  router.push('/perfil')
}

// 1. Interfaces Estrictas SQL
interface Usuario {
  nombre: string;
}

interface Entrega {
  tipo_entrega: string;
  empresa_envio?: string;
  n_seguimiento?: string;
}

interface Pedido {
  id_pedido: number;
  id_usuario: number;
  estado_pago: string;
  estado_envio: string;
  fecha: string;
  usuario?: Usuario | null;
  entrega?: Entrega[];
}

// Estado Superior
const sidebarExpandido = ref(true)
const toggleSidebar = () => { sidebarExpandido.value = !sidebarExpandido.value }

// Estado de UI
const activeTab = ref('validacion')
const cargando = ref(true)
const searchQuery = ref('')
const detallePedido = ref<Pedido | null>(null)

// Datos Reales BD
const pedidos = ref<Pedido[]>([])

// Quick Stats Reactivos
const stats = computed(() => {
  return {
    porCobrar: pedidos.value.filter(p => ['Pendiente', 'Por Verificar'].includes(p.estado_pago)).length,
    enRuta: pedidos.value.filter(p => p.estado_pago === 'Aprobado' && p.estado_envio !== 'Entregado').length,
    ventasMes: pedidos.value.filter(p => p.estado_envio === 'Entregado').length
  }
})

// Módulos con Filtrado Universal
const pedidosValidacion = computed(() => {
  return pedidos.value.filter(p => 
    ['Pendiente', 'Por Verificar'].includes(p.estado_pago) &&
    (p.id_pedido.toString().includes(searchQuery.value) || 
     (p.usuario?.nombre || '').toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
})

const pedidosLogistica = computed(() => {
  return pedidos.value.filter(p => 
    p.estado_pago === 'Aprobado' && p.estado_envio !== 'Entregado' &&
    (p.id_pedido.toString().includes(searchQuery.value) || 
     (p.usuario?.nombre || '').toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
})

const pedidosHistorial = computed(() => {
  return pedidos.value.filter(p => 
    p.estado_envio === 'Entregado' &&
    (p.id_pedido.toString().includes(searchQuery.value) || 
     (p.usuario?.nombre || '').toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
})

const obtenerPedidos = async () => {
  cargando.value = true
  try {
    const { data, error } = await supabase
      .from('pedido')
      // NOTA: Se removió el '!inner' de entrega para que los pedidos Pendientes (que aún no tienen entrega) SÍ aparezcan.
      .select('id_pedido, estado_pago, estado_envio, fecha, usuario:id_usuario(nombre), entrega(tipo_entrega, empresa_envio, n_seguimiento)')
      .order('fecha', { ascending: false });

    // DEPURACIÓN DE CONSOLA: Verifica lo que devuelve Supabase
    console.log("=== DATOS OBTENIDOS DE SUPABASE ===", data);
    if (error) {
      if (error.code === '42703') {
        console.error("ERROR 42703: Columna no encontrada en la base de datos. Asegúrate de que 'fecha' en pedido y 'n_seguimiento' en entrega existen.", error);
      }
      throw error;
    }
    
    pedidos.value = data || []
  } catch (error) {
    console.error("Error cargando dashboard:", error)
  } finally {
    cargando.value = false
  }
}

// Acciones Master
const formatearFecha = (isoString: string) => {
  return new Date(isoString).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

const cerrarDetalle = () => { detallePedido.value = null }

const enviarPago = async (id: number) => {
  try {
    // Aprobar
    await supabase.from('pedido').update({ estado_pago: 'Aprobado' }).eq('id_pedido', id)
    // Crear rastro en entrega
    await supabase.from('entrega').insert([{ id_pedido: id, estado: 'En proceso', fecha_creacion: new Date().toISOString() }])
    obtenerPedidos()
    detallePedido.value = null
  } catch(e) { console.error(e) }
}

const despacharEnvio = async (id: number) => {
  await supabase.from('pedido').update({ estado_envio: 'Entregado' }).eq('id_pedido', id)
  obtenerPedidos()
  detallePedido.value = null
}

onMounted(() => obtenerPedidos())
</script>

<template>
  <div class="luxury-layout">
    <TheHeader />

    <div class="main-body">
      <TheSidebar :is-open="sidebarExpandido" @toggle-menu="toggleSidebar" />

      <!-- VIP Dashboard Content -->
      <main class="dashboard-area">
        
        <!-- Barra de Navegación "Atrás" integrada -->
        <div class="top-navigation-bar">
          <button @click="volverPerfil" class="back-button" title="Volver al Perfil">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="back-icon"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <h2 class="nav-title">Módulo de Ventas</h2>
        </div>
        
        <div v-if="cargando" class="loader-overlay">
           <div class="spinner"></div>
           <p class="hina-mincho-font mt-4 text-[#9584c4]">Sincronizando Sistema...</p>
        </div>

        <div v-else class="content-wrapper">
          <!-- QUICK STATS -->
          <div class="quick-stats-grid">
            <div class="stat-card luxury-glass">
              <span class="stat-title">Total por Cobrar</span>
              <span class="stat-value text-purple">{{ stats.porCobrar }}</span>
              <div class="stat-decoration bg-purple"></div>
            </div>
            <div class="stat-card luxury-glass">
              <span class="stat-title">Pedidos en Ruta</span>
              <span class="stat-value text-gold">{{ stats.enRuta }}</span>
              <div class="stat-decoration bg-gold"></div>
            </div>
            <div class="stat-card luxury-glass">
              <span class="stat-title">Ventas del Mes</span>
              <span class="stat-value text-emerald">{{ stats.ventasMes }}</span>
              <div class="stat-decoration bg-emerald"></div>
            </div>
          </div>

          <!-- MASTER CONTROL PANEL -->
          <div class="control-panel luxury-glass">
            
            <!-- Tools Bar -->
            <div class="tools-bar">
              <h1 class="master-title hina-mincho-font">Administración Mikrokosmos</h1>
              <div class="search-box">
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  placeholder="🔍 Buscar ID o Cliente..." 
                  class="search-input"
                >
              </div>
            </div>

            <!-- Tabs -->
            <div class="tabs-bar hina-mincho-font">
              <button :class="['tab-btn', activeTab === 'validacion' ? 'active-tab' : '']" @click="activeTab = 'validacion'">Validación de Pagos</button>
              <button :class="['tab-btn', activeTab === 'logistica' ? 'active-tab' : '']" @click="activeTab = 'logistica'">Logística de Envíos</button>
              <button :class="['tab-btn', activeTab === 'historial' ? 'active-tab' : '']" @click="activeTab = 'historial'">Historial</button>
            </div>

            <!-- CONTENIDO DE TABS -->
            <div class="tab-content scroll-elegant">
              
              <!-- Tab A: Validación -->
              <div v-if="activeTab === 'validacion'" class="cards-grid">
                <div v-for="ped in pedidosValidacion" :key="'val-'+ped.id_pedido" class="data-card inner-glass relative-card">
                   <div class="card-badge bg-orange">Esperando</div>
                   <h3 class="card-id hina-mincho-font">Pedido #{{ ped.id_pedido }}</h3>
                   <p class="card-client"><strong>Cliente:</strong> {{ ped.usuario?.nombre || 'Anónimo' }}</p>
                   <p class="card-date">{{ formatearFecha(ped.fecha) }}</p>
                   
                   <div class="card-actions mt-4 flex gap-2">
                     <button class="btn-outline-gold w-full" @click="detallePedido = ped">Ver Comprobante</button>
                   </div>
                </div>
                <div v-if="pedidosValidacion.length === 0" class="empty-state">No hay pedidos pendientes.</div>
              </div>

              <!-- Tab B: Logística -->
              <div v-if="activeTab === 'logistica'" class="cards-grid">
                <div v-for="ped in pedidosLogistica" :key="'log-'+ped.id_pedido" class="data-card inner-glass relative-card">
                   <div class="card-badge bg-blue">Pagado</div>
                   <h3 class="card-id hina-mincho-font">Pedido #{{ ped.id_pedido }}</h3>
                   <p class="card-client"><strong>Cliente:</strong> {{ ped.usuario?.nombre }}</p>
                   <p class="card-type"><strong>Tipo:</strong> {{ ped.entrega?.[0]?.tipo_entrega || 'Local' }}</p>
                   
                   <div class="card-actions mt-4 flex gap-2">
                     <button class="btn-solid-purple w-full" @click="detallePedido = ped">Preparar Paquete</button>
                   </div>
                </div>
                <div v-if="pedidosLogistica.length === 0" class="empty-state">No hay envíos pendientes.</div>
              </div>

              <!-- Tab C: Historial -->
              <div v-if="activeTab === 'historial'" class="list-layout">
                <div v-for="ped in pedidosHistorial" :key="'his-'+ped.id_pedido" class="historial-row inner-glass">
                  <div>
                    <span class="row-id">#{{ ped.id_pedido }}</span>
                    <span class="row-date">{{ formatearFecha(ped.fecha) }}</span>
                  </div>
                  <div class="row-client">{{ ped.usuario?.nombre }}</div>
                  <div class="row-badge bg-emerald">✓ Finalizado</div>
                </div>
                <div v-if="pedidosHistorial.length === 0" class="empty-state">Aún sin registros completados.</div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <!-- MODAL LUXURY DETAIL -->
      <div v-if="detallePedido" class="modal-overlay">
         <div class="modal-glass">
            <header class="modal-header">
               <h2 class="hina-mincho-font text-[2rem] text-[#333]">Detalles del Pedido #{{ detallePedido.id_pedido }}</h2>
               <button @click="cerrarDetalle" class="close-btn">✕</button>
            </header>
            
            <div class="modal-body">
               <p><strong>Cliente:</strong> {{ detallePedido.usuario?.nombre || 'Anónimo' }}</p>
               <p><strong>Estado Actual:</strong> {{ detallePedido.estado_pago }}</p>
               <p><strong>Registro:</strong> {{ formatearFecha(detallePedido.fecha) }}</p>
               
               <hr class="elegant-hr">
               
               <!-- Botones Dinámicos Mágicos -->
               <div class="modal-actions">
                 <button v-if="['Pendiente', 'Por Verificar'].includes(detallePedido.estado_pago)" 
                         class="btn-solid-purple" @click="enviarPago(detallePedido.id_pedido)">
                   Validar Pago Oficial
                 </button>
                 
                 <button v-if="detallePedido.estado_pago === 'Aprobado' && detallePedido.estado_envio !== 'Entregado'" 
                         class="btn-solid-gold" @click="despacharEnvio(detallePedido.id_pedido)">
                   Finalizar / Despachar
                 </button>
               </div>
            </div>
         </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Hina+Mincho&family=Inter:wght@300;400;500;600&display=swap');

/* TOP NAVIGATION BAR */
.top-navigation-bar {
  width: 100%;
  background-color: transparent;
  display: flex;
  align-items: center;
  padding: 0 0 16px 0;
  margin-bottom: 20px;
  border-bottom: 1px solid #EEEEEE;
}

.back-button {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s ease, transform 0.2s ease;
  color: #333;
}

.back-button:hover {
  background: #f5f5f7;
  transform: translateX(-2px);
}

.back-icon {
  width: 22px;
  height: 22px;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 1.15rem;
  color: #333;
  margin: 0;
  padding-right: 38px; /* Para compensar visualmente el botón de atrás */
}

.luxury-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
  font-family: 'Inter', sans-serif;
  color: #4a4a4a;
}
.main-body { display: flex; flex: 1; overflow: hidden; }

.dashboard-area {
  flex: 1;
  padding: 30px 40px;
  overflow-y: auto;
  position: relative;
  background-image: radial-gradient(circle at top right, rgba(149,132,196,0.08), transparent 40%);
}

.hina-mincho-font { font-family: 'Hina Mincho', serif; }

/* SPINNER VIP */
.loader-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,0.7); backdrop-filter: blur(10px); z-index: 50; }
.spinner { width: 50px; height: 50px; border: 3px solid rgba(149,132,196,0.3); border-top-color: #9584c4; border-radius: 50%; animation: spin 1s infinite linear; }
@keyframes spin { to { transform: rotate(360deg); } }

/* GLASSMORPHISM UTILITIES */
.luxury-glass {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px 0 rgba(149, 132, 196, 0.1);
  border-radius: 20px;
}

.inner-glass {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 14px;
  transition: all 0.3s ease;
}
.inner-glass:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.05); }

/* QUICK STATS ALIGNMENT */
.quick-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
.stat-card { position: relative; padding: 25px 30px; display: flex; flex-direction: column; overflow: hidden; }
.stat-title { font-size: 0.95rem; text-transform: uppercase; letter-spacing: 1px; color: #777; margin-bottom: 5px; }
.stat-value { font-size: 2.8rem; font-weight: 600; font-family: 'Hina Mincho', serif; }
.stat-decoration { position: absolute; right: 0; top: 0; bottom: 0; width: 6px; }

/* PALETTE UTILS */
.text-purple { color: #9584c4; }   .bg-purple { background-color: #9584c4; }
.text-gold { color: #cba876; }    .bg-gold { background-color: #cba876; }
.text-emerald { color: #4b9b7e; } .bg-emerald { background-color: #4b9b7e; }
.bg-orange { background-color: #e09963; }
.bg-blue { background-color: #6a9bdc; }

/* MASTER CONTROL PANEL */
.control-panel { display: flex; flex-direction: column; overflow: hidden; min-height: 500px; padding: 30px; }
.tools-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.master-title { font-size: 2.2rem; color: #333; margin: 0; }
.search-input { width: 300px; padding: 12px 20px; border-radius: 30px; border: 1px solid rgba(0,0,0,0.1); background: rgba(255,255,255,0.8); outline: none; transition: border 0.3s; }
.search-input:focus { border-color: #9584c4; }

.tabs-bar { display: flex; gap: 30px; border-bottom: 2px solid rgba(0,0,0,0.05); margin-bottom: 25px; }
.tab-btn { padding: 10px 5px; font-size: 1.4rem; color: #888; background: transparent; border: none; border-bottom: 3px solid transparent; cursor: pointer; transition: all 0.3s; }
.tab-btn:hover { color: #9584c4; }
.active-tab { color: #9584c4; border-bottom-color: #9584c4; font-weight: 500; }

.tab-content { flex: 1; padding-bottom: 20px; }

/* CARDS A & B */
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.data-card { padding: 25px 20px; position: relative; }
.relative-card { position: relative; }
.card-badge { position: absolute; top: -10px; right: 20px; padding: 4px 12px; color: white; border-radius: 20px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.card-id { font-size: 1.8rem; color: #222; margin: 0 0 10px; border-bottom: 1px dashed rgba(0,0,0,0.1); padding-bottom: 5px; }
.card-client, .card-date, .card-type { font-size: 0.95rem; margin: 6px 0; color: #555; }

/* HISTORIAL ROWS C */
.list-layout { display: flex; flex-direction: column; gap: 12px; }
.historial-row { display: flex; justify-content: space-between; align-items: center; padding: 15px 25px; }
.row-id { font-weight: 600; font-size: 1.1rem; margin-right: 15px; }
.row-date { color: #888; font-size: 0.9rem; }
.row-badge { color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500; }

.empty-state { text-align: center; color: #aaa; margin-top: 50px; font-style: italic; font-size: 1.1rem; grid-column: 1 / -1; }

/* BOTONES LUXURY */
.flex { display: flex; } .gap-2 { gap: 8px; } .mt-4 { margin-top: 16px; } .w-full { width: 100%; }
.btn-outline-gold { background: transparent; border: 1px solid #cba876; color: #cba876; padding: 10px; border-radius: 8px; cursor: pointer; transition: all 0.3s; font-weight: 500; }
.btn-outline-gold:hover { background: #cba876; color: white; }
.btn-solid-purple { background: #9584c4; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; transition: all 0.3s; font-weight: 500; box-shadow: 0 4px 10px rgba(149,132,196,0.3); }
.btn-solid-purple:hover { background: #7f6eac; transform: translateY(-1px); }
.btn-solid-gold { background: #cba876; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; transition: all 0.3s; font-weight: 500; box-shadow: 0 4px 10px rgba(203,168,118,0.3); }

/* MODAL LUXURY */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(5px); z-index: 100; display: flex; align-items: center; justify-content: center; }
.modal-glass { background: rgba(255,255,255,0.85); backdrop-filter: blur(20px); border-radius: 20px; width: 90%; max-width: 500px; padding: 30px; border: 1px solid rgba(255,255,255,1); box-shadow: 0 20px 40px rgba(0,0,0,0.15); animation: zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.close-btn { background: transparent; border: none; font-size: 1.5rem; cursor: pointer; color: #aaa; transition: color 0.2s; }
.close-btn:hover { color: #333; }
.modal-body p { margin-bottom: 15px; font-size: 1.1rem; }
.elegant-hr { border: 0; height: 1px; background: linear-gradient(to right, transparent, rgba(0,0,0,0.1), transparent); margin: 25px 0; }
.modal-actions { display: flex; justify-content: center; }

@keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
/* SCROLL ELEGANT */
.scroll-elegant::-webkit-scrollbar { width: 6px; }
.scroll-elegant::-webkit-scrollbar-thumb { background: rgba(149,132,196,0.3); border-radius: 10px; }
</style>
