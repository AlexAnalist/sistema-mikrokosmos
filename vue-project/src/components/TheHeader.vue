<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ShoppingCart, UserCircle } from 'lucide-vue-next'
import { supabase } from '@/supabase'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()
const router = useRouter()
const haySesion = ref(false)

const searchQuery = ref('')
const sugerencias = ref<any[]>([])
const mostrarSugerencias = ref(false)
const suggestionsContainer = ref<HTMLElement | null>(null)

const buscarProductos = async () => {
  if (searchQuery.value.length < 2) {
    sugerencias.value = []
    return
  }

  const { data, error } = await supabase
    .from('producto')
    .select('id_productos, nombre, precio')
    .ilike('nombre', `%${searchQuery.value}%`)
    .limit(5)

  if (!error && data) {
    sugerencias.value = data
    mostrarSugerencias.value = true
  }
}

watch(searchQuery, () => {
  buscarProductos()
})

const irADetalle = (id: number) => {
  searchQuery.value = ''
  mostrarSugerencias.value = false
  router.push({ name: 'book-detail', params: { id } })
}

const handleClickOutside = (event: MouseEvent) => {
  if (suggestionsContainer.value && !suggestionsContainer.value.contains(event.target as Node)) {
    mostrarSugerencias.value = false
  }
}

const obtenerSesion = async () => {
  // 1. Verificamos sesión de Supabase Auth
  const { data } = await supabase.auth.getSession()
  if (data.session) return true

  // 2. Verificamos inicio de sesión manual en localStorage
  const userManual = localStorage.getItem('mikrokosmos_user')
  return !!userManual
}

const verificarSesion = async () => {
  haySesion.value = await obtenerSesion()
}

const irAlPerfil = async () => {
  const logueado = await obtenerSesion()
  if (logueado) {
    router.push('/perfil')
  } else {
    router.push('/login')
  }
}

onMounted(() => {
  verificarSesion()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <header class="main-header">
    <router-link to="/" class="logo-section">
      <img src="/assets/logo_tree.png" alt="Mikrokosmos Logo" class="logo-img" /> <h1 class="brand-name">Librería Mikrokosmos</h1>
    </router-link>
    
    <div class="search-container" ref="suggestionsContainer">
      <div class="search-bar">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Busca tus libros aquí..." 
          @focus="mostrarSugerencias = true"
        />
        <Search class="icon search-icon" />
      </div>

      <div v-if="mostrarSugerencias && sugerencias.length > 0" class="suggestions-list">
        <div 
          v-for="sug in sugerencias" 
          :key="sug.id_productos" 
          class="suggestion-item"
          @click="irADetalle(sug.id_productos)"
        >
          <span class="sug-name">{{ sug.nombre }}</span>
          <span class="sug-price">${{ sug.precio }}</span>
        </div>
      </div>
    </div>
    
    <div class="user-actions">
      <router-link to="/carrito" class="action-link cart-link">
        <ShoppingCart class="icon action-icon" />
        <span v-if="cartStore.totalItems > 0" class="cart-badge">{{ cartStore.totalItems }}</span>
      </router-link>
      <UserCircle 
        class="icon action-icon" 
        :class="{ 'is-active': haySesion }"
        @click="irAlPerfil" 
      />
    </div>
  </header>
</template>

<style scoped>
.main-header {
  background-color: #6A5ACD; /* Color morado principal de Figma */
  color: white;
  padding: 10px 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
}

.logo-section { display: flex; align-items: center; gap: 10px; cursor: pointer; text-decoration: none; color: inherit; }
.logo-img { height: 55px; }
.brand-name { font-size: 1.5rem; font-weight: bold; margin: 0; }

.search-container {
  flex: 0 1 40%;
  position: relative;
  z-index: 1000;
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 20px;
  padding: 0 15px;
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

.search-bar:focus-within {
  border-color: #00BFFF; /* Cian al hacer focus */
}

.search-bar input {
  width: 100%;
  padding: 10px 5px 10px 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 1rem;
}

.search-icon {
  color: #6A5ACD; /* Morado para el icono de búsqueda */
  margin-left: 5px;
}

.suggestions-list {
  position: absolute;
  top: 110%;
  left: 0;
  width: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  overflow: hidden;
  max-height: 300px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #333;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.suggestion-item:last-child { border-bottom: none; }
.suggestion-item:hover { background-color: #f7f7f7; }

.sug-name { font-family: 'Georgia', serif; font-size: 1.05rem; }
.sug-price { color: #6A5ACD; font-weight: bold; font-size: 0.9rem; }

.user-actions { display: flex; gap: 35px; align-items: center; }
.icon { cursor: pointer; transition: color 0.3s, transform 0.3s; }
.icon:hover, .icon.is-active { color: #00BFFF; }
.icon:hover { transform: scale(1.1); }
.icon.is-active { 
  filter: drop-shadow(0 0 5px rgba(0, 191, 255, 0.5));
}
.action-icon { width: 30px; height: 30px; }
.action-link { color: inherit; text-decoration: none; display: flex; align-items: center; }
.cart-link { position: relative; }
.cart-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #ff4d4d;
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 50%;
  min-width: 14px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
</style>