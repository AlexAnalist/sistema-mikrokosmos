<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRight, ChevronDown, Menu } from 'lucide-vue-next'

// Recibimos el estado del sidebar desde el padre
defineProps<{
  isOpen: boolean
}>()

// Definimos los eventos
const emit = defineEmits(['toggle-menu', 'filtrar'])

interface Seccion {
  nombre: string;
  abierto: boolean;
  opciones: string[];
}

// Estructura de datos completa (Géneros, Editoriales, etc.)
const secciones = ref<Seccion[]>([
  {
    nombre: 'Géneros',
    abierto: false,
    opciones: [
      'Romance', 'Fantasía', 'Romantasy', 'New Adult/Juveniles', 
      'Terror', 'Ciencia ficción', 'Clásicos', 'Literatura Universal',
      'Novelas gráficas/Comics', 'Infantiles', 'No ficción', 
      'Investigación y Negocios', 'Crecimiento personal'
    ]
  },
  { 
    nombre: 'Editoriales', 
    abierto: false, 
    opciones: [
      'Alfaguara', 'Booket', 'Contraluz', 'Crossbooks', 'Editorial Hidra',
      'Molino', 'Nova', 'Penguin', 'Planeta', 'Salamandra', 'Sello Wattpad', 'Urano'
    ] 
  },
  { nombre: 'Sagas/Estuches', abierto: false, opciones: ['Sagas completas', 'Estuches regalo'] },
  { nombre: 'Accesorios literarios', abierto: false, opciones: ['Papelería', 'Velas', 'Complementos'] },
  { nombre: 'Club Mikrokosmos', abierto: false, opciones: ['Información', 'Inscribirse'] }
])

const toggleSeccion = (index: number) => {
  if (secciones.value[index]) {
    secciones.value[index].abierto = !secciones.value[index].abierto
  }
}
</script>

<template>
  <div class="sidebar-wrapper">
    <div class="hamburger-fixed-box" @click="emit('toggle-menu')">
      <Menu class="hamburger-icon" />
    </div>

    <aside class="sidebar-content" :class="{ 'closed': !isOpen }">
      <nav class="menu-nav">
        <ul>
          <li v-for="(seccion, index) in secciones" :key="index" class="menu-block">
            <div class="menu-item" @click="toggleSeccion(index)">
              <span>{{ seccion.nombre }}</span>
              <component :is="seccion.abierto ? ChevronDown : ChevronRight" class="arrow-icon" />
            </div>

            <ul v-if="seccion.abierto" class="submenu">
              <li 
                v-for="opcion in seccion.opciones" 
                :key="opcion" 
                class="submenu-item"
                @click="emit('filtrar', { categoria: seccion.nombre, valor: opcion })"
              >
                {{ opcion }}
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </aside>
  </div>
</template>

<style scoped>
.sidebar-wrapper {
  position: relative;
  height: 100%;
  display: flex;
}

/* --- ESTILOS HAMBURGUESA FIJA (FUNCIONALIDAD) --- */
.hamburger-fixed-box {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hamburger-icon {
  width: 100%;
  height: 100%;
  color: #6A5ACD; /* Morado original */
}

/* --- ESTILOS CONTENIDO (DISEÑO RESTAURADO) --- */
.sidebar-content {
  width: 280px;
  background-color: #F5F5F5; /* Gris muy claro solicitado */
  border-right: 1px solid #E0E0E0; /* Borde sutil gris */
  padding-top: 70px; /* Espacio para que no tape la hamburguesa */
  transition: width 0.3s ease, transform 0.3s ease;
  overflow-x: hidden;
  height: 100%;
}

.sidebar-content.closed {
  width: 0;
  transform: translateX(-100%);
}

.menu-nav {
  width: 280px; /* Ancho interno fijo */
}

.menu-nav ul {
  padding: 0;
  margin: 0;
  list-style: none;
}

.menu-block {
  width: 100%;
  margin-bottom: 5px; /* Separación entre bloques morados */
}

/* BLOQUE MORADO ANTERIOR: Ocupa todo el ancho */
.menu-item {
  width: 100%;
  background-color: #6A5ACD;
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  box-sizing: border-box;
  font-weight: 500;
}

/* SUBMENÚ: Forzamos la sangría con mayor especificidad para ganar al reset global */
.menu-nav ul.submenu {
  background-color: #F5F5F5;
  padding: 10px 20px 15px 50px; 
  display: block;
}

/* EFECTO HOVER RESTAURADO */
.submenu-item {
  padding: 8px 0;
  font-family: 'Georgia', serif; /* Tipografía serif de tu diseño */
  color: #333; /* Color negro/gris original */
  font-size: 0.95rem;
  cursor: pointer;
  transition: color 0.2s; /* Transición suave para el hover */
}

/* Hover: El texto cambia al morado corporativo */
.submenu-item:hover {
  color: #6A5ACD;
}

.arrow-icon {
  width: 18px;
  height: 18px;
}
</style>