// Importa Firebase, Firestore, Storage y Auth de la versión modular
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

let hayAlgo = false;

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

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Iniciar sesión anónimamente para tener permisos de escritura
signInAnonymously(auth).catch(err => {
    console.error("Error al autenticar anónimamente en firebase-events.js:", err);
});

function checkAdminStatus() {
    return localStorage.getItem('isAdminLoggedIn') === 'true';
}

// Función para formatear la fecha
function formatearFecha(timestamp) {
    if (!timestamp) return '';
    let fecha;
    if (timestamp.toDate) {
        fecha = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        fecha = timestamp;
    } else {
        fecha = new Date(timestamp);
    }
    return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function cargarEventos() {
    const eventosSectionContent = document.getElementById('eventos-section-content'); 
    const eventosContainer = document.getElementById('eventos-container');
    const adminEventosBar = document.getElementById('adminEventosBar');
    
    if (!eventosContainer) return;

    eventosContainer.innerHTML = '';
    const isAdmin = checkAdminStatus();

    // Mostrar/ocultar barra de administración de eventos
    if (adminEventosBar) {
        if (isAdmin) {
            adminEventosBar.style.setProperty('display', 'flex', 'important');
        } else {
            adminEventosBar.style.setProperty('display', 'none', 'important');
        }
    }

    try {
        const querySnapshot = await getDocs(collection(db, "eventos"));
        const ahora = new Date(); 
        let hayEventos = false; 
        const isEnglish = window.location.pathname.includes('index_en.html');

        querySnapshot.forEach((docSnap) => {
            const evento = docSnap.data();
            if (!evento.fecha) return;
            
            let fechaEvento;
            if (evento.fecha.toDate) {
                fechaEvento = evento.fecha.toDate();
            } else {
                fechaEvento = new Date(evento.fecha);
            }

            // Los eventos se muestran si la fecha es futura o si es administrador (para poder verlos y borrarlos)
            if (fechaEvento > ahora || isAdmin) {
                hayEventos = true;
                hayAlgo = true;
                
                let urlImagen = evento.imagen;
                if (!urlImagen || urlImagen === ".jpg" || urlImagen === "undefined.jpg") {
                    urlImagen = "https://imgur.com/sG0VnFl.jpg";
                }
                
                const eventoDiv = document.createElement('div');
                eventoDiv.classList.add('col-lg-4', 'col-12', 'mb-3');
                
                let mostrarFecha = evento.mostrarFecha !== false; 
                let fechaHTML = mostrarFecha ? `<p class="product-p">${formatearFecha(evento.fecha)}</p>` : '';

                // Botón de eliminar para administrador
                const deleteBtnHTML = isAdmin ? `
                    <div class="mt-2 text-end">
                        <button class="btn btn-outline-danger btn-sm rounded-pill px-3 delete-evento-btn" data-id="${docSnap.id}" data-image="${evento.imagen || ''}">
                            <i class="bi bi-trash me-1"></i> ${isEnglish ? 'Delete' : 'Eliminar'}
                        </button>
                    </div>
                ` : '';

                eventoDiv.innerHTML = `
                    <div class="product-thumb">
                        <a>
                            <img src="${urlImagen}" class="img-fluid product-image " alt="${evento.nombre || ''}" onerror="this.src='images/eventos/error_evento.jpg';">
                        </a>
                        <div class="product-info d-flex flex-column" style="width: 100%;">
                            <div style="flex-grow: 1;">
                                <h5 class="product-title mb-0">
                                    <a class="product-title-link">${evento.nombre || ''}</a>
                                </h5>
                                ${fechaHTML}
                                <p class="product-p">${evento.descripcion || ''}</p>
                            </div>
                            ${deleteBtnHTML}
                        </div>
                    </div>
                `;

                eventosContainer.appendChild(eventoDiv);
            }
        });

        if (eventosSectionContent) {
            // Siempre mostrar la sección si el administrador está logueado para poder agregar eventos
            eventosSectionContent.style.display = (hayEventos || isAdmin) ? 'block' : 'none';
        }

        // Asignar listeners de eliminación
        if (isAdmin) {
            const deleteBtns = eventosContainer.querySelectorAll('.delete-evento-btn');
            deleteBtns.forEach(btn => {
                btn.addEventListener('click', async function () {
                    const idToDelete = this.getAttribute('data-id');
                    const imageUrl = this.getAttribute('data-image');
                    const confirmMsg = isEnglish ? 'Are you sure you want to delete this event?' : '¿Estás seguro de que querés eliminar este evento?';
                    
                    if (confirm(confirmMsg)) {
                        try {
                            // Borrar imagen de Storage si es una URL de Firebase
                            if (imageUrl && imageUrl.includes('firebasestorage.googleapis.com')) {
                                try {
                                    const storageRef = ref(storage, imageUrl);
                                    await deleteObject(storageRef);
                                } catch (storageErr) {
                                    console.warn("No se pudo borrar la imagen de Storage:", storageErr);
                                }
                            }
                            // Borrar documento de Firestore
                            await deleteDoc(doc(db, "eventos", idToDelete));
                            await cargarEventos();
                            alert(isEnglish ? 'Event deleted successfully.' : 'Evento eliminado correctamente.');
                        } catch (err) {
                            console.error("Error al eliminar evento:", err);
                            alert(isEnglish ? 'Error trying to delete from database.' : 'Error al intentar eliminar de la base de datos.');
                        }
                    }
                });
            });
        }
    } catch (error) {
        console.error("Error al cargar eventos:", error);
    }
}

async function cargarContenido() {
    await cargarEventos(); 
    const eventosSection = document.getElementById('eventos-section');
    const isAdmin = checkAdminStatus();

    if (eventosSection) {
        eventosSection.style.display = (hayAlgo || isAdmin) ? 'block' : 'none';
    }
}

// Asignar listeners para la creación de eventos
document.addEventListener('DOMContentLoaded', () => {
    const formNuevo = document.getElementById('formNuevoEvento');
    if (formNuevo) {
        formNuevo.addEventListener('submit', async function (e) {
            e.preventDefault();

            const nombre = document.getElementById('eventoNombre').value.trim();
            const descripcion = document.getElementById('eventoDescripcion').value.trim();
            const fechaInput = document.getElementById('eventoFecha').value;
            const fileInput = document.getElementById('eventoImagenFile');
            const noMostrarFecha = document.getElementById('eventoNoMostrarFecha').checked;
            const isEnglish = window.location.pathname.includes('index_en.html');

            if (!nombre || !descripcion || !fechaInput) {
                alert(isEnglish ? 'Please fill in all required fields.' : 'Por favor completá los campos requeridos.');
                return;
            }

            const submitBtn = formNuevo.querySelector('button[type="submit"]');
            const originalHTML = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> ' + (isEnglish ? 'Uploading...' : 'Subiendo...');
            }

            try {
                let imageUrl = '';
                if (fileInput && fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const fileId = Date.now().toString();
                    const extension = file.name.split('.').pop();
                    const storageRef = ref(storage, `eventos/${fileId}.${extension}`);
                    const uploadResult = await uploadBytes(storageRef, file);
                    imageUrl = await getDownloadURL(uploadResult.ref);
                } else {
                    imageUrl = 'https://imgur.com/sG0VnFl.jpg'; // default placeholder
                }

                const fecha = new Date(fechaInput);
                const eventId = Date.now().toString();

                await setDoc(doc(db, "eventos", eventId), {
                    nombre: nombre,
                    descripcion: descripcion,
                    fecha: fecha,
                    mostrarFecha: !noMostrarFecha,
                    imagen: imageUrl,
                    fechaCreado: Date.now()
                });

                formNuevo.reset();
                
                // Cerrar modal
                const modalEl = document.getElementById('nuevoEventoModal');
                if (modalEl && window.bootstrap) {
                    const modalObj = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
                    modalObj.hide();
                }

                await cargarEventos();
                alert(isEnglish ? 'Event created successfully!' : '¡Evento creado con éxito!');
            } catch (err) {
                console.error("Error al crear el evento:", err);
                alert(isEnglish ? 'An error occurred while uploading the event.' : 'Ocurrió un error al subir el evento.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalHTML;
                }
            }
        });
    }
});

// Listener global para recargar cuando cambie el estado de administración (login/logout)
window.addEventListener('adminStateChanged', () => {
    cargarContenido();
});

// Asignar la función principal a window.onload sin romper otros scripts
window.addEventListener('load', function () {
    cargarContenido();
});