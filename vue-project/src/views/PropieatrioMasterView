<script setup lang="ts">
import { ref } from 'vue'
import TheHeader from '@/components/TheHeader.vue'
import TheSidebar from '@/components/TheSideBar.vue'
import TheFooter from '@/components/TheFooter.vue'

// Control de navegación: 'dashboard', 'usuarios', 'perfil'
const pantallaActual = ref('dashboard') 
const busquedaRealizada = ref(false)
const inputBusqueda = ref('')

const sidebarExpandido = ref(true)
const toggleSidebar = () => {
  sidebarExpandido.value = !sidebarExpandido.value
}
</script>

<template>
  <div class="page-layout">
    <TheHeader />

    <div class="main-wrapper">
      <TheSidebar :is-open="sidebarExpandido" @toggle-menu="toggleSidebar" />

      <main class="content-area">
        
        <nav class="nav-roles">
          <button :class="{ active: pantallaActual === 'dashboard' }" @click="pantallaActual = 'dashboard'">
            📊 DASHBOARD
          </button>
          <button :class="{ active: pantallaActual === 'usuarios' }" @click="pantallaActual = 'usuarios'">
            👥 USUARIOS
          </button>
          <button :class="{ active: pantallaActual === 'perfil' }" @click="pantallaActual = 'perfil'">
            👤 MI PERFIL
          </button>
        </nav>

        <hr class="divider">

        <div v-if="pantallaActual === 'dashboard'" class="fade-in">
          <h1 class="title-figma">Resumen de Ventas</h1>
          <div class="stats-grid">
            <div class="stat-card main-purple">
              <div class="card-icon">💰</div>
              <div>
                <h3>Ingresos Mensuales</h3>
                <p class="price">$2,450.00</p>
                <p class="trend up">↑ 12% vs mes anterior</p>
              </div>
            </div>
            <div class="stat-card secondary-dark">
              <div class="card-icon">📚</div>
              <div>
                <h3>Libros Entregados</h3>
                <p class="price">85</p>
                <p class="trend">En curso: 12 pedidos</p>
              </div>
            </div>
          </div>
          
          <div class="chart-container">
            <h3>Crecimiento Semanal de Ventas</h3>
            <div class="bars-wrapper">
              <div class="bar" style="height: 60%"><span>Lun</span></div>
              <div class="bar" style="height: 45%"><span>Mar</span></div>
              <div class="bar" style="height: 85%"><span>Mie</span></div>
              <div class="bar" style="height: 55%"><span>Jue</span></div>
              <div class="bar" style="height: 95%"><span>Vie</span></div>
            </div>
          </div>
        </div>

        <div v-else-if="pantallaActual === 'usuarios'" class="fade-in">
          <h1 class="title-figma" style="text-align: center;">Administrar Permisos</h1>
          <div class="search-box">
            <input v-model="inputBusqueda" type="text" placeholder="Escribe 'Isaac' para buscar...">
            <button class="btn-lupa" @click="busquedaRealizada = true">🔍 BUSCAR</button>
          </div>

          <div v-if="!busquedaRealizada" class="empty-state">
            <div class="icon-search">🔎</div>
            <h2>No has buscado ningún usuario</h2>
            <p>Usa la barra superior para encontrar un empleado o cliente.</p>
          </div>

          <div v-else class="user-card-result">
            <div class="card-header">
              <div class="avatar-circle">I</div>
              <div>
                <h3>Isaac Martínez</h3>
                <p>isaac.mtz@universidad.edu</p>
              </div>
            </div>
            <div class="card-body">
              <label>Asignar Rol de Sistema:</label>
              <select class="rol-select">
                <option>Propietario</option>
                <option selected>Gestor de Ventas</option>
                <option>Cliente</option>
              </select>
              <button class="btn-save" @click="busquedaRealizada = false">Guardar Permisos</button>
            </div>
          </div>
        </div>

        <div v-else-if="pantallaActual === 'perfil'" class="fade-in">
          <h1 class="title-figma">Configuración de Cuenta</h1>
          <div class="profile-card">
            <div class="profile-header-bg"></div>
            <div class="profile-content">
              <div class="big-avatar">A</div>
              <h2>Usuario Propietario</h2>
              <p class="profile-tag">Administrador de Sistema</p>
              
              <div class="profile-info-grid">
                <div class="info-item"><strong>Email:</strong> <span>admin@libreria.com</span></div>
                <div class="info-item"><strong>Teléfono:</strong> <span>+58 412 123 4567</span></div>
                <div class="info-item"><strong>Nivel:</strong> <span>Acceso Total</span></div>
                <div class="info-item"><strong>Última conexión:</strong> <span>Hoy, 11:59 PM</span></div>
              </div>
              
              <div class="profile-actions">
                <button class="btn-edit-profile">Editar Datos</button>
                <button class="btn-logout">Cerrar Sesión</button>
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
.page-layout { display: flex; flex-direction: column; height: 100vh; background: #fdfdfd; font-family: 'Inter', sans-serif; }
.main-wrapper { display: flex; flex: 1; overflow: hidden; }
.content-area { flex: 1; padding: 30px; overflow-y: auto; background-color: #fafafa; }

/* NAVEGACIÓN DE BOTONES (TABS) */
.nav-roles { display: flex; gap: 15px; margin-bottom: 20px; justify-content: center; }
.nav-roles button { padding: 12px 30px; border: 2px solid #8b7abf; background: transparent; color: #8b7abf; border-radius: 30px; cursor: pointer; font-weight: bold; transition: 0.3s ease; }
.nav-roles button:hover { background: rgba(139, 122, 191, 0.1); }
.nav-roles button.active { background: #8b7abf; color: white; box-shadow: 0 4px 10px rgba(139, 122, 191, 0.3); }
.divider { border: 0; border-top: 1px solid #eee; margin-bottom: 30px; }

.title-figma { font-family: serif; font-style: italic; color: #333; margin-bottom: 25px; }

/* ESTILOS DASHBOARD */
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 35px; }
.stat-card { color: white; padding: 25px; border-radius: 20px; display: flex; align-items: center; gap: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
.stat-card.main-purple { background: #8b7abf; box-shadow: 0 10px 20px rgba(139, 122, 191, 0.4); }
.stat-card.secondary-dark { background: #333; }
.card-icon { font-size: 2.5rem; opacity: 0.8; }
.price { font-size: 2.5rem; font-weight: bold; margin-top: 5px; }
.trend { font-size: 0.8rem; opacity: 0.9; margin-top: 5px; }
.trend.up { color: #ccffcc; font-weight: bold; }

.chart-container { background: white; padding: 25px; border-radius: 20px; border: 1px solid #eee; box-shadow: 0 5px 15px rgba(0,0,0,0.02); }
.chart-container h3 { margin-bottom: 20px; color: #555; }
.bars-wrapper { display: flex; align-items: flex-end; gap: 15px; height: 180px; margin-top: 20px; padding: 10px; border-left: 2px solid #f0f0f0; border-bottom: 2px solid #f0f0f0; }
.bar { flex: 1; background: #8b7abf; border-radius: 6px 6px 0 0; position: relative; transition: height 0.3s ease; }
.bar:hover { background: #7a69ab; }
.bar span { position: absolute; bottom: -28px; left: 0; width: 100%; font-size: 0.75rem; text-align: center; color: #888; }

/* ESTILOS PERFIL (MUCHO MEJORADO) */
.profile-card { max-width: 550px; margin: 0 auto; background: white; border-radius: 25px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.08); border: 1px solid #eee; }
.profile-header-bg { height: 120px; background: #8b7abf; background: linear-gradient(135deg, #8b7abf 0%, #333333 100%); }
.profile-content { padding: 30px; text-align: center; position: relative; margin-top: -60px; }
.big-avatar { width: 110px; height: 110px; background: #333; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3.5rem; margin: 0 auto 15px; border: 5px solid white; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
.profile-tag { background: #f0f0f0; color: #666; padding: 5px 15px; border-radius: 20px; font-size: 0.8rem; display: inline-block; margin-bottom: 25px; }
.profile-info-grid { text-align: left; display: grid; gap: 15px; margin-bottom: 30px; }
.info-item { display: flex; justify-content: space-between; padding: 12px 15px; background: #fafafa; border-radius: 10px; border: 1px solid #f0f0f0; }
.info-item strong { color: #555; }
.info-item span { color: #888; }

.profile-actions { display: flex; gap: 15px; justify-content: center; }
.btn-edit-profile { padding: 12px 25px; background: white; border: 2px solid #8b7abf; color: #8b7abf; border-radius: 10px; cursor: pointer; font-weight: bold; }
.btn-logout { padding: 12px 25px; background: #ff4d4d; border: none; color: white; border-radius: 10px; cursor: pointer; font-weight: bold; }
.btn-logout:hover { background: #e60000; }

/* OTROS ESTILOS (BUSCADOR E ISAAC) */
.search-box { display: flex; max-width: 500px; margin: 0 auto 35px; }
.search-box input { flex: 1; padding: 12px 20px; border: 2px solid #8b7abf; border-radius: 25px 0 0 25px; outline: none; }
.btn-lupa { background: #8b7abf; color: white; border: none; padding: 0 25px; border-radius: 0 25px 25px 0; cursor: pointer; font-weight: bold; }
.empty-state { text-align: center; margin-top: 60px; color: #bbb; }
.icon-search { font-size: 60px; margin-bottom: 15px; }
.user-card-result { max-width: 480px; margin: 0 auto; border: 1px solid #eee; border-radius: 20px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); background: #fff; }
.card-header { display: flex; align-items: center; gap: 20px; margin-bottom: 25px; }
.avatar-circle { width: 65px; height: 65px; background: #8b7abf; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: bold; }
.card-body { display: flex; flex-direction: column; gap: 18px; }
.rol-select { padding: 12px; border-radius: 12px; border: 1px solid #ddd; background: #fafafa; }
.btn-save { background: #333; color: white; border: none; padding: 14px; border-radius: 12px; cursor: pointer; font-weight: bold; }

.fade-in { animation: fadeIn 0.4s ease-in; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
