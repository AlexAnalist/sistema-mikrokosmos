<template>
  <div class="checkout-page">
    <TheHeader />
    
    <div class="checkout-content"><div class="stepper-container">
        <div class="stepper">
          <div class="step completed"><span class="step-icon">🛒</span></div>
          <div class="step-line"></div>
          <div class="step active"><span class="step-icon">ⓘ</span></div>
        </div>
      </div><div class="separator top-separator"></div>

      <div class="checkout-layout"><div class="checkout-form-column">
          <h3 class="delivery-title hina-mincho-font">Tipo de entrega</h3>
          
          <div class="delivery-type-options">
            <label class="radio-label">
              <input type="radio" v-model="deliveryType" value="local" /> Entrega local
            </label>
            <label class="radio-label">
              <input type="radio" v-model="deliveryType" value="nacional" /> Envio nacional
            </label>
          </div>
          
          <div class="delivery-container">
            <div class="delivery-header">
              <h4 class="delivery-box-title hina-mincho-font">Dirección de envío.</h4>
              <p class="delivery-box-subtitle hina-mincho-font">Recibe tu pedido en cualquier dirección del país.</p>
            </div>
            
            <div class="delivery-body">
              <div v-if="!deliveryType" class="unselected-state">
                <p class="hina-mincho-font">Seleccione un Tipo de entrega para continuar.</p>
              </div>
              
              <div v-else class="shipping-form">
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

                <div v-else class="national-layout">
                  <!-- Contenido para nacional si fuera necesario -->
                  <p class="hina-mincho-font">Envío nacional seleccionado.</p>
                </div>
              </div>
            </div>

            <div class="delivery-footer">
               <RouterLink to="/carrito" class="back-link">
                 <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M9 14L4 9L9 4" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                   <path d="M4 9H14.5C17.5376 9 20 11.4624 20 14.5V16" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                 </svg>
               </RouterLink>

               <button 
                 class="btn-primary" 
                 :disabled="!deliveryType || isProcessing"
                 @click="processDelivery"
               >
                 {{ isProcessing ? 'Procesando...' : 'Enviar Aquí' }}
               </button>

               <RouterLink to="/carrito" class="btn-outline">Volver</RouterLink>
            </div>
          </div>
        </div>
        
        <div class="cart-summary-column">
          <div class="summary-box sticky-ticket">
            <h2 class="summary-card-title hina-mincho-font">Resumen de compra</h2>
            <div class="dashed-divider"></div>
            <div class="summary-items-list">
              <div v-for="item in cart" :key="item.id_producto" class="summary-row">
                <span>{{ item.titulo }} (x{{ item.cantidad }})</span>
                <span>${{ (item.precio * item.cantidad).toFixed(2) }}</span>
              </div>
            </div>
            <div class="dashed-divider"></div>
            <div class="summary-total-row">
              <strong class="hina-mincho-font">Total a pagar:</strong>
              <strong class="hina-mincho-font">$ {{ total_carrito.toFixed(2) }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import TheHeader from '@/components/TheHeader.vue'
import { supabase } from '@/supabase'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cartStore = useCartStore()

const deliveryType = ref('local') // Seteamos local por defecto para que el usuario lo vea
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

// Sincronizando con el estado real del carrito de Pinia
const cart = computed(() => cartStore.items)

const total_carrito = computed(() => {
  return cartStore.totalPrecio
})

const processDelivery = async () => {
  // 1. Validación de frontend
  if (!deliveryType.value) {
    alert("Por favor, seleccione un tipo de entrega.");
    return;
  }

  // Si es entrega local, la dirección es obligatoria
  if (deliveryType.value === 'local' && !formData.value.direccion.trim()) {
    alert("Por favor, ingrese la dirección de entrega.");
    return;
  }

  isProcessing.value = true;

  const tipoEntregaLimpio = deliveryType.value === 'local' ? 'Local' : 'Nacional';
  const direccionFinal = formData.value.direccion || 'Sin dirección';

  try {
    // 2. Obtener la sesión actual de Auth y luego el 'id_usuario' entero en la tabla 'usuario'
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      throw new Error("Debes iniciar sesión para procesar un pedido.");
    }
    
    // Consulta al usuario mediante el correo mapeado en Auth
    const { data: usuarioData, error: userDbError } = await supabase
      .from('usuario')
      .select('id_usuario, nombre')
      .eq('correo', authData.user.email)
      .single();
      
    if (userDbError || !usuarioData) {
      throw new Error("No se encontró el perfil numérico del usuario en la base de datos.");
    }

    const { id_usuario, nombre } = usuarioData;

    // 3. PRIMERA INSERCIÓN: Tabla 'pedido'
    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedido')
      .insert([{
        id_usuario: id_usuario,
        estado_pago: 'Pendiente',
        estado_envio: 'Pendiente'
      }])
      .select('id_pedido')
      .single();

    if (pedidoError) throw pedidoError;
    const { id_pedido } = pedidoData;

    // 4. SEGUNDA INSERCIÓN: Tabla 'detalles_pedidos'
    const detallesData = cart.value.map(item => ({
      id_pedido: id_pedido,
      id_productos: Number(item.id_producto), 
      cantidad: Number(item.cantidad),
      precio_venta: Number(item.precio)
    }));

    const { error: detallesError } = await supabase
      .from('detalles_pedidos')
      .insert(detallesData);

    if (detallesError) throw detallesError;

    // 5. TERCERA INSERCIÓN: Tabla 'entrega'
    const { error: entregaError } = await supabase
      .from('entrega')
      .insert([{
        id_pedido: id_pedido,
        tipo_entrega: tipoEntregaLimpio,
        direccion_envio: direccionFinal
      }]);

    if (entregaError) throw entregaError;

    // Si todo salió bien
    console.log("Transacción exitosa de Supabase completa.");

  } catch (error: any) {
    console.error('Detalles del error de BD:', JSON.stringify(error, null, 2));
    console.error('Error durante la transacción Supabase:', error);
    // Quitamos alert() para no frenar la redirección
  } finally {
    isProcessing.value = false;

    // 6. REDIRECCIÓN A WHATSAPP
    const listaLibros = cart.value
      .map(item => `${item.titulo} (x${item.cantidad})`)
      .join(', ');
      
    const totalVenta = `$${total_carrito.value.toFixed(2)}`;
    
    // Extraemos nombre temporal por si la BD arroja error
    let nombreCliente = "Cliente";
    const userManual = JSON.parse(localStorage.getItem('mikrokosmos_user') || '{}');
    if (userManual.nombre) nombreCliente = userManual.nombre;
    
    const mensaje = `Hola Mikrokosmos, mi nombre es ${nombreCliente}, mi pedido es: ${listaLibros} con un total de ${totalVenta}. Mi entrega es ${tipoEntregaLimpio} en la dirección ${direccionFinal}`;

    const encodedMessage = encodeURIComponent(mensaje);
    const whatsappUrl = `https://wa.me/584247846963?text=${encodedMessage}`;
    
    // Se abre WhatsApp inmediatamente
    window.open(whatsappUrl, '_blank');
    cartStore.vaciarCarrito();
    router.push('/');
  }
};
</script>

<style scoped>
/* Fuentes */
.hina-mincho-font { font-family: 'Hina Mincho', serif; }

/* Layout Geral */
.checkout-page {
  background-color: #fff;
  min-height: 100vh;
}
.checkout-content { width: 90%; max-width: 1200px; margin: 0 auto; padding: 40px 0; }
.checkout-layout { display: flex; gap: 50px; margin-top: 40px; align-items: flex-start; }
.checkout-form-column { flex: 7; }
.cart-summary-column { flex: 5; }

/* Estilos de los Radios Principales (arriba de la caja) */
.delivery-type-options { display: flex; gap: 30px; margin-bottom: 25px; padding-left: 10px; }
.radio-label { display: flex; align-items: center; gap: 10px; font-size: 1.1rem; cursor: pointer; color: #444; }

/* Caja de Entrega (Ajustada a la captura) */
.delivery-container { 
  border: 1.5px solid #d1d1d1; 
  border-radius: 35px; 
  padding: 50px; 
  min-height: 600px; 
  display: flex; 
  flex-direction: column;
  background-color: #fff;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}

.delivery-header { margin-bottom: 40px; }
.delivery-box-title { font-size: 2.8rem; font-weight: 500; margin: 0 0 10px 0; color: #000; }
.delivery-box-subtitle { font-size: 1.6rem; color: #333; margin: 0; }

.sub-radio-group { display: flex; flex-direction: column; gap: 25px; margin-bottom: 40px; }
.sub-radio-label { display: flex; align-items: center; gap: 15px; font-size: 1.8rem; cursor: pointer; color: #000; }

.custom-radio {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.form-group-custom { display: flex; flex-direction: column; gap: 12px; margin-bottom: 50px; }
.input-label-local { font-size: 1.6rem; color: #000; }
.form-input-flat { 
  width: 100%;
  padding: 15px 20px; 
  border: 1.5px solid #e0e0e0; 
  border-radius: 12px; 
  background-color: #fcfcfc;
  font-size: 1.3rem;
  outline: none;
}
.form-input-flat::placeholder { color: #aaa; }

.type-display { margin-bottom: 50px; }
.type-display h2 { font-size: 3.2rem; color: #000; margin: 0; font-weight: normal; }

/* Footer de la caja */
.delivery-footer { display: flex; align-items: center; gap: 20px; margin-top: auto; }

.back-link { 
  margin-right: 15px;
  transition: opacity 0.2s;
}
.back-link:hover { opacity: 0.7; }

.btn-primary { 
  background-color: #776CBE; 
  color: white; 
  border: none; 
  padding: 15px 45px; 
  border-radius: 12px; 
  font-size: 1.8rem;
  cursor: pointer;
  transition: filter 0.2s;
}
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
.btn-primary:disabled { background-color: #cccccc; cursor: not-allowed; }

.btn-outline { 
  border: 2px solid #b1b1b1; 
  color: #776CBE; 
  padding: 13px 40px; 
  border-radius: 12px; 
  text-decoration: none; 
  font-size: 1.8rem;
  transition: background 0.2s;
}
.btn-outline:hover { background-color: #f9f9f9; }

/* Resumen (Ticket) */
.sticky-ticket { 
  position: sticky; 
  top: 40px; 
  background: #fff; 
  padding: 40px; 
  border-radius: 20px; 
  border: 1.5px solid #eee; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.03); 
}
.summary-card-title { font-size: 2.2rem; margin-bottom: 25px; }
.summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 1.1rem; }
.summary-total-row { display: flex; justify-content: space-between; margin-top: 25px; font-size: 1.5rem; }
</style>