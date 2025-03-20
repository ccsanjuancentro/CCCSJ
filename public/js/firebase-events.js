// Importa Firebase y Firestore de la versión modular
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCv41Ccs_JqI7uGkfhFJV3D5MNyYXRwt5U",
    authDomain: "ccsanjuan-8c6ac.firebaseapp.com",
    projectId: "ccsanjuan-8c6ac",
    storageBucket: "ccsanjuan-8c6ac.firebasestorage.app",
    messagingSenderId: "449978680914",
    appId: "1:449978680914:web:310688cae51766341ac18b",
    measurementId: "G-T8BW6Y171T"
  };

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para formatear la fecha
function formatearFecha(timestamp) {
    const fecha = timestamp.toDate();
    return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para cargar eventos desde Firestore
async function cargarEventos() {
    const eventosContainer = document.getElementById('eventos-container');
    eventosContainer.innerHTML = ''; // Limpiar contenido previo

    try {
        // Obtener los eventos desde la colección "eventos"
        const querySnapshot = await getDocs(collection(db, "eventos"));
        querySnapshot.forEach((doc) => {
            const evento = doc.data();
            const eventoDiv = document.createElement('div');
            eventoDiv.classList.add('col-lg-4', 'col-12', 'mb-3');
            
            eventoDiv.innerHTML = `
                <div class="product-thumb">
                    <a>
                        <img src="${evento.imagen}" class="img-fluid product-image" alt="${evento.nombre}">
                    </a>
                    <div class="product-info d-flex">
                        <div>
                            <h5 class="product-title mb-0">
                                <a class="product-title-link">${evento.nombre}</a>
                            </h5>
                            <p class="product-p">${formatearFecha(evento.fecha)}</p>
                            <p class="product-p">${evento.descripcion}</p>
                        </div>
                    </div>
                </div>
            `;

            eventosContainer.appendChild(eventoDiv);
        });
    } catch (error) {
        console.error("Error al cargar eventos:", error);
    }
}

// Cargar los eventos cuando la página se haya cargado
window.onload = cargarEventos;