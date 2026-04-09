<script setup lang="ts">
import { Instagram } from 'lucide-vue-next'
</script>

<template>
  <footer class="main-footer">
    <div class="help-section">
      <a href="https://wa.me/584247846963?text=necesito%20ayuda%20con%20mi%20pedido" target="_blank" class="footer-link help-text">
        ¿Necesitas ayuda con tu pedido?
      </a>
    </div>
    
    <div class="social-section">
      <span class="follow-text">Síguenos en</span>
      <div class="social-links">
        <a href="https://www.tiktok.com/@mikrokosmos_libreria" target="_blank" class="footer-link social-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="social-icon">
            <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
          </svg>
          mikrokosmos_libreria
        </a>
        <a href="https://www.instagram.com/mikrokosmos_libreria.sc/" target="_blank" class="footer-link social-item">
          <Instagram :size="20" class="social-icon" />
          mikrokosmos_libreria.sc
        </a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.main-footer {
  background-color: #E6E6FA; /* Morado claro de Figma */
  color: #2C3E50;
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem; /* Letra más grande */
}

.footer-link {
  text-decoration: none;
  color: inherit;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;
}

.help-text {
  font-weight: 500;
}

.help-text:hover {
  color: #6A5ACD;
  transform: translateX(5px);
}

.social-section { display: flex; align-items: center; gap: 20px; }
.follow-text { opacity: 0.8; }
.social-links { display: flex; gap: 30px; font-weight: bold; }

.social-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.social-item:hover {
  color: #6A5ACD;
  transform: scale(1.05);
}

.social-icon {
  color: #2C3E50;
}

.social-item:hover .social-icon {
  color: #6A5ACD;
}
</style>