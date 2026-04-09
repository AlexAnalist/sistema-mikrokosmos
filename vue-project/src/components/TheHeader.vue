<script setup lang="ts">
import { Search, ShoppingCart, UserCircle } from 'lucide-vue-next'
</script>

<template>
  <header class="main-header">
    <router-link to="/" class="logo-section">
      <img src="/assets/logo_tree.png" alt="Mikrokosmos Logo" class="logo-img" /> <h1 class="brand-name">Librería Mikrokosmos</h1>
    </router-link>
    
    <div class="search-bar">
      <input type="text" placeholder="Buscar..." />
      <Search class="icon search-icon" />
    </div>
    
    <div class="user-actions">
      <router-link to="/carrito" class="action-link">
        <ShoppingCart class="icon action-icon" />
      </router-link>
      <UserCircle class="icon action-icon" />
    </div>
  </header>
</template>

<style scoped>
.main-header {
  background-color: #6A5ACD; /* Color morado principal de Figma */
  color: white;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
}

.logo-section { display: flex; align-items: center; gap: 10px; cursor: pointer; text-decoration: none; color: inherit; }
.logo-img { height: 40px; }
.brand-name { font-size: 1.5rem; font-weight: bold; margin: 0; }

.search-bar {
  display: flex;
  align-items: center;
  flex: 0 1 40%;
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
}

.search-icon {
  color: #6A5ACD; /* Morado para el icono de búsqueda */
  margin-left: 5px;
}

.user-actions { display: flex; gap: 20px; align-items: center; }
.icon { cursor: pointer; transition: color 0.3s, transform 0.3s; }
.icon:hover { color: #00BFFF; transform: scale(1.1); }
.action-icon { size: 24px; }
.action-link { color: inherit; text-decoration: none; display: flex; align-items: center; }
</style>