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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

// Verifica el estado de autenticación
auth.onAuthStateChanged((user) => {
    if (!user) {
        // Si no hay usuario autenticado, redirige a index.html con un mensaje
        alert("Primero debes iniciar sesión.");
        window.location.href = "index.html";
    }
});