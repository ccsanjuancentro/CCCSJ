// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCBd_rQXvTb70j6v2rnDTfzay_Qi0enklI",
    authDomain: "ccsanjuancentro-abf1d.firebaseapp.com",
    projectId: "ccsanjuancentro-abf1d",
    storageBucket: "ccsanjuancentro-abf1d.appspot.com",
    messagingSenderId: "1057587534711",
    appId: "1:1057587534711:web:fd24eee7173ddd59cfdf72",
    measurementId: "G-GL4H5THCHX"
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
            window.location.href = "index.html"; // Cambia por la página que desees
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
            window.location.href = "index.html"; // Cambia por la página que desees
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