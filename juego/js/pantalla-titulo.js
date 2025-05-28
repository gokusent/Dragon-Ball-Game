document.addEventListener("DOMContentLoaded", () => {
    const btnIniciar = document.getElementById('btnIniciar');
    const container = document.querySelector('.container');
    const audio = document.getElementById('musicaFondo');

    audio.volume = 0; // Iniciar volumen en 0 para evitar reproducción automática

    // Al pulsar "Iniciar" mostramos el contenido y ocultamos el botón
    btnIniciar.addEventListener('click', () => {
        btnIniciar.classList.add('fade-out'); // Añade clase para animación de desvanecimiento
        container.classList.add('expanded'); // Añade clase para animación

        setTimeout(() => {
            btnIniciar.style.display = 'none'; // Oculta el botón después de la animación
            container.style.display = 'block'; // Muestra el contenedor principal
        }, 3000); // Espera 1 segundo para ocultar el botón

        window.sessionStorage.setItem("musicaIniciada", "true");
        // Reiniciar y reproducir música
        audio.currentTime = 0;
        audio.volume = 0.5;
        audio.play().catch(err => {
            console.error("Error al reproducir la música:", err);
        });
    });

    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem('tiempoMusica', audio.currentTime);
        sessionStorage.removeItem('ReinicioMusica');
    });

  // Obtener referencias a los formularios de login y registro
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  // Obtener referencias a los enlaces que alternan entre formularios
  const showRegister = document.getElementById("showRegister");
  const showLogin = document.getElementById("showLogin");

  // Obtener referencias a los botones de login y registro
  const btnLogin = document.getElementById("btnLogin");
  const btnRegister = document.getElementById("btnRegister");

  // Inputs del formulario de login
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");

  // Inputs del formulario de registro
  const usuario = document.getElementById("usuario");
  const emailRegistro = document.getElementById("emailRegistro");
  const passwordRegistro = document.getElementById("passwordRegistro");

  // Elementos donde mostrar mensajes de error para cada formulario
  const loginError = document.getElementById("loginError");
  const registerError = document.getElementById("registerError");

  // Evento para mostrar el formulario de registro y ocultar el de login
  showRegister.addEventListener("click", () => {
    loginForm.classList.remove("active");   // Ocultar login
    registerForm.classList.add("active");   // Mostrar registro
    loginError.classList.add("oculto");     // Ocultar mensaje de error de login si está visible
  });

  // Evento para mostrar el formulario de login y ocultar el de registro
  showLogin.addEventListener("click", () => {
    registerForm.classList.remove("active");  // Ocultar registro
    loginForm.classList.add("active");         // Mostrar login
    registerError.classList.add("oculto");     // Ocultar mensaje de error de registro si está visible
  });

  // Evento para procesar el inicio de sesión cuando se hace click en btnLogin
  btnLogin.addEventListener("click", async () => {
    try {
      // Obtener y limpiar los valores de los inputs de login
      const email = loginEmail.value.trim();
      const password = loginPassword.value.trim();

      // Enviar petición POST al backend con las credenciales
      const response = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // Parsear respuesta JSON
      const data = await response.json();

      // Si la respuesta es correcta y se recibió token
      if (response.ok && data.token) {
        localStorage.setItem("token", data.token); // Guardar token en localStorage
        if (data.usuario) {
          // Guardar información del usuario en localStorage (opcional)
          localStorage.setItem("jugador", JSON.stringify(data.usuario));
          console.log("Usuario guardado:", data.usuario);
        } else {
            console.warn("No se recibió el objeto usuario.");
        }
        // Redirigir al menú principal
        window.location.href = "menu.html";
      } else {
        // Mostrar error recibido o mensaje por defecto
        mostrarError(loginError, data.error || "Correo o contraseña incorrectos.");
      }
    } catch (error) {
      // Capturar errores de red u otros
      mostrarError(loginError, "Error al conectar con el servidor.");
    }
  });

  // Evento para procesar el registro cuando se hace click en btnRegister
  btnRegister.addEventListener("click", () => {
    // Obtener y limpiar valores del formulario de registro
    const nombre = usuario.value.trim();
    const email = emailRegistro.value.trim();
    const password = passwordRegistro.value.trim();

    // Enviar petición POST para crear nuevo usuario
    fetch("http://127.0.0.1:8000/api/registrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, password })
    })
    .then(res => res.json())
    .then(data => {
      if (data.message === "Usuario registrado con éxito") {
        // Si el registro fue exitoso, mostrar alerta y volver al login
        alert("¡Registro exitoso!");
        registerForm.classList.remove("active");  // Ocultar registro
        loginForm.classList.add("active");        // Mostrar login
      } else {
        // Mostrar error recibido o mensaje por defecto
        mostrarError(registerError, data.error || "Error al registrar.");
      }
    })
    .catch(() => mostrarError(registerError, "Error al conectar con el servidor."));
  });

  // Función auxiliar para mostrar mensajes de error en un elemento dado
  function mostrarError(element, mensaje) {
    element.textContent = mensaje;    // Poner texto del error
    element.classList.remove("oculto"); // Hacer visible el mensaje
  }
});
