// Management script for Destacados using Firebase Storage & Firestore
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
    const storage = firebase.storage();

    if (firebase.auth) {
        firebase.auth().signInAnonymously().catch(err => {
            console.error("Error al autenticar anónimamente en destacados.js:", err);
        });
    }

    let activePreviewList = [];
    let currentPreviewIndex = 0;

    async function getDestacadosAsync() {
        try {
            const snapshot = await db.collection('destacados').get();
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
            console.error("Error al obtener destacados de Firestore:", e);
            return [];
        }
    }

    async function uploadDestacadoAsync(file, fechaExpiracion) {
        try {
            const id = Date.now().toString();
            const extension = file.name.split('.').pop();
            const storagePath = `destacados/${id}.${extension}`;
            const storageRef = storage.ref().child(storagePath);

            // Subir archivo a Storage
            const uploadTask = await storageRef.put(file);
            const fileUrl = await uploadTask.ref.getDownloadURL();

            // Guardar metadatos en Firestore
            await db.collection('destacados').doc(id).set({
                fileUrl: fileUrl,
                fileType: file.type,
                fechaExpiracion: fechaExpiracion,
                fechaCreado: Date.now()
            });
        } catch (e) {
            console.error("Error al subir destacado a Firebase:", e);
            throw e;
        }
    }

    async function deleteDestacadoAsync(id, fileUrl) {
        try {
            // Eliminar de Storage
            if (fileUrl) {
                try {
                    const storageRef = storage.refFromURL(fileUrl);
                    await storageRef.delete();
                } catch (err) {
                    console.warn("No se pudo eliminar el archivo de Storage:", err);
                }
            }
            // Eliminar de Firestore
            await db.collection('destacados').doc(id).delete();
        } catch (e) {
            console.error("Error al eliminar destacado de Firebase:", e);
            throw e;
        }
    }

    function getItemMediaSrc(item) {
        if (!item) return '';
        return item.fileUrl || '';
    }

    function normalizeDateYYYYMMDD(dateStr) {
        if (!dateStr) return '';
        const clean = dateStr.trim();

        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(clean)) {
            const parts = clean.split('-');
            const y = parts[0];
            const m = parts[1].padStart(2, '0');
            const d = parts[2].padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

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

                const mStr = String(month).padStart(2, '0');
                const dStr = String(day).padStart(2, '0');
                return `${y}-${mStr}-${dStr}`;
            }
        }

        const parsed = new Date(clean);
        if (!isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const mStr = String(parsed.getMonth() + 1).padStart(2, '0');
            const dStr = String(parsed.getDate()).padStart(2, '0');
            return `${y}-${mStr}-${dStr}`;
        }

        return clean;
    }

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

    function isDestacadoValid(dateStr) {
        if (!dateStr) return true;
        try {
            const normalized = normalizeDateYYYYMMDD(dateStr);
            const todayStr = getTodayYYYYMMDD();
            return normalized >= todayStr;
        } catch (e) {
            return true;
        }
    }

    function checkAdminStatus() {
        return localStorage.getItem('isAdminLoggedIn') === 'true';
    }

    function updateModalImage(index) {
        if (activePreviewList.length === 0) return;
        currentPreviewIndex = (index + activePreviewList.length) % activePreviewList.length;
        const currentItem = activePreviewList[currentPreviewIndex];
        const modalImg = document.getElementById('destacadoModalFullImage');
        const prevBtn = document.getElementById('prevDestacadoModalBtn');
        const nextBtn = document.getElementById('nextDestacadoModalBtn');
        const counterEl = document.getElementById('destacadoModalCounter');

        if (modalImg && currentItem) {
            modalImg.src = getItemMediaSrc(currentItem);
        }

        if (activePreviewList.length > 1) {
            if (prevBtn) prevBtn.style.display = 'flex';
            if (nextBtn) nextBtn.style.display = 'flex';
            if (counterEl) {
                counterEl.style.display = 'block';
                counterEl.textContent = `${currentPreviewIndex + 1} / ${activePreviewList.length}`;
            }
        } else {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            if (counterEl) counterEl.style.display = 'none';
        }
    }

    async function renderDestacados() {
        const section = document.getElementById('destacados-section');
        const container = document.getElementById('destacados-container');
        const adminBar = document.getElementById('adminDestacadosBar');
        if (!container || !section) return;

        const isAdmin = checkAdminStatus();
        const rawList = await getDestacadosAsync();

        // Filter valid non-expired items
        const validList = rawList.filter(item => isDestacadoValid(item.fechaExpiracion));
        activePreviewList = validList;

        // Purge expired items permanently
        for (const item of rawList) {
            if (!isDestacadoValid(item.fechaExpiracion)) {
                await deleteDestacadoAsync(item.id, item.fileUrl).catch(() => {});
            }
        }

        if (validList.length === 0 && !isAdmin) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';

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

        validList.forEach((item, index) => {
            const cardItem = document.createElement('div');
            cardItem.className = 'destacado-card-item';

            const mediaSrc = getItemMediaSrc(item);

            let mediaHTML = '';
            if (item.fileType && item.fileType.startsWith('video/')) {
                mediaHTML = `
                    <div class="ratio ratio-16x9 rounded-4 overflow-hidden bg-black shadow-sm">
                        <video src="${mediaSrc}" controls muted class="w-100 h-100 object-fit-cover"></video>
                    </div>
                `;
            } else {
                mediaHTML = `
                    <div class="overflow-hidden rounded-4 bg-transparent d-flex align-items-center justify-content-center destacado-img-wrapper" style="height: 460px; width: 100%; cursor: pointer;" title="Haz clic para ver en grande">
                        <img src="${mediaSrc}" class="destacado-img-element" style="max-width: 100%; max-height: 100%; object-fit: contain; transition: transform 0.3s ease;" alt="Destacado">
                    </div>
                `;
            }

            const dateDMY = formatDateDMY(item.fechaExpiracion);
            const adminInfoHTML = isAdmin ? `
                <div class="d-flex align-items-center justify-content-between text-muted mt-2 small px-1" style="font-size: 11px;">
                    <span><i class="bi bi-calendar-event me-1"></i>Vence: <strong>${dateDMY || 'Sin fecha'}</strong></span>
                    <button class="btn btn-outline-danger btn-sm rounded-pill px-2 py-0 delete-destacado-btn" data-id="${item.id}" data-url="${item.fileUrl || ''}" style="font-size: 11px;">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </div>
            ` : '';

            cardItem.innerHTML = `
                <div class="position-relative">
                    ${mediaHTML}
                    ${adminInfoHTML}
                </div>
            `;

            // Attach click event for image modal preview
            const imgWrapper = cardItem.querySelector('.destacado-img-wrapper');
            if (imgWrapper) {
                imgWrapper.addEventListener('click', function () {
                    const modalEl = document.getElementById('destacadoImageModal');
                    if (modalEl && window.bootstrap) {
                        if (modalEl.parentElement !== document.body) {
                            document.body.appendChild(modalEl);
                        }
                        updateModalImage(index);
                        const modalObj = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
                        modalObj.show();
                    }
                });
            }

            container.appendChild(cardItem);
        });

        if (isAdmin) {
            const deleteBtns = container.querySelectorAll('.delete-destacado-btn');
            deleteBtns.forEach(btn => {
                btn.addEventListener('click', async function () {
                    const idToDelete = this.getAttribute('data-id');
                    const fileUrlToDelete = this.getAttribute('data-url');
                    if (confirm('¿Estás seguro de que querés eliminar este destacado?')) {
                        try {
                            await deleteDestacadoAsync(idToDelete, fileUrlToDelete);
                            await renderDestacados();
                            alert('Destacado eliminado correctamente.');
                        } catch (err) {
                            alert('Error al intentar eliminar el destacado.');
                        }
                    }
                });
            });
        }
    }

    renderDestacados();
    document.addEventListener('DOMContentLoaded', renderDestacados);
    window.addEventListener('load', renderDestacados);

    document.addEventListener('DOMContentLoaded', function () {
        // Initialize Flatpickr for Destacados date input
        const fechaEl = document.getElementById('destacadoFechaFin');
        if (fechaEl && typeof flatpickr !== 'undefined') {
            flatpickr(fechaEl, {
                dateFormat: 'd/m/Y',
                locale: (typeof flatpickr.l10ns !== 'undefined' && flatpickr.l10ns.es) ? flatpickr.l10ns.es : 'es',
                minDate: 'today',
                allowInput: true
            });
        }

        // Modal prev/next controls
        const prevBtn = document.getElementById('prevDestacadoModalBtn');
        const nextBtn = document.getElementById('nextDestacadoModalBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                updateModalImage(currentPreviewIndex - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                updateModalImage(currentPreviewIndex + 1);
            });
        }

        document.addEventListener('keydown', function (e) {
            const modalEl = document.getElementById('destacadoImageModal');
            if (modalEl && modalEl.classList.contains('show')) {
                if (e.key === 'ArrowLeft') {
                    updateModalImage(currentPreviewIndex - 1);
                } else if (e.key === 'ArrowRight') {
                    updateModalImage(currentPreviewIndex + 1);
                }
            }
        });

        // Attach global logout button event listeners
        const logoutBtns = document.querySelectorAll('.btnLogoutAdminGlobal, #btnLogoutAdmin');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                localStorage.removeItem('isAdminLoggedIn');
                localStorage.removeItem('adminUser');
                alert('Has cerrado sesión de administrador.');
                if (window.refreshAnuncios) window.refreshAnuncios();
                renderDestacados();
            });
        });

        const formNuevo = document.getElementById('formNuevoDestacado');
        if (formNuevo) {
            formNuevo.addEventListener('submit', async function (e) {
                e.preventDefault();

                const fileInput = document.getElementById('destacadoFile');
                const fechaInput = document.getElementById('destacadoFechaFin');

                if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                    alert('Por favor, seleccioná un archivo de imagen o video para subir.');
                    return;
                }

                const rawFecha = fechaInput ? fechaInput.value.trim() : '';
                if (!rawFecha) {
                    alert('Por favor, seleccioná hasta qué fecha estará visible.');
                    return;
                }

                const fechaExpiracion = normalizeDateYYYYMMDD(rawFecha);
                const dateDMY = formatDateDMY(fechaExpiracion);
                const file = fileInput.files[0];

                // Enforce 300 MB maximum file size limit
                const maxMB = 300;
                const maxBytes = maxMB * 1024 * 1024;
                if (file.size > maxBytes) {
                    alert(`El archivo seleccionado es demasiado grande (${(file.size / (1024 * 1024)).toFixed(1)} MB). El límite máximo permitido es de ${maxMB} MB.`);
                    return;
                }

                const submitBtn = formNuevo.querySelector('button[type="submit"]');
                const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';

                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = `
                        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        <i class="bi bi-clock-history me-1"></i> Procesando y Subiendo...
                    `;
                }

                try {
                    await uploadDestacadoAsync(file, fechaExpiracion);

                    formNuevo.reset();
                    const modalEl = document.getElementById('nuevoDestacadoModal');
                    if (modalEl && window.bootstrap && window.bootstrap.Modal) {
                        const modalObj = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
                        modalObj.hide();
                    }

                    await renderDestacados();
                    alert(`¡Destacado publicado con éxito! Estará visible hasta el ${dateDMY}.`);
                } catch (err) {
                    console.error('Error saving to Firebase:', err);
                    alert('Ocurrió un error al subir el archivo a Firebase.');
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnHTML;
                    }
                }
            });
        }
    });

    window.refreshDestacados = renderDestacados;
})();
