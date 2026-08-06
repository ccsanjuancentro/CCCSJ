// Importa Firebase y Firestore de la versión modular
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

// Función para formatear la fecha
function formatearFecha(timestamp) {
    if (!timestamp || !timestamp.toDate) return '';
    const fecha = timestamp.toDate();
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
    if (!eventosContainer) return;

    eventosContainer.innerHTML = '';

    try {
        const querySnapshot = await getDocs(collection(db, "eventos"));
        const ahora = new Date(); 
        let hayEventos = false; 

        querySnapshot.forEach((doc) => {
            const evento = doc.data();
            if (!evento.fecha) return;
            const fechaEvento = evento.fecha.toDate(); 

            if (fechaEvento > ahora) {
                hayEventos = true;
                hayAlgo = true;
                let urlImagen = evento.imagen;
                if (!urlImagen || urlImagen === ".jpg") {
                    urlImagen = "https://imgur.com/sG0VnFl.jpg";
                }
                const eventoDiv = document.createElement('div');
                eventoDiv.classList.add('col-lg-4', 'col-12', 'mb-3');
                let mostrarFecha = evento.mostrarFecha || false; 
                let fechaHTML = mostrarFecha ? `<p class="product-p">${formatearFecha(evento.fecha)}</p>` : '';

                eventoDiv.innerHTML = `
                    <div class="product-thumb">
                        <a>
                            <img src="${urlImagen}" class="img-fluid product-image " alt="${evento.nombre || ''}" onerror="this.src='images/eventos/error_evento.jpg';">
                        </a>
                        <div class="product-info d-flex">
                            <div>
                                <h5 class="product-title mb-0">
                                    <a class="product-title-link">${evento.nombre || ''}</a>
                                </h5>
                                ${fechaHTML}
                                <p class="product-p">${evento.descripcion || ''}</p>
                            </div>
                        </div>
                    </div>
                `;

                eventosContainer.appendChild(eventoDiv);
            }
        });

        if (eventosSectionContent) {
            eventosSectionContent.style.display = hayEventos ? 'block' : 'none';
        }
    } catch (error) {
        console.error("Error al cargar eventos:", error);
    }
}

async function cargarContenido() {
    await cargarEventos(); 
    const eventosSection = document.getElementById('eventos-section');

    if (eventosSection) {
        eventosSection.style.display = hayAlgo ? 'block' : 'none';
    }
}

// Asignar la función principal a window.onload sin romper anuncios.js
window.addEventListener('load', function () {
    cargarContenido();
});