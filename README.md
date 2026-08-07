# CCCSJ Website (Comunidad Cristiana San Juan)

Repositorio principal para el sitio web y sistema de administración de la **Comunidad Cristiana San Juan Centro**.

---

## 🚀 Requisitos del Sistema y Entorno de Desarrollo

Para ejecutar, modificar o desplegar este proyecto en el futuro, asegurate de contar con:

1. **Node.js**: Versión 16.x o superior (recomendado Node v18 LTS o v20 LTS).
2. **npm** (incluido con Node.js) o **yarn**.
3. **Firebase CLI**: Herramienta de línea de comandos de Firebase.
   ```bash
   npm install -g firebase-tools
   ```
4. **Git**: Control de versiones.

---

## 🛠️ Tecnologías e Infraestructura

- **Frontend**: HTML5, CSS3 vanilla (con Bootstrap 5 y Bootstrap Icons), JavaScript (ES6+).
- **Backend & Base de Datos**: Firebase Firestore (gestión de encuentros, anuncios, usuarios y reglas).
- **Almacenamiento de Multimedia**: Supabase Storage (Bucket `CCCSJ`).
- **Autenticación**: Firebase Auth.
- **Formularios & Contacto**: EmailJS.
- **Hosting**: Firebase Hosting.

---

## 🔐 Credenciales y Configuración de Servicios

Dado que este es un **repositorio privado**, se documentan aquí las claves y configuraciones necesarias para su mantenimiento futuro:

### 1. Firebase (`iglesiaccsj143`)
- **Cuenta Propietaria**: `iglesiaccsj@gmail.com`
- **Contraseña**: Comcri143
- **Proyecto ID**: `iglesiaccsj143`
- **Dominio Público**: [https://iglesiaccsj.web.app](https://iglesiaccsj.web.app)

### 2. Supabase Storage
- **URL del Proyecto**: `https://xgwlzndirvqzmaikdzzi.supabase.co`
- **Bucket**: `CCCSJ`
- **Clave Pública**: `sb_publishable_Sy8pM68ESM-AsnXbE0rUcA_3Q7bvr7C`

---

## 💻 Pruebas Locales (Desarrollo)

Para probar el sitio web localmente sin desplegar:

1. Abrí la carpeta del proyecto en tu terminal.
2. Serví la carpeta `public` mediante cualquier servidor local estático o mediante Firebase Emulators:
   ```bash
   # Opción A: Usando Firebase CLI (Recomendado)
   firebase serve --only hosting

   # Opción B: Usando npx serve
   npx serve public
   ```
3. Abrí en el navegador `http://localhost:5000` o la URL indicada en la terminal.

---

## 📦 Despliegue a Producción (Firebase Hosting)

1. Abre la terminal en el directorio raíz del proyecto.
2. Inicia sesión en Firebase con la cuenta del proyecto:
   ```bash
   firebase login
   ```
   *(Si necesitas autenticar desde un dispositivo o terminal remota, usa `firebase login --no-localhost`)*.
3. Despliega los cambios ejecutando:
   ```bash
   firebase deploy --only hosting
   ```

---

## 📂 Estructura del Proyecto

- `public/`: Archivos estáticos del sitio web (HTML, CSS, JS, imágenes).
  - `index.html` / `index_en.html`: Página principal (Español e Inglés).
  - `conecta.html` / `conecta_en.html`: Sección de ministerios y "Quiero Servir".
  - `js/encuentros.js`: Panel administrativo de encuentros, calendario y time pickers.
  - `js/destacados.js`: Gestión de anuncios destacados e integración con Supabase.
- `firestore.rules`: Reglas de seguridad de Firestore.
- `firebase.json`: Configuración de despliegue de Firebase Hosting.