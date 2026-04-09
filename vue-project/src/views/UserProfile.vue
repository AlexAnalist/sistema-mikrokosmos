<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TheHeader from '@/components/TheHeader.vue'
import TheSidebar from '@/components/TheSideBar.vue'
import TheFooter from '@/components/TheFooter.vue'

// --- ESTADOS ---
const sidebarExpandido = ref(true)
const cargando = ref(true)
const usuario = ref<any>(null)
const router = useRouter()

// Datos de conexión (Asegúrate de usar tus variables de entorno)
const supabaseUrl = 'https://qqzqtxfykfmauujsqgoy.supabase.co'
const supabaseKey = 'sb_publishable_URWKs3wjsKY0qg-GvXbHjg_CeLMSw25'

const toggleSidebar = () => {
  sidebarExpandido.value = !sidebarExpandido.value
}

// --- LÓGICA DE SUPABASE ---
const verificarSesion = async () => {
  try {
    cargando.value = true
    
    // En Supabase Auth con REST, la sesión suele persistir en localStorage bajo 'sb-token'
    // Pero lo ideal es usar el cliente oficial. Aquí simulamos la validación:
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token') || ''}`, 
      }
    })

    if (!res.ok) {
      // Si no hay sesión válida, redirigir al login
      router.push('/login')
      return
    }

    usuario.value = await res.json()
  } catch (error) {
    console.error("Error de autenticación:", error)
  } finally {
    cargando.value = false
  }
}

const handleLogout = async () => {
  // Lógica para limpiar el storage y redirigir
  localStorage.removeItem('supabase.auth.token')
  router.push('/login')
}

onMounted(() => {
  verificarSesion()
})
</script>

<template>
  <div class="page-layout">
    <TheHeader />

    <div class="main-wrapper">
      <TheSidebar :is-open="sidebarExpandido" @toggle-menu="toggleSidebar" />

      <main class="content-area">
        <div v-if="cargando" class="loader-container">
          <div class="spinner"></div>
        </div>

        <div v-else class="profile-main-container">
          <h1 class="title">Mi cuenta</h1>

          <div class="profile-card">
            <div class="avatar-wrapper">
              <img 
                :src="usuario?.user_metadata?.avatar_url || 'https://www.mclaren.com/racing/team/oscar-piastri/assets/oscar-piastri.jpg'" 
                class="profile-img" 
              />
            </div>

            <h2 class="user-role">Gestor de Ventas</h2>
            <p class="user-email">{{ usuario?.email }}</p>

            <div class="options-list">
              <button class="btn-menu">Mis pedidos</button>
              <button class="btn-menu">Datos personales</button>
              <button class="btn-menu">Direcciones de envío</button>
              <button class="btn-menu">Módulo de pedidos</button>
              
              <button @click="handleLogout" class="btn-logout">Cerrar sesión</button>
            </div>
          </div>
        </div>
      </main>
    </div>

    <TheFooter />
  </div>
</template>

<style scoped>
/* Estructura heredada de tu ejemplo */
.page-layout { display: flex; flex-direction: column; height: 100vh; }
.main-wrapper { display: flex; flex: 1; overflow: hidden; }

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-left: 2px solid #00BFFF; /* El borde cian que tienes */
  background-color: #fff;
  overflow-y: auto;
  align-items: center; /* Centra el perfil horizontalmente */
  padding: 40px 20px;
}

/* Spinner (Igual al tuyo) */
.loader-container { flex: 1; display: flex; align-items: center; justify-content: center; }
.spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #6A5ACD; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* Estilos específicos de la Cuenta */
.profile-main-container {
  width: 100%;
  max-width: 450px;
  text-align: center;
  font-family: 'Playfair Display', serif;
}

.title {
  font-size: 2.8rem;
  font-weight: normal;
  margin-bottom: 2rem;
  color: #333;
}

.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrapper {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #7e78d2;
  margin-bottom: 1rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.profile-img { width: 100%; height: 100%; object-fit: cover; }

.user-role { font-size: 1.6rem; font-weight: normal; margin: 0; }
.user-email { color: #888; margin-bottom: 2rem; }

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

/* Botones con el estilo morado de tu imagen */
.btn-menu {
  background-color: #8379c7;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-menu:hover { background-color: #6a61a8; }

.btn-logout {
  background-color: transparent;
  color: #8379c7;
  border: 1px solid #8379c7;
  padding: 12px;
  border-radius: 10px;
  margin-top: 10px;
  cursor: pointer;
}

.btn-logout:hover { background-color: #f8f7ff; }
</style>