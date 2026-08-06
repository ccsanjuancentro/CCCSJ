// Management script for Próximos Encuentros (Calendar & Event Management for CCCSJ)
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

    const DEFAULT_ENCUENTROS = [
        { id: 'fixed_domingo', title: 'Reunión Dominical', time: '10:00 hs', lugar: 'En la iglesia', dayOfWeek: 0, isRecurring: true, isFixedDefault: true, borderClass: 'border-danger' },
        { id: 'fixed_miercoles', title: 'Grupo de Oración', time: '20:00 hs', lugar: 'En la iglesia', dayOfWeek: 3, isRecurring: true, isFixedDefault: true, borderClass: 'border-info' },
        { id: 'fixed_sabado_adol', title: 'Adolescentes', time: '18:00 hs', lugar: 'En la iglesia', dayOfWeek: 6, isRecurring: true, isFixedDefault: true, borderClass: 'border-info' },
        { id: 'fixed_sabado_jov', title: 'Jóvenes', time: '20:30 hs', lugar: 'En la iglesia', dayOfWeek: 6, isRecurring: true, isFixedDefault: true, borderClass: 'border-danger' }
    ];

    function checkAdminStatus() {
        return localStorage.getItem('isAdminLoggedIn') === 'true';
    }

    async function getEncuentros() {
        try {
            const snapshot = await db.collection('encuentros').get();
            const list = [];
            snapshot.forEach(doc => {
                list.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // If empty, seed database with default encounters
            if (list.length === 0) {
                for (const item of DEFAULT_ENCUENTROS) {
                    await db.collection('encuentros').doc(item.id).set(item);
                    list.push(item);
                }
            }
            return list;
        } catch (e) {
            console.error("Error al obtener encuentros de Firestore:", e);
            return DEFAULT_ENCUENTROS;
        }
    }

    async function getOverrides() {
        try {
            const snapshot = await db.collection('encuentros_overrides').get();
            const list = [];
            snapshot.forEach(doc => {
                list.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return list;
        } catch (e) {
            console.error("Error al obtener overrides de Firestore:", e);
            return [];
        }
    }

    async function saveEncuentros(list) {
        try {
            const snapshot = await db.collection('encuentros').get();
            const existingIds = [];
            snapshot.forEach(doc => existingIds.push(doc.id));

            for (const item of list) {
                await db.collection('encuentros').doc(item.id).set(item);
            }

            const newIds = list.map(item => item.id);
            for (const id of existingIds) {
                if (!newIds.includes(id)) {
                    await db.collection('encuentros').doc(id).delete();
                }
            }
        } catch (e) {
            console.error("Error al guardar encuentros en Firestore:", e);
        }
    }

    async function saveOverrides(list) {
        try {
            const snapshot = await db.collection('encuentros_overrides').get();
            const existingIds = [];
            snapshot.forEach(doc => existingIds.push(doc.id));

            for (const item of list) {
                const docId = `override_${item.encuentroId}_${item.fecha}`;
                await db.collection('encuentros_overrides').doc(docId).set({
                    encuentroId: item.encuentroId,
                    fecha: item.fecha,
                    cancelled: !!item.cancelled,
                    time: item.time || null,
                    lugar: item.lugar || null,
                    title: item.title || null
                });
            }

            const newDocIds = list.map(item => `override_${item.encuentroId}_${item.fecha}`);
            for (const id of existingIds) {
                if (!newDocIds.includes(id)) {
                    await db.collection('encuentros_overrides').doc(id).delete();
                }
            }
        } catch (e) {
            console.error("Error al guardar overrides en Firestore:", e);
        }
    }

    function normalizeDateYYYYMMDD(d) {
        if (!d) return '';
        if (typeof d === 'string') {
            const clean = d.trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
            if (clean.includes('/')) {
                const parts = clean.split('/');
                if (parts.length === 3) {
                    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
        }
        const dateObj = new Date(d);
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function formatDateDMY(isoDateStr) {
        if (!isoDateStr) return '';
        const parts = isoDateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return isoDateStr;
    }

    function getBorderClass(title) {
        const lower = (title || '').toLowerCase();
        if (lower.includes('dominical') || lower.includes('jóvenes') || lower.includes('jovenes')) return 'border-danger';
        if (lower.includes('oración') || lower.includes('oracion') || lower.includes('adolescentes')) return 'border-info';
        return 'border-primary';
    }

    function getEventsForDate(targetDate, allEncuentros, allOverrides) {
        const targetIso = normalizeDateYYYYMMDD(targetDate);
        const targetDayOfWeek = targetDate.getDay();

        let results = [];

        // 1. Recurring weekly events matching targetDayOfWeek
        allEncuentros.forEach(item => {
            if (item.isRecurring && item.dayOfWeek === targetDayOfWeek) {
                // Check if overridden for targetIso
                const override = allOverrides.find(o => o.encuentroId === item.id && o.fecha === targetIso);
                if (override) {
                    if (override.cancelled) {
                        results.push({
                            ...item,
                            isCancelled: true,
                            isOverridden: true
                        });
                    } else {
                        results.push({
                            ...item,
                            time: override.time || item.time,
                            lugar: override.lugar || item.lugar,
                            title: override.title || item.title,
                            isOverridden: true
                        });
                    }
                } else {
                    results.push(item);
                }
            }
        });

        // 2. Specific single-date events matching targetIso
        allEncuentros.forEach(item => {
            if (!item.isRecurring && item.fecha === targetIso) {
                results.push(item);
            }
        });

        return results;
    }

    async function renderEncuentrosCalendar() {
        const calendarContainer = document.getElementById('activitiesCalendarContainer');
        const adminBar = document.getElementById('adminEncuentrosBar');
        if (!calendarContainer) return;

        const isAdmin = checkAdminStatus();
        const allEncuentros = await getEncuentros();
        const allOverrides = await getOverrides();

        const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

        if (adminBar) {
            if (isAdmin) {
                adminBar.classList.remove('d-none');
                adminBar.style.display = 'flex';
            } else {
                adminBar.classList.add('d-none');
                adminBar.style.display = 'none';
            }
        }

        const today = new Date();
        const weekDatesIso = [];
        let html = "";

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date();
            currentDate.setDate(today.getDate() + i);
            const isoStr = normalizeDateYYYYMMDD(currentDate);
            weekDatesIso.push(isoStr);

            const dayOfWeek = currentDate.getDay();
            const dayOfMonth = currentDate.getDate();
            const monthName = monthNames[currentDate.getMonth()];
            const dayName = dayNames[dayOfWeek];

            let tagLabel = "";
            if (i === 0) tagLabel = "HOY";
            else if (i === 1) tagLabel = "MAÑANA";

            const formattedDate = `${dayOfMonth} ${monthName}`;
            const dayEvents = getEventsForDate(currentDate, allEncuentros, allOverrides);
            const hasEvents = dayEvents.length > 0;

            if (hasEvents) {
                let eventsHtml = "";
                dayEvents.forEach(event => {
                    const bClass = event.borderClass || getBorderClass(event.title);
                    const lugarHTML = (event.lugar && event.lugar !== 'En la iglesia') ? `<span class="text-muted small" style="font-size: 10px;"><i class="bi bi-geo-alt-fill me-1"></i>${event.lugar}</span>` : '';
                    
                    const adminActionButtons = isAdmin ? `
                        <div class="mt-1 pt-1 border-top d-flex gap-1 justify-content-end">
                            <button class="btn btn-sm btn-outline-primary py-0 px-1 btn-edit-encuentro" data-id="${event.id}" data-date="${isoStr}" title="Editar / Horario Especial / Eliminar" style="font-size: 10px;">
                                <i class="bi bi-pencil-fill"></i> Editar
                            </button>
                        </div>
                    ` : '';

                    if (event.isCancelled) {
                        eventsHtml += `
                            <div class="p-2 rounded-3 border-start border-3 border-danger shadow-sm d-flex flex-column gap-1 position-relative" style="background-color: #ffeef0;">
                                <div class="d-flex align-items-center justify-content-between">
                                    <h6 class="text-danger mb-0 font-weight-bold text-decoration-line-through" style="font-size: 13px; line-height: 1.2;">${event.title}</h6>
                                    <span class="badge bg-danger text-white ms-1" style="font-size: 8.5px; font-weight: 700;">CANCELADO</span>
                                </div>
                                <span class="text-danger" style="font-size: 10.5px; font-weight: 600;"><i class="bi bi-x-circle-fill me-1"></i>Reunión Suspendida</span>
                                ${adminActionButtons}
                            </div>
                        `;
                    } else {
                        const overrideBadge = event.isOverridden ? `<span class="badge bg-warning text-dark me-1" style="font-size: 8px;">Horario especial</span>` : '';
                        eventsHtml += `
                            <div class="p-2 bg-white rounded-3 border-start border-3 ${bClass} shadow-sm d-flex flex-column gap-1 position-relative">
                                <div class="d-flex align-items-center justify-content-between">
                                    <h6 class="text-dark mb-0 font-weight-bold" style="font-size: 13px; line-height: 1.2;">${event.title}</h6>
                                    ${overrideBadge}
                                </div>
                                <span class="text-muted" style="font-size: 10.5px; font-weight: 600;"><i class="bi bi-clock-fill me-1 text-primary"></i>${event.time}</span>
                                ${lugarHTML}
                                ${adminActionButtons}
                            </div>
                        `;
                    }
                });

                html += `
                    <div class="calendar-day-col">
                        <div class="card w-100 rounded-4 shadow-sm p-3 calendar-active-card d-flex flex-column h-100">
                            <div class="border-bottom pb-2 mb-2">
                                ${tagLabel ? `<span class="badge bg-primary text-white mb-1" style="font-size: 9px; letter-spacing: 0.5px;">${tagLabel}</span>` : ''}
                                <span class="text-primary font-weight-bold d-block text-uppercase" style="font-size: 11px;">${dayName}</span>
                                <h5 class="text-dark mb-0 font-weight-bold" style="font-size: 17px;">${formattedDate}</h5>
                            </div>
                            <div class="d-flex flex-column gap-2 my-auto">
                                ${eventsHtml}
                            </div>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="calendar-day-col">
                        <div class="card w-100 rounded-4 p-3 calendar-empty-card d-flex flex-column h-100">
                            <div class="pb-2 mb-2">
                                ${tagLabel ? `<span class="badge bg-secondary text-white mb-1" style="font-size: 9px; letter-spacing: 0.5px;">${tagLabel}</span>` : ''}
                                <span class="text-muted font-weight-bold d-block text-uppercase" style="font-size: 11px;">${dayName}</span>
                                <h5 class="text-secondary mb-0 font-weight-bold" style="font-size: 16px;">${formattedDate}</h5>
                            </div>
                            <div class="my-auto text-center">
                                <span class="text-muted fst-italic" style="font-size: 11px; opacity: 0.5;">Sin encuentros</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        calendarContainer.innerHTML = html;

        // Render Future / Off-Calendar Events List for Admin in Grey ("Eventos Futuros Grisados")
        renderFutureEventsGrisados(isAdmin, weekDatesIso, allEncuentros);

        // Attach event listeners for Admin edit buttons
        if (isAdmin) {
            const editBtns = calendarContainer.querySelectorAll('.btn-edit-encuentro');
            editBtns.forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = this.getAttribute('data-id');
                    const targetIso = this.getAttribute('data-date');
                    openEditarModal(id, targetIso);
                });
            });
        }
    }

    function renderFutureEventsGrisados(isAdmin, currentWeekIsoList, allEncuentros) {
        const container = document.getElementById('futureEventsContainer');
        const section = document.getElementById('futureEventsSection');
        if (!container || !section) return;

        if (!isAdmin) {
            section.style.display = 'none';
            return;
        }

        const todayIso = normalizeDateYYYYMMDD(new Date());

        // Find single-date future events that are AFTER current week
        const futureEvents = allEncuentros.filter(item => {
            if (item.isRecurring) return false;
            return item.fecha > todayIso && !currentWeekIsoList.includes(item.fecha);
        });

        futureEvents.sort((a, b) => a.fecha.localeCompare(b.fecha));

        if (futureEvents.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        container.innerHTML = '';

        futureEvents.forEach(event => {
            const dateDMY = formatDateDMY(event.fecha);
            const card = document.createElement('div');
            card.className = 'col-12 col-md-6 col-lg-4 mb-3';
            card.innerHTML = `
                <div class="card border border-secondary bg-light rounded-4 shadow-sm p-3 text-muted position-relative" style="opacity: 0.85;">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <span class="badge bg-secondary text-white font-weight-bold" style="font-size: 10px;">
                            <i class="bi bi-clock-history me-1"></i> Programado (Aún no visible)
                        </span>
                        <span class="small font-weight-bold text-dark"><i class="bi bi-calendar-event me-1"></i>${dateDMY}</span>
                    </div>
                    <h6 class="text-dark font-weight-bold mb-1">${event.title}</h6>
                    <div class="small d-flex flex-column gap-1">
                        <span><i class="bi bi-clock me-1"></i><strong>Horario:</strong> ${event.time}</span>
                        <span><i class="bi bi-geo-alt me-1"></i><strong>Lugar:</strong> ${event.lugar || 'En la iglesia'}</span>
                    </div>
                    <div class="mt-3 pt-2 border-top d-flex gap-2 justify-content-end">
                        <button class="btn btn-sm btn-outline-danger py-1 px-2 btn-delete-future" data-id="${event.id}" style="font-size: 11px;">
                            <i class="bi bi-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        // Attach delete listeners
        const deleteBtns = container.querySelectorAll('.btn-delete-future');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', async function () {
                const idToDelete = this.getAttribute('data-id');
                if (confirm('¿Estás seguro de eliminar este evento futuro?')) {
                    const list = (await getEncuentros()).filter(item => item.id !== idToDelete);
                    await saveEncuentros(list);
                    await renderEncuentrosCalendar();
                    alert('Evento futuro eliminado.');
                }
            });
        });
    }

    async function openEditarModal(id, targetIso) {
        const allEncuentros = await getEncuentros();
        const event = allEncuentros.find(e => e.id === id);
        if (!event) return;

        const modalEl = document.getElementById('editarEncuentroModal');
        if (!modalEl || !window.bootstrap) return;

        document.getElementById('editEncuentroId').value = event.id;
        document.getElementById('editEncuentroTargetIso').value = targetIso || '';
        document.getElementById('editEncuentroTitle').value = event.title;
        document.getElementById('editEncuentroTime').value = event.time;
        document.getElementById('editEncuentroLugar').value = event.lugar || 'En la iglesia';

        // Set date input value
        const editFechaInput = document.getElementById('editEncuentroFecha');
        if (editFechaInput) {
            editFechaInput.value = formatDateDMY(targetIso || event.fecha || normalizeDateYYYYMMDD(new Date()));
        }

        // Set cancellation checkbox status
        const overrides = await getOverrides();
        const currentOverride = overrides.find(o => o.encuentroId === id && o.fecha === targetIso);
        const cancelledCheck = document.getElementById('editEncuentroCancelled');
        if (cancelledCheck) {
            cancelledCheck.checked = !!(currentOverride && currentOverride.cancelled);
        }

        const scopeContainer = document.getElementById('containerEditScopeRadio');
        if (scopeContainer) {
            scopeContainer.style.display = event.isRecurring ? 'block' : 'none';
        }

        const modalObj = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
        modalObj.show();
    }

    document.addEventListener('DOMContentLoaded', function () {
        renderEncuentrosCalendar();
        window.addEventListener('load', renderEncuentrosCalendar);

        // Setup Flatpickr for date inputs
        const fechaEl = document.getElementById('encuentroFecha');
        if (fechaEl && typeof flatpickr !== 'undefined') {
            flatpickr(fechaEl, {
                dateFormat: 'd/m/Y',
                locale: (typeof flatpickr.l10ns !== 'undefined' && flatpickr.l10ns.es) ? flatpickr.l10ns.es : 'es',
                minDate: 'today',
                allowInput: true
            });
        }

        const editFechaEl = document.getElementById('editEncuentroFecha');
        if (editFechaEl && typeof flatpickr !== 'undefined') {
            flatpickr(editFechaEl, {
                dateFormat: 'd/m/Y',
                locale: (typeof flatpickr.l10ns !== 'undefined' && flatpickr.l10ns.es) ? flatpickr.l10ns.es : 'es',
                allowInput: true
            });
        }

        // Setup Flatpickr time picker clock helpers for encounter time inputs
        const timeInputEls = [document.getElementById('encuentroTime'), document.getElementById('editEncuentroTime')];
        timeInputEls.forEach(timeEl => {
            if (timeEl && typeof flatpickr !== 'undefined') {
                flatpickr(timeEl, {
                    enableTime: true,
                    noCalendar: true,
                    dateFormat: "H:i",
                    time_24hr: true,
                    allowInput: true
                });
            }
        });

        // Toggle specific date vs recurring input in Nuevo Encuentro Modal
        const tipoSelect = document.getElementById('encuentroTipoRepeticion');
        const containerFecha = document.getElementById('containerEncuentroFecha');
        const containerDiaSemana = document.getElementById('containerEncuentroDiaSemana');

        if (tipoSelect) {
            tipoSelect.addEventListener('change', function () {
                if (this.value === 'semanal') {
                    if (containerFecha) containerFecha.style.display = 'none';
                    if (containerDiaSemana) containerDiaSemana.style.display = 'block';
                } else {
                    if (containerFecha) containerFecha.style.display = 'block';
                    if (containerDiaSemana) containerDiaSemana.style.display = 'none';
                }
            });
        }

        // Handle Nuevo Encuentro Form Submission
        const formNuevo = document.getElementById('formNuevoEncuentro');
        if (formNuevo) {
            formNuevo.addEventListener('submit', async function (e) {
                e.preventDefault();

                const titleInput = document.getElementById('encuentroTitle');
                const timeInput = document.getElementById('encuentroTime');
                const lugarInput = document.getElementById('encuentroLugar');
                const tipoVal = document.getElementById('encuentroTipoRepeticion').value;

                const title = titleInput.value.trim();
                const time = timeInput.value.trim();
                const lugar = lugarInput.value.trim() || 'En la iglesia';

                if (!title || !time) {
                    alert('Por favor completá el ministerio/título y el horario.');
                    return;
                }

                let newEncuentro = {
                    id: Date.now().toString(),
                    title: title,
                    time: time,
                    lugar: lugar,
                    borderClass: getBorderClass(title)
                };

                if (tipoVal === 'semanal') {
                    const dayOfWeek = parseInt(document.getElementById('encuentroDiaSemana').value, 10);
                    newEncuentro.isRecurring = true;
                    newEncuentro.dayOfWeek = dayOfWeek;
                } else {
                    const rawFecha = document.getElementById('encuentroFecha').value.trim();
                    if (!rawFecha) {
                        alert('Por favor seleccioná la fecha del encuentro.');
                        return;
                    }
                    const isoFecha = normalizeDateYYYYMMDD(rawFecha);
                    const targetDateObj = new Date(isoFecha + 'T00:00:00');

                    newEncuentro.isRecurring = false;
                    newEncuentro.fecha = isoFecha;
                    newEncuentro.dayOfWeek = targetDateObj.getDay();
                }

                const submitBtn = formNuevo.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.disabled = true;

                try {
                    const list = await getEncuentros();
                    list.push(newEncuentro);
                    await saveEncuentros(list);

                    formNuevo.reset();
                    const modalEl = document.getElementById('nuevoEncuentroModal');
                    if (modalEl && window.bootstrap) {
                        const modalObj = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
                        modalObj.hide();
                    }

                    await renderEncuentrosCalendar();
                    alert('¡Encuentro creado con éxito!');
                } catch (err) {
                    alert('Error al guardar el encuentro en la base de datos.');
                } finally {
                    if (submitBtn) submitBtn.disabled = false;
                }
            });
        }

        // Handle Delete Encuentro Button
        const btnDelete = document.getElementById('btnDeleteEncuentro');
        if (btnDelete) {
            btnDelete.addEventListener('click', async function () {
                const id = document.getElementById('editEncuentroId').value;
                const targetIso = document.getElementById('editEncuentroTargetIso').value;
                const list = await getEncuentros();
                const item = list.find(e => e.id === id);

                if (!item) return;

                const submitBtn = this;
                submitBtn.disabled = true;

                try {
                    if (item.isRecurring) {
                        if (confirm('¿Querés cancelar esta reunión solo para este día (en rojo) o eliminar la regla semanal por completo?\n\n[OK] = Cancelar solo para este día (se verá en rojo)\n[Cancelar] = Eliminar encuentro semanal permanentemente')) {
                            const overrides = await getOverrides();
                            const filtered = overrides.filter(o => !(o.encuentroId === id && o.fecha === targetIso));
                            filtered.push({ encuentroId: id, fecha: targetIso, cancelled: true });
                            await saveOverrides(filtered);
                        } else {
                            const updated = list.filter(e => e.id !== id);
                            await saveEncuentros(updated);
                        }
                    } else {
                        if (confirm('¿Estás seguro de eliminar este encuentro?')) {
                            const updated = list.filter(e => e.id !== id);
                            await saveEncuentros(updated);
                        }
                    }

                    const modalEl = document.getElementById('editarEncuentroModal');
                    if (modalEl && window.bootstrap) {
                        const modalObj = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
                        modalObj.hide();
                    }
                    await renderEncuentrosCalendar();
                } catch (err) {
                    alert('Error al intentar eliminar el encuentro.');
                } finally {
                    submitBtn.disabled = false;
                }
            });
        }

        // Handle Editar Encuentro Form
        const formEditar = document.getElementById('formEditarEncuentro');
        if (formEditar) {
            formEditar.addEventListener('submit', async function (e) {
                e.preventDefault();

                const id = document.getElementById('editEncuentroId').value;
                const targetIso = document.getElementById('editEncuentroTargetIso').value;
                const newTitle = document.getElementById('editEncuentroTitle').value.trim();
                const newTime = document.getElementById('editEncuentroTime').value.trim();
                const newLugar = document.getElementById('editEncuentroLugar').value.trim() || 'En la iglesia';
                const rawNewFecha = document.getElementById('editEncuentroFecha').value.trim();
                const isCancelled = document.getElementById('editEncuentroCancelled').checked;
                const scopeRadio = document.querySelector('input[name="editScopeRadio"]:checked');
                const editScope = scopeRadio ? scopeRadio.value : 'especial';

                if (!newTitle || !newTime) {
                    alert('Por favor completá los campos.');
                    return;
                }

                const submitBtn = formEditar.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.disabled = true;

                try {
                    const list = await getEncuentros();
                    const item = list.find(e => e.id === id);
                    if (!item) return;

                    const newIsoFecha = normalizeDateYYYYMMDD(rawNewFecha);

                    if (isCancelled) {
                        // Mark as cancelled for targetIso
                        const overrides = await getOverrides();
                        const filtered = overrides.filter(o => !(o.encuentroId === id && o.fecha === targetIso));
                        filtered.push({ encuentroId: id, fecha: targetIso, cancelled: true });
                        await saveOverrides(filtered);
                    } else if (!item.isRecurring) {
                        // Single date event modification
                        item.title = newTitle;
                        item.time = newTime;
                        item.lugar = newLugar;
                        item.borderClass = getBorderClass(newTitle);
                        if (newIsoFecha) {
                            item.fecha = newIsoFecha;
                            const dObj = new Date(newIsoFecha + 'T00:00:00');
                            item.dayOfWeek = dObj.getDay();
                        }
                        await saveEncuentros(list);
                    } else if (editScope === 'permanente') {
                        // Update main recurring object permanently
                        item.title = newTitle;
                        item.time = newTime;
                        item.lugar = newLugar;
                        item.borderClass = getBorderClass(newTitle);
                        await saveEncuentros(list);
                    } else {
                        // Create single day override exception
                        const overrides = await getOverrides();
                        const filtered = overrides.filter(o => !(o.encuentroId === id && o.fecha === targetIso));
                        
                        if (newIsoFecha && newIsoFecha !== targetIso) {
                            // Date changed for single occurrence
                            filtered.push({ encuentroId: id, fecha: targetIso, cancelled: true });
                            await saveOverrides(filtered);

                            const dObj = new Date(newIsoFecha + 'T00:00:00');
                            list.push({
                                id: Date.now().toString(),
                                title: newTitle,
                                time: newTime,
                                lugar: newLugar,
                                fecha: newIsoFecha,
                                dayOfWeek: dObj.getDay(),
                                isRecurring: false,
                                borderClass: getBorderClass(newTitle)
                            });
                            await saveEncuentros(list);
                        } else {
                            filtered.push({
                                encuentroId: id,
                                fecha: targetIso,
                                title: newTitle,
                                time: newTime,
                                lugar: newLugar,
                                cancelled: false
                            });
                            await saveOverrides(filtered);
                        }
                    }

                    const modalEl = document.getElementById('editarEncuentroModal');
                    if (modalEl && window.bootstrap) {
                        const modalObj = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
                        modalObj.hide();
                    }

                    await renderEncuentrosCalendar();
                    alert('¡Modificación guardada exitosamente!');
                } catch (err) {
                    alert('Error al guardar la modificación.');
                } finally {
                    if (submitBtn) submitBtn.disabled = false;
                }
            });

            // Handle Reset to Defaults button
            const btnResetDefaults = document.getElementById('btnResetEncuentrosDefaults');
            if (btnResetDefaults) {
                btnResetDefaults.addEventListener('click', async function () {
                    if (confirm('¿Querés restablecer los 4 encuentros fijos originales?')) {
                        const submitBtn = this;
                        submitBtn.disabled = true;
                        try {
                            await saveEncuentros(DEFAULT_ENCUENTROS);
                            await saveOverrides([]);
                            await renderEncuentrosCalendar();
                            alert('Encuentros restablecidos a los 4 fijos originales.');
                        } catch (err) {
                            alert('Error al restablecer los encuentros.');
                        } finally {
                            submitBtn.disabled = false;
                        }
                    }
                });
            }
        }
    });

    window.refreshEncuentros = renderEncuentrosCalendar;
})();
