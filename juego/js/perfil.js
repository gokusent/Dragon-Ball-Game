document.addEventListener("DOMContentLoaded", async () => {
    const perfilContainer = document.getElementById("perfil");

    // Contenedor para los datos del perfil
    const datosContainer = document.createElement("div");
    datosContainer.id = "datos-usuario";
    perfilContainer.appendChild(datosContainer);

    // 1) Obtener token y perfil propio
    const token = localStorage.getItem("token");
    if (!token) {
        alert("No estás autenticado.");
        window.location.href = "index.html";
        return;
    }

    // 2) Cargar mi perfil para saber mi ID
    let me;
    try {
        const meRes = await fetch("http://127.0.0.1:8000/api/perfil", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!meRes.ok) throw new Error();
        me = await meRes.json();
    } catch {
        console.error("Error al obtener tu perfil");
        return;
    }
    const currentUserId = String(me.id);

    // 3) ¿Se está viendo otro perfil? (lee ?id=XYZ)
    const params = new URLSearchParams(window.location.search);
    const viewId = params.get("id");  // null si no hay

    // 4) Cargar el perfil a mostrar
    let perfil;
    try {
        if (viewId && viewId !== currentUserId) {
            // Perfil de otro usuario
            const otherRes = await fetch(`http://127.0.0.1:8000/api/perfil/${viewId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!otherRes.ok) {
                alert("Usuario no encontrado.");
                return;
            }
            perfil = await otherRes.json();
        } else {
            // Mi propio perfil
            perfil = me;
        }
    } catch {
        console.error("Error cargando perfil solicitado");
        return;
    }

    // 5) Mostrar avatar y nombre
    const infoUsuario = document.createElement("div");
    infoUsuario.id = "info-usuario";
    datosContainer.appendChild(infoUsuario);

    const avatar = document.createElement("img");
    avatar.src = perfil.avatar.startsWith("http")
        ? perfil.avatar
        : `http://127.0.0.1:8000${perfil.avatar}`;
    avatar.alt = "Avatar";
    avatar.style.width = "100px";
    avatar.style.height = "100px";
    avatar.style.borderRadius = "50%";
    infoUsuario.appendChild(avatar);

    const nombre = document.createElement("h2");
    nombre.textContent = perfil.nombre;
    infoUsuario.appendChild(nombre);

    function crearParrafoStats(contenedor, texto) {
        const p = document.createElement("p");
        p.textContent = texto;
        contenedor.appendChild(p);
    }
    
    // 6) Mostrar estadísticas
    const statsContainer = document.createElement("div");
    statsContainer.id = "estadisticas-usuario";
    statsContainer.style.marginTop = "10px";
    datosContainer.appendChild(statsContainer);

    try {
        const statsRes = await fetch(
            `http://localhost:3000/api/estadisticas/usuario/${perfil.id}`,
        );        
    
        if (statsRes.ok) {
            stats = await statsRes.json();
        } else if (statsRes.status !== 404) {
            throw new Error("No se pudieron cargar las estadísticas");
        }

        crearParrafoStats(statsContainer, `Victorias: ${stats.victorias}`);
        crearParrafoStats(statsContainer, `Derrotas: ${stats.derrotas}`);
        crearParrafoStats(statsContainer, `Partidas: ${stats.numeroPartida}`);
        
    } catch (err) {
        console.error("Error al obtener las estadísticas:", err);
        crearParrafoStats(statsContainer, 'No se pudieron cargar las estadísticas.');
    }

    // 7) Amigos
    async function mostrarBotonAmistad(perfilId) {
        const container = document.getElementById('amigos-usuario');
    
        // Crear botón
        const boton = document.createElement('button');
        boton.style.marginTop = "10px";
        boton.style.padding = "8px 12px";
        boton.style.cursor = "pointer";
    
        // Verificar estado actual de la relación
        try {
            // Cambiar a GET y pasar el perfilId como parámetro de consulta
            const estadoResponse = await fetch(`http://localhost:8000/api/estado-amistad?solicitado_id=${perfilId}`, {
                method: 'GET', // Usar GET para evitar el error
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });
    
            const rawText = await estadoResponse.text();
            let estadoData;
            try {
                estadoData = JSON.parse(rawText);
            } catch (e) {
                console.error("Respuesta no válida:", rawText);
                return;
            }
    
            // Ajustar el texto y estado del botón según la respuesta
            if (estadoData.estado === 'aceptada') {
                boton.textContent = "Amigo";
                boton.disabled = true;
            } else if (estadoData.estado === 'pendiente') {
                boton.textContent = "Solicitud pendiente";
                boton.disabled = true;
            } else {
                boton.textContent = "Enviar solicitud de amistad";
                boton.disabled = false;
    
                // Solo añadimos el listener si puede enviar
                boton.addEventListener('click', async () => {
                    try {
                        const response = await fetch('http://localhost:8000/api/solicitar-amistad', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + localStorage.getItem('token')
                            },
                            body: JSON.stringify({ solicitado_id: perfilId })
                        });
    
                        const rawText = await response.text();
                        let data;
                        try {
                            data = JSON.parse(rawText);
                        } catch (e) {
                            console.error("Respuesta no válida:", rawText);
                            alert("Error interno del servidor.");
                            return;
                        }
    
                        if (response.ok) {
                            boton.textContent = "Solicitud enviada";
                            boton.disabled = true;
                        } else {
                            alert(data.message || 'Error al enviar solicitud');
                        }
                    } catch (error) {
                        console.error('Error enviando solicitud:', error);
                    }
                });
            }
    
            container.appendChild(boton);
        } catch (error) {
            console.error('Error al verificar estado de amistad:', error);
        }
    }
    
    

    async function cargarSolicitudesPendientes() {
        const container = document.getElementById('solicitudes-pendientes');
        container.innerHTML = "<h3>Solicitudes de amistad recibidas</h3>";
    
        try {
            const response = await fetch("http://localhost:8000/api/solicitudes-pendientes", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                }
            });
    
            if (!response.ok) {
                const errorText = await response.text(); // porque puede no ser JSON
                throw new Error(errorText);
            }
    
            const solicitudes = await response.json();
    
            if (solicitudes.length === 0) {
                container.innerHTML += "<p>No tienes solicitudes pendientes.</p>";
                return;
            }
    
            solicitudes.forEach(solicitud => {
                const divSolicitud = document.createElement('div');
                divSolicitud.style.marginBottom = "10px";
    
                const nombre = solicitud.solicitante.nombre;
                divSolicitud.innerHTML = `<strong>${nombre}</strong> quiere ser tu amigo.`;
    
                const btnAceptar = document.createElement('button');
                btnAceptar.textContent = "Aceptar";
                btnAceptar.style.marginLeft = "10px";
                btnAceptar.addEventListener('click', () => responderSolicitud(solicitud.id, 'aceptada'));
    
                const btnRechazar = document.createElement('button');
                btnRechazar.textContent = "Rechazar";
                btnRechazar.style.marginLeft = "5px";
                btnRechazar.addEventListener('click', () => responderSolicitud(solicitud.id, 'rechazada'));
    
                divSolicitud.appendChild(btnAceptar);
                divSolicitud.appendChild(btnRechazar);
    
                container.appendChild(divSolicitud);
            });
        } catch (error) {
            console.error("Error cargando solicitudes:", error);
        }
    }
    

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
                const errorData = await response.text();  // Obtén el contenido como texto
                console.error('Error en la respuesta:', errorData);  // Muestra el contenido del error
                alert('Error al responder solicitud');
                return;
            }
            
            const data = await response.json();  // Solo intentar convertir a JSON si la respuesta es OK
            
            if (response.ok) {
                alert('Solicitud ' + respuesta);
                cargarSolicitudesPendientes(); // Refrescar lista
            } else {
                alert(data.message || 'Error al responder solicitud');
            }
            
        } catch (error) {
            console.error('Error respondiendo solicitud:', error);
        }
    }

    // 8) Si es MI perfil, habilitar edición
    if (!viewId || viewId === currentUserId) {
        setupCambiarNombre();
        setupAvatarMenu();
        setupCambiarPassword();
    }

    // 9) Botón Volver al menú
    const btnVolver = document.createElement("button");
    btnVolver.textContent = "Volver al Menú";
    btnVolver.style.marginTop = "20px";
    btnVolver.addEventListener("click", () => {
        window.location.href = "menu.html";
    });
    datosContainer.appendChild(btnVolver);

    // 10) Logout (solo en mi perfil)
    if (!viewId || viewId === currentUserId) {
        const logoutContainer = document.createElement("div");
        logoutContainer.id = "logout-container";
        logoutContainer.style.marginTop = "10px";
        datosContainer.appendChild(logoutContainer);

        const btnLogout = document.createElement("button");
        btnLogout.textContent = "Salir";
        btnLogout.addEventListener("click", async () => {
            await fetch("http://127.0.0.1:8000/api/logout", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            localStorage.removeItem("token");
            window.location.href = "index.html";
        });
        logoutContainer.appendChild(btnLogout);
    }

    // 11) Mostrar botón de amistad si es otro perfil
    if (viewId && viewId !== currentUserId) {
        const amistadContainer = document.createElement("div");
        amistadContainer.id = "amigos-usuario";
        amistadContainer.style.marginTop = "20px";
        datosContainer.appendChild(amistadContainer);
        await mostrarBotonAmistad(viewId);
    }
    
    // 12) Mostrar solicitudes pendientes solo en tu perfil
    if (!viewId || viewId === currentUserId) {
        const solicitudesContainer = document.createElement("div");
        solicitudesContainer.id = "solicitudes-pendientes";
        solicitudesContainer.style.marginTop = "20px";
        datosContainer.appendChild(solicitudesContainer);
        await cargarSolicitudesPendientes();
    }
    
    // 13) Crear buscador de amigos
    if (!viewId || viewId === currentUserId) {
        const amigosContainer = document.createElement("div");
        amigosContainer.id = "amigos-usuario";
        amigosContainer.style.marginTop = "20px";
        datosContainer.appendChild(amigosContainer);
        
        function crearBuscadorAmigos() {
            const contenedor = document.getElementById('amigos-usuario'); // Puedes cambiar este contenedor
        
            // Botón para mostrar/ocultar el buscador
            const botonAbrir = document.createElement('button');
            botonAbrir.textContent = 'Buscar perfiles';
            botonAbrir.style.margin = '10px';
            botonAbrir.style.padding = '6px 10px';
        
            const botonVerAmigos = document.createElement('button');
            botonVerAmigos.textContent = 'Amigos';
            botonVerAmigos.style.margin = '10px';
            botonVerAmigos.style.padding = '6px 10px';

            contenedor.appendChild(botonVerAmigos);

            // Contenedor desplegable para los amigos
            const amigosListaContainer = document.createElement('div');
            amigosListaContainer.style.marginTop = '10px';
            amigosListaContainer.style.display = 'none'; // Oculto inicialmente

            contenedor.appendChild(amigosListaContainer);

            contenedor.appendChild(botonAbrir);
        
            // Contenedor del buscador
            const buscadorContainer = document.createElement('div');
            buscadorContainer.style.marginTop = '10px';
            buscadorContainer.style.display = 'none';
            buscadorContainer.style.position = 'relative';
            buscadorContainer.style.border = '1px solid #ccc';
            buscadorContainer.style.padding = '10px';
            buscadorContainer.style.borderRadius = '6px';

            const inputBusqueda = document.createElement('input');
            inputBusqueda.type = 'text';
            inputBusqueda.placeholder = 'Escribe un nombre...';
            inputBusqueda.style.padding = '6px';
            inputBusqueda.style.marginRight = '10px';
            inputBusqueda.style.width = '200px';
        
            const resultados = document.createElement('div');
            resultados.style.marginTop = '10px';
        
            buscadorContainer.appendChild(inputBusqueda);
            buscadorContainer.appendChild(resultados);
            contenedor.appendChild(buscadorContainer);
        
            // Botón de cerrar (X)
            const botonCerrar = document.createElement('button');
            botonCerrar.textContent = '✖';
            botonCerrar.style.position = 'absolute';
            botonCerrar.style.bottom = '6px';
            botonCerrar.style.right = '6px';
            botonCerrar.style.border = 'none';
            botonCerrar.style.background = 'transparent';
            botonCerrar.style.cursor = 'pointer';
            botonCerrar.style.fontSize = '16px';
            botonCerrar.title = 'Borrar';

            botonCerrar.addEventListener('click', () => {
                buscadorContainer.style.display = 'none';
                resultados.innerHTML = '';
                inputBusqueda.value = '';
                renderizados = new Set();
                ultimoTexto = '';
            });

            buscadorContainer.appendChild(botonCerrar);

            botonAbrir.addEventListener('click', () => {
                const visible = buscadorContainer.style.display === 'none';
                buscadorContainer.style.display = visible ? 'block' : 'none';
            
                if (!visible) {
                    // Si lo cierras, reinicia todo
                    resultados.innerHTML = '';
                    inputBusqueda.value = '';
                    renderizados = new Set();
                    ultimoTexto = '';
                }
            });

            botonVerAmigos.addEventListener('click', async () => {
                amigosListaContainer.style.display = amigosListaContainer.style.display === 'none' ? 'block' : 'none';
            
                if (amigosListaContainer.innerHTML !== '') return; // Si ya se cargaron, no volver a pedirlos
            
                try {
                    const res = await fetch('http://localhost:8000/api/mis-amigos', {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        }
                    });
            
                    const data = await res.json();
                    const amigos = data.amigos;
                                
                    botonVerAmigos.textContent = `Amigos (${amigos.length})`;

                    if (amigos.length === 0) {
                        amigosListaContainer.innerHTML = '<p>No tienes amigos.</p>';
                        return;
                    }
                    
                    amigos.forEach(amigo => {
                    const item = document.createElement('div');
                    item.style.display = 'flex';
                    item.style.alignItems = 'center';
                    item.style.marginBottom = '10px';

                    const avatar = document.createElement('img');
                    avatar.src = amigo.avatar?.startsWith("http")
                    ? amigo.avatar
                    : `http://127.0.0.1:8000${amigo.avatar || '/storage/avatars/default.jpg'}`;            avatar.alt = 'avatar';
                    avatar.style.width = '40px';
                    avatar.style.height = '40px';
                    avatar.style.borderRadius = '50%';
                    avatar.style.marginRight = '10px';
                    avatar.onerror = () => avatar.src = '/storage/avatars/default.jpg';

                    const nombre = document.createElement('span');
                    nombre.textContent = amigo.nombre;

                    avatar.style.cursor = 'pointer';
                    nombre.style.cursor = 'pointer';

                    avatar.onclick = () => {
                        window.location.href = `perfil.html?id=${amigo.id}`;
                    };
                    nombre.onclick = () => {
                        window.location.href = `perfil.html?id=${amigo.id}`;
                    };

                    item.appendChild(avatar);
                    item.appendChild(nombre);
                    amigosListaContainer.appendChild(item);
                });
            } catch (err) {
                console.error('Error al cargar amigos:', err);
            }
        });
        
        // Mueve esto fuera del inputBusqueda.addEventListener:
        let renderizados = new Set(); // IDs ya mostrados

        let ultimoTexto = ''; // Para evitar búsquedas repetidas

        inputBusqueda.addEventListener('input', async () => {
            const nombre = inputBusqueda.value.trim();
            if (nombre.length < 2) {
                resultados.innerHTML = ''; // Limpiar resultados si el texto es corto
                return;
            }

            if (nombre !== ultimoTexto) {  
                // Evitar búsquedas repetidas
                resultados.innerHTML = ''; // Limpiar resultados previos
                renderizados = new Set(); // Reiniciar el set de renderizados
                ultimoTexto = nombre; // Actualizar el último texto buscado
            }

            try {
                const res = await fetch(`http://localhost:8000/api/buscar-usuarios?nombre=${encodeURIComponent(nombre)}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });

                const usuarios = await res.json();

                const unicos = usuarios.filter((usuario, index, self) =>
                    index === self.findIndex(u => u.id === usuario.id)
                );

                unicos.forEach(async usuario => {
                    if (String(usuario.id) === currentUserId || renderizados.has(usuario.id)) return;

                    renderizados.add(usuario.id); // Ahora sí se mantiene entre búsquedas
                
                    const item = document.createElement('div');
                    item.style.display = 'flex';
                    item.style.alignItems = 'center';
                    item.style.marginBottom = '10px';

                    const enlacePerfil = document.createElement('a');
                    enlacePerfil.href = `perfil.html?id=${usuario.id}`;
                    enlacePerfil.style.display = 'flex';
                    enlacePerfil.style.alignItems = 'center';
                    enlacePerfil.style.textDecoration = 'none';
                    enlacePerfil.style.color = 'inherit';

                    const avatarImg = document.createElement('img');
                    avatarImg.src = usuario.avatar?.startsWith("http")
                        ? usuario.avatar
                        : `http://127.0.0.1:8000${usuario.avatar || '/storage/avatars/default.jpg'}`;
                    avatarImg.alt = "Avatar";
                    avatarImg.style.width = '40px';
                    avatarImg.style.height = '40px';
                    avatarImg.style.borderRadius = '50%';
                    avatarImg.style.marginRight = '10px';
                    avatarImg.onerror = () => avatarImg.src = '/storage/avatars/default.jpg';

                    const nombre = document.createElement('span');
                    nombre.textContent = usuario.nombre;
                    nombre.style.fontSize = '16px';

                    enlacePerfil.appendChild(avatarImg);
                    enlacePerfil.appendChild(nombre);

                    item.appendChild(enlacePerfil);


                    const botonAgregar = document.createElement('button');
                    botonAgregar.style.padding = '4px 8px';

                // Verificar estado de amistad
                try {
                    const estadoRes = await fetch(`http://localhost:8000/api/estado-amistad?id=${usuario.id}`, {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        }
                    });
                    const estadoJson = await estadoRes.json();
                    
                    if (estadoJson.estado === 'pendiente') {
                        botonAgregar.textContent = 'Solicitud pendiente';
                        botonAgregar.disabled = true;
                    } else if (estadoJson.estado === 'aceptada') {
                        botonAgregar.textContent = 'Amigo';
                        botonAgregar.disabled = true;
                    } else {
                        // Solo si no hay amistad, permitir enviar solicitud        
                        botonAgregar.textContent = 'Agregar';
                        botonAgregar.onclick = async () => {
                            const respuesta = await fetch('http://localhost:8000/api/solicitar-amistad', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                                },
                                body: JSON.stringify({ solicitado_id: usuario.id })
                            });

                            const raw = await respuesta.text();
                            if (respuesta.ok) {
                                botonAgregar.textContent = "Solicitud enviada";
                                botonAgregar.disabled = true;
                            } else {
                                alert(raw);
                            }
                        };
                    }
                } catch (err) {
                    console.error('Error al comprobar estado de amistad:', err);
                    botonAgregar.textContent = 'Agregar';
                }

                item.appendChild(botonAgregar);
                resultados.appendChild(item);
            });


            } catch (err) {
                console.error('Error al buscar usuarios:', err);
            }        
        });
    }
    
    crearBuscadorAmigos();
}

    // ——— Funciones auxiliares ———

    async function setupCambiarNombre() {
        nombre.style.cursor = "pointer";
        nombre.title = "Haz clic para cambiar el nombre";
        nombre.addEventListener("click", async () => {
            const nuevo = prompt("Escribe tu nuevo nombre:");
            if (!nuevo) return;
            const res = await fetch("http://127.0.0.1:8000/api/perfil/nombre", {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ nombre: nuevo })
            });
            if (!res.ok) return alert("No se pudo cambiar el nombre.");
            nombre.textContent = nuevo;
            alert("Nombre actualizado correctamente.");
        });
    }

    function setupAvatarMenu() {
        const menu = document.createElement("div");
        menu.id = "menu-avatar";
        Object.assign(menu.style, {
            display: "none",
            position: "absolute",
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            padding: "10px",
            borderRadius: "5px",
            zIndex: 10000
        });
        document.body.appendChild(menu);

        const btnCamb = document.createElement("button");
        btnCamb.textContent = "Cambiar Avatar";
        const btnBorr = document.createElement("button");
        btnBorr.textContent = "Borrar Avatar";
        menu.append(btnCamb, btnBorr);

        avatar.style.cursor = "pointer";
        avatar.title = "Cambiar o borrar avatar";
        avatar.addEventListener("click", e => {
            menu.style.display = "block";
            menu.style.top = `${e.clientY + 5}px`;
            menu.style.left = `${e.clientX + 5}px`;
        });
        window.addEventListener("click", e => {
            if (!menu.contains(e.target) && e.target !== avatar) {
                menu.style.display = "none";
            }
        });

        btnCamb.addEventListener("click", () => {
            const fi = document.createElement("input");
            fi.type = "file"; fi.accept = "image/*"; fi.click();
            fi.onchange = async () => {
                const file = fi.files[0];
                if (!file) return;
                const fd = new FormData();
                fd.append("avatar", file);
                const r = await fetch("http://127.0.0.1:8000/api/perfil/avatar", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: fd
                });
                if (!r.ok) return alert("Error al subir avatar.");
                const j = await r.json();
                avatar.src = `http://127.0.0.1:8000${j.nuevo_avatar_url}`;
                window.location.reload();
            };
        });

        btnBorr.addEventListener("click", async () => {
            const r = await fetch("http://127.0.0.1:8000/api/perfil/borrar-avatar", {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            if (!r.ok) return alert("Error al borrar avatar.");
            const j = await r.json();
            avatar.src = `http://127.0.0.1:8000${j.avatar}`;
            menu.style.display = "none";
        });
    }

    function setupCambiarPassword() {
        const btn = document.createElement("button");
        btn.textContent = "Cambiar Contraseña";
        datosContainer.appendChild(btn);
        btn.addEventListener("click", () => {
            // Crear fondo oscuro
            const fondoModal = document.createElement("div");
            fondoModal.id = "fondo-modal";
            fondoModal.style.position = "fixed";
            fondoModal.style.top = 0;
            fondoModal.style.left = 0;
            fondoModal.style.width = "100%";
            fondoModal.style.height = "100%";
            fondoModal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
            fondoModal.style.display = "flex";
            fondoModal.style.alignItems = "center";
            fondoModal.style.justifyContent = "center";
            fondoModal.style.zIndex = 9999;

            // Crear contenido del modal
            const modal = document.createElement("div");
            modal.style.backgroundColor = "#fff";
            modal.style.padding = "20px";
            modal.style.borderRadius = "8px";
            modal.style.width = "300px";
            modal.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
            modal.innerHTML = `
                <h2>Cambiar Contraseña</h2>
                <input type="password" id="password-actual" placeholder="Contraseña actual" style="width: 100%; margin-bottom: 10px;">
                <input type="password" id="nueva-password" placeholder="Nueva contraseña" style="width: 100%; margin-bottom: 10px;">
                <input type="password" id="confirmar-password" placeholder="Confirmar nueva contraseña" style="width: 100%; margin-bottom: 20px;">
                <button id="btn-actualizar-password" style="width: 100%; margin-bottom: 10px;">Actualizar</button>
                <button id="btn-cancelar" style="width: 100%;">Cancelar</button>
            `;

            fondoModal.appendChild(modal);
            document.body.appendChild(fondoModal);

            // Eventos para actualizar o cancelar
            document.getElementById("btn-cancelar").addEventListener("click", () => {
                document.body.removeChild(fondoModal);
            });

            document.getElementById("btn-actualizar-password").addEventListener("click", async () => {
                const contraseñaActual = document.getElementById("password-actual").value;
                const nuevaContraseña = document.getElementById("nueva-password").value;
                const confirmarContraseña = document.getElementById("confirmar-password").value;

                if (!contraseñaActual || !nuevaContraseña || !confirmarContraseña) {
                    alert("Por favor, completa todos los campos.");
                    return;
                }

                if (nuevaContraseña !== confirmarContraseña) {
                    alert("Las nuevas contraseñas no coinciden.");
                    return;
                }

                try {
                    const token = localStorage.getItem("token");
                    const respuesta = await fetch("http://127.0.0.1:8000/api/perfil/password", {
                        method: "PUT",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            contraseña_actual: contraseñaActual,
                            nueva_contraseña: nuevaContraseña,
                            nueva_contraseña_confirmation: confirmarContraseña
                        })
                    });

                    const data = await respuesta.json();

                    if (!respuesta.ok) {
                        if (data.errores) {
                            alert(Object.values(data.errores).join("\n"));
                        } else if (data.error) {
                            alert(data.error);
                        } else {
                            alert("Error al cambiar contraseña.");
                        }
                        return;
                    }

                    alert(data.mensaje);
                    document.body.removeChild(fondoModal);
                } catch (error) {
                    console.error("Error actualizando contraseña:", error);
                    alert("Hubo un problema al cambiar la contraseña.");
                }
            });
        });
    }
});