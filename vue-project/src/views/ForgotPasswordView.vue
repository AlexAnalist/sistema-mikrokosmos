<template>
  <div class="login-page">
    <div class="glass-card">
      <form @submit.prevent="reset_password" class="auth-form">
        <AuthInput 
          label="Email" 
          placeholder="Correo" 
          type="email" 
          icon="🗑️" 
          v-model="email"
        />
        
        <div class="buttons-container">
          <RouterLink to="/login" class="cancel-link">Cancelar</RouterLink>
          <button type="submit" class="primary-btn">Recuperar contraseña</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AuthInput from '@/components/AuthInput.vue'
import { supabase } from '@/supabase'

const email = ref('')

const reset_password = async () => {
  if (!email.value) return;
  
  const { error } = await supabase.auth.resetPasswordForEmail(email.value)
  
  if (error) {
    console.error("Error al enviar recuperación:", error.message)
  } else {
    alert("¡Revisa tu universo de mensajes! Te enviamos un enlace de acceso")
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

.glass-card {
  width: 280px; 
  /* Auto permite que la tarjeta abrace el contenido pequeño sin estirarse a 470px */
  height: auto; 
  min-height: 180px; 
  
  background: rgba(221, 219, 235, 0.45);
  border: none;
  border-radius: 9.9px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  box-sizing: border-box;
}

.auth-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

:deep(.input-container) {
  margin-bottom: 1.5rem;
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
  font-size: 1rem;
}

.buttons-container {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  align-items: center;
  width: 100%;
  margin-top: 0.5rem;
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
  padding: 8px 12px;
  font-family: inherit;
  font-size: 0.95rem;
  transition: opacity 0.2s ease;
}

.primary-btn:hover {
  opacity: 0.85;
}
</style>
