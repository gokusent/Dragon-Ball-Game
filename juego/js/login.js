document.getElementById("btnLogin").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const mensajeError = document.getElementById("mensajeError");

    // Enviar solicitud de login a Laravel
    const respuesta = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const datos = await respuesta.json();

    if (respuesta.ok) {
        localStorage.setItem("token", datos.token); // Guardar el token
        window.location.href = "menu.html"; // Redirigir al menú principal
    } else {
        mensajeError.innerText = datos.error || "Error en el inicio de sesión";
        mensajeError.style.display = "block";
    }
});
