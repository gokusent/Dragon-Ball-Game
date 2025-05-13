document.addEventListener("DOMContentLoaded", () => {
    const elementosUI = {
        pantallaInicio: document.getElementById("pantalla-inicio"),
        pantallaJugar: document.getElementById("pantalla-jugar"),
        btnJugar: document.getElementById("btn-jugar"),
        btnGacha: document.getElementById("btn-gacha"),
        btnInventario: document.getElementById("btn-inventario"),
        btnPerfil: document.getElementById("btn-perfil"),
        btnAjustes: document.getElementById("btn-ajustes"),
        btnVolver: document.getElementById("btn-volver-menu"),
        btnJugarCPU: document.getElementById("btn-jugar-cpu"),
        btnJugarLocal: document.getElementById("btn-jugar-local"),
        btnJugarPVP: document.getElementById("btn-jugar-pvp"),
        btnForo : document.getElementById("btn-foro"),
    };

    function mostrarPantalla(pantallaMostrar, pantallaOcultar) {
        if (pantallaMostrar && pantallaOcultar) {
            pantallaOcultar.classList.add("oculto");
            pantallaMostrar.classList.remove("oculto");
        }
    }

    function setupEventListeners() {
        if (elementosUI.btnJugar) {
            elementosUI.btnJugar.addEventListener("click", () => {
                mostrarPantalla(elementosUI.pantallaJugar, elementosUI.pantallaInicio);
            });
        }

        if (elementosUI.btnVolver) {
            elementosUI.btnVolver.addEventListener("click", () => {
                mostrarPantalla(elementosUI.pantallaInicio, elementosUI.pantallaJugar);
            });
        }

        if (elementosUI.btnGacha) elementosUI.btnGacha.addEventListener("click", () => window.location.href = "gacha.html");
        if (elementosUI.btnInventario) elementosUI.btnInventario.addEventListener("click", () => window.location.href = "inventario.html");
        if (elementosUI.btnPerfil) elementosUI.btnPerfil.addEventListener("click", () => window.location.href = "perfil.html");

        if (elementosUI.btnJugarCPU) elementosUI.btnJugarCPU.addEventListener("click", () => window.location.href = "seleccion.html?modo=cpu");
        if (elementosUI.btnJugarLocal) elementosUI.btnJugarLocal.addEventListener("click", () => window.location.href = "seleccion.html?modo=local");

        if (elementosUI.btnJugarPVP) {
            elementosUI.btnJugarPVP.addEventListener("click", async () => {
                const token = localStorage.getItem("token");
            
                try {
                    // Obtener perfil del usuario autenticado (para el ID)
                    const perfilRes = await fetch("http://localhost:8000/api/perfil", {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
            
                    if (!perfilRes.ok) throw new Error("No se pudo obtener el perfil");
            
                    const perfil = await perfilRes.json();
                    const jugador_id = perfil.id;
            
                    // Buscar salas disponibles
                    const disponiblesRes = await fetch("http://localhost:8000/api/salas-disponibles", {
                        headers: { Authorization: `Bearer ${token}` }
                    });
            
                    const salas = await disponiblesRes.json();
            
                    let nombreSala;
            
                    if (salas.length > 0) {
                        // Hay una sala disponible: unirse como jugador2
                        const sala = salas[0];
                        nombreSala = sala.sala;
            
                        const joinRes = await fetch(`http://localhost:8000/api/salas/${sala.id}`, {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({ jugador2_id: jugador_id })
                        });
            
                        if (!joinRes.ok) throw new Error("Error al unirse a la sala existente");
            
                        const data = await joinRes.json();

                        // Guarda antes de cambiar a la página de combate
                        localStorage.setItem("jugador_id", jugador_id);
                        localStorage.setItem("salaPvp", nombreSala);
                        console.log(`✅ Te uniste a la sala de ${data.jugador1_id} (ID: ${data.id})`);
                        window.location.href = `sala.html?sala=${encodeURIComponent(data.sala)}`;

                    } else {
                        // No hay salas → crear una nueva
                        nombreSala = `pvp_${Date.now()}`;
            
                        const crearRes = await fetch("http://localhost:8000/api/crear-sala", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                sala: nombreSala,
                                jugador1_id: jugador_id
                            })
                        });
            
                        if (!crearRes.ok) throw new Error("Error al crear la sala");
            
                        const crearData = await crearRes.json();
                        console.log("✅ Sala creada:", crearData);
                    }
            
                    // Redirigir al HTML de la sala
                    if (nombreSala) {
                        // Guarda antes de cambiar a la página de combate
                        localStorage.setItem("jugador_id", jugador_id);
                        localStorage.setItem("salaPvp", nombreSala);
                        window.location.href = `sala.html?sala=${encodeURIComponent(nombreSala)}`;
                    }
            
                } catch (error) {
                    console.error("Error en el flujo de PvP:", error);
                }
            });            
        }
        
        if (elementosUI.btnForo) elementosUI.btnForo.addEventListener("click", () => window.location.href = "foro.html");
    }

    function cargarModoJuego() {
        const urlParams = new URLSearchParams(window.location.search);
        const modo = urlParams.get("modo");

        const modosValidos = ["cpu", "local", "pvp"];
        if (modosValidos.includes(modo) && !window.modoCargado) {
            window.modoCargado = modo;
            import(`./modo${modo.charAt(0).toUpperCase() + modo.slice(1)}.js`)
                .then(() => console.log(`✅ Script de modo ${modo} cargado`))
                .catch(err => console.error(`❌ Error al cargar modo ${modo}:`, err));
        }
    }

    setupEventListeners();
    cargarModoJuego();
});

