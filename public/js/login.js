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

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Observador de autenticación
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // El usuario ya tiene una sesión activa
        console.log("Usuario autenticado:", user.email);

        // Muestra el mensaje
        const sessionMessage = document.getElementById('sessionMessage');
        if (sessionMessage) {
            sessionMessage.style.display = 'block';
        }

        // Redirige después de 2 segundos
        setTimeout(() => {
            window.location.href = "seleccion.html"; // Cambia por la página que desees
        }, 2000);
    } else {
        // No hay sesión activa
        console.log("No hay sesión activa.");
    }
});

// Función de inicio de sesión con Firebase
function signInUser(email, password) {
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Inicio de sesión exitoso
            const user = userCredential.user;
            console.log('Usuario autenticado:', user.email);
            alert('Inicio de sesión correcto.');
            // Redirigir al usuario
            window.location.href = "seleccion.html"; // Cambia por la página que desees
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log('Error:', errorCode, errorMessage);
            alert('Error al iniciar sesión: ' + errorMessage); // Muestra el mensaje de error
        });
}

// Modifica el evento submit del formulario para usar Firebase
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Evita que el formulario se envíe y la página se recargue

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Llama a la función de inicio de sesión con Firebase
        signInUser(email, password);
    });
}
