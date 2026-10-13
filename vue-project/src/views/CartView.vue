<template>
  <div class="cart-page">
    <TheHeader />
    
    <div class="cart-content">
      
      <!-- Stepper Dinámico -->
      <div class="stepper-container">
        <div class="stepper">
          <!-- Paso 1 (🛒) -->
          <div class="step" :class="{ 'active': currentStep === 1, 'completed': currentStep === 2 }">
            <span class="step-icon">🛒</span>
          </div>
          <div class="step-line"></div>
          <!-- Paso 2 (ⓘ) -->
          <div class="step" :class="{ 'active': currentStep === 2, 'inactive': currentStep === 1 }">
            <span class="step-icon">ⓘ</span>
          </div>
        </div>
      </div>

      <!-- Línea divisora superior -->
      <div class="separator top-separator"></div>

      <!-- ============================================== -->
      <!-- ESTADO: CARRITO VACÍO                          -->
      <!-- ============================================== -->
      <div v-if="cartStore.items.length === 0" class="empty-cart-view">
        <div class="empty-left-column">
          <div class="left-text-wrapper">
            <p class="main-text">
              No tienes productos en tu carro de<br/>
              compras, ¿Todavía no encuentras lo<br/>
              que buscas?
            </p>
            <p class="sub-text">Búscalo aquí:</p>
            <RouterLink to="/" class="home-link">Ir a la página de inicio</RouterLink>
          </div>
        </div>
        
        <div class="cart-summary-column">
          <div class="summary-box">
            <h2 class="summary-card-title hina-mincho-font">Resumen de compra</h2>
            <div class="dashed-divider"></div>
            <div class="empty-resumen-placeholder">
              <span>(Ver resumen)</span>
            </div>
            <div class="dashed-divider"></div>
            <div class="summary-total-row">
              <strong>Total a pagar:</strong>
              <strong>$ 0.00</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- FLUJO CON PRODUCTOS (PASO 1 y PASO 2)          -->
      <!-- ============================================== -->
      <div v-else class="cart-flow-container">
        
        <!-- Layout a dos columnas compartido -->
        <div class="main-split-layout">
          
          <!-- COLUMNA IZQUIERDA DINÁMICA -->
          <div class="left-dynamic-column">
            
            <!-- PASO 1: Lista de Items -->
            <div v-if="currentStep === 1" class="cart-items-column">
              <h2 class="column-title">Tus productos</h2>
              <div v-for="item in cartStore.items" :key="item.id_producto" class="item-card">
                <img :src="item.imagen_url" alt="Portada del libro" class="cart-item-image" />
                <div class="item-info">
                  <p><strong>Título:</strong> {{ item.titulo }}</p>
                  <p><strong>Precio:</strong> ${{ item.precio.toFixed(2) }}</p>
                  
                  <div class="quantity-actions">
                    <span>Cantidad: </span>
                    <button @click="updateQuantity(item.id_producto, -1)" class="qty-btn">-</button>
                    <span>{{ item.cantidad }}</span>
                    <button @click="updateQuantity(item.id_producto, 1)" class="qty-btn">+</button>
                    <button @click="removeItem(item.id_producto)" class="delete-btn">🗑️ Eliminar</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- PASO 2: Formulario de Envío -->
            <div v-else-if="currentStep === 2" class="checkout-form-column">
              <h3 class="delivery-title">Tipo de entrega</h3>
              
              <div class="delivery-type-row">
                <div class="delivery-type-options">
                  <label class="radio-label">
                    <input type="radio" v-model="deliveryType" value="local" /> Entrega local
                  </label>
                  <label class="radio-label">
                    <input type="radio" v-model="deliveryType" value="nacional" /> Envio nacional
                  </label>
                </div>

                <div class="autofill-mini-container">
                  <button @click.prevent="fetchUltimaEntrega" class="btn-autofill-mini" :disabled="isFetchingUltimaEntrega">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span>{{ isFetchingUltimaEntrega ? 'Buscando...' : 'Reutilizar última dirección' }}</span>
                  </button>
                  <transition name="fade">
                    <p v-if="mensajeFetch" class="fetch-message-mini">{{ mensajeFetch }}</p>
                  </transition>
                </div>
              </div>
              
              <div class="delivery-container">
                <div class="delivery-header">
                  <h4 class="delivery-box-title">Dirección de envío.</h4>
                  <p class="delivery-box-subtitle">Recibe tu pedido en cualquier dirección del pais.</p>
                </div>
                
                <div class="delivery-body">
                  <div v-if="!deliveryType" class="unselected-state">
                    <p>Seleccione un Tipo de entrega.</p>
                  </div>
                  
                  <div v-else class="shipping-form">
                    
                    <!-- OPCIÓN: ENTREGA LOCAL -->
                    <div v-if="deliveryType === 'local'" class="local-layout">
                      <div class="sub-radio-group">
                        <label class="sub-radio-label hina-mincho-font">
                          <input type="radio" v-model="localOption" value="sede" class="custom-radio" /> Recoger en la sede principal.
                        </label>
                        <label class="sub-radio-label hina-mincho-font">
                          <input type="radio" v-model="localOption" value="delivery" class="custom-radio" /> Delivery en la ciudad.
                        </label>
                      </div>

                      <div class="form-group-custom">
                        <label class="input-label-local hina-mincho-font">Dirección</label>
                        <input 
                          type="text" 
                          class="form-input-flat" 
                          placeholder="Dirección" 
                          v-model="formData.direccion" 
                          :readonly="localOption === 'sede'"
                        />
                      </div>

                      <div class="type-display">
                        <h2 class="hina-mincho-font">Tipo Envio: Local.</h2>
                      </div>
                    </div>

                    <!-- OPCIÓN: ENVIO NACIONAL -->
                    <div v-else class="national-layout">
                      <div class="form-group-custom">
                        <label class="input-label-local hina-mincho-font">Empresa de envios</label>
                        <select v-model="formDataNational.empresa" class="form-select-purple hina-mincho-font">
                          <option value="" disabled selected>Empresa</option>
                          <option value="mrw">MRW</option>
                          <option value="zoom">Zoom</option>
                          <option value="tealca">Tealca</option>
                          <option value="domesa">Domesa</option>
                        </select>
                      </div>

                      <div class="form-group-custom">
                        <label class="input-label-local hina-mincho-font">Estado</label>
                        <select v-model="formDataNational.estado" class="form-select-purple hina-mincho-font">
                          <option value="" disabled selected>Estado</option>
                          <option v-for="estado in estadosVenezuela" :key="estado" :value="estado">{{ estado }}</option>
                        </select>
                      </div>

                      <div class="form-group-custom">
                        <label class="input-label-local hina-mincho-font">Ciudad</label>
                        <select v-model="formDataNational.ciudad" class="form-select-purple hina-mincho-font">
                          <option value="" disabled selected>Ciudad</option>
                          <option v-for="ciudad in ciudadesFiltradas" :key="ciudad" :value="ciudad">{{ ciudad }}</option>
                        </select>
                        <!-- Si no hay estado seleccionado, se muestra un select vacío o un mensaje -->
                        <p v-if="!formDataNational.estado" class="hina-mincho-font hint-text">Selecciona un estado primero</p>
                      </div>

                      <div class="form-group-custom">
                        <label class="input-label-local hina-mincho-font">Dirección</label>
                        <input type="text" class="form-input-flat" placeholder="Dirección de la agencia" v-model="formDataNational.direccionAgencia" />
                      </div>

                      <div class="type-display">
                        <h2 class="hina-mincho-font">Tipo Envio: Nacional.</h2>
                      </div>
                    </div>

                  </div>
                </div>
                
                <div class="delivery-footer">
                  <button @click="currentStep = 1" class="back-link-icon" title="Volver al carrito">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 14L4 9L9 4" stroke="black" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M4 9H14.5C17.5376 9 20 11.4624 20 14.5V16" stroke="black" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <button class="btn-primary" :disabled="!isFormValid || isProcessing" @click="processDelivery">
                    {{ isProcessing ? 'Procesando...' : 'Enviar Aquí' }}
                  </button>
                  <button class="btn-outline" @click="currentStep = 1">Volver</button>
                </div>
              </div>
            </div>

          </div>

          <!-- COLUMNA DERECHA COMPARTIDA: Ticket de Resumen -->
          <div class="cart-summary-column">
            <div class="summary-box" :class="{ 'sticky-ticket': currentStep === 2 }">
              <h2 class="summary-card-title hina-mincho-font">Resumen de compra</h2>
              <div class="dashed-divider"></div>
              
              <div class="summary-items-list">
                <div v-for="item in cartStore.items" :key="'sum-'+item.id_producto" class="summary-row">
                  <span>{{ item.titulo }} (x{{ item.cantidad }})</span>
                  <span>${{ (item.precio * item.cantidad).toFixed(2) }}</span>
                </div>
              </div>
              
              <div class="dashed-divider"></div>
              <div class="summary-total-row">
                <strong>Total a pagar:</strong>
                <strong>$ {{ cartStore.totalPrecio.toFixed(2) }}</strong>
              </div>
            </div>
          </div>

        </div>

        <!-- FOOTER DEL PASO 1 (Solo visible en el carrito) -->
        <div v-if="currentStep === 1" class="bottom-section">
          <div class="separator"></div>
          <div class="summary-footer">
            <div class="total-text">
              <span class="subtotal-label">SubTotal</span>
              <span class="total-numbers">$ {{ cartStore.totalPrecio.toFixed(0) }}</span>
            </div>
            <div class="actions-wrapper">
              <RouterLink to="/" class="back-arrow" title="Regresar al catálogo">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 14 4 9l5-5"/>
                  <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v1.5"/>
                </svg>
              </RouterLink>
              <button class="continue-btn" :disabled="cartStore.items.length === 0" @click="currentStep = 2">Continuar</button>
            </div>
          </div>
        </div>

      </div>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import TheHeader from '@/components/TheHeader.vue'
import { useCartStore } from '@/stores/cart'
import { supabase } from '@/supabase'

const cartStore = useCartStore()
const router = useRouter()

export interface CartItem {
  id: string
  title: string
  price: number
  quantity: number
}

// Variables Globales del Flow
const currentStep = ref(1) // 1 = Carrito, 2 = Formulario de Envío
const deliveryType = ref('local')
const localOption = ref('sede')
const isProcessing = ref(false)
const formData = ref({ direccion: 'Sede principal' })

// Watcher para automatizar la dirección
watch(localOption, (newVal) => {
  if (newVal === 'sede') {
    formData.value.direccion = 'Sede principal'
  } else {
    formData.value.direccion = ''
  }
})

// Datos para Envío Nacional
const formDataNational = ref({
  empresa: '',
  estado: '',
  ciudad: '',
  direccionAgencia: ''
})

const estadosVenezuela = [
  "Amazonas", "Anzoátegui", "Apure", "Aragua", "Barinas", "Bolívar", "Carabobo", 
  "Cojedes", "Delta Amacuro", "Falcón", "Guárico", "Lara", "Mérida", "Miranda", 
  "Monagas", "Nueva Esparta", "Portuguesa", "Sucre", "Trujillo", 
  "La Guaira", "Yaracuy", "Zulia", "Distrito Capital"
]

// Diccionario simplificado de ciudades
const ciudadesPorEstado: Record<string, string[]> = {
  "Distrito Capital": ["Caracas"],
  "Zulia": ["Maracaibo", "Cabimas", "Ciudad Ojeda"],
  "Carabobo": ["Valencia", "Puerto Cabello", "Guacara"],
  "Aragua": ["Maracay", "Turmero", "La Victoria"],
  "Lara": ["Barquisimeto", "Cabudare"],
  "Anzoátegui": ["Barcelona", "Puerto La Cruz", "Lechería", "El Tigre"],
  "Bolívar": ["Ciudad Guayana", "Ciudad Bolívar"],
  "Miranda": ["Los Teques", "Guarenas", "Guatire"],
  "Mérida": ["Mérida", "El Vigía"],
  "Nueva Esparta": ["Porlamar", "La Asunción"]
  // Se pueden añadir más según sea necesario
}

const ciudadesFiltradas = computed(() => {
  if (!formDataNational.value.estado) return []
  return ciudadesPorEstado[formDataNational.value.estado] || ["Cualquier ciudad"]
})

const isFetchingUltimaEntrega = ref(false)
const mensajeFetch = ref('')

const fetchUltimaEntrega = async () => {
  isFetchingUltimaEntrega.value = true;
  mensajeFetch.value = '';

  const clearMessage = () => {
    setTimeout(() => { mensajeFetch.value = '' }, 2000); // 2 segundos según instrucción
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userManual = JSON.parse(localStorage.getItem('mikrokosmos_user') || '{}');
    
    let userId = userManual.id_usuario;
    if (!userId && session?.user?.email) {
      const { data: userData } = await supabase
        .from('usuario')
        .select('id_usuario')
        .eq('correo', session.user.email)
        .single();
      userId = userData?.id_usuario;
    }

    if (!userId) {
      mensajeFetch.value = 'Inicia sesión primero';
      clearMessage();
      return;
    }

    // PASO 1 (ID Pedido): .maybeSingle() para evitar 406 en pedidos también
    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedido')
      .select('id_pedido')
      .eq('id_usuario', userId)
      .order('id_pedido', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pedidoError || !pedidoData) {
      mensajeFetch.value = 'No hay historial disponible';
      clearMessage();
      return;
    }

    // PASO 2 (Consulta Plana): Sin order() ni limit()
    const { data: entregaData, error: entregaError } = await supabase
      .from('entrega')
      .select('*')
      .eq('id_pedido', pedidoData.id_pedido)
      .maybeSingle();

    if (entregaError || !entregaData) {
      mensajeFetch.value = 'No hay historial disponible';
      clearMessage();
    } else {
      const { 
        tipo_entrega, 
        direccion_envio, 
        empresa_envio, 
        estado_envio_nacional, 
        ciudad_envio,
        tipo_direccion_envio
      } = entregaData;
      
      if (tipo_entrega === 'Local') {
        deliveryType.value = 'local';
        
        // Mapeo tipo_direccion_envio ('Recoger en sede' -> 'sede' / 'Delivery' -> 'delivery')
        if (tipo_direccion_envio && tipo_direccion_envio.toLowerCase().includes('sede')) {
          localOption.value = 'sede';
        } else {
          localOption.value = 'delivery';
        }
        
        // Campo de texto
        formData.value.direccion = direccion_envio || '';
        
      } else if (tipo_entrega === 'Nacional') {
        deliveryType.value = 'nacional';
        
        // Selectores
        if (empresa_envio) formDataNational.value.empresa = empresa_envio.toLowerCase();
        if (estado_envio_nacional) formDataNational.value.estado = estado_envio_nacional;
        if (ciudad_envio) formDataNational.value.ciudad = ciudad_envio;
        
        // Campo de texto
        formDataNational.value.direccionAgencia = direccion_envio || '';
      }
      
      mensajeFetch.value = '¡Datos aplicados!';
      clearMessage();
    }
  } catch (error) {
    console.error("Error al obtener la última entrega:", error);
    mensajeFetch.value = 'No hay historial disponible';
    clearMessage();
  } finally {
    isFetchingUltimaEntrega.value = false;
  }
};

const isFormValid = computed(() => {
  if (deliveryType.value === 'local') {
    return !!formData.value.direccion && !!localOption.value
  } else if (deliveryType.value === 'nacional') {
    return !!formDataNational.value.empresa && 
           !!formDataNational.value.estado && 
           !!formDataNational.value.ciudad && 
           !!formDataNational.value.direccionAgencia
  }
  return false
})

const processDelivery = () => {
  isProcessing.value = true
  
  // 1. Construir el mensaje para WhatsApp
  let message = "¡Hola Mikrokosmos! 📚⚡\n\nQuiero realizar un pedido con los siguientes detalles:\n\n"
  
  // Detalles de Envío
  if (deliveryType.value === 'local') {
    message += "*Tipo de Entrega:* Entrega Local 🏠\n"
    message += `*Opción:* ${localOption.value === 'sede' ? 'Recoger en sede' : 'Delivery en la ciudad'}\n`
    message += `*Dirección:* ${formData.value.direccion || 'No especificada'}\n`
  } else {
    message += "*Tipo de Entrega:* Envío Nacional 🚚\n"
    message += `*Empresa:* ${formDataNational.value.empresa.toUpperCase() || 'Sin especificar'}\n`
    message += `*Estado:* ${formDataNational.value.estado || 'Sin especificar'}\n`
    message += `*Ciudad:* ${formDataNational.value.ciudad || 'Sin especificar'}\n`
    message += `*Agencia:* ${formDataNational.value.direccionAgencia || 'Sin especificar'}\n`
  }

  message += "\n*Resumen del Pedido:* 🛒\n"
  cartStore.items.forEach(item => {
    message += `- ${item.titulo} (x${item.cantidad}): $${(item.precio * item.cantidad).toFixed(2)}\n`
  })
  
  message += `\n*TOTAL A PAGAR:* $${cartStore.totalPrecio.toFixed(2)}\n`
  message += "\n_¡Quedo atento a su confirmación!_"

  // 2. Codificar y Redirigir
  const phoneNumber = "584247846963"
  const encodedMessage = encodeURIComponent(message)
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`

  // 3. Confirmación en Supabase (Persistencia)
  confirmarPedidoSupabase().then(() => {
    isProcessing.value = false
    window.open(whatsappUrl, '_blank')
    cartStore.vaciarCarrito()
    alert("¡Pedido realizado con éxito!")
    router.push('/')
  }).catch(err => {
    console.error(err)
    alert("Error al registrar el pedido en la base de datos.")
    isProcessing.value = false
  })
}

const confirmarPedidoSupabase = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  const userManual = JSON.parse(localStorage.getItem('mikrokosmos_user') || '{}')
  
  // Obtenemos el id_usuario (asumiendo que es el entero de la tabla usuario)
  let userId = userManual.id_usuario;

  // Si no está en el localStorage, intentamos buscarlo en la DB usando el correo de la sesión
  if (!userId && session?.user?.email) {
    const { data: userData } = await supabase
      .from('usuario')
      .select('id_usuario')
      .eq('correo', session.user.email)
      .single();
    userId = userData?.id_usuario;
  }

  if (!userId) throw new Error("No se pudo identificar al usuario en la base de datos.");

  // 1. Crear el Pedido primero para obtener el id_pedido
  const { data: pedidoData, error: pedidoError } = await supabase
    .from('pedido')
    .insert([{
      id_usuario: userId,
      estado_pago: 'Pendiente',
      estado_envio: 'Pendiente'
    }])
    .select('id_pedido')
    .single();

  if (pedidoError) throw pedidoError;
  const id_pedido = pedidoData.id_pedido;

  // 2. Insertar en detalles_pedidos con el mapeo correcto
  const inserts = cartStore.items.map(item => ({
    id_pedido: id_pedido,
    id_productos: item.id_producto,
    cantidad: item.cantidad,
    precio_venta: item.precio
  }))

  const { error: detallesError } = await supabase
    .from('detalles_pedidos')
    .insert(inserts)

  if (detallesError) throw detallesError
}

const updateQuantity = (id: number, delta: number) => {
  cartStore.actualizarCantidad(id, delta)
}

const removeItem = (id: number) => {
  cartStore.eliminarDelCarrito(id)
}
</script>

<style scoped>
/* Contenedor macro */
.cart-page { font-family: inherit; min-height: 100vh; background-color: #ffffff; display: flex; flex-direction: column; }
.cart-content { flex: 1; display: flex; flex-direction: column; padding-top: 30px; width: 90%; max-width: 1400px; margin: 0 auto; }

/* Tipografía */
.hina-mincho-font { font-family: 'Hina Mincho', serif; }

/* Stepper dinámico */
.stepper-container { display: flex; justify-content: center; margin-bottom: 30px; }
.stepper { display: flex; align-items: center; }
.step { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; transition: background 0.3s; }
.step.active { background-color: #776CBE; color: white; }
.step.completed { background-color: #776CBE; color: white; opacity: 0.8; }
.step.inactive { background-color: #888888; color: white; }
.step-line { width: 50px; height: 1px; background-color: #cccccc; }

/* Separador borde a borde */
.separator {
  width: 100vw; position: relative; left: 50%; right: 50%;
  margin-left: -50vw; margin-right: -50vw;
  height: 1px; background-color: #d8d8d8; margin-top: 20px; margin-bottom: 20px;
}

/* LAYOUT PRINCIPAL EMPAQUETADO (Vacío / Flow) */
.empty-cart-view { display: flex; justify-content: space-between; gap: 40px; width: 100%; flex: 1; min-height: 350px; margin-top: 30px; }
.empty-left-column { flex: 3; display: flex; align-items: center; justify-content: center; }
.left-text-wrapper { text-align: left; max-width: 400px; font-size: 1.1rem; }
.main-text { margin-bottom: 25px; line-height: 1.4; color: #000; }
.sub-text { margin-bottom: 25px; color: #000; }
.home-link { color: #888888; text-decoration: underline; display: block; text-align: center; }
.empty-resumen-placeholder { display: flex; justify-content: center; align-items: center; height: 100px; color: #888; font-size: 1.1rem; font-style: italic; }

.cart-flow-container { display: flex; flex-direction: column; width: 100%; flex: 1; }
.main-split-layout { display: flex; gap: 50px; margin-top: 20px; margin-bottom: 20px; align-items: flex-start; }
.left-dynamic-column { flex: 6; display: flex; flex-direction: column; }

/* PASO 1 COMPONENTES */
.cart-items-column { display: flex; flex-direction: column; gap: 15px; width: 100%; }
.column-title { font-size: 1.2rem; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
.item-card { border: 1px solid #ccc; border-radius: 8px; padding: 15px; background-color: #fafafa; display: flex; gap: 20px; align-items: flex-start; }
.cart-item-image { width: 80px; height: 120px; object-fit: contain; border-radius: 4px; flex-shrink: 0; }
.item-info { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.quantity-actions { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
.qty-btn { background: #776CBE; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; }
.delete-btn { margin-left: auto; background: transparent; color: crimson; border: 1px solid crimson; padding: 4px 8px; border-radius: 4px; cursor: pointer; }

/* PASO 2 COMPONENTES (Caja de Checkout) */
.checkout-form-column { width: 100%; display: flex; flex-direction: column; animation: fadeIn 0.3s ease; }
.delivery-type-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-right: 15px;
}

.delivery-type-options { 
  display: flex; 
  gap: 35px; 
  padding-left: 10px; 
}

.autofill-mini-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-autofill-mini {
  background-color: #9584c4;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(149, 132, 196, 0.2);
}

.btn-autofill-mini:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.btn-autofill-mini:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.fetch-message-mini {
  font-family: 'Hina Mincho', serif;
  font-size: 0.85rem;
  color: #9584c4;
  margin: 0;
  white-space: nowrap;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.delivery-container { 
  border: 1.5px solid #d1d1d1; 
  border-radius: 35px; 
  padding: 30px 40px; 
  min-height: 480px; 
  display: flex; 
  flex-direction: column;
  background-color: #fff;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}

.delivery-header { margin-bottom: 25px; }
.delivery-box-title { font-family: 'Hina Mincho', serif; font-size: 1.8rem; margin: 0; font-weight: 500; color: #000; }
.delivery-box-subtitle { font-family: 'Hina Mincho', serif; font-size: 1rem; color: #333; margin-top: 8px; }

.delivery-body { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
}

.unselected-state { display: flex; align-items: center; margin-top: 40px; font-family: 'Hina Mincho', serif; font-size: 1.2rem; color: #333; }

.shipping-form { display: flex; flex-direction: column; animation: fadeIn 0.4s ease-in-out; }

/* Layout Local */
.local-layout { display: flex; flex-direction: column; }
.sub-radio-group { display: flex; flex-direction: column; gap: 15px; margin-bottom: 25px; }
.sub-radio-label { display: flex; align-items: center; gap: 12px; font-size: 1.3rem; cursor: pointer; color: #000; font-family: 'Hina Mincho', serif; }

.custom-radio { width: 20px; height: 20px; cursor: pointer; }

.form-group-custom { display: flex; flex-direction: column; gap: 8px; margin-bottom: 25px; }
.input-label-local { font-size: 1.2rem; color: #000; font-family: 'Hina Mincho', serif; }
.form-input-flat { 
  width: 100%;
  padding: 10px 15px; 
  border: 1.5px solid #e0e0e0; 
  border-radius: 10px; 
  background-color: #fcfcfc;
  font-size: 1.1rem;
  outline: none;
  font-family: inherit;
}
.form-input-flat::placeholder { color: #aaa; }

/* Estilos Select Púrpura (Nacional) */
.form-select-purple {
  width: 60%;
  padding: 10px 15px;
  border-radius: 8px;
  border: none;
  background-color: #776CBE;
  color: white;
  font-size: 1.1rem;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 15px center;
  padding-right: 45px;
}

.form-select-purple option {
  background-color: #fff;
  color: #333;
}

.hint-text {
  font-size: 1rem;
  color: #776CBE;
  margin-top: 5px;
  font-style: italic;
}

.type-display { margin-bottom: 50px; }
.type-display h2 { font-size: 3.2rem; color: #000; margin: 0; font-weight: normal; font-family: 'Hina Mincho', serif; }

/* Footer del Checkout */
.delivery-footer { display: flex; align-items: center; gap: 20px; margin-top: auto; padding-top: 20px; }
.back-link-icon { color: #000; cursor: pointer; display: flex; align-items: center; background: transparent; border: none; padding: 0; transition: opacity 0.2s; }
.back-link-icon:hover { opacity: 0.6; }

.btn-primary { 
  background-color: #776CBE; 
  color: white; 
  border: none; 
  padding: 10px 35px; 
  border-radius: 10px; 
  font-size: 1.3rem;
  cursor: pointer;
  font-family: 'Hina Mincho', serif;
  transition: filter 0.2s;
}
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
.btn-primary:disabled { background-color: #cccccc; cursor: not-allowed; opacity: 0.7; }

.btn-outline { 
  border: 2px solid #b1b1b1; 
  color: #776CBE; 
  padding: 9px 30px; 
  border-radius: 10px; 
  background: #fff;
  cursor: pointer;
  font-size: 1.3rem;
  font-family: 'Hina Mincho', serif;
  transition: background 0.2s;
}
.btn-outline:hover { background-color: #f9f9f9; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* COLUMNA DERECHA (TICKET) */
.cart-summary-column { flex: 4; height: fit-content; }
.summary-box { background-color: #ffffff; padding: 40px; border-radius: 20px; border: 1.5px solid #eee; box-shadow: 0 10px 30px rgba(0,0,0,0.03); transition: all 0.3s ease; }
.sticky-ticket { position: sticky; top: 40px; }
.summary-card-title { font-size: 2.2rem; font-weight: 500; text-align: center; margin-bottom: 25px; margin-top: 0; color: #000; font-family: 'Hina Mincho', serif; }
.dashed-divider { height: 1px; border-bottom: 1px dashed #cccccc; margin: 15px 0; }
.summary-items-list { max-height: 300px; overflow-y: auto; padding-right: 5px; margin: 10px 0; }
.summary-items-list::-webkit-scrollbar { width: 5px; }
.summary-items-list::-webkit-scrollbar-thumb { background: #bbb; border-radius: 4px; }
.summary-row { display: flex; justify-content: space-between; margin-bottom: 15px; color: #333; font-size: 1.1rem; }
.summary-total-row { display: flex; justify-content: space-between; font-size: 1.5rem; margin-top: 25px; }

/* FOOTER INFERIOR (Paso 1) */
.bottom-section { width: 100%; padding-bottom: 30px; margin-top: auto; }
.summary-footer { display: flex; justify-content: space-between; align-items: flex-start; padding: 0 10px; }
.total-text { display: flex; flex-direction: column; line-height: 1.2; }
.subtotal-label { font-size: 0.9rem; }
.total-numbers { font-size: 1.2rem; margin: 4px 0; }
.actions-wrapper { display: flex; align-items: center; gap: 15px; }
.back-arrow { color: #000; display: flex; align-items: center; cursor: pointer; }
.back-arrow:hover { opacity: 0.7; }
.continue-btn { background-color: #776CBE; color: white; border: none; border-radius: 6px; padding: 10px 24px; font-size: 1.1rem; cursor: pointer; font-family: inherit; }
.continue-btn:disabled { opacity: 0.6; cursor: default; }
</style>