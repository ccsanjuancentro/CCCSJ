// ========== ANUNCIOS MANAGER ==========
// Maneja CRUD de anuncios con Firebase Firestore

(function() {
  "use strict";

  class AnunciosManager {
    constructor() {
      this.collectionName = 'anuncios';
    }

    // Obtener todos los anuncios
    async getAll() {
      try {
        const snapshot = await db.collection(this.collectionName).orderBy('fechaCreado', 'desc').get();
        const anuncios = [];
        snapshot.forEach(doc => {
          anuncios.push({
            id: doc.id,
            ...doc.data()
          });
        });
        return anuncios;
      } catch (error) {
        console.error("Error obteniendo anuncios:", error);
        return [];
      }
    }

    // Crear nuevo anuncio
    async create(titulo, remitente, fechaExpiracion) {
      try {
        const docRef = await db.collection(this.collectionName).add({
          titulo: titulo.trim(),
          remitente: remitente.trim(),
          fechaExpiracion: this.normalizaFecha(fechaExpiracion),
          fechaCreado: firebase.firestore.Timestamp.now()
        });
        return docRef.id;
      } catch (error) {
        console.error("Error creando anuncio:", error);
        throw error;
      }
    }

    // Eliminar anuncio
    async delete(id) {
      try {
        await db.collection(this.collectionName).doc(id).delete();
        return true;
      } catch (error) {
        console.error("Error eliminando anuncio:", error);
        throw error;
      }
    }

    // Normalizar fecha a formato YYYY-MM-DD
    normalizaFecha(dateStr) {
      if (!dateStr) return '';
      const clean = dateStr.trim();

      // Si ya es YYYY-MM-DD
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(clean)) {
        const parts = clean.split('-');
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }

      // Si tiene slashes (DD/MM/YYYY o MM/DD/YYYY)
      if (clean.includes('/')) {
        const parts = clean.split('/');
        if (parts.length === 3) {
          let p1 = parseInt(parts[0], 10);
          let p2 = parseInt(parts[1], 10);
          let y = parts[2];
          if (y.length === 2) y = '20' + y;

          let day, month;
          if (p1 > 12) {
            day = p1;
            month = p2;
          } else if (p2 > 12) {
            day = p2;
            month = p1;
          } else {
            day = p1;
            month = p2;
          }

          return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }

      return dateStr;
    }

    // Verificar si un anuncio está vigente (no expiró)
    esVigente(fechaExpiracion) {
      if (!fechaExpiracion) return true;
      const hoy = new Date();
      const today = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      return fechaExpiracion >= today;
    }

    // Formatear fecha a DD/MM/YYYY para mostrar
    formateaFecha(dateStr) {
      if (!dateStr) return '';
      const normalized = this.normalizaFecha(dateStr);
      const parts = normalized.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    }
  }

  // Crear instancia global
  window.anunciosManager = new AnunciosManager();
})();
