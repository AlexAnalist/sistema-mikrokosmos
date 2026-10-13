<!-- ============================================== -->
<!-- Template: Estructura HTML y componentes visuales -->
<!-- ============================================== -->
<template>
  <div class="login-page">
    
    <!-- Título fuera de la tarjeta con estilo requerido -->
    <h1 class="main-title">Bienvenido a tu universo de libros</h1>

    <!-- Contenedor glass-card con los filtros y forma indicados -->
    <div class="glass-card">
      <form @submit.prevent="login" class="auth-form">
        
        <!-- Campos de entrada reutilizables ubicados en common -->
        <AuthInput 
          label="Correo" 
          placeholder="Correo" 
          type="email" 
          icon="🗑️" 
          v-model="email"
        />
        
        <AuthInput 
          label="Contraseña" 
          placeholder="Contraseña" 
          type="password" 
          icon="👁️" 
          v-model="password"
        />
        
        <!-- Botón principal (Usa el color exacto solicitado en el CSS de abajo) -->
        <button type="submit" class="primary-btn">Iniciar sesión</button>
        
        <div class="divider">
          <span>o continuar con</span>
        </div>
        
        <!-- Botón de proveedor alternativo -->
        <button type="button" class="google-btn" @click="sign_google">
          <strong>G</strong>
        </button>
        
        <!-- Botón secundario -->
        <RouterLink to="/register" class="secondary-btn" style="text-decoration: none; display: flex; align-items: center; justify-content: center; width: 200px; padding: 10px 0; font-family: inherit;">Crear una nueva cuenta</RouterLink>

      </form>
      
      <!-- Enlace para recuperar contraseña -->
      <RouterLink to="/recuperar" class="forgot-link">¿Olvidaste tu contraseña?</RouterLink>

    </div>
  </div>
</template>

<!-- ============================================== -->
<!-- Script: Lógica y conexión con base de datos    -->
<!-- ============================================== -->
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import AuthInput from '@/components/AuthInput.vue'
import { supabase } from '@/supabase'

// Estado reactivo para los inputs
const router = useRouter()
const email = ref('')
const password = ref('')

// Función estricta para el login con Google
const sign_google = async () => {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
  if (error) {
    console.error("Error en autenticación con Google:", error.message)
  }
}

// Función encargada del inicio de sesión por correo (ya existía)
const login = async () => {
  // Consultamos tu tabla 'usuario' manual
  const { data, error } = await supabase
    .from('usuario')
    .select('*')
    .eq('correo', email.value)
    .eq('clave', password.value)
    .single()

  if (error || !data) {
    alert("Datos incorrectos en la tabla. Verifica correo y clave.");
  } else {
    console.log("¡Usuario encontrado en la tabla!", data);
    // Guardamos el usuario en localStorage para que otras vistas lo reconozcan
    localStorage.setItem('mikrokosmos_user', JSON.stringify(data));
    router.push({ name: 'home' })
  }
}
</script>


<!-- ============================================== -->
<!-- Style: Diseño estricto de la vista (Scoped)    -->
<!-- ============================================== -->
<style scoped>
/* 1. Importación de la fuente solicitada: Hina Mincho serif */
@import url('https://fonts.googleapis.com/css2?family=Hina+Mincho&display=swap');

/* Regla del root de la vista: aplica la tipografía general y el fondo */
.login-page {
  /* Tipografía base Hina Mincho */
  font-family: 'Hina Mincho', serif;
  
  min-height: 100vh;
  display: flex;
  flex-direction: column; /* Organiza elementos de arriba hacia abajo para dejar el título por fuera */
  align-items: center;
  justify-content: center;
  
  /* Imagen de fondo /fondo-estrellas.jpg solicitada */
  background-image: url('/fondo-estrellas.jpg');
  background-repeat: no-repeat;
  background-position: center bottom;
  background-size: cover;
  
  /* Fallback y ajuste opcional para scrolls en pantallas chicas */
  background-attachment: fixed;
  background-color: #28104e; 
  padding: 20px;
}

/* Título principal movido arriba de la card */
.main-title {
  /* 1. Evitamos que se estire a lo ancho. 
     Fijamos un ancho máximo para que la frase se quiebre en dos líneas automáticamente. 
     Ajusta este número (ej: 400px o 500px) para controlar dónde se corta la frase. */
max-width: 300px; 
 /* 2. Centramos el bloque del título horizontalmente si el contenedor principal lo permite */
margin-left: auto;
margin-right: auto;
 
 /* 3. Confirmamos la tipografía y estética */
color: rgba(255, 255, 255, 1); /* 100% de opacidad, blanco sólido */
font-family: 'Hina Mincho', serif; /* Nos aseguramos que hereda o usa la fuente */
font-size: 2.2rem;
font-weight: 400;
text-align: center;
margin-bottom: 2rem;
line-height: 1.2;
 
/* 4. Añadimos una sombra de texto sutil para mejorar legibilidad contra el fondo estrellado */
text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}

/* El Glass-Card exactamente con las reglas especificadas */
.glass-card {
  /* Dimensiones exactas de tu Figma */
  width: 280px;
  height: 470px;
  
  /* Manteniendo el estilo visual */
  background: rgba(221, 219, 235, 0.45);
  border: none;
  border-radius: 9.9px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  /* Centrado de contenido */
  display: flex;
  flex-direction: column;
  justify-content: center; /* Centra verticalmente los elementos internos */
  align-items: center;
  
  /* Espaciado interno */
  padding: 2rem;
  
  /* Asegura que nada se salga si la pantalla es muy pequeña */
  /*max-width: 95vw; 
  max-height: 90vh;
  overflow-y: auto;*/
}

/* Contenedor del formulario */
.auth-form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Mismo color para ambos botones: Violeta exacto #776CBE */
.primary-btn, .secondary-btn {
  background-color: #776CBE;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  
  /* CAMBIO: Reduce el ancho aquí */
  width: 200px; /* Prueba con 180px o 200px */
  padding: 10px 0; /* Ajusta el alto interno */
  
  font-family: inherit;
  font-size: 1.1rem;
  margin-top: 10px;
}

.primary-btn {
  width: 50%;
  padding: 9px 5px;
  font-size: 1.1rem;
  margin-top: 10px;
}

.secondary-btn {
  padding: 10px 24px;
  font-size: 1rem;
  margin-bottom: 1.5rem;
}

.primary-btn:hover, .secondary-btn:hover {
  opacity: 0.85; /* Ligero efecto al pasar el cursor */
}

/* Línea separadora */
.divider {
  display: flex;
  align-items: center;
  width: 100%;
  margin: 1.5rem 0;
  color: rgba(0, 0, 0, 0.9);
  font-size: 1rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid rgba(0, 0, 0, 0.5);
  margin: 0 10px;
}

/* Botón de login con Google */
.google-btn {
  background: #5c6bc0;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 1.5rem;
  font-family: sans-serif;
}

/* Enlace a contraseña olvidada */
.forgot-link {
  color: rgba(0, 0, 0, 1); 
  font-size: 0.95rem;
  text-decoration: none;
  font-family: inherit;
}

.forgot-link:hover {
  text-decoration: underline;
  color: #000;
}
</style>
