import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue' // Asegúrate de que el nombre coincida

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    // Aquí irás añadiendo tus otras 39 rutas después
  ]
})

export default router