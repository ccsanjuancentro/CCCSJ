// ========== ENCUENTROS MANAGER ==========
// Maneja CRUD de encuentros con Firebase Firestore + Supabase Storage

(function() {
  "use strict";

  class EncuentrosManager {
    constructor() {
      this.collectionName = 'encuentros';
      this.storageBucket = 'CCCSJ'; // Nombre del bucket en Supabase
      this.storagePath = 'eventos/';
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

        // Si hay imagen, subirla a Supabase Storage
        if (archivo) {
          imagenUrl = await this.subirImagen(archivo);
        }

        // Crear documento en Firestore
        const docRef = await db.collection(this.collectionName).add({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          fecha: firebase.firestore.Timestamp.fromDate(new Date(fecha)),
          imagenUrl: imagenUrl,
          imagenPath: imagenUrl ? this.extraerPath(imagenUrl) : null,
          fechaCreado: firebase.firestore.Timestamp.now()
        });

        return docRef.id;
      } catch (error) {
        console.error("Error creando encuentro:", error);
        throw error;
      }
    }

    // Subir imagen a Supabase Storage
    async subirImagen(archivo) {
      try {
        const fileId = Date.now().toString();
        const extension = archivo.name.split('.').pop();
        const storagePath = `${this.storagePath}${fileId}.${extension}`;

        // Subir archivo a Supabase
        const { data, error } = await supabaseClient.storage
          .from(this.storageBucket)
          .upload(storagePath, archivo, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) throw error;

        // Obtener URL pública
        const { data: publicUrlData } = supabaseClient.storage
          .from(this.storageBucket)
          .getPublicUrl(storagePath);

        return publicUrlData.publicUrl;
      } catch (error) {
        console.error("Error subiendo imagen a Supabase:", error);
        throw error;
      }
    }

    // Extraer ruta de almacenamiento de la URL pública
    extraerPath(imagenUrl) {
      try {
        // La URL es: https://xgwlzndirvqzmaikdzzi.supabase.co/storage/v1/object/public/CCCSJ/eventos/123456.jpg
        const parts = imagenUrl.split('/object/public/');
        if (parts.length > 1) {
          return parts[1]; // "CCCSJ/eventos/123456.jpg"
        }
        return imagenUrl;
      } catch (e) {
        return imagenUrl;
      }
    }

    // Eliminar encuentro (y su imagen)
    async delete(id, imagenUrl) {
      try {
        // Eliminar imagen de Supabase Storage si existe
        if (imagenUrl) {
          try {
            const imagenPath = this.extraerPath(imagenUrl);
            // Remover el bucket name si está incluido
            const pathSinBucket = imagenPath.replace(`${this.storageBucket}/`, '');
            
            const { error } = await supabaseClient.storage
              .from(this.storageBucket)
              .remove([pathSinBucket]);
            
            if (error) console.warn("Error eliminando imagen:", error);
          } catch (storageErr) {
            console.warn("No se pudo eliminar la imagen de Supabase:", storageErr);
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
