<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
const guardando = ref(false)

const usuarioId = ref<number | null>(null)
const fotoSeleccionada = ref<File | null>(null)
const fotoPreview = ref<string | null>(null)

// Datos reactivos del formulario (Sincronizados con el SQL REAL de la tabla usuario)
const form = ref({
  nombre: '',
  direccion_personal: '',
  n_telefonico: '',
  foto_url: ''
})

// Avatar por defecto si no hay foto_url ni preview
const defaultAvatar = 'https://st3.depositphotos.com/6672868/13701/v/450/depositphotos_137014128-stock-illustration-user-profile-icon.jpg'

/**
 * Carga los datos del usuario logueado desde Supabase
 */
const cargarDatos = async () => {
  try {
    cargando.value = true
    const userLocal = localStorage.getItem('mikrokosmos_user')
    
    if (!userLocal) {
      router.push('/login')
      return
    }

    const userParsed = JSON.parse(userLocal)
    // Se extrae id_usuario (el PK entero de tu tabla)
    usuarioId.value = userParsed.id_usuario

    if (!usuarioId.value) {
      console.error("No se encontró id_usuario en el localStorage")
      return
    }

    // Consulta real a la tabla public.usuario
    const { data, error } = await supabase
      .from('usuario')
      .select('nombre, direccion_personal, n_telefonico, foto_url')
      .eq('id_usuario', usuarioId.value)
      .single()

    if (error) throw error

    if (data) {
      form.value = {
        nombre: data.nombre ?? '',
        direccion_personal: data.direccion_personal ?? '',
        n_telefonico: data.n_telefonico ?? '',
        foto_url: data.foto_url ?? ''
      }
    }
  } catch (error) {
    console.error("Error al cargar datos del perfil:", error)
  } finally {
    cargando.value = false
  }
}

/**
 * Maneja la selección de archivo de imagen
 */
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    if (file) {
      fotoSeleccionada.value = file
      // Generar preview local
      fotoPreview.value = URL.createObjectURL(file)
    }
  }
}

/**
 * Dispara el input file oculto
 */
const triggerFileInput = () => {
  const fileInput = document.getElementById('avatar-input') as HTMLInputElement
  if (fileInput) fileInput.click()
}

/**
 * Sube la foto al bucket 'perfiles' y actualiza la tabla 'usuario'
 */
const guardarCambios = async () => {
  try {
    guardando.value = true
    let newFotoUrl = form.value.foto_url

    // 1. Subir imagen si hay una nueva seleccionada
    if (fotoSeleccionada.value && usuarioId.value) {
      // Detectamos la extensión real del archivo (png, jpg, webp, jpeg)
      const extension = fotoSeleccionada.value.name.split('.').pop()
      const fileName = `${usuarioId.value}.${extension}`
      
      const { error: uploadError } = await supabase
        .storage
        .from('perfiles')
        .upload(fileName, fotoSeleccionada.value, {
          upsert: true,
          cacheControl: '0'
        })
        
      if (uploadError) throw uploadError

      // Obtener la URL pública procesada por Supabase
      const { data: publicUrlData } = supabase
        .storage
        .from('perfiles')
        .getPublicUrl(fileName)
        
      if (publicUrlData?.publicUrl) {
        newFotoUrl = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`
      }
    }

    // 2. Update en la tabla 'usuario' (PK id_usuario, teléfono n_telefonico)
    const { error: updateError } = await supabase
      .from('usuario')
      .update({
        nombre: form.value.nombre,
        direccion_personal: form.value.direccion_personal,
        n_telefonico: form.value.n_telefonico,
        foto_url: newFotoUrl
      })
      .eq('id_usuario', usuarioId.value)

    if (updateError) throw updateError

    // 3. Sincronizar cambios en localStorage para persistencia visual inmediata
    const userLocal = localStorage.getItem('mikrokosmos_user')
    if (userLocal) {
      const parsedUser = JSON.parse(userLocal)
      parsedUser.nombre = form.value.nombre
      parsedUser.direccion_personal = form.value.direccion_personal
      parsedUser.n_telefonico = form.value.n_telefonico
      parsedUser.foto_url = newFotoUrl
      
      localStorage.setItem('mikrokosmos_user', JSON.stringify(parsedUser))
    }

    // Volver al perfil
    router.back()

  } catch (error: any) {
    console.error("Error al guardar perfil:", error)
    alert("Hubo un error al guardar los cambios: " + (error.message || "Error desconocido"))
  } finally {
    guardando.value = false
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  cargarDatos()
})
</script>

<template>
  <div class="page-layout">
    <TheHeader />

    <div class="main-wrapper">
      <TheSidebar :is-open="sidebarExpandido" @toggle-menu="toggleSidebar" />

      <main class="content-area">
        <div class="edit-profile-layout">
          <!-- Header Interno de la Vista de Edición -->
          <header class="inner-header">
            <button class="back-button" @click="goBack">
              <!-- SVG Flecha izquierda -->
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <h1 class="header-title">Editar perfil</h1>
            <div class="spacer"></div> <!-- Spacer para balancear -->
          </header>

          <main class="inner-content">
            <div v-if="cargando" class="loader-container">
              <div class="spinner"></div>
            </div>

            <div v-else class="form-container">
              
              <!-- Avatar Section -->
              <div class="avatar-section">
                <div class="avatar-wrapper">
                   <img 
                     :src="fotoPreview || form.foto_url || defaultAvatar" 
                     class="profile-img" 
                     alt=""
                   />
                </div>
                <button class="btn-text-blue" @click="triggerFileInput">
                  Editar foto o avatar
                </button>
                <!-- Input oculto -->
                <input 
                  type="file" 
                  id="avatar-input" 
                  accept="image/*" 
                  class="hidden-input" 
                  @change="handleFileSelect"
                />
              </div>

              <!-- Form Fields Section -->
              <div class="fields-section">
                
                <div class="input-group">
                  <label class="input-label">Nombre</label>
                  <input 
                    type="text" 
                    class="custom-input" 
                    v-model="form.nombre" 
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div class="input-group">
                  <label class="input-label">Dirección</label>
                  <input 
                    type="text" 
                    class="custom-input" 
                    v-model="form.direccion_personal" 
                    placeholder="Tu dirección"
                  />
                </div>

                <div class="input-group">
                  <label class="input-label">Teléfono</label>
                  <input 
                    type="tel" 
                    class="custom-input" 
                    v-model="form.n_telefonico" 
                    placeholder="Número de teléfono"
                  />
                </div>

              </div>

              <button 
                class="save-button" 
                @click="guardarCambios" 
                :disabled="guardando"
              >
                {{ guardando ? 'Guardando...' : 'Guardar' }}
              </button>

            </div>
          </main>
        </div>
      </main>
    </div>

    <TheFooter />
  </div>
</template>

<style scoped>
/* Estructura heredada del Dashboard */
.page-layout { display: flex; flex-direction: column; height: 100vh; }
.main-wrapper { display: flex; flex: 1; overflow: hidden; }

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  overflow-y: auto;
}

/* White Theme Contenedor Interno */
.edit-profile-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  background-color: #ffffff;
  color: #2D2D2D;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* Header Interno */
.inner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #EEEEEE;
  background-color: #ffffff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-button {
  background: transparent;
  border: none;
  color: #2D2D2D;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.back-button:hover {
  transform: translateX(-4px);
}

.header-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  color: #2D2D2D;
}

.spacer {
  width: 40px; /* Para equilibrar el ancho del botón back */
}

/* Content */
.inner-content {
  flex: 1;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form-container {
  width: 100%;
  max-width: 600px; /* Maximum width of the form, centered */
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Loader */
.loader-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #7e78d2; /* Mikrokosmos accent */
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }


/* Avatar Section */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.avatar-wrapper {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #f1f1f1;
  border: 3px solid #7e78d2; /* Light subtle border, accent color */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.profile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-text-blue {
  background: transparent;
  border: none;
  color: #7e78d2; /* Acento morado en lugar de azul IG */
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-text-blue:hover {
  text-decoration: underline;
}

.hidden-input {
  display: none;
}

/* Form Fields */
.fields-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 0.95rem;
  color: #555555;
  font-weight: 500;
  margin-left: 4px;
}

.custom-input {
  background-color: #ffffff;
  border: 1px solid #DDDDDD;
  color: #2D2D2D;
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s, background-color 0.2s, box-shadow 0.2s;
}

.custom-input:focus {
  border-color: #7e78d2; /* Acento Mikrokosmos */
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(126, 120, 210, 0.1);
}
.custom-input::placeholder {
  color: #A0A0A0;
}

/* Botón Guardar */
.save-button {
  background-color: #8379c7; /* Acento Mikrokosmos */
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 16px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 24px;
  transition: background-color 0.3s, transform 0.1s;
}

.save-button:hover {
  background-color: #6a61a8;
}

.save-button:active {
  transform: scale(0.98);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
