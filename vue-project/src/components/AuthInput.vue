<!-- ============================================== -->
<!-- Template: Input junto con su Etiqueta          -->
<!-- ============================================== -->
<template>
  <div class="input-container">
    <!-- Si pasamos un label por prop, lo mostramos -->
    <label v-if="label" class="input-label">{{ label }}</label>
    
    <!-- Contenedor del input y un posible icono a la derecha -->
    <div class="input-wrapper">
      <input 
        :type="type" 
        :placeholder="placeholder" 
        class="auth-input" 
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <span class="icon" v-if="icon">
        {{ icon }}
      </span>
    </div>
  </div>
</template>

<!-- ============================================== -->
<!-- Script: Control de propiedades                 -->
<!-- ============================================== -->
<script setup lang="ts">
// Propiedades (props) reutilizables para configurar cada input 
defineProps<{
  label?: string
  type?: string
  placeholder?: string
  icon?: string
  modelValue?: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<!-- ============================================== -->
<!-- Style: Apariencia del campo y herencia de font -->
<!-- ============================================== -->
<style scoped>
/* Contenedor completo (label + input) */
.input-container {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.2rem;
  width: 100%;
  align-items: flex-start;
}

/* El texto de arriba (Correo, Contraseña) hereda Hina Mincho */
.input-label {
  font-size: 18px;
  color: #000000;
  margin-bottom: 0.4rem;
  text-align: left;
  font-family: inherit; /* ← Se asegura de usar la tipografía del Padre */
}

/* Envoltura relativa para poder posicionar iconos absolute */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

/* Campo de texto (Input per se) hereda Hina Mincho */
.auth-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  padding-right: 2.5rem;
  border-radius: 8px;
  border: none;
  background-color: #fff;
  color: #333;
  font-size: 1rem;
  outline: none;
  font-family: inherit; /* ← Se asegura de usar la tipografía del Padre */
}

.auth-input::placeholder {
  color: #aaa;
}

/* Iconos de la derecha (Ojo, basurero, etc) */
.icon {
  position: absolute;
  right: 10px;
  color: #999;
  font-size: 1.2rem;
  cursor: pointer;
}
</style>
