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
        
                // Genera un nombre de sala aleatorio
                const nombreSala = `pvp_${Date.now()}`;
        
                try {
                    const response = await fetch("http://localhost:8000/api/crear-sala", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            sala: nombreSala,
                            jugador1_id: 1 // ⚠️ Aquí debes poner el ID real del jugador autenticado
                        })
                    });
        
                    if (!response.ok) {
                        throw new Error(`Error al crear la sala: ${response.statusText}`);
                    }
        
                    const data = await response.json();
        
                    console.log("✅ Sala creada:", data);
                    console.log("Respuesta de la API:", data); // Verifica el valor completo de la respuesta

                    if (data.sala) {
                        window.location.href = `sala.html?sala=${encodeURIComponent(data.sala)}`;
                    }
                } catch (error) {
                    console.error("Error al crear la sala:", error);
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

