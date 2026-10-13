import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CartItem {
  id_producto: number
  titulo: string
  precio: number
  cantidad: number
  imagen_url: string
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  const totalItems = computed(() => {
    return items.value.reduce((total, item) => total + item.cantidad, 0)
  })

  const totalPrecio = computed(() => {
    return items.value.reduce((total, item) => total + (item.precio * item.cantidad), 0)
  })

  function agregarAlCarrito(producto: CartItem) {
    const itemExistente = items.value.find(item => item.id_producto === producto.id_producto)
    
    if (itemExistente) {
      itemExistente.cantidad += 1
    } else {
      items.value.push({ ...producto, cantidad: 1 })
    }
  }

  function eliminarDelCarrito(id: number) {
    items.value = items.value.filter(item => item.id_producto !== id)
  }

  function actualizarCantidad(id: number, delta: number) {
    const item = items.value.find(i => i.id_producto === id)
    if (item) {
      const nuevaCant = item.cantidad + delta
      if (nuevaCant > 0) {
        item.cantidad = nuevaCant
      }
    }
  }

  function vaciarCarrito() {
    items.value = []
  }

  return { 
    items, 
    totalItems, 
    totalPrecio, 
    agregarAlCarrito, 
    eliminarDelCarrito, 
    actualizarCantidad,
    vaciarCarrito 
  }
})
