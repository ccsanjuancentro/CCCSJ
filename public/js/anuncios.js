// Management script for Novedades (CCCSJ)
(function () {
    "use strict";

    // Configuración de Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyCpL5fjAy05rV2OMWFWwRwy4ttElmhtqBg",
        authDomain: "iglesiaccsj143.firebaseapp.com",
        projectId: "iglesiaccsj143",
        storageBucket: "iglesiaccsj143.firebasestorage.app",
        messagingSenderId: "141392861764",
        appId: "1:141392861764:web:2d91da3c7b985f0d15ba11",
        measurementId: "G-4N1DQTQK11"
    };

    // Inicializa Firebase si no está inicializado
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();

    // Smart date normalizer: handles DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
    function normalizeDateYYYYMMDD(dateStr) {
        if (!dateStr) return '';
        const clean = dateStr.trim();

        // 1. Direct YYYY-MM-DD match
        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(clean)) {
            const parts = clean.split('-');
            const y = parts[0];
            const m = parts[1].padStart(2, '0');
            const d = parts[2].padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        // 2. Format with slashes (DD/MM/YYYY or MM/DD/YYYY)
        if (clean.includes('/')) {
            const parts = clean.split('/');
            if (parts.length === 3) {
                let p1 = parseInt(parts[0], 10);
                let p2 = parseInt(parts[1], 10);
                let y = parts[2];
                if (y.length === 2) y = '20' + y;

                let day, month;
                if (p1 > 12) {
                    // e.g. 25/08/2026 -> p1 is day
                    day = p1;
                    month = p2;
                } else if (p2 > 12) {
                    // e.g. 08/25/2026 -> p2 is day
                    day = p2;
                    month = p1;
                } else {
                    // Default to DD/MM/YYYY
                    day = p1;
                    month = p2;
                }

                const mStr = String(month).padStart(2, '0');
                const dStr = String(day).padStart(2, '0');
                return `${y}-${mStr}-${dStr}`;
            }
        }

        // 3. Fallback: Native Date parsing
        const parsed = new Date(clean);
        if (!isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const mStr = String(parsed.getMonth() + 1).padStart(2, '0');
            const dStr = String(parsed.getDate()).padStart(2, '0');
            return `${y}-${mStr}-${dStr}`;
        }

        return clean;
    }

    // Format any date to DD/MM/YYYY for UI display
    function formatDateDMY(dateStr) {
        if (!dateStr) return '';
        const isoDate = normalizeDateYYYYMMDD(dateStr);
        const parts = isoDate.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    }

    function getTodayYYYYMMDD() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // Check if announcement is valid (fechaExpiracion >= today in YYYY-MM-DD)
    function isAnuncioValid(dateStr) {
        if (!dateStr) return true;
        try {
            const normalized = normalizeDateYYYYMMDD(dateStr);
            const todayStr = getTodayYYYYMMDD();
            return normalized >= todayStr;
        } catch (e) {
            return true;
        }
    }

    async function getAnuncios() {
        try {
            const snapshot = await db.collection('anuncios').get();
            const list = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                list.push({
                    id: doc.id,
                    ...data
                });
            });
            // Ordenar por fecha de creación desc
            list.sort((a, b) => (b.fechaCreado || 0) - (a.fechaCreado || 0));
            return list;
        } catch (e) {
            console.error("Error al obtener anuncios de Firestore:", e);
            return [];
        }
    }

    async function addAnuncio(anuncio) {
        try {
            await db.collection('anuncios').doc(anuncio.id).set({
                titulo: anuncio.titulo,
                remitente: anuncio.remitente,
                fechaExpiracion: anuncio.fechaExpiracion,
                fechaCreado: Date.now()
            });
        } catch (e) {
            console.error("Error al guardar anuncio en Firestore:", e);
            throw e;
        }
    }

    async function deleteAnuncio(id) {
        try {
            await db.collection('anuncios').doc(id).delete();
        } catch (e) {
            console.error("Error al eliminar anuncio de Firestore:", e);
            throw e;
        }
    }

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
        const rawList = await getAnuncios();

        // Filter valid non-expired items
        const validList = rawList.filter(item => isAnuncioValid(item.fechaExpiracion));

        // Purge expired anuncios permanently from storage
        for (const item of rawList) {
            if (!isAnuncioValid(item.fechaExpiracion)) {
                await deleteAnuncio(item.id).catch(() => {});
            }
        }

        if (validList.length === 0 && !isAdmin) {
            section.style.display = 'none';
            return;
        }

        // IF 1+ ANNOUNCEMENTS OR ADMIN -> SHOW ENTIRE SECTION DIV
        section.style.display = 'block';
        section.className = 'py-5 bg-light border-top border-bottom';
        if (titleBadge) titleBadge.style.display = 'block';

        if (adminBar) {
            if (isAdmin) {
                adminBar.classList.remove('d-none');
                adminBar.style.display = 'flex';
            } else {
                adminBar.classList.add('d-none');
                adminBar.style.display = 'none';
            }
        }

        container.innerHTML = '';

        validList.forEach((item) => {
            const col = document.createElement('div');
            col.className = 'anuncio-card-item';

            const remitenteHTML = item.remitente ? `
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <span class="badge bg-danger text-white rounded-pill px-3 py-1 font-weight-bold" style="font-size: 11px;">
                        <i class="bi bi-person-fill me-1"></i>${item.remitente}
                    </span>
                </div>
            ` : '';

            // "Vence" date formatted as DD/MM/YYYY, ONLY visible for Admin
            const dateDMY = formatDateDMY(item.fechaExpiracion);
            const adminInfoHTML = isAdmin ? `
                <div class="text-muted mt-2 small pt-1 border-top" style="font-size: 11px;">
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
                <div class="card h-100 border-0 shadow-sm rounded-4 p-4 bg-white card-hover-effect border-start border-4 border-danger">
                    ${remitenteHTML}
                    <h5 class="font-weight-bold text-dark my-2" style="font-size: 19px; line-height: 1.4;">${item.titulo}</h5>
                    ${adminInfoHTML}
                    ${deleteBtnHTML}
                </div>
            `;

            container.appendChild(col);
        });

        // Attach delete listeners with confirmation
        if (isAdmin) {
            const deleteBtns = container.querySelectorAll('.delete-anuncio-btn');
            deleteBtns.forEach(btn => {
                btn.addEventListener('click', async function () {
                    const idToDelete = this.getAttribute('data-id');
                    if (confirm('¿Estás seguro de que querés eliminar esta novedad?')) {
                        try {
                            await deleteAnuncio(idToDelete);
                            await renderAnuncios();
                            alert('Novedad eliminada correctamente.');
                        } catch (err) {
                            alert('Error al intentar eliminar de la base de datos.');
                        }
                    }
                });
            });
        }
    }

    // Execute render immediately and on DOM events
    renderAnuncios();
    document.addEventListener('DOMContentLoaded', renderAnuncios);
    window.addEventListener('load', renderAnuncios);

    document.addEventListener('DOMContentLoaded', function () {
        // Initialize Flatpickr calendar in Spanish with d/m/Y format
        const fechaEl = document.getElementById('anuncioFechaFin');
        if (fechaEl && typeof flatpickr !== 'undefined') {
            flatpickr(fechaEl, {
                dateFormat: 'd/m/Y',
                locale: (typeof flatpickr.l10ns !== 'undefined' && flatpickr.l10ns.es) ? flatpickr.l10ns.es : 'es',
                minDate: 'today',
                allowInput: true
            });
        }

        // Form submit for new anuncio with strict validation & confirmation
        const formNuevo = document.getElementById('formNuevoAnuncio');
        if (formNuevo) {
            formNuevo.addEventListener('submit', async function (e) {
                e.preventDefault();

                const tituloInput = document.getElementById('anuncioTitulo');
                const remitenteInput = document.getElementById('anuncioRemitente');
                const fechaFinInput = document.getElementById('anuncioFechaFin');

                const titulo = tituloInput ? tituloInput.value.trim() : '';
                const remitente = remitenteInput ? remitenteInput.value.trim() : '';
                const rawFecha = fechaFinInput ? fechaFinInput.value.trim() : '';

                // Strict Validation: ALL fields must be filled
                if (!titulo || !remitente || !rawFecha) {
                    alert('Por favor, completá todos los campos antes de guardar.');
                    return;
                }

                // Convert any input format (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD) to normalized YYYY-MM-DD
                const fechaExpiracion = normalizeDateYYYYMMDD(rawFecha);
                const dateDMY = formatDateDMY(fechaExpiracion);

                // Confirmation dialog before saving
                const confirmSave = confirm(`¿Confirmás la publicación de esta novedad?\n\nTítulo: ${titulo}\nRemitente: ${remitente}\nActivo hasta: ${dateDMY}`);
                if (!confirmSave) {
                    return;
                }

                const newAnuncio = {
                    id: Date.now().toString(),
                    titulo,
                    remitente,
                    fechaExpiracion
                };

                const submitBtn = formNuevo.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                }

                try {
                    await addAnuncio(newAnuncio);
                    formNuevo.reset();
                    const modalEl = document.getElementById('nuevoAnuncioModal');
                    if (modalEl && window.bootstrap && window.bootstrap.Modal) {
                        const modalObj = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
                        modalObj.hide();
                    }
                    await renderAnuncios();
                    alert('¡Novedad publicada correctamente!');
                } catch (err) {
                    alert('Error al publicar la novedad en la base de datos.');
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                    }
                }
            });
        }

        // Logout admin button listener
        const btnLogout = document.getElementById('btnLogoutAdmin');
        if (btnLogout) {
            btnLogout.addEventListener('click', function () {
                localStorage.removeItem('isAdminLoggedIn');
                localStorage.removeItem('adminUser');
                alert('Has cerrado sesión de administrador.');
                renderAnuncios();
            });
        }
    });

    // Expose renderAnuncios globally
    window.refreshAnuncios = renderAnuncios;
})();
