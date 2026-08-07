# CCCSJ Website

Repositorio para la página web de la Comunidad Cristiana San Juan Centro.

## Despliegue en Firebase

El sitio web está alojado en Firebase Hosting.

### Credenciales del Proyecto
* **Proyecto en Firebase:** `iglesiaccsj143`
* **Cuenta de Google Propietaria:** `iglesiaccsj@gmail.com`
* **Dominio Principal:** [https://iglesiaccsj.web.app](https://iglesiaccsj.web.app)

### Pasos para realizar el Despliegue (Deploy)

1. Abre la terminal en el directorio del proyecto.
2. Inicia sesión en Firebase con la cuenta propietaria (`iglesiaccsj@gmail.com`):
   ```bash
   firebase login
   ```
   *(Si necesitas usar otra cuenta o iniciar desde un navegador específico, usa `firebase login --no-localhost`)*.
3. Despliega los archivos de la carpeta `public` ejecutando:
   ```bash
   firebase deploy --only hosting
   ```

   data base
fTbQAU2kmpLfWCTe