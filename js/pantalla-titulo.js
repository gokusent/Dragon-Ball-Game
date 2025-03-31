document.addEventListener("DOMContentLoaded", () => {
    const btnIniciar = document.getElementById("btn-iniciar");
    
    const formularioLogin = document.getElementById("formulario-login");
    const formularioRegistro = document.getElementById("formulario-registro");

    const btnLogin = document.getElementById("btnLogin");
    const btnRegistrar = document.getElementById("btnRegistrar");
    const btnRegistrarCuenta = document.getElementById("btnRegistrarCuenta");

    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const usuario = document.getElementById("usuario");
    const emailRegistro = document.getElementById("emailRegistro");
    const passwordRegistro = document.getElementById("passwordRegistro");

    const mensajeError = document.getElementById("mensajeError");

    let usuarioLogueado = false;

    // Mostrar formulario de inicio de sesión
    btnIniciar.addEventListener("click", () => {
        if (usuarioLogueado) {
            window.location.href = "menu.html";
        } else {
            formularioLogin.classList.remove("oculto");
            btnIniciar.classList.add("oculto");
        }
    });

    // Iniciar sesión
    btnLogin.addEventListener("click", () => {
        const userEmail = email.value;
        const userPassword = password.value;
    
        fetch("http://127.0.0.1:8000/api/login", {  // ✅ URL corregida
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: userEmail,
                password: userPassword
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem("authToken", data.token);
                formularioLogin.classList.add("oculto");
                window.location.href = "menu.html";  // ✅ Redirige al menú tras iniciar sesión
            } else {
                mostrarMensajeError("Correo o contraseña incorrectos.");
            }
        })
        .catch(error => {
            mostrarMensajeError("Error al conectar con el servidor.");
        });
    });

    // Mostrar formulario de registro
    btnRegistrar.addEventListener("click", () => {
        formularioLogin.classList.add("oculto");
        formularioRegistro.classList.remove("oculto");
    });

    // Crear cuenta
    btnRegistrarCuenta.addEventListener("click", () => {
        const newUsuario = usuario.value;
        const newEmail = emailRegistro.value;
        const newPassword = passwordRegistro.value;
    
        fetch("http://127.0.0.1:8000/api/registrar", {  // ✅ URL corregida
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nombre: newUsuario,
                email: newEmail,
                password: newPassword
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Usuario registrado con éxito") {
                formularioRegistro.classList.add("oculto");
                window.location.href = "menu.html";  // ✅ Redirige tras registrarse
            } else {
                mostrarMensajeError(data.error || "Hubo un error al crear la cuenta.");
            }
        })
        .catch(error => {
            mostrarMensajeError("Error al conectar con el servidor.");
        });
    });

    function mostrarMensajeError(mensaje) {
        if (mensajeError) {
            mensajeError.style.display = "block";
            mensajeError.textContent = mensaje;
        } else {
            alert(mensaje);
        }
    }
});
