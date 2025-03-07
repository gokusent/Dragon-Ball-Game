document.addEventListener("DOMContentLoaded", () => {
    const attackSound = document.getElementById("attackSound");
    const specialAttackSound = document.getElementById("specialAttackSound");

    function asignarSonidos() {
        document.querySelectorAll(".boton-atacar").forEach(btn => {
            btn.addEventListener("click", () => {
                attackSound.currentTime = 0;
                attackSound.play();
            });
        });

        document.querySelectorAll(".boton-habilidad").forEach(btn => {
            btn.addEventListener("click", () => {
                specialAttackSound.currentTime = 0;
                specialAttackSound.play();
            });
        });
    }

    setTimeout(asignarSonidos, 1000); // Asegura que los botones dinámicos ya existan
});

