import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // Importamos el mapa que hicimos arriba

const app = createApp(App)

app.use(router) // Le decimos a Vue: "Usa el sistema de navegación"

app.mount('#app')