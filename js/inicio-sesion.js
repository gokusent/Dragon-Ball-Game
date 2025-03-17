document.getElementById("btn-iniciar").addEventListener("click", () => {
    const email = localStorage.getItem("email");
    const password = localStorage.getItem("password");

    if (email && password) {
        iniciarSesion(email, password);
    } else {
        document.getElementById("registroContainer").style.display = "block";
    }
});

// Función para iniciar sesión automáticamente
function iniciarSesion(email, password) {
    fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem("token", data.token);
            window.location.href = "menu.html"; // Redirigir al menú principal
        } else {
            document.getElementById("registroContainer").style.display = "block";
        }
    })
    .catch(error => console.error("Error:", error));
}

document.getElementById("btnRegistrar").addEventListener("click", () => {
    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    fetch("http://127.0.0.1:8000/api/registrar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ nombre, email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.mensaje) {
            localStorage.setItem("email", email);
            localStorage.setItem("password", password);
            iniciarSesion(email, password);
        } else {
            alert("Error al registrar: " + JSON.stringify(data));
        }
    })
    .catch(error => console.error("Error:", error));
});
