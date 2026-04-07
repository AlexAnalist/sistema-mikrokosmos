<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { supabase } from './supabase'

// --- ESTADO (La lógica) ---
const estado = ref('Comprobando conexión...')
const nuevoLibro = ref('')
const listaLibros = ref<any[]>([])

async function obtenerLibros() {
  const { data, error } = await supabase.from('producto').select('*')
  if (error) {
    estado.value = "Error al conectar con Supabase"
  } else {
    estado.value = "✅ Conexión perfecta"
    listaLibros.value = data || []
  }
}

async function agregarLibro() {
  if (nuevoLibro.value.length < 3) return
  
  const { error } = await supabase
    .from('libros')
    .insert([{ titulo: nuevoLibro.value }])

  if (!error) {
    nuevoLibro.value = '' // Limpiar el campo
    obtenerLibros() // Recargar la lista
  }
}

onMounted(() => {
  obtenerLibros()
})
</script>

<template>
  <div class="container">
    <header>
      <h1>Mi Librería Digital 📚</h1>
      <p class="status">{{ estado }}</p>
    </header>

    <main>
      <section class="add-book">
        <input 
          v-model="nuevoLibro" 
          placeholder="Escribe el nombre de un libro..." 
          @keyup.enter="agregarLibro"
        />
        <button @click="agregarLibro">Añadir</button>
      </section>

      <section class="book-list">
        <h2>Tus Libros</h2>
        <ul>
          <li v-for="libro in listaLibros" :key="libro.id">
            <span>📖 {{ libro.titulo }}</span>
          </li>
        </ul>
        <p v-if="listaLibros.length === 0">Aún no hay libros. ¡Añade el primero!</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* --- ESTILOS (El diseño) --- */
.container {
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
  font-family: 'Segoe UI', sans-serif;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

header { text-align: center; margin-bottom: 30px; }
h1 { color: #2c3e50; }
.status { font-size: 0.8rem; color: #42b883; font-weight: bold; }

.add-book { display: flex; gap: 10px; margin-bottom: 30px; }

input {
  flex: 1;
  padding: 12px;
  border: 2px solid #eee;
  border-radius: 8px;
  outline: none;
}

input:focus { border-color: #42b883; }

button {
  padding: 10px 20px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

ul { list-style: none; padding: 0; }

li {
  background: #f8f9fa;
  margin-bottom: 10px;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  transition: transform 0.2s;
}

li:hover { transform: translateX(5px); }
</style>''