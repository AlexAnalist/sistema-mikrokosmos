<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import TheHeader from '@/components/TheHeader.vue'
import TheSidebar from '@/components/TheSideBar.vue'
import TheFooter from '@/components/TheFooter.vue'
import { useCartStore } from '@/stores/cart'
import { supabase } from '@/supabase'

const cartStore = useCartStore()

// --- ESTADOS ---
const sidebarExpandido = ref(true)
const cargando = ref(true)
const usuario = ref<any>(null)
const router = useRouter()

const toggleSidebar = () => {
  sidebarExpandido.value = !sidebarExpandido.value
}

// --- PERMISOS DE ROL ---
const userRole = computed(() => usuario.value?.rol?.toLowerCase() || '')

const canViewOrdersModule = computed(() => 
  ['gestor de ventas', 'gestor_de_ventas', 'administrador', 'admin', 'propietaria'].includes(userRole.value)
)
const canViewEditorModule = computed(() => 
  ['administrador', 'admin', 'propietaria'].includes(userRole.value)
)
const canViewStatsAndPermissions = computed(() => 
  ['propietaria'].includes(userRole.value)
)

// --- LÓGICA DE SESIÓN ---
const verificarSesion = async () => {
  try {
    cargando.value = true
    
    // 1. Intentar obtener sesión actual de Supabase Auth
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (session && !sessionError) {
      // Intentamos recuperar el id_usuario desde el localStorage primero 
      // para mapear correctamente con la tabla 'usuario' (integer PK)
      const userLocal = localStorage.getItem('mikrokosmos_user')
      const userId = userLocal ? JSON.parse(userLocal).id_usuario : null

      if (userId) {
        // Consultar datos adicionales en la tabla 'public.usuario' usando id_usuario
        const { data: userDb, error: dbError } = await supabase
          .from('usuario')
          .select('nombre, rol, foto_url')
          .eq('id_usuario', userId)
          .single()

        if (!dbError && userDb) {
          usuario.value = {
            ...session.user,
            nombre: userDb.nombre,
            rol: userDb.rol,
            foto_url: userDb.foto_url,
            correo: session.user.email
          }
          return // Éxito con Supabase
        }
      }
    }

    // 2. Si falló Supabase, intentar recuperación híbrida vía LocalStorage
    const userLocal = localStorage.getItem('mikrokosmos_user')
    
    if (userLocal) {
      const parsedUser = JSON.parse(userLocal)
      console.log("Recuperando sesión desde localStorage:", parsedUser)
      
      usuario.value = {
        ...parsedUser,
        nombre: parsedUser.nombre || 'Usuario',
        rol: parsedUser.rol || 'Cliente'
      }
      return // Éxito con LocalStorage
    }

    // 3. Solo si AMBOS fallan, redirigir al login
    console.error("No se encontró sesión en Auth ni LocalStorage")
    router.push('/login')

  } catch (error) {
    console.error("Error crítico al cargar perfil:", error)
    router.push('/login')
  } finally {
    cargando.value = false
  }
}

const handleLogout = async () => {
  // Limpiamos el storage y el carrito global
  localStorage.removeItem('mikrokosmos_user')
  cartStore.vaciarCarrito()
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
                :src="usuario?.foto_url || usuario?.user_metadata?.avatar_url || 'https://st3.depositphotos.com/6672868/13701/v/450/depositphotos_137014128-stock-illustration-user-profile-icon.jpg'" 
                class="profile-img" 
                alt=""
              />
            </div>

            <h2 class="user-role">{{ usuario?.nombre }}</h2>
            <p class="user-email">{{ usuario?.rol }}</p>

            <div class="options-list">
              <!-- Todos los roles ven estos dos -->
              <button @click="router.push('/mis-pedidos')" class="btn-menu">Mis pedidos</button>
              <button @click="router.push('/editar-perfil')" class="btn-menu">Datos personales</button>
              
              <!-- Gestor de ventas en adelante -->
              <button v-if="canViewOrdersModule" class="btn-menu">Módulo de pedidos</button>
              
              <!-- Administrador en adelante -->
              <button v-if="canViewEditorModule" class="btn-menu">Módulo de edición</button>

              <!-- Solo Propietaria -->
              <button v-if="canViewStatsAndPermissions" class="btn-menu">Estadísticas</button>
              <button v-if="canViewStatsAndPermissions" class="btn-menu">Permisos</button>
              
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