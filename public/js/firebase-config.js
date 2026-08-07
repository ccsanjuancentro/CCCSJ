// ========== FIREBASE CONFIGURATION ==========
// Este archivo centraliza toda la configuración de Firebase
// Úsalo en lugar de repetir la configuración en cada JS

const firebaseConfig = {
  apiKey: "AIzaSyCpL5fjAy05rV2OMWFWwRwy4ttElmhtqBg",
  authDomain: "iglesiaccsj143.firebaseapp.com",
  projectId: "iglesiaccsj143",
  storageBucket: "iglesiaccsj143.firebasestorage.app",
  messagingSenderId: "141392861764",
  appId: "1:141392861764:web:2d91da3c7b985f0d15ba11",
  measurementId: "G-4N1DQTQK11"
};

// Inicializar Firebase si no está inicializado
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Exportar referencias para usar en otros archivos
const db = firebase.firestore();
const auth = firebase.auth();

// Auth anónimo (opcional, solo si necesitas permisos de lectura/escritura)
auth.signInAnonymously().catch(err => {
  console.warn("Auth anónimo (opcional):", err);
});
