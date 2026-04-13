<template>
  <div class="login-page">
    <h1 class="main-title">Empieza en<br />Mikrokosmos</h1>

    <div class="glass-card">
      <!-- Banner de Notificación -->
      <transition name="fade">
        <div v-if="mensajeError" class="mikrokosmos-alert">
          {{ mensajeError }}
        </div>
      </transition>

      <form @submit.prevent="register" class="auth-form">
        
        <AuthInput 
          label="Email"
          v-model="email"
          placeholder="Correo" 
          type="email" 
          icon="🗑️" 
        />
        
        <AuthInput 
          label="Contraseña" 
          v-model="password"
          placeholder="Contraseña" 
          type="password" 
          icon="👁️" 
        />
        
        <AuthInput 
          label="Nombre" 
          v-model="nombre"
          placeholder="Nombre" 
          type="text" 
        />
        
        <div class="buttons-container">
          <RouterLink to="/login" class="cancel-link">Cancelar</RouterLink>
          <button type="submit" class="primary-btn">Registrarse</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthInput from '@/components/AuthInput.vue'
import { supabase } from '@/supabase'

const router = useRouter()

// 1. Agregamos las variables reactivas
const email = ref('')
const password = ref('')
const nombre = ref('')
const mensajeError = ref('')

const mostrarError = (msg: string) => {
  mensajeError.value = msg
  setTimeout(() => {
    mensajeError.value = ''
  }, 4000)
}

const register = async () => {
  // Validación simple antes de enviar
  if (!email.value || !password.value || !nombre.value) {
    mostrarError("Por favor, completa todos los campos, panita.")
    return
  }

  try {
    // 1. VALIDACIÓN PREVENTIVA (Frontend):
    const { data: usuarioExistente } = await supabase
      .from('usuario')
      .select('correo')
      .eq('correo', email.value)
      .maybeSingle()

    if (usuarioExistente) {
      mostrarError("¡Ups! Este correo ya está registrado en Mikrokosmos. Intenta iniciar sesión.")
      return
    }

    // 2. Registro en el motor de Autenticación de Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })

    if (authError) {
      // 3. MANEJO DE EXCEPCIONES (Backend):
      if (authError.message.includes('already registered') || authError.status === 422) {
        mostrarError("¡Ups! Este correo ya está registrado en Mikrokosmos. Intenta iniciar sesión.")
        return
      }
      throw authError
    }

    // 4. Si el usuario se creó bien, guardamos sus datos en la tabla 'usuario'
    if (authData.user) {
      const { error: dbError } = await supabase
        .from('usuario')
        .insert([
          { 
            correo: email.value, 
            nombre: nombre.value, 
            clave: password.value, 
            rol: 'cliente'         
          }
        ])

      // Manejo de error de base de datos (Unique Constraint)
      if (dbError) {
        if (dbError.code === '23505') {
          mostrarError("¡Ups! Este correo ya está registrado en Mikrokosmos. Intenta iniciar sesión.")
          return
        }
        throw dbError
      }

      router.push('/login') 
    }
  } catch (error: any) {
    mostrarError("Error: " + (error.message || "No se pudo completar el registro"))
    console.error(error)
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Hina+Mincho&display=swap');

.login-page {
  font-family: 'Hina Mincho', serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-image: url('/fondo-estrellas.jpg');
  background-repeat: no-repeat;
  background-position: center bottom;
  background-size: cover;
  background-attachment: fixed;
  background-color: #28104e;
  padding: 20px;
}

.main-title {
  max-width: 300px; 
  margin-left: auto;
  margin-right: auto;
  color: rgba(255, 255, 255, 1);
  font-family: inherit;
  font-size: 2.2rem;
  font-weight: 400;
  text-align: center;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}

.glass-card {
  /* Hacemos la tarjeta más ancha para que respiren los inputs */
  width: 360px;
  height: 470px;
  background: rgba(221, 219, 235, 0.45);
  border: none;
  border-radius: 9.9px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2.5rem; /* Un poco más de padding lateral para dar respiro */
  box-sizing: border-box;
}

.auth-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
}

:deep(.input-container) {
  margin-bottom: 1.25rem; /* Un poco más despegados verticalmente */
  align-items: stretch;
  width: 100%;
}

:deep(.input-label) {
  font-size: 18px;
  color: #000;
  text-align: left;
  font-family: 'Hina Mincho', serif;
  margin-bottom: 0.2rem;
}

:deep(.auth-input) {
  padding-left: 0.8rem;
  padding-top: 0.6rem;
  padding-bottom: 0.6rem;
  font-family: inherit;
  background: white;
  border-radius: 8px;
  border: none;
}

.buttons-container {
  display: flex;
  justify-content: center; /* Centramos los botones juntos */
  gap: 1.5rem; /* Espaciado fijo entre ellos para que se vean pegados pero definidos */
  align-items: center;
  width: 100%;
  margin-top: auto;
  padding-top: 1rem;
}

.cancel-link {
  color: rgba(0, 0, 0, 0.8);
  text-decoration: none;
  font-size: 1rem;
}

.primary-btn {
  background-color: #776CBE;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  padding: 8px 16px;
  font-family: inherit;
  font-size: 1rem;
  transition: opacity 0.2s ease;
}

.primary-btn:hover {
  opacity: 0.85;
}

/* Estilo de Alertas Mikrokosmos */
.mikrokosmos-alert {
  position: absolute;
  top: 20px;
  width: 90%;
  padding: 12px;
  background-color: #9584c4;
  color: white;
  text-align: center;
  border-radius: 8px;
  font-size: 0.9rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 100;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s, transform 0.5s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
