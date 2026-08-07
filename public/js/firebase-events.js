// ========== FIREBASE EVENTS / ENCUENTROS ==========
// Maneja la renderización de encuentros (eventos) desde Firestore + Storage

(function () {
  "use strict";

  function checkAdminStatus() {
    return localStorage.getItem('isAdminLoggedIn') === 'true';
  }

  async function renderEncuentros() {
    const eventosSectionContent = document.getElementById('eventos-section-content');
    const eventosContainer = document.getElementById('eventos-container');
    const adminEventosBar = document.getElementById('adminEventosBar');

    if (!eventosContainer) return;

    eventosContainer.innerHTML = '';
    const isAdmin = checkAdminStatus();
    const isEnglish = window.location.pathname.includes('_en.html');

    try {
      // Obtener encuentros (mostrar todos si es admin, solo vigentes si no)
      const encuentros = await encuentrosManager.getAll(isAdmin);

      // Mostrar/ocultar sección
      if (eventosSectionContent) {
        eventosSectionContent.style.display = (encuentros.length > 0 || isAdmin) ? 'block' : 'none';
      }

      // Mostrar/ocultar barra de admin
      if (adminEventosBar) {
        adminEventosBar.style.display = isAdmin ? 'flex' : 'none';
      }

      // Renderizar cada encuentro
      encuentros.forEach((evento) => {
        let urlImagen = evento.imagenUrl;
        if (!urlImagen || urlImagen === ".jpg" || urlImagen === "undefined.jpg") {
          urlImagen = "https://imgur.com/sG0VnFl.jpg";
        }

        const eventoDiv = document.createElement('div');
        eventoDiv.classList.add('col-lg-4', 'col-12', 'mb-3');

        const mostrarFecha = evento.mostrarFecha !== false;
        const fechaHTML = mostrarFecha ? `
          <p class="product-p">${encuentrosManager.formateaFecha(evento.fecha)}</p>
        ` : '';

        const vigenciaHTML = !evento.vigente && isAdmin ? `
          <span class="badge bg-secondary">Expirado</span>
        ` : '';

        const deleteBtnHTML = isAdmin ? `
          <div class="mt-2 text-end">
            <button class="btn btn-outline-danger btn-sm rounded-pill px-3 delete-evento-btn" 
                    data-id="${evento.id}" 
                    data-image="${evento.imagenUrl || ''}">
              <i class="bi bi-trash me-1"></i> ${isEnglish ? 'Delete' : 'Eliminar'}
            </button>
          </div>
        ` : '';

        eventoDiv.innerHTML = `
          <div class="product-thumb">
            <a>
              <img src="${urlImagen}" class="img-fluid product-image" 
                   alt="${evento.nombre || ''}" 
                   onerror="this.src='images/eventos/error_evento.jpg';"
                   style="height: 250px; object-fit: cover;">
            </a>
            <div class="product-info d-flex flex-column" style="width: 100%;">
              <div style="flex-grow: 1;">
                <h5 class="product-title mb-0">
                  <a class="product-title-link">${evento.nombre || ''}</a>
                </h5>
                ${fechaHTML}
                <p class="product-p">${evento.descripcion || ''}</p>
                ${vigenciaHTML}
              </div>
              ${deleteBtnHTML}
            </div>
          </div>
        `;

        eventosContainer.appendChild(eventoDiv);
      });

      // Agregar listeners para eliminar
      if (isAdmin) {
        const deleteBtns = eventosContainer.querySelectorAll('.delete-evento-btn');
        deleteBtns.forEach(btn => {
          btn.addEventListener('click', async function () {
            const idToDelete = this.getAttribute('data-id');
            const imageUrl = this.getAttribute('data-image');
            const confirmMsg = isEnglish ? 
              'Are you sure you want to delete this event?' : 
              '¿Estás seguro de que querés eliminar este evento?';

            if (confirm(confirmMsg)) {
              try {
                await encuentrosManager.delete(idToDelete, imageUrl);
                await renderEncuentros();
                const msg = isEnglish ? 'Event deleted successfully.' : 'Evento eliminado correctamente.';
                alert(msg);
              } catch (err) {
                const msg = isEnglish ? 
                  'Error trying to delete from database.' : 
                  'Error al intentar eliminar de la base de datos.';
                alert(msg);
                console.error(err);
              }
            }
          });
        });
      }

    } catch (error) {
      console.error("Error renderizando encuentros:", error);
    }
  }

  // Inicializar cuando el DOM está listo
  document.addEventListener('DOMContentLoaded', async () => {
    await renderEncuentros();

    // Formulario para crear nuevo encuentro
    const formNuevo = document.getElementById('formNuevoEvento');
    if (formNuevo) {
      formNuevo.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('eventoNombre')?.value.trim() || '';
        const descripcion = document.getElementById('eventoDescripcion')?.value.trim() || '';
        const fechaInput = document.getElementById('eventoFecha')?.value || '';
        const fileInput = document.getElementById('eventoImagenFile');
        const archivo = fileInput?.files[0] || null;
        const isEnglish = window.location.pathname.includes('_en.html');

        // Validar
        if (!nombre || !descripcion || !fechaInput) {
          const msg = isEnglish ? 
            'Please fill in all required fields.' : 
            'Por favor completá los campos requeridos.';
          alert(msg);
          return;
        }

        const submitBtn = formNuevo.querySelector('button[type="submit"]');
        const originalHTML = submitBtn?.innerHTML || '';
        
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2"></span>
            ${isEnglish ? 'Uploading...' : 'Subiendo...'}
          `;
        }

        try {
          await encuentrosManager.create(nombre, descripcion, fechaInput, archivo);
          
          formNuevo.reset();

          // Cerrar modal
          const modalEl = document.getElementById('nuevoEventoModal');
          if (modalEl && window.bootstrap && window.bootstrap.Modal) {
            const modalObj = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
            modalObj.hide();
          }

          await renderEncuentros();
          const msg = isEnglish ? 'Event created successfully!' : '¡Evento creado con éxito!';
          alert(msg);
        } catch (err) {
          console.error("Error creating event:", err);
          const msg = isEnglish ? 
            'An error occurred while uploading the event.' : 
            'Ocurrió un error al subir el evento.';
          alert(msg);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHTML;
          }
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
        renderEncuentros();
      });
    }
  });

  // Exponer función de refrescamiento
  window.refreshEncuentros = renderEncuentros;
  window.refreshEventos = renderEncuentros;

  // Escuchar cambios de estado de admin
  window.addEventListener('adminStateChanged', renderEncuentros);

  // Al cargar la página
  window.addEventListener('load', async () => {
    await renderEncuentros();
  });
})();
