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
  

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Check if admin session already exists
if (localStorage.getItem('isAdminLoggedIn') === 'true') {
    const sessionMessage = document.getElementById('sessionMessage');
    if (sessionMessage) {
        sessionMessage.style.display = 'block';
        sessionMessage.innerText = 'Sesión activa como Administrador (cccsj). Redirigiendo al panel...';
    }
    setTimeout(() => {
        window.location.href = "index.html";
    }, 1000);
}

// Observador de autenticación Firebase
if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log("Usuario autenticado Firebase:", user.email);
            const sessionMessage = document.getElementById('sessionMessage');
            if (sessionMessage) {
                sessionMessage.style.display = 'block';
            }
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);
        }
    });
}

// Función de inicio de sesión
function signInUser(username, password) {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Verificación de administrador cccsj / fnlo143
    if (cleanUser === 'cccsj' && cleanPass === 'fnlo143') {
        localStorage.setItem('isAdminLoggedIn', 'true');
        localStorage.setItem('adminUser', 'cccsj');
        alert('¡Inicio de sesión correcto como Administrador cccsj!');
        window.location.href = "index.html";
        return;
    }

    // Si no es el admin local, intentar Firebase si está configurado
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signInWithEmailAndPassword(username, password)
            .then((userCredential) => {
                localStorage.setItem('isAdminLoggedIn', 'true');
                localStorage.setItem('adminUser', userCredential.user.email);
                alert('Inicio de sesión correcto.');
                window.location.href = "index.html";
            })
            .catch((error) => {
                alert('Usuario o contraseña incorrectos. (Para acceso directo usá el usuario: cccsj y la contraseña asignada)');
            });
    } else {
        alert('Usuario o contraseña incorrectos. (Usá usuario: cccsj y contraseña: fnlo143)');
    }
}

// Evento submit del formulario
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        signInUser(email, password);
    });
}
