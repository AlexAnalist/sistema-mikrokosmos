# Arquitectura Recomendada para Mikrokosmos (Vue 3 + Vite)

Para mantener el proyecto libre de caos (especialmente al trabajar en equipo con Alejandra y otros colegas), se recomienda seguir la siguiente estructura de carpetas. Esto garantiza una separación clara de responsabilidades:

```text
libreria-mikrokosmos/
└── vue-project/
    ├── public/                 # Archivos estáticos que no son procesados por Vite
    │   ├── favicon.ico
    │   └── fondo-estrellas.jpg # Las imágenes crudas van aquí o en assets
    │
    ├── src/                    # Aquí vive TODO el código de tu aplicación
    │   ├── assets/             # Archivos estáticos procesados (CSS global, logos SVG, fuentes)
    │   │   ├── main.css
    │   │   └── base.css
    │   │
    │   ├── components/         # Componentes reutilizables o "pedacitos de UI"
    │   │   ├── common/         # Componentes muy genéricos (botones, inputs, modales)
    │   │   │   ├── AuthInput.vue
    │   │   │   └── PrimaryButton.vue
    │   │   ├── layout/         # Componentes de estructura principal
    │   │   │   ├── TheHeader.vue
    │   │   │   └── TheSideBar.vue
    │   │   └── ...
    │   │
    │   ├── views/              # Vistas completas (se conectan al router)
    │   │   ├── HomeView.vue
    │   │   └── MiSeccionLogicaView.vue (Ej: LoginView.vue)
    │   │
    │   ├── router/             # Configuración de Vue Router (rutas de la app)
    │   │   └── index.ts
    │   │
    │   ├── stores/             # (Opcional) Estado global usando Pinia
    │   │   └── index.ts
    │   │
    │   ├── lib/ o utils/       # Lógica pura de JS/TS separada de la UI
    │   │   ├── supabase.ts     # Cliente e instanciamiento de la DB
    │   │   └── helpers.ts      # Funciones accesorias matemáticas, de fecha, etc.
    │   │
    │   ├── App.vue             # Componente Raíz donde inicia todo (normalmente solo tiene <RouterView />)
    │   └── main.ts             # Punto de entrada de la app. Configura Vue, el router y monta la app.
    │
    ├── .env.local              # Variables de entorno (URL de Supabase, Keys) ¡NO SUBIR A GITHUB!
    ├── .gitignore              # Qué cosas ignorar en Git
    ├── index.html              # El HTML principal donde Vite inyecta todo
    ├── package.json            # Dependencias del proyecto (npm install)
    ├── vite.config.ts          # Configuración de construcción de Vite
    └── tsconfig.json           # Configuración de comportamiento de TypeScript
```

### Reglas de Oro para un Proyecto Ordenado:
1. **Views vs Components**: Si un archivo representa "una ventana entera" va en `views/`. Si el archivo representa un "botón" o "un bloque que se repite", debe ir en `components/`.
2. **Encapsulamiento del CSS**: Todo componente o vista nueva debe usar `<style scoped>` (excepto en un archivo central como `assets/main.css`). Así evitan pisarse el estilo entre compañeros.
3. **Lógica separada**: Si tienes una función muy compleja que hace cálculos puros y duros, expórtala en archivos TypeScript puros (`.ts`) en una carpeta como `lib/` en lugar de amontonarla toda dentro de la etiqueta `<script>` del Vue.
