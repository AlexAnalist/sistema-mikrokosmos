<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'

interface Banner {
  imagen: string;
  subtitulo: string;
  titulo: string;
  promo: string;
  idDestino: number;
}

const router = useRouter()
const banners = ref<Banner[]>([])
const indiceActual = ref(0)
let intervalo: any = null

const cargarBanners = async () => {
  try {
    const { data, error } = await supabase
      .from('header')
      .select('id_header, imagen_url, texto_banner')
      .order('id_header', { ascending: true })

    if (error) throw error

    if (data && data.length > 0) {
      banners.value = data.map((b: any) => {
        let parsed = { subtitulo: '', titulo: '', promo: '', idDestino: 1 }
        if (b.texto_banner) {
          try {
            parsed = JSON.parse(b.texto_banner)
          } catch(e) {
            parsed.titulo = b.texto_banner
          }
        }
        return {
          imagen: b.imagen_url || '',
          subtitulo: parsed.subtitulo || '',
          titulo: parsed.titulo || '',
          promo: parsed.promo || '',
          idDestino: parsed.idDestino || 1
        }
      })
    } else {
      // Default fallback en caso de no haber banners
      banners.value = [
        {
          imagen: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200",
          subtitulo: '¿Encontrarte a ti misma?',
          titulo: 'PREVENTA IMPERDIBLE*',
          promo: '¡Asegura tu libro hoy!',
          idDestino: 1
        }
      ]
    }
  } catch (e) {
    console.error("Error cargando banners para DynamicBanner:", e)
  }
}

const siguienteBanner = () => {
  if (banners.value.length > 0) {
    indiceActual.value = (indiceActual.value + 1) % banners.value.length
  }
}

onMounted(async () => {
  await cargarBanners()
  intervalo = setInterval(siguienteBanner, 10000)
})

onBeforeUnmount(() => {
  if (intervalo) clearInterval(intervalo)
})

const irADetalle = (id: number) => {
  if (id) {
    router.push({ name: 'book-detail', params: { id } })
  }
}
</script>

<template>
  <section class="dynamic-banner-section" v-if="banners.length > 0">
    <div class="banner-slider">
      <TransitionGroup name="fade">
        <div 
          v-for="(banner, index) in banners" 
          :key="banner.imagen"
          v-show="index === indiceActual"
          class="banner-container"
          @click="irADetalle(banner.idDestino)"
        >
          <img :src="banner.imagen" class="banner-img" />
          <div class="banner-text-overlay">
            <p class="subtitle">{{ banner.subtitulo }}</p>
            <h2 class="title">{{ banner.titulo }}</h2>
            <p class="promo">{{ banner.promo }}</p>
          </div>
        </div>
      </TransitionGroup>

      <div class="carousel-dots">
        <span 
          v-for="(_, index) in banners" 
          :key="'dot-'+index"
          :class="['dot', { active: index === indiceActual }]"
          @click="indiceActual = index"
        ></span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dynamic-banner-section {
  width: 100%;
  padding: 20px 40px 0 40px;
  box-sizing: border-box;
}

.banner-slider {
  position: relative;
  width: 100%;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  border-bottom: 4px solid #00BFFF;
  background-color: #000;
  cursor: pointer;
}

.banner-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  opacity: 0.8;
}

.banner-text-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, rgba(106, 90, 205, 0.9) 0%, rgba(0, 0, 0, 0.1) 70%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 60px;
}

.subtitle { font-size: 1.4rem; font-weight: bold; color: #00BFFF; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
.title { font-size: 3rem; font-weight: 900; margin: 0 0 15px 0; line-height: 1.1; max-width: 60%; }
.promo { font-size: 1.2rem; background: #00BFFF; color: #fff; padding: 5px 15px; border-radius: 20px; align-self: flex-start; }

/* Transiciones Fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Dots */
.carousel-dots { position: absolute; bottom: 25px; right: 50px; display: flex; gap: 10px; z-index: 10; }
.dot { width: 12px; height: 12px; border-radius: 50%; background: rgba(255,255,255,0.4); cursor: pointer; transition: 0.3s; }
.dot.active { background: #00BFFF; transform: scale(1.3); }
</style>
