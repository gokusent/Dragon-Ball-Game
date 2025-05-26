document.addEventListener("DOMContentLoaded", async () => {
    const audio = document.getElementById('musicaFondo');
    const paginaActual = window.paginaActual || 'index';

    window.addEventListener('DOMContentLoaded', () => {
        const tiempo = sessionStorage.getItem('tiempoMusica');
        const reinicio = sessionStorage.getItem('ReinicioMusica') === 'true';

        if (['index', 'menu', 'perfil'].includes(paginaActual) && reinicio) {
            audio.currentTime = 0;
            sessionStorage.removeItem('ReinicioMusica');
        } else if (tiempo) {
            audio.currentTime = parseFloat(tiempo);
        }

        audio.volume = 0.5;
        audio.play().catch(err => {
            console.error("Error al reproducir la música:", err);
        });
    });

    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem('tiempoMusica', audio.currentTime);
    });

    // Obtener token del localStorage
    const token = localStorage.getItem("token");
    if (!token) {
        // Redirigir a login si no hay token
        window.location.href = "index.html";
        return;
    }

    // ==== ELEMENTOS DEL DOM ====
    const avatar = document.getElementById("avatar");
    const nombre = document.getElementById("nombre-usuario");
    const inputBusqueda = document.getElementById("input-buscar-usuario");
    const resultados = document.getElementById("resultados-busqueda");
    const seccionBusqueda = document.getElementById("seccion-buscar");
    const seccionSolicitudes = document.getElementById("seccion-solicitudes");
    const seccionEstadisticas = document.getElementById("seccion-estadisticas");
    const contenedorAmigos = document.getElementById("contenedor-amigos");
    const formularioEditarPerfil = document.getElementById("formulario-editar-perfil");

    // ==== BOTONES ====
    const btnEditar = document.getElementById("btn-editar-perfil");
    const btnSolicitudes = document.getElementById("btn-solicitudes");
    const btnBuscar = document.getElementById("btn-buscar");
    const btnMenu = document.getElementById("btn-menu");
    const btnSalir = document.getElementById("btn-salir");

    let currentUserId = null;

    // ==== FUNCIONES ====

    // Cargar perfil propio o de otro usuario (por ID en la URL)
    async function cargarPerfil() {
        const id = obtenerParametroId();
        if (id && id !== currentUserId) {
            await cargarPerfilPorId(id);
        } else {
            const res = await fetch("http://localhost:8000/api/perfil", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) return alert("Error al cargar perfil");

            const data = await res.json();
            currentUserId = String(data.id);
            avatar.src = `http://127.0.0.1:8000${data.avatar || '/storage/avatars/default.jpg'}`;
            nombre.textContent = data.nombre;
            btnEditar.style.display = 'inline-block';
        }
    }

    // Cargar el perfil de otro usuario por ID
    async function cargarPerfilPorId(id) {
        const res = await fetch(`http://localhost:8000/api/perfil/${id}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            alert("No se pudo cargar el perfil solicitado.");
            return;
        }

        const data = await res.json();
        avatar.src = `http://127.0.0.1:8000${data.avatar || '/storage/avatars/default.jpg'}`;
        nombre.textContent = data.nombre;

        mostrarBotonAgregarAmigo(id);

        btnEditar.style.display = 'none';
        formularioEditarPerfil.classList.remove("visible");
    }

    // Mostrar u ocultar botones según si estás viendo tu propio perfil
    function actualizarVistaSegunPerfil() {
        const idParam = obtenerParametroId();
        const esPerfilPropio = !idParam || idParam === currentUserId;

        btnEditar.style.display = esPerfilPropio ? 'inline-block' : 'none';
        btnBuscar.style.display = esPerfilPropio ? 'inline-block' : 'none';
        btnSalir.style.display = esPerfilPropio ? 'inline-block' : 'none';
        btnSolicitudes.style.display = esPerfilPropio ? 'inline-block' : 'none';

        let btnVolver = document.getElementById('btn-volver-perfil');

        if (!esPerfilPropio) {
            if (!btnVolver) {
                btnVolver = document.createElement('button');
                btnVolver.id = 'btn-volver-perfil';
                btnVolver.textContent = 'Volver a Mi Perfil';
                btnVolver.style.marginLeft = '10px';
                btnVolver.addEventListener('click', () => {
                    window.location.href = 'perfil.html';
                });
                document.querySelector('.top-bar').appendChild(btnVolver);
            }
        } else {
            if (btnVolver) btnVolver.remove();
        }
    }

    // Obtener ID del usuario desde los parámetros de la URL
    function obtenerParametroId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }
    
    // Cargar estadísticas del usuario (victorias, derrotas, partidas)
    async function cargarEstadisticas(currentUserId) {
        const params = new URLSearchParams(window.location.search);
        const viewId = params.get('id') || currentUserId;

        const statsContainer = document.getElementById("seccion-estadisticas");
        statsContainer.innerHTML = "<h3>Estadísticas</h3>";

        try {
            const perfilRes = await fetch(`http://localhost:8000/api/perfil/${viewId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!perfilRes.ok) throw new Error("Error al cargar perfil");
            const perfil = await perfilRes.json();
            currentUserId = String(perfil.id);
        } catch (error) {
            console.error("Error cargando perfil:", error);
            statsContainer.innerHTML = "<p>Error al cargar perfil.</p>";
            return;
        }

        try {
            const res = await fetch(`http://localhost:3000/api/estadisticas/usuario/${currentUserId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok && res.status !== 404) {
                throw new Error("No se pudieron cargar las estadísticas.");
            }

            const stats = await res.json();

            const p1 = document.createElement("p");
            p1.textContent = `Partidas jugadas: ${stats.numeroPartida}`;
            const p2 = document.createElement("p");
            p2.textContent = `Victorias: ${stats.victorias}`;
            const p3 = document.createElement("p");
            p3.textContent = `Derrotas: ${stats.derrotas}`;

            statsContainer.append(p1, p2, p3);
        } catch (error) {
            console.error("Error cargando estadísticas:", error);
            const p = document.createElement("p");
            p.textContent = "No hay partidas registradas.";
            statsContainer.appendChild(p);
        }
    }

    // Cargar amigos del usuario
    async function cargarAmigos(currentUserId) {
        const params = new URLSearchParams(window.location.search);
        const viewId = params.get('id') || currentUserId;

        const statsContainer = document.getElementById("seccion-estadisticas");
        statsContainer.innerHTML = "<h3>Estadísticas</h3>";

        try {
            const perfilRes = await fetch(`http://localhost:8000/api/perfil/${viewId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!perfilRes.ok) throw new Error("Error al cargar perfil");
            const perfil = await perfilRes.json();
            currentUserId = String(perfil.id);
        } catch (error) {
            console.error("Error cargando perfil:", error);
            statsContainer.innerHTML = "<p>Error al cargar perfil.</p>";
            return;
        }

    contenedorAmigos.innerHTML = '';

    const endpoint = currentUserId === viewId
        ? `http://localhost:8000/api/amigos/${currentUserId}`
        : 'http://localhost:8000/api/mis-amigos';

    try {
        const res = await fetch(endpoint, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
            contenedorAmigos.textContent = "No se pudo cargar la lista de amigos.";
            return;
        }

        const data = await res.json();
        const amigos = data.amigos;
;

            if (!amigos.length) {
                contenedorAmigos.innerHTML = "<p>No tienes amigos.</p>";
                return;
            }

            amigos.forEach(amigo => {
                const item = document.createElement('div');
                item.className = 'usuario-item';

                const avatarAmigo = document.createElement('img');
                avatarAmigo.src = amigo.avatar?.startsWith("http")
                    ? amigo.avatar
                    : `http://127.0.0.1:8000${amigo.avatar || '/storage/avatars/default.jpg'}`;
                avatarAmigo.alt = 'avatar';
                avatarAmigo.onerror = () => avatarAmigo.src = '/storage/avatars/default.jpg';
                avatarAmigo.classList.add("avatar-amigo");

                const nombreAmigo = document.createElement('span');
                nombreAmigo.textContent = amigo.nombre;

                avatarAmigo.onclick = () => window.location.href = `perfil.html?id=${amigo.id}`;
                nombreAmigo.onclick = () => window.location.href = `perfil.html?id=${amigo.id}`;

                item.append(avatarAmigo, nombreAmigo);
                contenedorAmigos.appendChild(item);
            });

        } catch (error) {
            console.error("Error cargando amigos:", error);
            contenedorAmigos.textContent = "Error al cargar amigos.";
        }
    }

    // Cargar solicitudes de amistad pendientes
    async function cargarSolicitudes() {
        const cont = document.getElementById("contenedor-solicitudes");
        cont.innerHTML = "<h3>Solicitudes de amistad recibidas</h3>";

        try {
            const response = await fetch("http://localhost:8000/api/solicitudes-pendientes", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            const solicitudes = await response.json();

            if (solicitudes.length === 0) {
                cont.innerHTML += "<p>No tienes solicitudes pendientes.</p>";
                return;
            }

            solicitudes.forEach(solicitud => {
                const divSolicitud = document.createElement('div');
                divSolicitud.className = "usuario-item";

                const avatar = document.createElement("img");
                avatar.src = solicitud.solicitante.avatar
                    ? `http://127.0.0.1:8000${solicitud.solicitante.avatar}`
                    : "/storage/avatars/default.jpg";
                avatar.onerror = () => avatar.src = "/storage/avatars/default.jpg";

                const nombre = document.createElement("span");
                nombre.textContent = solicitud.solicitante.nombre;

                const btnAceptar = document.createElement("button");
                btnAceptar.textContent = "Aceptar";
                btnAceptar.addEventListener("click", () =>
                    responderSolicitud(solicitud.id, "aceptada")
                );

                const btnRechazar = document.createElement("button");
                btnRechazar.textContent = "Rechazar";
                btnRechazar.addEventListener("click", () =>
                    responderSolicitud(solicitud.id, "rechazada")
                );

                divSolicitud.append(avatar, nombre, btnAceptar, btnRechazar);
                cont.appendChild(divSolicitud);
            });

        } catch (error) {
            console.error("Error cargando solicitudes:", error);
            cont.innerHTML = "<p>Error al cargar solicitudes.</p>";
        }
    }

    // Enviar respuesta a solicitud de amistad
    async function responderSolicitud(solicitudId, respuesta) {
        try {
            const response = await fetch('http://localhost:8000/api/responder-solicitud', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify({ solicitud_id: solicitudId, respuesta: respuesta })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error en la respuesta:', errorText);
                alert('Error al responder solicitud');
                return;
            }

            const data = await response.json();
            alert('Solicitud ' + respuesta);
            cargarSolicitudes();
            cargarAmigos(currentUserId);

        } catch (error) {
            console.error('Error respondiendo solicitud:', error);
        }
    }

    // Buscar usuarios y enviar solicitudes de amistad
    let renderizados = new Set();
    let ultimoTexto = '';
    inputBusqueda.addEventListener('input', async () => {
        const nombre = inputBusqueda.value.trim();

        if (nombre.length < 2) {
            resultados.innerHTML = '';
            return;
        }

        if (nombre !== ultimoTexto) {
            resultados.innerHTML = '';
            renderizados = new Set();
            ultimoTexto = nombre;
        }

        try {
            const res = await fetch(`http://localhost:8000/api/buscar-usuarios?nombre=${encodeURIComponent(nombre)}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            const usuarios = await res.json();
            const unicos = usuarios.filter((usuario, index, self) =>
                index === self.findIndex(u => u.id === usuario.id)
            );

            unicos.forEach(async usuario => {
                if (String(usuario.id) === currentUserId || renderizados.has(usuario.id)) return;
                renderizados.add(usuario.id);

                const item = document.createElement('div');
                item.className = "usuario-item";

                const img = document.createElement("img");
                img.src = usuario.avatar?.startsWith("http")
                    ? usuario.avatar
                    : `http://127.0.0.1:8000${usuario.avatar || '/storage/avatars/default.jpg'}`;
                img.onerror = () => img.src = '/storage/avatars/default.jpg';
                img.onclick = () => window.location.href = `perfil.html?id=${usuario.id}`;

                const span = document.createElement("span");
                span.textContent = usuario.nombre;
                span.onclick = () => window.location.href = `perfil.html?id=${usuario.id}`;

                const boton = document.createElement("button");
                boton.textContent = "Agregar";

                const estadoRes = await fetch(`http://localhost:8000/api/estado-amistad?id=${usuario.id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                const estado = await estadoRes.json();

                if (estado.estado === 'aceptada') {
                    boton.textContent = "Amigo";
                    boton.disabled = true;
                } else if (estado.estado === 'pendiente') {
                    boton.textContent = "Solicitud pendiente";
                    boton.disabled = true;
                } else {
                    boton.onclick = async () => {
                        const r = await fetch("http://localhost:8000/api/solicitar-amistad", {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${token}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ solicitado_id: usuario.id })
                        });
                        if (r.ok) {
                            boton.textContent = "Solicitud enviada";
                            boton.disabled = true;
                        } else {
                            alert("Error al enviar solicitud.");
                        }
                    };
                }

                item.append(img, span, boton);
                resultados.appendChild(item);
            });

        } catch (e) {
            console.error("Error buscando usuarios:", e);
        }
    });

    // Mostrar botón "Agregar amigo" si no es amigo
    async function mostrarBotonAgregarAmigo(idPerfilVisitado) {
        if (idPerfilVisitado === currentUserId) return; // No mostrar si es el mismo usuario

        let contenedorBoton = document.getElementById("contenedor-boton-agregar");
        if (!contenedorBoton) {
            contenedorBoton = document.createElement("div");
            contenedorBoton.id = "contenedor-boton-agregar";
            document.querySelector(".perfil-info")?.appendChild(contenedorBoton); // Asegúrate de que .perfil-info exista
        } else {
            contenedorBoton.innerHTML = ""; // Limpiar si ya existe
        }

        try {
            const res = await fetch(`http://localhost:8000/api/estado-amistad?id=${idPerfilVisitado}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const estado = await res.json();
            const boton = document.createElement("button");

            if (estado.estado === "aceptada") {
                boton.textContent = "Amigo";
                boton.disabled = true;
            } else if (estado.estado === "pendiente") {
                boton.textContent = "Solicitud pendiente";
                boton.disabled = true;
            } else {
                boton.textContent = "Agregar amigo";
                boton.addEventListener("click", async () => {
                    const r = await fetch("http://localhost:8000/api/solicitar-amistad", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ solicitado_id: idPerfilVisitado })
                    });
                    if (r.ok) {
                        boton.textContent = "Solicitud enviada";
                        boton.disabled = true;
                    } else {
                        alert("Error al enviar solicitud.");
                    }
                });
            }

            contenedorBoton.appendChild(boton);

        } catch (error) {
            console.error("Error verificando estado de amistad:", error);
        }
    }

    // ==== EVENTOS DE BOTONES ====

    btnEditar.addEventListener("click", () => {
        formularioEditarPerfil.classList.toggle("visible");
    });

    btnSolicitudes.addEventListener("click", () => {
        seccionBusqueda.classList.remove("visible");
        seccionEstadisticas.classList.remove("visible");
        seccionSolicitudes.classList.toggle("visible");
        cargarSolicitudes();
    });

    btnBuscar.addEventListener("click", () => {
        seccionSolicitudes.classList.remove("visible");
        seccionEstadisticas.classList.remove("visible");
        seccionBusqueda.classList.toggle("visible");
    });

    btnSalir.addEventListener("click", () => {
        localStorage.removeItem("token");
        alert("Sesión cerrada correctamente.");
        window.location.href = "index.html";
    });

    btnMenu.addEventListener("click", () => {
        window.location.href = "menu.html";
    });

    // Cambiar nombre de usuario
    document.getElementById("form-nombre").addEventListener("submit", async e => {
        e.preventDefault();
        const nuevo = document.getElementById("nuevo-nombre").value;
        const res = await fetch("http://localhost:8000/api/perfil/nombre", {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nombre: nuevo })
        });
        if (!res.ok) return alert("No se pudo cambiar el nombre");
        nombre.textContent = nuevo;
        alert("Nombre actualizado correctamente.");
    });

    // Cambiar avatar
    document.getElementById("input-avatar").addEventListener("change", async e => {
        const file = e.target.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append("avatar", file);
        const res = await fetch("http://localhost:8000/api/perfil/avatar", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: fd
        });
        if (!res.ok) return alert("Error al subir avatar");
        const data = await res.json();
        avatar.src = `http://127.0.0.1:8000${data.nuevo_avatar_url}`;
        alert("Avatar actualizado correctamente.");
        window.location.reload();
    });

    // Borrar avatar
    document.getElementById("borrar-avatar").addEventListener("click", async () => {
        const res = await fetch("http://127.0.0.1:8000/api/perfil/borrar-avatar", {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
        });
        if (!res.ok) return alert("Error al borrar avatar");
        const data = await res.json();
        avatar.src = `http://127.0.1:8000${data.nuevo_avatar_url || '/storage/avatars/default.jpg'}`;
        alert("Avatar eliminado correctamente.");
    });

    // Cambiar contraseña
    document.getElementById("form-password").addEventListener("submit", async e => {
        e.preventDefault();
        const actual = document.getElementById("password-actual").value;
        const nueva = document.getElementById("nueva-password").value;
        const confirmar = document.getElementById("confirmar-password").value;
        if (nueva !== confirmar) return alert("Las nuevas contraseñas no coinciden.");
        const res = await fetch("http://localhost:8000/api/perfil/password", {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contraseña_actual: actual,
                nueva_contraseña: nueva,
                nueva_contraseña_confirmation: confirmar
            })
        });
        const data = await res.json();
        if (!res.ok) return alert(data.error || "Error al cambiar contraseña.");
        alert(data.mensaje);
    });

    // ==== INICIALIZACIÓN ====
    await cargarPerfil();
    actualizarVistaSegunPerfil();
    await cargarAmigos(currentUserId);
    await cargarEstadisticas(currentUserId);
});
