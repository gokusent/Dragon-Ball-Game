document.addEventListener("DOMContentLoaded", () => {
    // 📌 Elementos del menú principal
    const pantallaInicio = document.getElementById("pantalla-inicio");
    const pantallaJugar = document.getElementById("pantalla-jugar");

    const btnJugar = document.getElementById("btn-jugar");
    const btnGacha = document.getElementById("btn-gacha");
    const btnInventario = document.getElementById("btn-inventario");
    const btnPerfil = document.getElementById("btn-perfil");
    const btnAjustes = document.getElementById("btn-ajustes");
    const btnVolver = document.getElementById("btn-volver-menu");

    function mostrarPantalla(pantallaMostrar, pantallaOcultar) {
        if (pantallaMostrar && pantallaOcultar) {
            pantallaOcultar.classList.add("oculto");
            pantallaMostrar.classList.remove("oculto");
        }
    }

    if (btnJugar) {
        btnJugar.addEventListener("click", () => {
            mostrarPantalla(pantallaJugar, pantallaInicio);
        });
    }

    if (btnVolver) {
        btnVolver.addEventListener("click", () => {
            mostrarPantalla(pantallaInicio, pantallaJugar);
        });
    }

    if (btnGacha) btnGacha.addEventListener("click", () => window.location.href = "gacha.html");
    if (btnInventario) btnInventario.addEventListener("click", () => window.location.href = "inventario.html");
    if (btnPerfil) btnPerfil.addEventListener("click", () => window.location.href = "perfil.html");

    // Redirigir a la selección con el modo de juego en la URL
    const btnJugarCPU = document.getElementById("btn-jugar-cpu");
    const btnJugarLocal = document.getElementById("btn-jugar-local");
    const btnJugarPVP = document.getElementById("btn-jugar-pvp");

    if (btnJugarCPU) btnJugarCPU.addEventListener("click", () => window.location.href = "seleccion.html?modo=cpu");
    if (btnJugarLocal) btnJugarLocal.addEventListener("click", () => window.location.href = "seleccion.html?modo=local");
    if (btnJugarPVP) { 
        btnJugarPVP.addEventListener("click", () => {
            console.log("🔍 Buscando partida PVP...");
            
            const socket = io("http://localhost:3000");
        
            // Deshabilitar botón para evitar múltiples clics
            btnJugarPVP.disabled = true; 
        
            // Emitimos la búsqueda de partida
            socket.emit("buscar_partida");
        
            // Manejar eventos de conexión y partida encontrada
            socket.on("connect", () => {
                console.log("✅ Conectado al servidor PVP con ID:", socket.id);
            });
        
            socket.on("partida_empezada", (data) => {
                console.log("🎮 Partida encontrada:", data); // Verifica qué se recibe
            
                if (data.sala) {
                    console.log(`🔗 Redirigiendo a sala.html?sala=${data.sala}`);
                    window.location.href = `sala.html?sala=${data.sala}`;
                } else {
                    console.error("❌ No se recibió un ID de sala válido");
                }
            });
            
        
            socket.on("disconnect", () => {
                console.log("❌ Desconectado del servidor PVP");
            });
        });        
    }
    
    // Obtener modo de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const modo = urlParams.get("modo");

    console.log("Modo de juego seleccionado:", modo);

    // ✅ Solo cargar el script correspondiente al modo si no se ha cargado antes
    const modosValidos = ["cpu", "local", "pvp"];
    if (modosValidos.includes(modo) && !window.modoCargado) {
        window.modoCargado = modo; // Guardamos qué modo ya se cargó
        import(`./modo${modo.charAt(0).toUpperCase() + modo.slice(1)}.js`)
            .then(() => console.log(`✅ Script de modo ${modo} cargado correctamente`))
            .catch(err => console.error(`❌ Error al cargar modo ${modo}:`, err));
    } else {
        console.error("⚠️ Modo de juego no válido o ya cargado:", modo);
    }
});


