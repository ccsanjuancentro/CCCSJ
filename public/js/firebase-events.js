// Importa Firebase y Firestore de la versión modular
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
let hayAlgo=false
// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCv41Ccs_JqI7uGkfhFJV3D5MNyYXRwt5U",
    authDomain: "ccsanjuan-8c6ac.firebaseapp.com",
    projectId: "ccsanjuan-8c6ac",
    storageBucket: "ccsanjuan-8c6ac.appspot.com",
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

function getNextFirstSunday() {
    const today = new Date(); // Obtiene la fecha actual
    let year = today.getFullYear(); // Año actual
    let month = today.getMonth(); // Mes actual

    // Busca el primer domingo del mes actual
    let firstSunday = new Date(year, month, 1); // Primer día del mes
    while (firstSunday.getDay() !== 0) { // Mientras no sea domingo (0)
        firstSunday.setDate(firstSunday.getDate() + 1); // Avanza un día
    }

    // Si el primer domingo ya pasó este mes, busca en el próximo mes
    if (firstSunday < today) {
        month += 1; // Siguiente mes
        if (month > 11) { // Si es diciembre, pasa a enero del siguiente año
            month = 0;
            year += 1;
        }
        firstSunday = new Date(year, month, 1); // Primer día del siguiente mes
        while (firstSunday.getDay() !== 0) { // Busca el primer domingo
            firstSunday.setDate(firstSunday.getDate() + 1);
        }
    }
    firstSunday.setHours(10, 0, 0, 0);
    return firstSunday; // Retorna la fecha del próximo primer domingo
}

function formatDate(date) {
    // Formatea la fecha en el formato deseado (dd/mm/yyyy hh:mm)
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function cargarEventos() {
    const eventosSectionContent = document.getElementById('eventos-section-content'); // Contenedor del título 
    const eventosContainer = document.getElementById('eventos-container');
    eventosContainer.innerHTML = '';

    // Crear el evento "Santa Cena" con la fecha calculada
    const eventoDiv = document.createElement('div');
    eventoDiv.innerHTML = ``;

    eventosContainer.appendChild(eventoDiv);

    try {
        const querySnapshot = await getDocs(collection(db, "eventos"));
        const ahora = new Date(); // Obtiene la fecha y hora actual
        let hayEventos = false; 

        querySnapshot.forEach((doc) => {
            const evento = doc.data();
            const fechaEvento = evento.fecha.toDate(); // Convierte el timestamp de Firestore a un objeto Date

            // Compara la fecha del evento con la fecha actual
            if (fechaEvento > ahora) {
                hayEventos = true;
                hayAlgo=true;
                let urlImagen = evento.imagen;
                if (!urlImagen || urlImagen == ".jpg") {
                    urlImagen = "https://imgur.com/sG0VnFl.jpg";
                }
                console.log("Valor de evento.imagen:", evento.imagen);
                console.log("Tipo de dato de evento.imagen:", typeof evento.imagen);
                const eventoDiv = document.createElement('div');
                eventoDiv.classList.add('col-lg-4', 'col-12', 'mb-3');
                let mostrarFecha = evento.mostrarFecha || false; // Si no existe, se asume false
                let fechaHTML = mostrarFecha ? `<p class="product-p">${formatearFecha(evento.fecha)}</p>` : '';

                eventoDiv.innerHTML = `
                    <div class="product-thumb">
                        <a>
                            <img src="${urlImagen}" class="img-fluid product-image " alt="${evento.nombre}" onerror="this.src='images/eventos/error_evento.jpg';">
                        </a>
                        <div class="product-info d-flex">
                            <div>
                                <h5 class="product-title mb-0">
                                    <a class="product-title-link">${evento.nombre}</a>
                                </h5>
                                ${fechaHTML}
                                <p class="product-p">${evento.descripcion}</p>
                            </div>
                        </div>
                    </div>
                `;

                eventosContainer.appendChild(eventoDiv);
            }
        });

        // Ocultar el contenedor de anuncios y el título si no hay anuncios
        if (!hayEventos) {
            eventosSectionContent.style.display = 'none'; // Oculta el contenedor y el título
        } else {
            eventosSectionContent.style.display = 'block'; // Muestra el contenedor y el título
        }
    } catch (error) {
        console.error("Error al cargar eventos:", error);
    }
}

// Función para cargar los anuncios
async function cargarAnuncios() {
    const anunciosContainer = document.getElementById('anuncios-container');
    const anunciosSectionContent = document.getElementById('anuncios-section-content'); // Contenedor del título y anuncios
    const ahora = new Date(); 
    let hayAnuncios = false; 
    

    try {
        const querySnapshot = await getDocs(collection(db, "anuncios"));
        anunciosContainer.innerHTML = ''; // Limpia el contenedor antes de cargar los anuncios

        querySnapshot.forEach((doc) => {
            const anuncio = doc.data();
            const fechaAnuncio = anuncio.fecha.toDate(); // Convierte el timestamp de Firestore a un objeto Date

            // Solo muestra el anuncio si la fecha aún no ha pasado
            if (fechaAnuncio > ahora) {
                hayAnuncios = true; // Hay al menos un anuncio
                hayAlgo=true;
                const anuncioDiv = document.createElement('div');
                anuncioDiv.classList.add('col-lg-4', 'col-md-6', 'col-12', 'mb-3'); // Ajuste de columnas

                anuncioDiv.innerHTML = `
                    <div class="product-thumb">
                        <div class="product-info d-flex flex-column text-center">
                            <div>
                                <h5 class="product-title mb-2">
                                    <a class="product-title-link">${anuncio.titulo}</a>
                                </h5>
                                <p class="product-p mb-0">${anuncio.descripcion}</p>
                            </div>
                        </div>
                    </div>
                `;

                anunciosContainer.appendChild(anuncioDiv);
            }
        });

        // Ocultar el contenedor de anuncios y el título si no hay anuncios
        if (!hayAnuncios) {
            anunciosSectionContent.style.display = 'none'; // Oculta el contenedor y el título
        } else {
            anunciosSectionContent.style.display = 'block'; // Muestra el contenedor y el título
        }
    } catch (error) {
        console.error("Error al cargar anuncios:", error);
    }
}
// Función principal que carga tanto eventos como anuncios
async function cargarContenido() {
    await cargarEventos(); 
    await cargarAnuncios();
    const eventosSection = document.getElementById('eventos-section');

    if (!hayAlgo) {
        eventosSection.style.display = 'none';  // Si no hay ninguno, ocultar toda la sección
    } else {
        eventosSection.style.display = 'block'; // Si hay al menos uno, mostrarla
    }
}

// Asignar la función principal a window.onload
window.onload = cargarContenido;