document.addEventListener("DOMContentLoaded", async () => {
    const btnLogout = document.createElement("button");
    btnLogout.innerHTML = "Salir";
    document.body.appendChild(btnLogout);

    btnLogout.addEventListener("click", async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("No estás autenticado.");
            return;
        }

        try {
            const respuesta = await fetch("http://127.0.0.1:8000/api/logout", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`, // 🔑 Enviar el token
                    "Content-Type": "application/json"
                }
            });

            if (!respuesta.ok) throw new Error("Error al cerrar sesión");

            // ✅ Logout exitoso: eliminar token y redirigir
            localStorage.removeItem("token");
            alert("Sesión cerrada correctamente.");
            window.location.href = "index.html";
        } catch (error) {
            console.error("Error cerrando sesión:", error);
            alert("Hubo un problema al cerrar sesión.");
        }
    });
});
