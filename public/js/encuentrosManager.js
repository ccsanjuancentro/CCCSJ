// ========== ENCUENTROS MANAGER ==========
// Maneja CRUD de encuentros (eventos/reuniones) con Firebase Firestore + Storage

(function() {
  "use strict";

  class EncuentrosManager {
    constructor() {
      this.collectionName = 'encuentros';
      this.storagePath = 'encuentros/';
    }

    // Obtener todos los encuentros vigentes (fecha futura) o todos si es admin
    async getAll(showExpired = false) {
      try {
        const snapshot = await db.collection(this.collectionName).orderBy('fecha', 'asc').get();
        const encuentros = [];
        const ahora = new Date();

        snapshot.forEach(doc => {
          const data = doc.data();
          const fecha = data.fecha.toDate ? data.fecha.toDate() : new Date(data.fecha);
          const vigente = fecha > ahora;

          // Si no es admin, mostrar solo vigentes
          if (vigente || showExpired) {
            encuentros.push({
              id: doc.id,
              ...data,
              fecha: fecha,
              vigente: vigente
            });
          }
        });

        return encuentros;
      } catch (error) {
        console.error("Error obteniendo encuentros:", error);
        return [];
      }
    }

    // Crear nuevo encuentro con imagen
    async create(nombre, descripcion, fecha, archivo) {
      try {
        let imagenUrl = null;

        // Si hay imagen, subirla a Firebase Storage
        if (archivo) {
          imagenUrl = await this.subirImagen(archivo);
        }

        // Crear documento en Firestore
        const docRef = await db.collection(this.collectionName).add({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          fecha: firebase.firestore.Timestamp.fromDate(new Date(fecha)),
          imagenUrl: imagenUrl,
          fechaCreado: firebase.firestore.Timestamp.now()
        });

        return docRef.id;
      } catch (error) {
        console.error("Error creando encuentro:", error);
        throw error;
      }
    }

    // Subir imagen a Firebase Storage
    async subirImagen(archivo) {
      const fileId = Date.now().toString();
      const extension = archivo.name.split('.').pop();
      const storagePath = `${this.storagePath}${fileId}.${extension}`;
      const storageRef = storage.ref(storagePath);

      try {
        await storageRef.put(archivo);
        const imagenUrl = await storageRef.getDownloadURL();
        return imagenUrl;
      } catch (error) {
        console.error("Error subiendo imagen:", error);
        throw error;
      }
    }

    // Eliminar encuentro (y su imagen)
    async delete(id, imagenUrl) {
      try {
        // Eliminar imagen del Storage si existe
        if (imagenUrl) {
          try {
            const storageRef = storage.refFromURL(imagenUrl);
            await storageRef.delete();
          } catch (storageErr) {
            console.warn("Imagen no encontrada en Storage:", storageErr);
          }
        }

        // Eliminar documento de Firestore
        await db.collection(this.collectionName).doc(id).delete();
        return true;
      } catch (error) {
        console.error("Error eliminando encuentro:", error);
        throw error;
      }
    }

    // Formatear fecha para mostrar
    formateaFecha(fecha) {
      if (!fecha) return '';
      const f = fecha.toDate ? fecha.toDate() : fecha;
      return f.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // Purgar encuentros expirados (admin only)
    async purgarExpirados() {
      try {
        const encuentros = await this.getAll(true);
        const ahora = new Date();

        for (const encuentro of encuentros) {
          if (!encuentro.vigente) {
            await this.delete(encuentro.id, encuentro.imagenUrl);
          }
        }

        return true;
      } catch (error) {
        console.error("Error purgando encuentros expirados:", error);
        throw error;
      }
    }
  }

  // Crear instancia global
  window.encuentrosManager = new EncuentrosManager();
})();
