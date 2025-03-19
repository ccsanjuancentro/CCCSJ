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

// Referencias a los elementos del DOM
const uploadSection = document.getElementById('uploadSection');
const unauthenticatedMessage = document.getElementById('unauthenticatedMessage');
const fileList = document.getElementById('fileList');
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');

// Verificar el estado de autenticación
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // Usuario autenticado: mostrar la interfaz de subida
        console.log("Usuario autenticado:", user.email);
        uploadSection.classList.remove('hidden');
        unauthenticatedMessage.classList.add('hidden');
    } else {
        // Usuario no autenticado: ocultar la interfaz de subida
        console.log("No hay sesión activa.");
        uploadSection.classList.add('hidden');
        unauthenticatedMessage.classList.remove('hidden');
    }
});

// Subir archivo
uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const file = fileInput.files[0];
    if (file) {
        console.log("Archivo seleccionado:", file.name);
        const storageRef = firebase.storage().ref('pdfs/' + file.name);
        storageRef.put(file).then((snapshot) => {
            console.log("Archivo subido correctamente:", snapshot);
            alert('Archivo subido correctamente.');
            listFiles(); // Actualizar la lista de archivos
        }).catch((error) => {
            console.error('Error al subir el archivo:', error);
            alert('Error al subir el archivo.');
        });
    } else {
        console.log("No se seleccionó ningún archivo.");
        alert("Por favor, selecciona un archivo.");
    }
});

// Listar archivos
function listFiles() {
    const storageRef = firebase.storage().ref('pdfs/');
    storageRef.listAll().then((result) => {
        console.log("Archivos listados:", result.items);
        fileList.innerHTML = ''; // Limpiar la lista
        result.items.forEach((item) => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = item.name;
            link.onclick = () => downloadFile(item);
            li.appendChild(link);
            fileList.appendChild(li);
        });
    }).catch((error) => {
        console.error('Error al listar archivos:', error);
    });
}

// Descargar archivo
function downloadFile(item) {
    item.getDownloadURL().then((url) => {
        console.log("URL de descarga:", url);
        const link = document.createElement('a');
        link.href = url;
        link.download = item.name;
        link.click();
    }).catch((error) => {
        console.error('Error al descargar el archivo:', error);
        alert('Error al descargar el archivo.');
    });
}

// Cargar la lista de archivos al iniciar la página
listFiles();