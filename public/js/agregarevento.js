// Importa Firebase y Firestore de la versión modular
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

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

// Captura el formulario
const eventoForm = document.getElementById('eventoForm');

// Función para agregar un evento a Firestore
eventoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtiene los valores del formulario
    const nombre = eventoForm.nombre.value;
    const descripcion = eventoForm.descripcion.value;
    const fecha = new Date(eventoForm.fecha.value);
    const imagen = eventoForm.imagen.value;

    const user = auth.currentUser;

    try {
        // Añade el documento a la colección "eventos"
        await addDoc(collection(db, "eventos"), {
            nombre: nombre,
            descripcion: descripcion,
            fecha: Timestamp.fromDate(fecha),
            imagen: imagen,
            uid: user.uid // opcional: guardar quién creó el evento
        });

        alert('Evento agregado correctamente');
        eventoForm.reset(); // Limpia el formulario
    } catch (error) {
        console.error("Error al agregar el evento:", error);
        alert('Hubo un error al agregar el evento');
    }
});
