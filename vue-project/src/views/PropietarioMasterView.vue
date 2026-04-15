<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import TheHeader from '@/components/TheHeader.vue'
import TheSidebar from '@/components/TheSideBar.vue'
import TheFooter from '@/components/TheFooter.vue'

// Chart.js (registramos solo lo que necesitamos para tree-shaking)
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  BarElement, CategoryScale, LinearScale,
  LineElement, PointElement, Filler, Title
} from 'chart.js'
import { Pie, Bar, Line } from 'vue-chartjs'
import DataLabelsPlugin from 'chartjs-plugin-datalabels'

ChartJS.register(
  ArcElement, Tooltip, Legend,
  BarElement, CategoryScale, LinearScale,
  LineElement, PointElement, Filler, Title,
  DataLabelsPlugin
)

// ─── PALETA MIKROKOSMOS ──────────────────────────────────────────────────────
const PALETTE = [
  '#9584c4', '#b8a9d9', '#6f5f9e', '#d4ccea',
  '#4a3a7a', '#c3b6e8', '#7a6aaa', '#e8e4f4',
  '#3d2e6b', '#f0ecfb'
]

const router = useRouter()
const sidebarExpandido = ref(true)
const toggleSidebar = () => { sidebarExpandido.value = !sidebarExpandido.value }

// ─── NAVEGACIÓN ──────────────────────────────────────────────────────────────
const pantallaActual = ref<'dashboard' | 'usuarios' | 'perfil'>('dashboard')
const cargandoVista = ref(false)

const navegarA = async (pantalla: 'dashboard' | 'usuarios' | 'perfil') => {
  if (pantallaActual.value === pantalla) return
  cargandoVista.value = true
  pantallaActual.value = pantalla
  await new Promise(r => setTimeout(r, 350))
  cargandoVista.value = false
  if (pantalla === 'usuarios') fetchUsuarios()
  if (pantalla === 'perfil')   fetchPerfil()
}

const tituloNavegacion = computed(() => {
  if (pantallaActual.value === 'dashboard') return 'Dashboard Ejecutivo'
  if (pantallaActual.value === 'usuarios') return 'Gestión de Usuarios'
  return 'Administrador'
})

const volverPerfil = () => {
  router.push('/perfil')
}

// ════════════════════════════════════════════════════════════════════════════
// FILTROS GLOBALES
// ════════════════════════════════════════════════════════════════════════════
type TiempoFiltro = 'día' | 'semanas' | 'meses' | 'años'

const filtroTiempo     = ref<TiempoFiltro>('meses')
const filtroDiaSemana  = ref<string>(new Date().getDay().toString())
const filtroCategoria  = ref<string>('todas')
const filtroEditorial  = ref<string>('todas')

const categoriasDisponibles  = ref<string[]>([])
const editorialesDisponibles = ref<string[]>([])

// ════════════════════════════════════════════════════════════════════════════
// SECCIÓN 1: DASHBOARD — KPIs + Gráficas
// ════════════════════════════════════════════════════════════════════════════
const cargandoDashboard = ref(true)

// KPIs
const totalVentas          = ref(0)
const pedidosSinEntregar   = ref(0)
const pedidosAEnviar       = ref(0)

// Gráficas
type TipoGrafica = 'circular' | 'barras' | 'lineas'
const graficaActual = ref<TipoGrafica>('circular')

// Datos crudos para re-calcular al cambiar filtros
const allPedidos      = ref<any[]>([])
const allDetalles     = ref<any[]>([])
const allLibros       = ref<any[]>([])
const allArticulos    = ref<any[]>([])
const allEntregas     = ref<any[]>([])

// ─── Función de rango de fecha según filtro ──────────────────────────────────
const getFechaDesde = (): string => {
  const now = new Date()
  if (filtroTiempo.value === 'semanas') {
    now.setDate(now.getDate() - 7)
  } else if (filtroTiempo.value === 'meses') {
    now.setMonth(now.getMonth() - 1)
  } else {
    now.setFullYear(now.getFullYear() - 1)
  }
  return now.toISOString()
}

// ─── Fetch principal (solo se ejecuta una vez, filtra en computed) ────────────
const fetchDashboard = async () => {
  cargandoDashboard.value = true
  try {
    // Pedidos (sin filtro de fecha — lo aplicamos en computed)
    const { data: pedidos } = await supabase
      .from('pedido')
      .select('id_pedido, fecha, estado_pago, estado_envio')
    allPedidos.value = pedidos ?? []

    // Detalles todos
    const { data: detalles } = await supabase
      .from('detalles_pedidos')
      .select('id_pedido, id_productos, cantidad, precio_venta')
    allDetalles.value = detalles ?? []

    // Libros + Editorial + Genero
    const { data: libros } = await supabase
      .from('libro_detalles')
      .select('id_productos, genero, autor, editorial')
    allLibros.value = libros ?? []

    // Artículos + Categoría
    const { data: articulos } = await supabase
      .from('articulo_detalles')
      .select('id_productos, categoria')
    allArticulos.value = articulos ?? []

    // Entregas
    const { data: entregas } = await supabase
      .from('entrega')
      .select('id_pedido, estado_envio_nacional')
    allEntregas.value = entregas ?? []

    // Listas de filtros únicos
    const cats = new Set<string>()
    allLibros.value.forEach(l => l.genero && cats.add(l.genero))
    allArticulos.value.forEach(a => a.categoria && cats.add(a.categoria))
    categoriasDisponibles.value = Array.from(cats).sort()

    const eds = new Set<string>()
    allLibros.value.forEach(l => l.editorial && eds.add(l.editorial))
    editorialesDisponibles.value = Array.from(eds).sort()

  } catch (e) {
    console.error('fetchDashboard:', e)
  } finally {
    cargandoDashboard.value = false
  }
}

// ─── Computed: pedidos filtrados por tiempo ───────────────────────────────────
const pedidosFiltrados = computed(() => {
  if (filtroTiempo.value === 'día') {
    const targetDay = parseInt(filtroDiaSemana.value)
    const now = new Date()
    const currentDay = now.getDay()
    const diff = targetDay - currentDay
    const targetDate = new Date()
    targetDate.setDate(now.getDate() + diff)

    return allPedidos.value.filter(p => {
      // Usamos p.fecha (equivalente a created_at)
      const d = new Date(p.fecha)
      return d.getDate() === targetDate.getDate() && 
             d.getMonth() === targetDate.getMonth() && 
             d.getFullYear() === targetDate.getFullYear()
    })
  }

  const desde = new Date(getFechaDesde())
  return allPedidos.value.filter(p => new Date(p.fecha) >= desde)
})

// ─── Computed: IDs de pedidos con pago aprobado en el rango ──────────────────
const idsAprobados = computed(() =>
  pedidosFiltrados.value
    .filter(p => p.estado_pago === 'Aprobado')
    .map(p => p.id_pedido)
)

// ─── Computed: detalles de pedidos aprobados + filtros categoría/editorial ────
const detallesFiltrados = computed(() => {
  let dets = allDetalles.value.filter(d => idsAprobados.value.includes(d.id_pedido))

  if (filtroCategoria.value !== 'todas') {
    const idsCategoria = new Set([
      ...allLibros.value.filter(l => l.genero === filtroCategoria.value).map(l => l.id_productos),
      ...allArticulos.value.filter(a => a.categoria === filtroCategoria.value).map(a => a.id_productos)
    ])
    dets = dets.filter(d => idsCategoria.has(d.id_productos))
  }

  if (filtroEditorial.value !== 'todas') {
    const idsEditorial = new Set(
      allLibros.value.filter(l => l.editorial === filtroEditorial.value).map(l => l.id_productos)
    )
    dets = dets.filter(d => idsEditorial.has(d.id_productos))
  }

  return dets
})

// ─── KPIs reactivos corregidos ───────────────────────────────────────────────
watch([detallesFiltrados, allEntregas, pedidosFiltrados], () => {
  // 1. Ingresos totales (Suma de lo que ya se pagó en el periodo seleccionado)
  totalVentas.value = detallesFiltrados.value
    .reduce((acc, d) => acc + d.cantidad * d.precio_venta, 0)

  // 2. PEDIDOS SIN ENTREGAR (AQUÍ ESTABA EL ERROR)
  // Ahora filtramos directamente los pedidos que están en el limbo: Pagados pero no enviados.
  pedidosSinEntregar.value = pedidosFiltrados.value.filter(p => 
    p.estado_pago === 'Aprobado' && 
    p.estado_envio === 'Pendiente'
  ).length

  // 3. Pendientes de Despacho (Aprobados que no tienen registro en la tabla entrega)
  const idsConEntrega = new Set(allEntregas.value.map(e => e.id_pedido))
  pedidosAEnviar.value = idsAprobados.value
    .filter(id => !idsConEntrega.has(id)).length
    
}, { immediate: true })

// ─── GRÁFICA CIRCULAR: Ventas por Categoría ──────────────────────────────────
const chartCircularData = computed(() => {
  const map: Record<string, number> = {}

  for (const det of detallesFiltrados.value) {
    const lib = allLibros.value.find(l => l.id_productos === det.id_productos)
    const art = allArticulos.value.find(a => a.id_productos === det.id_productos)
    const cat = lib?.genero ?? art?.categoria ?? 'Sin categoría'
    map[cat] = (map[cat] ?? 0) + det.cantidad * det.precio_venta
  }

  const labels = Object.keys(map)
  return {
    labels,
    datasets: [{
      data: labels.map(l => map[l]),
      backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }
})

const chartCircularOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: { padding: { left: 8, right: 8, top: 8, bottom: 8 } },
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        font: { family: 'Inter', size: 13 },
        padding: 18,
        // Añade el % al texto de cada etiqueta de la leyenda
        generateLabels: (chart: any) => {
          const data = chart.data
          const total = (data.datasets[0]?.data as number[])?.reduce((a: number, b: number) => a + b, 0) || 1
          return data.labels.map((label: string, i: number) => {
            const value = data.datasets[0].data[i] as number
            const pct = ((value / total) * 100).toFixed(1)
            return {
              text: `${label}  (${pct}%)`,
              fillStyle: data.datasets[0].backgroundColor[i],
              strokeStyle: '#fff',
              lineWidth: 2,
              hidden: false,
              index: i
            }
          })
        }
      }
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => {
          const total = (ctx.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0)
          const pct = ((ctx.parsed / total) * 100).toFixed(1)
          return `  ${ctx.label}: $${ctx.parsed.toLocaleString('es-CL')}  (${pct}%)`
        }
      }
    },
    // ── chartjs-plugin-datalabels: porcentaje sobre cada rebanada ──
    datalabels: {
      display: true,
      color: (ctx: any) => {
        // Colores oscuros del PALETTE usan texto blanco, claros usan oscuro
        const darkSlices = ['#9584c4', '#6f5f9e', '#4a3a7a', '#7a6aaa', '#3d2e6b']
        const bg = ctx.dataset.backgroundColor[ctx.dataIndex]
        return darkSlices.includes(bg) ? '#ffffff' : '#3d2e6b'
      },
      font: { family: 'Inter', weight: 'bold' as const, size: 13 },
      formatter: (value: number, ctx: any) => {
        const total = (ctx.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0)
        const pct = ((value / total) * 100).toFixed(1)
        return `${pct}%`
      },
      // Solo muestra si la rebanada es mayor al 3% (evita labels aplastadas)
      display: (ctx: any) => {
        const total = (ctx.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0)
        return (ctx.dataset.data[ctx.dataIndex] / total) > 0.03
      }
    }
  }
}

// ─── GRÁFICA DE BARRAS: Volumen por Editorial ─────────────────────────────────
const chartBarrasData = computed(() => {
  const map: Record<string, number> = {}

  for (const det of detallesFiltrados.value) {
    const lib = allLibros.value.find(l => l.id_productos === det.id_productos)
    const ed = lib?.editorial ?? 'Sin editorial'
    map[ed] = (map[ed] ?? 0) + det.cantidad
  }

  const labels = Object.keys(map).sort((a, b) => map[b] - map[a]).slice(0, 10)
  return {
    labels,
    datasets: [{
      label: 'Unidades vendidas',
      data: labels.map(l => map[l]),
      backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
      borderRadius: 8,
      borderSkipped: false
    }]
  }
})

const chartBarrasOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: { display: false },
    datalabels: { display: false }  // desactivado: solo aplica en Pie
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { family: 'Inter' } } },
    y: { grid: { color: '#f0ecfb' }, ticks: { font: { family: 'Inter' } }, beginAtZero: true }
  }
}

// ─── GRÁFICA DE LÍNEAS: Tendencia de ingresos ────────────────────────────────
const chartLineasData = computed(() => {
  const map: Record<string, number> = {}

  const getKey = (fecha: string): string => {
    const d = new Date(fecha)
    if (filtroTiempo.value === 'día') {
      return `${d.getHours().toString().padStart(2, '0')}:00`
    } else if (filtroTiempo.value === 'semanas') {
      // Agrupar por día (últimos 7 días)
      return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' })
    } else if (filtroTiempo.value === 'meses') {
      // Agrupar por semana del mes
      const week = Math.ceil(d.getDate() / 7)
      return `Sem ${week} ${d.toLocaleDateString('es-CL', { month: 'short' })}`
    } else {
      // Agrupar por mes del año
      return d.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' })
    }
  }

  for (const ped of pedidosFiltrados.value.filter(p => p.estado_pago === 'Aprobado')) {
    const key = getKey(ped.fecha)
    const ingreso = allDetalles.value
      .filter(d => d.id_pedido === ped.id_pedido)
      .reduce((acc, d) => acc + d.cantidad * d.precio_venta, 0)
    map[key] = (map[key] ?? 0) + ingreso
  }

  let labels = Object.keys(map)
  if (filtroTiempo.value === 'día') {
    labels.sort()
  }
  return {
    labels,
    datasets: [{
      label: 'Ingresos',
      data: labels.map(l => map[l]),
      borderColor: '#9584c4',
      backgroundColor: 'rgba(149, 132, 196, 0.12)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#9584c4',
      pointRadius: 5,
      pointHoverRadius: 8
    }]
  }
})

const chartLineasOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx: any) => ` $${ctx.parsed.y.toLocaleString('es-CL')}` } },
    datalabels: { display: false }  // desactivado: solo aplica en Pie
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { family: 'Inter' } } },
    y: { 
      grid: { color: '#f0ecfb' }, 
      ticks: { 
        font: { family: 'Inter' }, 
        callback: (v: any) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}` 
      }, 
      beginAtZero: true 
    }
  }
}

const formatearMoneda = (v: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(v)

// ─── Reactivo: refrescar al cambiar filtros ───────────────────────────────────
watch([filtroTiempo, filtroCategoria, filtroEditorial], () => {
  // Los computed se recalculan automáticamente, solo forzamos re-render
})

// ════════════════════════════════════════════════════════════════════════════
// SECCIÓN 2: USUARIOS
// ════════════════════════════════════════════════════════════════════════════
const cargandoUsuarios   = ref(false)
const usuarios           = ref<any[]>([])
const inputBusqueda      = ref('')
const rolEditando        = ref<Record<number, string>>({})

const usuariosFiltrados = computed(() => {
  const q = inputBusqueda.value.trim().toLowerCase()
  if (!q) return usuarios.value
  return usuarios.value.filter(u =>
    u.nombre?.toLowerCase().includes(q) || u.correo?.toLowerCase().includes(q)
  )
})

const fetchUsuarios = async () => {
  cargandoUsuarios.value = true
  try {
    const { data, error } = await supabase
      .from('usuario')
      .select('id_usuario, nombre, correo, rol')
      .order('nombre', { ascending: true })
    if (error) throw error
    usuarios.value = data ?? []
    rolEditando.value = {}
    for (const u of usuarios.value) {
      rolEditando.value[u.id_usuario] = u.rol ?? 'cliente'
    }
  } catch (e) {
    console.error('fetchUsuarios:', e)
  } finally {
    cargandoUsuarios.value = false
  }
}

const inicialAvatar = (nombre: string) => (nombre?.[0] ?? '?').toUpperCase()

const guardarRol = async (usuario: any) => {
  try {
    const nuevoRol = rolEditando.value[usuario.id_usuario]
    const { error } = await supabase
      .from('usuario')
      .update({ rol: nuevoRol })
      .eq('id_usuario', usuario.id_usuario)
    if (error) throw error
    usuario.rol = nuevoRol
    alert(`✅ Rol de "${usuario.nombre}" actualizado a "${nuevoRol}"`)
  } catch (e: any) {
    alert('❌ Error: ' + (e.message ?? e))
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SECCIÓN 3: PERFIL
// ════════════════════════════════════════════════════════════════════════════
const cargandoPerfil  = ref(false)
const perfilUsuario   = ref<any>(null)

const fetchPerfil = async () => {
  cargandoPerfil.value = true
  try {
    const userLocal = localStorage.getItem('mikrokosmos_user')
    if (!userLocal) return
    const { id_usuario } = JSON.parse(userLocal)
    const { data, error } = await supabase
      .from('usuario')
      .select('id_usuario, nombre, correo, rol')
      .eq('id_usuario', id_usuario)
      .single()
    if (error) throw error
    perfilUsuario.value = data
  } catch (e) {
    console.error('fetchPerfil:', e)
  } finally {
    cargandoPerfil.value = false
  }
}

onMounted(() => fetchDashboard())
</script>

<template>
  <div class="page-layout">
    <TheHeader />

    <div class="main-wrapper">
      <TheSidebar :is-open="sidebarExpandido" @toggle-menu="toggleSidebar" />

      <main class="content-area">
        <!-- Barra de Navegación "Atrás" integrada -->
        <div class="top-navigation-bar">
          <button @click="volverPerfil" class="back-button" title="Volver al Perfil">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="back-icon"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <h2 class="nav-title">{{ tituloNavegacion }}</h2>
        </div>

        <!-- ── TABS ── -->
        <nav class="nav-roles">
          <button :class="{ active: pantallaActual === 'dashboard' }" @click="navegarA('dashboard')">
            <span>📊</span> Dashboard
          </button>
          <button :class="{ active: pantallaActual === 'usuarios' }" @click="navegarA('usuarios')">
            <span>👥</span> Usuarios
          </button>
          <button :class="{ active: pantallaActual === 'perfil' }" @click="navegarA('perfil')">
            <span>👤</span> Mi Perfil
          </button>
        </nav>

        <hr class="divider" />

        <div v-if="cargandoVista" class="loader-container"><div class="spinner"></div></div>

        <!-- ══════════════════════════════════════════════
             DASHBOARD
        ══════════════════════════════════════════════ -->
        <div v-else-if="pantallaActual === 'dashboard'" class="fade-in">

          <div class="dashboard-header">
            <h1 class="title-figma">Dashboard Ejecutivo</h1>

            <!-- ── BARRA DE FILTROS ── -->
            <div class="filters-bar">
              <!-- Tiempo -->
              <div class="filter-pill-group">
                <button
                  v-for="t in (['día', 'semanas', 'meses', 'años'] as const)"
                  :key="t"
                  class="filter-pill"
                  :class="{ active: filtroTiempo === t }"
                  @click="filtroTiempo = t"
                >{{ t.charAt(0).toUpperCase() + t.slice(1) }}</button>
              </div>

              <!-- Día Específico (si está seleccionado Día) -->
              <select v-if="filtroTiempo === 'día'" class="filter-select" v-model="filtroDiaSemana">
                <option value="1">Lunes</option>
                <option value="2">Martes</option>
                <option value="3">Miércoles</option>
                <option value="4">Jueves</option>
                <option value="5">Viernes</option>
                <option value="6">Sábado</option>
                <option value="0">Domingo</option>
              </select>

              <!-- Categoría -->
              <select class="filter-select" v-model="filtroCategoria">
                <option value="todas">Todas las categorías</option>
                <option v-for="cat in categoriasDisponibles" :key="cat" :value="cat">{{ cat }}</option>
              </select>

              <!-- Editorial -->
              <select class="filter-select" v-model="filtroEditorial">
                <option value="todas">Todas las editoriales</option>
                <option v-for="ed in editorialesDisponibles" :key="ed" :value="ed">{{ ed }}</option>
              </select>
            </div>
          </div>

          <!-- ── KPIs ── -->
          <div v-if="cargandoDashboard" class="loader-container"><div class="spinner"></div></div>
          <div v-else class="stats-grid">

            <div class="stat-card kpi-ingresos">
              <div class="kpi-icon">💰</div>
              <div class="kpi-body">
                <p class="kpi-label">Ingresos Totales</p>
                <p class="kpi-value">{{ formatearMoneda(totalVentas) }}</p>
                <p class="kpi-sub">Pedidos aprobados · {{ filtroTiempo }}</p>
              </div>
            </div>

            <div class="stat-card kpi-sin-entregar">
              <div class="kpi-icon">🚚</div>
              <div class="kpi-body">
                <p class="kpi-label">Sin Entregar</p>
                <p class="kpi-value">{{ pedidosSinEntregar }}</p>
                <p class="kpi-sub">En proceso de envío</p>
              </div>
            </div>

            <div class="stat-card kpi-a-enviar">
              <div class="kpi-icon">📦</div>
              <div class="kpi-body">
                <p class="kpi-label">Pendientes de Despacho</p>
                <p class="kpi-value">{{ pedidosAEnviar }}</p>
                <p class="kpi-sub">Aprobados sin registro en entrega</p>
              </div>
            </div>

          </div>

          <!-- ── MÓDULO DE GRÁFICAS ── -->
          <div class="chart-module">
            <div class="chart-module-header">
              <h2 class="section-subtitle">Análisis Visual</h2>
              <div class="chart-switcher">
                <button
                  class="chart-tab"
                  :class="{ active: graficaActual === 'circular' }"
                  @click="graficaActual = 'circular'"
                >🥧 Por Categoría</button>
                <button
                  class="chart-tab"
                  :class="{ active: graficaActual === 'barras' }"
                  @click="graficaActual = 'barras'"
                >📊 Por Editorial</button>
                <button
                  class="chart-tab"
                  :class="{ active: graficaActual === 'lineas' }"
                  @click="graficaActual = 'lineas'"
                >📈 Tendencia</button>
              </div>
            </div>

            <div class="chart-area">
              <div v-if="detallesFiltrados.length === 0" class="chart-empty">
                <p>📭 Sin datos para el periodo y filtros seleccionados.</p>
              </div>
              <template v-else>
                <Pie
                  v-if="graficaActual === 'circular'"
                  :data="chartCircularData"
                  :options="chartCircularOptions"
                />
                <Bar
                  v-else-if="graficaActual === 'barras'"
                  :data="chartBarrasData"
                  :options="chartBarrasOptions"
                />
                <Line
                  v-else-if="graficaActual === 'lineas'"
                  :data="chartLineasData"
                  :options="chartLineasOptions"
                />
              </template>
            </div>
          </div>

        </div>

        <!-- ══════════════════════════════════════════════
             USUARIOS
        ══════════════════════════════════════════════ -->
        <div v-else-if="pantallaActual === 'usuarios'" class="fade-in">
          <h1 class="title-figma" style="text-align:center">Gestión de Usuarios</h1>

          <div class="search-box">
            <input v-model="inputBusqueda" type="text" placeholder="Buscar por nombre o correo…" />
            <button class="btn-lupa" @click="fetchUsuarios">🔍 Cargar</button>
          </div>

          <div v-if="cargandoUsuarios" class="loader-container"><div class="spinner"></div></div>

          <div v-else-if="usuariosFiltrados.length === 0" class="empty-state">
            <div class="icon-search">🔎</div>
            <h2>Sin resultados</h2>
            <p>Haz clic en "Cargar" para traer los usuarios.</p>
          </div>

          <div v-else class="users-grid">
            <div v-for="usr in usuariosFiltrados" :key="usr.id_usuario" class="user-card-result">
              <div class="card-header">
                <div class="avatar-circle">{{ inicialAvatar(usr.nombre) }}</div>
                <div>
                  <h3>{{ usr.nombre }}</h3>
                  <p>{{ usr.correo }}</p>
                </div>
              </div>
              <div class="card-body">
                <label>Rol actual: <strong>{{ usr.rol }}</strong></label>
                <select class="rol-select" v-model="rolEditando[usr.id_usuario]">
                  <option value="propietaria">Propietaria</option>
                  <option value="Gestor de ventas">Gestor de Ventas</option>
                  <option value="cliente">Cliente</option>
                  <option value="administrador">Administrador</option>
                </select>
                <button class="btn-save" @click="guardarRol(usr)">Guardar Permiso</button>
              </div>
            </div>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════
             PERFIL
        ══════════════════════════════════════════════ -->
        <div v-else-if="pantallaActual === 'perfil'" class="fade-in">
          <h1 class="title-figma">Configuración de Cuenta</h1>

          <div v-if="cargandoPerfil" class="loader-container"><div class="spinner"></div></div>

          <div v-else class="profile-card">
            <div class="profile-header-bg"></div>
            <div class="profile-content">
              <div class="big-avatar">{{ inicialAvatar(perfilUsuario?.nombre ?? 'P') }}</div>
              <h2>{{ perfilUsuario?.nombre ?? 'Propietario' }}</h2>
              <p class="profile-tag">{{ perfilUsuario?.rol ?? 'Administrador' }}</p>

              <div class="profile-info-grid">
                <div class="info-item"><strong>Email:</strong><span>{{ perfilUsuario?.correo ?? '—' }}</span></div>
                <div class="info-item"><strong>Rol:</strong><span>{{ perfilUsuario?.rol ?? '—' }}</span></div>
                <div class="info-item"><strong>ID:</strong><span>#{{ perfilUsuario?.id_usuario ?? '—' }}</span></div>
              </div>

              <div class="profile-management-grid">
                <button class="mgmt-btn" @click="router.push({ name: 'admin-catalogo' })">📦 Módulo de edición del catálogo</button>
                <button class="mgmt-btn" @click="router.push({ name: 'gestor' })">🚚 Ver Envíos y Pagos</button>
                <button class="mgmt-btn" @click="navegarA('dashboard')">📊 Ver Reportes del Dashboard</button>
              </div>

              <div class="profile-actions">
                <button class="btn-edit-profile" @click="router.push({ name: 'edit-profile' })">Editar Datos</button>
                <button class="btn-logout" @click="router.push({ name: 'LogicaLogin' })">Cerrar Sesión</button>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
    <TheFooter />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Hina+Mincho&family=Inter:wght@300;400;500;600;700&display=swap');

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
  padding-right: 38px;
}

/* ─── LAYOUT ─────────────────────────────────────────────────────────────── */
.page-layout  { display: flex; flex-direction: column; height: 100vh; background: #fff; font-family: 'Inter', sans-serif; }
.main-wrapper { display: flex; flex: 1; overflow: hidden; }
.content-area { flex: 1; padding: 28px 32px; overflow-y: auto; background: #fdfdfd; }

/* ─── TABS ───────────────────────────────────────────────────────────────── */
.nav-roles { display: flex; gap: 10px; margin-bottom: 18px; justify-content: center; }
.nav-roles button { display: flex; align-items: center; gap: 7px; padding: 10px 26px; border: 2px solid #9584c4; background: transparent; color: #9584c4; border-radius: 30px; cursor: pointer; font-weight: 600; font-size: 0.92rem; transition: all 0.22s; }
.nav-roles button:hover { background: rgba(149,132,196,.1); transform: translateY(-2px); }
.nav-roles button.active { background: #9584c4; color: #fff; box-shadow: 0 4px 14px rgba(149,132,196,.38); }
.divider { border: 0; border-top: 1px solid #eee; margin-bottom: 24px; }

/* ─── TIPOGRAFÍA ─────────────────────────────────────────────────────────── */
.title-figma     { font-family: 'Hina Mincho', serif; font-size: 2.4rem; color: #333; margin-bottom: 20px; font-weight: normal; }
.section-subtitle{ font-family: 'Hina Mincho', serif; font-size: 1.5rem; color: #444; font-weight: normal; margin: 0; }

/* ─── SPINNERS ───────────────────────────────────────────────────────────── */
.loader-container { display: flex; justify-content: center; align-items: center; height: 240px; }
.spinner { width: 46px; height: 46px; border: 4px solid #f0ecfb; border-top: 4px solid #9584c4; border-radius: 50%; animation: spin .85s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── DASHBOARD HEADER + FILTROS ─────────────────────────────────────────── */
.dashboard-header { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }

.filters-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #ede9fb;
  border-radius: 14px;
  padding: 14px 20px;
  box-shadow: 0 3px 14px rgba(149,132,196,.07);
}

.filter-pill-group { display: flex; gap: 6px; }
.filter-pill {
  padding: 7px 18px;
  border: 1.5px solid #dcd0f0;
  background: transparent;
  color: #7a69ab;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
}
.filter-pill:hover  { background: rgba(149,132,196,.1); }
.filter-pill.active { background: #9584c4; color: #fff; border-color: #9584c4; box-shadow: 0 3px 10px rgba(149,132,196,.3); }

.filter-select {
  padding: 8px 14px;
  border: 1.5px solid #dcd0f0;
  border-radius: 10px;
  background: #fafafa;
  color: #444;
  font-size: 0.88rem;
  outline: none;
  cursor: pointer;
  transition: border-color .2s;
  min-width: 160px;
}
.filter-select:focus { border-color: #9584c4; }

/* ─── KPIs ───────────────────────────────────────────────────────────────── */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 28px; }

.stat-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px 26px;
  border-radius: 20px;
  color: #fff;
  transition: transform .25s;
}
.stat-card:hover { transform: translateY(-4px); }
.kpi-ingresos   { background: linear-gradient(135deg, #9584c4, #6f5f9e); box-shadow: 0 8px 22px rgba(149,132,196,.35); }
.kpi-sin-entregar { background: linear-gradient(135deg, #4a3a7a, #2d2060); box-shadow: 0 8px 22px rgba(74,58,122,.3); }
.kpi-a-enviar   { background: linear-gradient(135deg, #2d2d2d, #111); box-shadow: 0 8px 22px rgba(0,0,0,.15); }

.kpi-icon  { font-size: 2.4rem; opacity: .9; }
.kpi-body  { display: flex; flex-direction: column; gap: 4px; }
.kpi-label { font-size: 0.8rem; font-weight: 600; opacity: .8; text-transform: uppercase; letter-spacing: .5px; margin: 0; }
.kpi-value { font-size: 2rem; font-weight: 700; margin: 0; line-height: 1.1; }
.kpi-sub   { font-size: 0.78rem; opacity: .7; margin: 0; }

/* ─── MÓDULO DE GRÁFICAS ─────────────────────────────────────────────────── */
.chart-module {
  background: #fff;
  border: 1px solid #ede9fb;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 4px 22px rgba(149,132,196,.07);
}

.chart-module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 24px;
}

.chart-switcher { display: flex; gap: 8px; }
.chart-tab {
  padding: 8px 18px;
  border: 1.5px solid #dcd0f0;
  border-radius: 10px;
  background: transparent;
  color: #7a69ab;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
}
.chart-tab:hover  { background: rgba(149,132,196,.1); }
.chart-tab.active { background: #9584c4; color: #fff; border-color: #9584c4; box-shadow: 0 3px 10px rgba(149,132,196,.3); }

.chart-area {
  height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.chart-area canvas { max-height: 360px !important; }

.chart-empty {
  text-align: center;
  color: #bbb;
  font-size: 1rem;
}

/* ─── USUARIOS ───────────────────────────────────────────────────────────── */
.search-box { display: flex; max-width: 520px; margin: 0 auto 26px; border-radius: 14px; box-shadow: 0 4px 16px rgba(149,132,196,.1); overflow: hidden; border: 1.5px solid #e0d8f0; }
.search-box input { flex: 1; padding: 13px 18px; border: none; outline: none; font-size: .97rem; }
.btn-lupa { background: #9584c4; color: #fff; border: none; padding: 0 26px; cursor: pointer; font-weight: 700; font-size: .88rem; transition: background .2s; }
.btn-lupa:hover { background: #7a69ab; }

.users-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 18px; }
.user-card-result { border: 1px solid #ede9fb; border-radius: 18px; padding: 24px; box-shadow: 0 4px 18px rgba(149,132,196,.07); background: #fff; transition: transform .22s, box-shadow .22s; }
.user-card-result:hover { transform: translateY(-4px); box-shadow: 0 10px 28px rgba(149,132,196,.14); }
.card-header { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.avatar-circle { width: 54px; height: 54px; background: #9584c4; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; flex-shrink: 0; }
.card-header h3 { margin: 0 0 3px; font-size: 1rem; color: #222; }
.card-header p  { margin: 0; font-size: .82rem; color: #888; }
.card-body { display: flex; flex-direction: column; gap: 10px; }
.card-body label { font-size: .83rem; color: #666; }
.card-body label strong { color: #9584c4; }
.rol-select { padding: 9px 12px; border-radius: 10px; border: 1.5px solid #e0d8f0; background: #fafafa; font-size: .93rem; outline: none; width: 100%; transition: border-color .2s; }
.rol-select:focus { border-color: #9584c4; }
.btn-save { background: #2d2d2d; color: #fff; border: none; padding: 11px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: .93rem; transition: background .22s; }
.btn-save:hover { background: #9584c4; }

.empty-state { text-align: center; margin-top: 50px; color: #bbb; }
.icon-search  { font-size: 52px; margin-bottom: 10px; }

/* ─── PERFIL ─────────────────────────────────────────────────────────────── */
.profile-card { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 14px 44px rgba(149,132,196,.12); border: 1px solid #ede9fb; }
.profile-header-bg { height: 118px; background: linear-gradient(135deg, #9584c4 0%, #6f5f9e 100%); }
.profile-content { padding: 30px 38px 38px; text-align: center; position: relative; margin-top: -52px; }
.big-avatar { width: 104px; height: 104px; background: #2d2d2d; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; margin: 0 auto 12px; border: 6px solid #fff; box-shadow: 0 6px 20px rgba(0,0,0,.13); }
.profile-content h2 { font-family: 'Hina Mincho', serif; font-size: 1.9rem; color: #222; margin-bottom: 4px; }
.profile-tag { background: #fdf5ff; color: #9584c4; border: 1.5px solid #e0d8f0; padding: 5px 15px; border-radius: 20px; font-size: .83rem; font-weight: 600; display: inline-block; margin-bottom: 22px; text-transform: capitalize; }
.profile-info-grid { text-align: left; display: grid; gap: 10px; margin-bottom: 24px; }
.info-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: #fafafa; border-radius: 10px; border: 1px solid #f0f0f0; transition: border-color .2s; }
.info-item:hover { border-color: #dcd0f0; }
.info-item strong { color: #555; font-size: .88rem; }
.info-item span   { color: #777; font-weight: 500; font-size: .88rem; }
.profile-management-grid { display: grid; gap: 10px; margin-bottom: 24px; }
.mgmt-btn { background: transparent; border: 2px dashed #dcd0f0; color: #555; padding: 13px 16px; font-size: .98rem; font-family: 'Hina Mincho', serif; border-radius: 12px; cursor: pointer; transition: all .22s; text-align: left; display: flex; align-items: center; gap: 10px; }
.mgmt-btn:hover { background: #9584c4; color: #fff; border-color: #9584c4; transform: translateX(5px); box-shadow: 0 5px 14px rgba(149,132,196,.3); }
.profile-actions { display: flex; gap: 12px; justify-content: center; border-top: 1px solid #f0f0f0; padding-top: 20px; }
.btn-edit-profile { padding: 10px 22px; background: #fff; border: 2px solid #9584c4; color: #9584c4; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all .2s; }
.btn-edit-profile:hover { background: #9584c4; color: #fff; }
.btn-logout { padding: 10px 22px; background: #ff4d4d; border: none; color: #fff; border-radius: 12px; cursor: pointer; font-weight: 600; transition: background .2s; box-shadow: 0 4px 12px rgba(255,77,77,.22); }
.btn-logout:hover { background: #e60000; }

/* ─── ANIMACIONES ────────────────────────────────────────────────────────── */
.fade-in { animation: fadeIn .32s cubic-bezier(.4,0,.2,1); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

/* ─── RESPONSIVE ─────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
  .chart-module-header { flex-direction: column; align-items: flex-start; }
  .chart-switcher { flex-wrap: wrap; }
  .dashboard-header { gap: 12px; }
}
</style>
