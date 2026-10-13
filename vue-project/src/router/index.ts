import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import BookDetailView from '../views/BookDetailView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import CartView from '../views/CartView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import UserProfile from '../views/UserProfile.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { 
      path: '/libro/:id', 
      name: 'book-detail', 
      component: BookDetailView, 
      props: true 
    },
    { path: '/login', name: 'LogicaLogin', component: LoginView },
    { path: '/register', name: 'register', component: RegisterView },
    { path: '/recuperar', name: 'forgotPassword', component: ForgotPasswordView },
    { path: '/carrito', name: 'cart', component: CartView },
    { path: '/checkout', name: 'checkout', component: CheckoutView },
    { path: '/perfil', name: 'profile', component: UserProfile }, 
    { path: '/editar-perfil', name: 'edit-profile', component: () => import('../views/EditProfileView.vue') },
    { path: '/mis-pedidos', name: 'my-orders', component: () => import('../views/MyOrdersView.vue') },
    { path: '/mis-pedidos/:id', name: 'order-detail', component: () => import('../views/OrderDetailView.vue') },
    { path: '/propietario', name: 'propietario', component: () => import('../views/PropietarioMasterView.vue')},
    { path: '/gestor', name: 'gestor', component: () => import('../views/GestorMasterView.vue') },
    { path: '/admin/catalogo', name: 'admin-catalogo', component: () => import('../views/AdminCatalogView.vue') }
  ]
})

export default router
