<script setup lang="ts">
import { Search, ShoppingCart, UserCircle } from 'lucide-vue-next'
</script>

<template>
  <header class="main-header">
    <div class="logo-section">
      <img src="/assets/logo_tree.png" alt="Mikrokosmos Logo" class="logo-img" /> <h1 class="brand-name">Librería Mikrokosmos</h1>
    </div>
    
    <div class="search-bar">
      <input type="text" placeholder="Value" />
      <Search class="icon search-icon" />
    </div>
    
    <div class="user-actions">
      <ShoppingCart class="icon action-icon" />
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

.logo-section { display: flex; align-items: center; gap: 10px; }
.logo-img { height: 40px; }
.brand-name { font-size: 1.5rem; font-weight: bold; margin: 0; }

.search-bar {
  position: relative;
  flex: 0 1 40%; /* Ancho de la barra de búsqueda */
}

.search-bar input {
  width: 100%;
  padding: 10px 40px 10px 15px;
  border-radius: 20px;
  border: none;
  outline: none;
}

.search-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #888;
}

.user-actions { display: flex; gap: 20px; }
.icon { cursor: pointer; }
.action-icon { size: 24px; }
</style>