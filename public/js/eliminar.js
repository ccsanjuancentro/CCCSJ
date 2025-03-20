// Importa Firebase y Firestore de la versión modular
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

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
const auth = getAuth(app);

// Autenticación anónima (opcional, si no estás usando autenticación)
signInAnonymously(auth)
    .then(() => {
        console.log("Usuario autenticado anónimamente");
    })
    .catch((error) => {
        console.error("Error al autenticar anónimamente:", error);
    });

// ID del anuncio y evento que no deseas cargar
const ANUNCIO_EXCLUIDO_ID = "JCvcEnf3STJHWj9mzqP0"; // Reemplaza con el ID real
const EVENTO_EXCLUIDO_ID = "9duhFKysx25GAnKh2LHl"; // Reemplaza con el ID real

// Función para cargar y mostrar anuncios
async function cargarAnuncios() {
    const anunciosList = document.getElementById('anuncios-list');
    anunciosList.innerHTML = ''; // Limpia el contenedor antes de cargar los anuncios

    try {
        const querySnapshot = await getDocs(collection(db, "anuncios"));

        querySnapshot.forEach((doc) => {
            // Excluir el anuncio con el ID específico
            if (doc.id !== ANUNCIO_EXCLUIDO_ID) {
                const anuncio = doc.data();
                const anuncioDiv = document.createElement('div');
                anuncioDiv.classList.add('col-md-4', 'mb-3');

                anuncioDiv.innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${anuncio.titulo}</h5>
                            <p class="card-text">${anuncio.descripcion}</p>
                            <button class="btn btn-danger btn-sm" onclick="eliminarAnuncio('${doc.id}')">Eliminar</button>
                        </div>
                    </div>
                `;

                anunciosList.appendChild(anuncioDiv);
            }
        });
    } catch (error) {
        console.error("Error al cargar anuncios:", error);
    }
}

async function cargarEventos() {
    const eventosList = document.getElementById('eventos-list');
    eventosList.innerHTML = ''; // Limpia el contenedor antes de cargar los eventos

    try {
        const querySnapshot = await getDocs(collection(db, "eventos"));

        querySnapshot.forEach((doc) => {
            // Excluir el evento con el ID específico
            if (doc.id !== EVENTO_EXCLUIDO_ID) {
                const evento = doc.data();
                const eventoDiv = document.createElement('div');
                eventoDiv.classList.add('col-md-4', 'mb-3');

                eventoDiv.innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${evento.nombre}</h5>
                            <p class="card-text">${evento.descripcion}</p>
                            <button class="btn btn-danger btn-sm" onclick="eliminarEvento('${doc.id}')">Eliminar</button>
                        </div>
                    </div>
                `;

                eventosList.appendChild(eventoDiv);
            }
        });
    } catch (error) {
        console.error("Error al cargar eventos:", error);
    }
}

// Función para eliminar un anuncio
window.eliminarAnuncio = async function (id) {
    if (confirm("¿Estás seguro de que quieres eliminar este anuncio?")) {
        try {
            await deleteDoc(doc(db, "anuncios", id));
            alert("Anuncio eliminado correctamente");
            cargarAnuncios(); // Recargar la lista de anuncios
        } catch (error) {
            console.error("Error al eliminar el anuncio:", error);
            alert("Hubo un error al eliminar el anuncio");
        }
    }
};

// Función para eliminar un evento
window.eliminarEvento = async function (id) {
    if (confirm("¿Estás seguro de que quieres eliminar este evento?")) {
        try {
            await deleteDoc(doc(db, "eventos", id));
            alert("Evento eliminado correctamente");
            cargarEventos(); // Recargar la lista de eventos
        } catch (error) {
            console.error("Error al eliminar el evento:", error);
            alert("Hubo un error al eliminar el evento");
        }
    }
};

// Cargar anuncios y eventos cuando la página se cargue
window.onload = () => {
    cargarAnuncios();
    cargarEventos();
};