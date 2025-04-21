// Importa Firebase y Firestore de la versión modular
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

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
const auth = getAuth(app);

// Captura el formulario
const anuncioForm = document.getElementById('anuncioForm');

// Función para agregar un anuncio a Firestore
anuncioForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const titulo = anuncioForm.titulo.value;
    const descripcion = anuncioForm.descripcion.value;
    const fecha = new Date(anuncioForm.fecha.value);

    const user = auth.currentUser;

    try {
        await addDoc(collection(db, "anuncios"), {
            titulo: titulo,
            descripcion: descripcion,
            fecha: Timestamp.fromDate(fecha),
            uid: user?.uid || null
        });

        Swal.fire({
            title: '¡Anuncio agregado!',
            text: '¿Quieres agregar otro anuncio?',
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'Sí',
            cancelButtonText: 'No',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                anuncioForm.reset();
            } else {
                window.location.href = 'index.html';
            }
        });
    } catch (error) {
        console.error("Error al agregar el anuncio:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un error al agregar el anuncio. Por favor, intenta nuevamente.'
        });
    }
});