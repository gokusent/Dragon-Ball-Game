document.addEventListener("DOMContentLoaded", () => {
    const pantallaTitulo = document.getElementById("pantalla-titulo");
    const pantallaInicio = document.getElementById("pantalla-inicio");
    
    const btnIniciar = document.getElementById("btn-iniciar");
    const btnJugar = document.getElementById("btn-jugar");
    const btnGacha = document.getElementById("btn-gacha");
    const btnInventario = document.getElementById("btn-inventario");

    // Iniciar el juego y mostrar el menú principal
    btnIniciar.addEventListener("click", () => {
        pantallaTitulo.style.display = "none";
        pantallaInicio.classList.remove("oculto");
    });

    // Ir a la pantalla de combate
    btnJugar.addEventListener("click", () => {
        window.location.href = "seleccion.html"; // Redirige a la pantalla de combate
    });

    btnGacha.addEventListener("click", () => {
        window.location.href = "gacha.html";
    })

    btnInventario.addEventListener("click", () => {
        window.location.href = "inventario.html";
    });
});
