<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TheHeader from '@/components/TheHeader.vue'
import TheSidebar from '@/components/TheSideBar.vue'
import TheFooter from '@/components/TheFooter.vue'

const router = useRouter()

// Control de navegación: 'dashboard', 'usuarios', 'perfil'
const pantallaActual = ref('dashboard') 
const busquedaRealizada = ref(false)
const inputBusqueda = ref('')
const cargando = ref(false)

const sidebarExpandido = ref(true)
const toggleSidebar = () => {
  sidebarExpandido.value = !sidebarExpandido.value
}

const simularCarga = async (pantalla: string) => {
  cargando.value = true
  pantallaActual.value = pantalla
  await new Promise(resolve => setTimeout(resolve, 800))
  cargando.value = false
}

const navegarA = (ruta: string) => {
  router.push(ruta)
}
</script>

<template>
  <div class="page-layout">
    <TheHeader />

    <div class="main-wrapper">
      <TheSidebar :is-open="sidebarExpandido" @toggle-menu="toggleSidebar" />

      <main class="content-area">
        
        <nav class="nav-roles">
          <button :class="{ active: pantallaActual === 'dashboard' }" @click="simularCarga('dashboard')">
            📊 DASHBOARD
          </button>
          <button :class="{ active: pantallaActual === 'usuarios' }" @click="simularCarga('usuarios')">
            👥 USUARIOS
          </button>
          <button :class="{ active: pantallaActual === 'perfil' }" @click="simularCarga('perfil')">
            👤 MI PERFIL
          </button>
        </nav>

        <hr class="divider">

        <div v-if="cargando" class="loader-container">
          <div class="spinner"></div>
        </div>

        <div v-else-if="pantallaActual === 'dashboard'" class="fade-in">
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

              <!-- BOTONES DE NAVEGACIÓN -->
              <div class="profile-management-grid hina-mincho-font">
                <button class="mgmt-btn" @click="navegarA('/admin/catalogo')">
                  📦 Gestionar Inventario
                </button>
                <button class="mgmt-btn" @click="navegarA('/gestor')">
                  🚚 Ver Envíos y Pagos
                </button>
                <button class="mgmt-btn" @click="navegarA('/propietario')">
                  📄 Reportes Ejecutivos
                </button>
              </div>
              
              <div class="profile-actions">
                <button class="btn-edit-profile">Editar Datos</button>
                <button class="btn-logout" @click="navegarA('/login')">Cerrar Sesión</button>
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

.hina-mincho-font { font-family: 'Hina Mincho', serif; }

.page-layout { display: flex; flex-direction: column; height: 100vh; background: #fff; font-family: 'Inter', sans-serif; }
.main-wrapper { display: flex; flex: 1; overflow: hidden; }
.content-area { flex: 1; padding: 30px; overflow-y: auto; background-color: #fdfdfd; }

/* NAVEGACIÓN DE BOTONES (TABS) */
.nav-roles { display: flex; gap: 15px; margin-bottom: 20px; justify-content: center; }
.nav-roles button { padding: 12px 30px; border: 2px solid #9584c4; background: transparent; color: #9584c4; border-radius: 30px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; }
.nav-roles button:hover { background: rgba(149, 132, 196, 0.1); transform: translateY(-2px); }
.nav-roles button.active { background: #9584c4; color: white; box-shadow: 0 4px 12px rgba(149, 132, 196, 0.4); }
.divider { border: 0; border-top: 1px solid #eee; margin-bottom: 30px; }

.title-figma { font-family: 'Hina Mincho', serif; font-size: 2.8rem; color: #333; margin-bottom: 25px; font-weight: normal; }

/* SPINNER CARGA */
.loader-container { display: flex; justify-content: center; align-items: center; height: 300px; }
.spinner { width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #9584c4; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* ESTILOS DASHBOARD */
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 35px; }
.stat-card { color: white; padding: 25px; border-radius: 20px; display: flex; align-items: center; gap: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.05); transition: transform 0.3s; }
.stat-card:hover { transform: translateY(-5px); }
.stat-card.main-purple { background: #9584c4; box-shadow: 0 10px 20px rgba(149, 132, 196, 0.3); }
.stat-card.secondary-dark { background: #333; }
.card-icon { font-size: 2.5rem; opacity: 0.9; }
.price { font-size: 2.5rem; font-weight: bold; margin-top: 5px; }
.trend { font-size: 0.8rem; opacity: 0.9; margin-top: 5px; }
.trend.up { color: #ccffcc; font-weight: bold; }

.chart-container { background: white; padding: 25px; border-radius: 20px; border: 1px solid #eee; box-shadow: 0 5px 25px rgba(0,0,0,0.04); }
.chart-container h3 { margin-bottom: 20px; color: #555; font-family: 'Hina Mincho', serif; font-size: 1.8rem; }
.bars-wrapper { display: flex; align-items: flex-end; gap: 15px; height: 180px; margin-top: 20px; padding: 10px; border-left: 2px solid #f0f0f0; border-bottom: 2px solid #f0f0f0; }
.bar { flex: 1; background: #9584c4; border-radius: 6px 6px 0 0; position: relative; transition: height 0.3s ease, filter 0.3s; }
.bar:hover { filter: brightness(1.1); cursor: pointer; }
.bar span { position: absolute; bottom: -28px; left: 0; width: 100%; font-size: 0.8rem; text-align: center; color: #888; font-weight: 500; }

/* ESTILOS PERFIL */
.profile-card { max-width: 600px; margin: 0 auto; background: white; border-radius: 25px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.08); border: 1px solid #eee; }
.profile-header-bg { height: 120px; background: linear-gradient(135deg, #9584c4 0%, #6f5f9e 100%); }
.profile-content { padding: 40px; text-align: center; position: relative; margin-top: -60px; }
.big-avatar { width: 110px; height: 110px; background: #333; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3.5rem; margin: 0 auto 15px; border: 6px solid white; box-shadow: 0 5px 20px rgba(0,0,0,0.15); }
.profile-content h2 { font-family: 'Hina Mincho', serif; font-size: 2.2rem; color: #222; margin-bottom: 5px; }
.profile-tag { background: #fdf5ff; color: #9584c4; border: 1px solid #e0d8f0; padding: 6px 18px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-block; margin-bottom: 25px; }

.profile-info-grid { text-align: left; display: grid; gap: 15px; margin-bottom: 30px; }
.info-item { display: flex; justify-content: space-between; padding: 14px 18px; background: #fafafa; border-radius: 12px; border: 1px solid #f0f0f0; transition: border-color 0.2s; }
.info-item:hover { border-color: #dcd0f0; }
.info-item strong { color: #555; }
.info-item span { color: #777; font-weight: 500;}

.profile-management-grid {
  display: grid;
  gap: 15px;
  margin-bottom: 35px;
  grid-template-columns: 1fr;
}
.mgmt-btn {
  background-color: transparent;
  border: 2px dashed #dcd0f0;
  color: #555;
  padding: 16px;
  font-size: 1.3rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
}
.mgmt-btn:hover {
  background-color: #9584c4;
  color: white;
  border-color: #9584c4;
  transform: translateX(5px);
  box-shadow: 0 5px 15px rgba(149, 132, 196, 0.3);
}

.profile-actions { display: flex; gap: 15px; justify-content: center; border-top: 1px solid #f0f0f0; padding-top: 25px; }
.btn-edit-profile { padding: 12px 25px; background: white; border: 2px solid #9584c4; color: #9584c4; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
.btn-edit-profile:hover { background: #9584c4; color: white; }
.btn-logout { padding: 12px 25px; background: #ff4d4d; border: none; color: white; border-radius: 12px; cursor: pointer; font-weight: 600; transition: background 0.2s; box-shadow: 0 4px 10px rgba(255, 77, 77, 0.2); }
.btn-logout:hover { background: #e60000; }

/* OTROS ESTILOS (BUSCADOR E ISAAC) */
.search-box { display: flex; max-width: 500px; margin: 0 auto 35px; box-shadow: 0 5px 20px rgba(0,0,0,0.05); border-radius: 25px; }
.search-box input { flex: 1; padding: 15px 25px; border: 2px solid #e0d8f0; border-radius: 25px 0 0 25px; outline: none; font-size: 1rem; transition: border-color 0.2s; }
.search-box input:focus { border-color: #9584c4; }
.btn-lupa { background: #9584c4; color: white; border: none; padding: 0 30px; border-radius: 0 25px 25px 0; cursor: pointer; font-weight: bold; transition: background 0.2s; }
.btn-lupa:hover { background: #7a69ab; }
.empty-state { text-align: center; margin-top: 60px; color: #bbb; }
.icon-search { font-size: 60px; margin-bottom: 15px; }
.user-card-result { max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 20px; padding: 35px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); background: #fff; transition: transform 0.3s; }
.user-card-result:hover { transform: translateY(-5px); }
.card-header { display: flex; align-items: center; gap: 20px; margin-bottom: 25px; }
.avatar-circle { width: 70px; height: 70px; background: #9584c4; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; }
.card-body { display: flex; flex-direction: column; gap: 20px; }
.rol-select { padding: 14px; border-radius: 12px; border: 1px solid #e0d8f0; background: #fafafa; font-size: 1rem; outline: none; transition: border-color 0.2s; }
.rol-select:focus { border-color: #9584c4; }
.btn-save { background: #333; color: white; border: none; padding: 16px; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 1.05rem; transition: background 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.btn-save:hover { background: #222; }

.fade-in { animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
</style>
