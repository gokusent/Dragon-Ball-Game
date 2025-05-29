document.addEventListener("DOMContentLoaded", () => {
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
    alert("Debes iniciar sesión para ver tu inventario.");
    window.location.href = "index.html";
    return;
  }

  // ==== ELEMENTOS DEL DOM ====
  const inventarioContainer = document.getElementById("inventario-container");
  const buscadorInput = document.getElementById("buscador");
  const filtroSelect = document.getElementById("filtro");
  const filtroRareza = document.getElementById("filtro-rareza");
  const modal = document.getElementById("personaje-modal");
  const cerrarBtn = document.getElementById("cerrar-modal");
  const imgContent = document.getElementById("img-content");
  const infoContent = document.getElementById("info");

  let personajes = [];

  // ==== FUNCIONES ====

  // Mostrar modal con los detalles del personaje
  function mostrarDetalles(personaje) {
    // Mostrar imagen principal (usa imagen_url si existe y por defecto una imagen genérica)
    imgContent.innerHTML = `
      <img src="${personaje.imagen_url || 'cartas/default.png'}" class="imagen-grande" alt="${personaje.nombre}">
    `;

    // Mostrar la información completa del personaje
    infoContent.innerHTML = `
      <h2>${personaje.nombre}</h2>
      <p><strong>Rareza:</strong> <span class="${personaje.rareza?.toLowerCase() || 'común'}">${personaje.rareza ?? 'Común'}</span></p>
      <p><strong>Vida:</strong> ${personaje.vida ?? 'N/A'}</p>
      <p><strong>Daño:</strong> ${personaje.daño ?? 'N/A'}</p>
      <p><strong>Energía:</strong> ${personaje.energia ?? 'N/A'}</p>
      <p><strong>Técnica Especial:</strong> ${personaje.tecnica_especial ?? 'N/A'}</p>
      <p><strong>Daño Técnica Especial:</strong> ${personaje.daño_especial ?? 'N/A'}</p>
    `;

    // Mostrar el modal
    modal.style.display = "block";
  }

  // Renderizar cartas en el contenedor principal
  function renderizarCartas(lista) {
    inventarioContainer.innerHTML = "";

    if (lista.length === 0) {
      inventarioContainer.innerHTML = "<p>No hay personajes que mostrar.</p>";
      return;
    }

    // Crear cada carta a partir de los personajes filtrados
    lista.forEach(personaje => {
      const card = document.createElement("div");
      card.classList.add("carta");

      card.innerHTML = `
        <h3>${personaje.nombre}</h3>
        <img src="${personaje.imagen_url || 'cartas/default.png'}" alt="${personaje.nombre}">
        <div class="info">
          <p>Cantidad: ${personaje.cantidad ?? 1}</p>
        </div>
      `;

      // Evento para abrir modal al hacer clic en la carta
      card.addEventListener("click", () => mostrarDetalles(personaje));

      inventarioContainer.appendChild(card);
    });
  }

  // Aplicar filtros de búsqueda, rareza y orden
  function aplicarFiltros() {
    const textoBusqueda = buscadorInput.value.toLowerCase();
    const filtroOrden = filtroSelect.value;
    const filtroRarezaValue = filtroRareza.value.toLowerCase();

    // Filtrar por nombre y rareza
    let filtrados = personajes.filter(p =>
      p.nombre.toLowerCase().includes(textoBusqueda) &&
      (filtroRarezaValue === "" || (p.rareza?.toLowerCase() === filtroRarezaValue))
    );

    // Ordenar por daño o vida
    switch (filtroOrden) {
      case "daño-asc":
        filtrados.sort((a, b) => (a.daño ?? 0) - (b.daño ?? 0));
        break;
      case "daño-desc":
        filtrados.sort((a, b) => (b.daño ?? 0) - (a.daño ?? 0));
        break;
      case "vida-asc":
        filtrados.sort((a, b) => (a.vida ?? 0) - (b.vida ?? 0));
        break;
      case "vida-desc":
        filtrados.sort((a, b) => (b.vida ?? 0) - (a.vida ?? 0));
        break;
    }

    // Mostrar resultados filtrados
    renderizarCartas(filtrados);
  }

  // Cargar el inventario desde la API
  async function cargarInventario() {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/inventario", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Error al obtener inventario");

      const inventario = await res.json();

      if (inventario.length === 0) {
        inventarioContainer.innerHTML = "<p id='nohay'>No tienes personajes en tu inventario.</p>";
        return;
      }

      // Obtener detalles de cada carta en el inventario
      const detallesPromises = inventario.map(p =>
        fetch(`http://127.0.0.1:8000/api/cartas/${p.carta_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(r => {
            if (!r.ok) throw new Error("Error al obtener detalles");
            return r.json();
          })
          .then(detalle => ({ ...p, ...detalle })) // Combinar info del inventario y la carta
      );

      personajes = await Promise.all(detallesPromises);

      // Mostrar todas las cartas
      renderizarCartas(personajes);

    } catch (error) {
      console.error(error);
      inventarioContainer.innerHTML = "<p>Error al cargar inventario.</p>";
    }
  }

  // ==== EVENTOS ====

  // Filtros de búsqueda y selección
  buscadorInput.addEventListener("input", aplicarFiltros);
  filtroSelect.addEventListener("change", aplicarFiltros);
  filtroRareza.addEventListener("change", aplicarFiltros);

  // Cerrar modal desde el botón
  cerrarBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Cerrar modal haciendo clic fuera del contenido
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
  });

  // ==== INICIAR CARGA DE DATOS ====
  cargarInventario();
});
