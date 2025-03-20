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