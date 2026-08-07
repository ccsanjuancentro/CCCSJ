// ========== ANUNCIOS SECTION ==========
// Este archivo maneja la renderización y lógica de anuncios en la página
// Usa anunciosManager.js para las operaciones CRUD

(function () {
  "use strict";

  function checkAdminStatus() {
    return localStorage.getItem('isAdminLoggedIn') === 'true';
  }

  async function renderAnuncios() {
    const section = document.getElementById('anuncios-section');
    const container = document.getElementById('anuncios-container');
    const adminBar = document.getElementById('adminAnunciosBar');
    const titleBadge = document.getElementById('anunciosTitleBadge');

    if (!container || !section) return;

    const isAdmin = checkAdminStatus();
    
    try {
      const allAnuncios = await anunciosManager.getAll();
      
      // Filtrar solo anuncios vigentes (no expirados)
      const anuncios = allAnuncios.filter(a => anunciosManager.esVigente(a.fechaExpiracion));

      // Mostrar/ocultar sección
      section.style.display = (anuncios.length > 0 || isAdmin) ? 'block' : 'none';
      if (titleBadge) titleBadge.style.display = (anuncios.length > 0 || isAdmin) ? 'block' : 'none';

      // Mostrar/ocultar barra de admin
      if (adminBar) {
        adminBar.style.display = isAdmin ? 'flex' : 'none';
      }

      // Limpiar contenedor
      container.innerHTML = '';

      // Renderizar cada anuncio
      anuncios.forEach((item) => {
        const col = document.createElement('div');
        col.className = 'col-lg-6 col-12 mb-3';

        const remitenteHTML = item.remitente ? `
          <div class="mb-2">
            <span class="badge bg-danger text-white px-3 py-1">
              <i class="bi bi-person-fill me-1"></i>${item.remitente}
            </span>
          </div>
        ` : '';

        const dateDMY = anunciosManager.formateaFecha(item.fechaExpiracion);
        const adminInfoHTML = isAdmin ? `
          <div class="text-muted mt-2 pt-2 border-top small">
            <i class="bi bi-calendar-event me-1"></i>Vence: <strong>${dateDMY || 'Sin fecha'}</strong>
          </div>
        ` : '';

        const deleteBtnHTML = isAdmin ? `
          <div class="mt-2 text-end">
            <button class="btn btn-outline-danger btn-sm rounded-pill px-3 delete-anuncio-btn" data-id="${item.id}">
              <i class="bi bi-trash me-1"></i> Eliminar
            </button>
          </div>
        ` : '';

        col.innerHTML = `
          <div class="card h-100 border-0 shadow-sm rounded-4 p-4 bg-white border-start border-4 border-danger">
            ${remitenteHTML}
            <h5 class="font-weight-bold text-dark my-2" style="font-size: 19px; line-height: 1.4;">
              ${item.titulo}
            </h5>
            ${adminInfoHTML}
            ${deleteBtnHTML}
          </div>
        `;

        container.appendChild(col);
      });

      // Agregar event listeners para botones de eliminar
      if (isAdmin) {
        const deleteBtns = container.querySelectorAll('.delete-anuncio-btn');
        deleteBtns.forEach(btn => {
          btn.addEventListener('click', async function () {
            const idToDelete = this.getAttribute('data-id');
            if (confirm('¿Estás seguro de que querés eliminar este anuncio?')) {
              try {
                await anunciosManager.delete(idToDelete);
                await renderAnuncios();
                alert('Anuncio eliminado correctamente.');
              } catch (err) {
                alert('Error al intentar eliminar: ' + err.message);
              }
            }
          });
        });
      }

    } catch (error) {
      console.error("Error renderizando anuncios:", error);
    }
  }

  // Inicializar cuando el DOM está listo
  document.addEventListener('DOMContentLoaded', async () => {
    await renderAnuncios();

    // Inicializar flatpickr para el campo de fecha
    const fechaAnuncioEl = document.getElementById('anuncioFechaFin');
    if (fechaAnuncioEl && typeof flatpickr !== 'undefined') {
      flatpickr(fechaAnuncioEl, {
        dateFormat: 'd/m/Y',
        locale: (typeof flatpickr.l10ns !== 'undefined' && flatpickr.l10ns.es) ? flatpickr.l10ns.es : 'es',
        minDate: 'today',
        allowInput: true
      });
    }

    // Formulario para nuevo anuncio
    const formNuevo = document.getElementById('formNuevoAnuncio');
    if (formNuevo) {
      formNuevo.addEventListener('submit', async (e) => {
        e.preventDefault();

        const tituloInput = document.getElementById('anuncioTitulo');
        const remitenteInput = document.getElementById('anuncioRemitente');
        const fechaFinInput = document.getElementById('anuncioFechaFin');

        const titulo = tituloInput ? tituloInput.value.trim() : '';
        const remitente = remitenteInput ? remitenteInput.value.trim() : '';
        const rawFecha = fechaFinInput ? fechaFinInput.value.trim() : '';

        // Validar que todos los campos estén completos
        if (!titulo || !remitente || !rawFecha) {
          alert('Por favor, completá todos los campos antes de guardar.');
          return;
        }

        const fechaExpiracion = anunciosManager.normalizaFecha(rawFecha);
        const dateDMY = anunciosManager.formateaFecha(fechaExpiracion);

        // Confirmar antes de guardar
        const confirmSave = confirm(
          `¿Confirmás la publicación de esta novedad?\n\nTítulo: ${titulo}\nRemitente: ${remitente}\nActivo hasta: ${dateDMY}`
        );
        if (!confirmSave) return;

        const submitBtn = formNuevo.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
          await anunciosManager.create(titulo, remitente, fechaExpiracion);
          formNuevo.reset();
          
          // Cerrar modal
          const modalEl = document.getElementById('nuevoAnuncioModal');
          if (modalEl && window.bootstrap && window.bootstrap.Modal) {
            const modalObj = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
            modalObj.hide();
          }
          
          await renderAnuncios();
          alert('¡Novedad publicada correctamente!');
        } catch (err) {
          alert('Error al publicar: ' + err.message);
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }

    // Botón de logout (si existe)
    const btnLogout = document.getElementById('btnLogoutAdmin');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('adminUser');
        alert('Has cerrado sesión de administrador.');
        renderAnuncios();
      });
    }
  });

  // Exponer función de refrescamiento global
  window.refreshAnuncios = renderAnuncios;

  // Escuchar cambios de estado de admin (cuando se loguea/desloguea)
  window.addEventListener('adminStateChanged', renderAnuncios);
})();
