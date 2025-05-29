import socket from "./socket.js";

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");

    try {
        if (!token) throw new Error('No hay token en localStorage.');

        // Obtener perfil del usuario actual
        const perfilRes = await fetch("http://127.0.0.1:8000/api/perfil", {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include"
        });
        if (!perfilRes.ok) throw new Error(`Error en la API: ${perfilRes.statusText}`);

        const perfil = await perfilRes.json();
        const jugador_id = perfil.id;
        const nombre = perfil.nombre;
        // URL del avatar actual o por defecto
        const avatar = perfil.avatar
            ? (perfil.avatar.startsWith('http')
                ? perfil.avatar
                : `http://127.0.0.1:8000${perfil.avatar}`)
            : 'http://127.0.0.1:8000/storage/avatars/default.jpg';

        console.log('🧾 Perfil del usuario:', { jugador_id, nombre, avatar });

        // Registrar usuario en Socket
        socket.emit('registrar_usuario', { jugador_id, nombre, avatar });

        // Elementos del DOM
        const tituloInput = document.getElementById('titulo-post');
        const contenidoInput = document.getElementById('contenido-post');
        const publicarBtn = document.getElementById('publicar-post');
        const listaPosts = document.getElementById('lista-posts');

        // Publicar post
        publicarBtn.addEventListener('click', () => {
            const titulo = tituloInput.value.trim();
            const contenido = contenidoInput.value.trim();
            if (!titulo || !contenido) {
                alert('Debes escribir un título y contenido.');
                return;
            }
            socket.emit('nuevo_post', {
                titulo,
                contenido,
                fecha: new Date().toISOString(),
                nombre,
                avatar
            });
            tituloInput.value = '';
            contenidoInput.value = '';
        });

        // Recibir nuevo post
        socket.on('post_creado', agregarPost);

        // Normaliza la URL del avatar
        function normalizeAvatarUrl(url) {
            if (!url) return 'http://127.0.0.1:8000/storage/avatars/default.jpg';
            return url.startsWith('http') ? url : `http://127.0.0.1:8000${url}`;
        }

        // Agregar post al DOM
        function agregarPost(post) {
            const avatarUrl = normalizeAvatarUrl(post.avatar);
            const postDiv = document.createElement('div');
            postDiv.classList.add('post');
            postDiv.innerHTML = `
                <div class="post-cabecera">
                    <!-- Enlace al perfil del autor del post -->
                    <a href="perfil.html?id=${post.usuario_id}">
                      <img src="${avatarUrl}" alt="avatar" class="avatar-post">
                    </a>
                    <div class="info-post">
                        <h3>${post.titulo}</h3>
                        <small>
                          Por <strong>${post.nombre || 'Anónimo'}</strong> -
                          ${new Date(post.fecha).toLocaleString()}
                        </small>
                    </div>
                </div>
                <div class="acciones-post">
                <p>${post.contenido}</p>
                </div>
                <div class="comentarios" id="comentarios-${post.id}" style="display: none;"></div>
                <div class="formulario-comentario" id="formulario-${post.id}" style="display: none;"></div>
                <hr>
            `;
            listaPosts.prepend(postDiv);
            postDiv.querySelector('.post-cabecera')
                   .addEventListener('click', () => toggleComentarios(post.id));
        }

        // Mostrar u ocultar comentarios
        function toggleComentarios(postId) {
            const c = document.getElementById(`comentarios-${postId}`);
            const f = document.getElementById(`formulario-${postId}`);
            if (!c || !f) return;
            const show = c.style.display === 'none';
            c.style.display = show ? 'block' : 'none';
            f.style.display = show ? 'block' : 'none';
            if (show && !f.hasChildNodes()) mostrarFormularioComentario(postId);
        }

        // Pedir posts existentes
        socket.emit('obtener_posts');

        // Recibir posts con comentarios
        socket.on('todos_los_posts', posts => {
            posts.forEach(post => {
                agregarPost(post);
                if (post.comentarios?.length) {
                    post.comentarios.forEach(comentario => {
                        agregarComentario(post.id, comentario);
                    });
                }
            });
        });

        // Agregar comentario al DOM
        function agregarComentario(postId, comentario) {
            console.log('Agregar comentario:', comentario);

            const cDiv = document.getElementById(`comentarios-${postId}`);
            if (!cDiv) {
                console.warn(`No se encontró el contenedor comentarios-${postId}`);
                return;
            }

            const avatarUrl = normalizeAvatarUrl(comentario.avatar);
            console.log('Avatar URL:', avatarUrl);

            const div = document.createElement('div');
            div.classList.add('comentario');

            div.innerHTML = `
                <div class="autor">
                    <a href="perfil.html?id=${comentario.usuario_id}">
                    <img src="${avatarUrl}" alt="avatar" class="avatar-comentario">
                    </a>
                    <div class="contenido-comentario">
                    <strong>${comentario.autor || comentario.nombre}</strong>
                    ${comentario.fecha ? `- <span>${new Date(comentario.fecha).toLocaleString()}</span>` : ''}
                    </div>
                    <div class="contenido-comentario">
                    <p>${comentario.contenido}</p>
                    </div>
                    `;

            if (comentario.imagen) {
                console.log('Imagen base64 recibida:', comentario.imagen.substring(0, 30) + '...');

                const img = document.createElement('img');
                img.src = comentario.imagen;
                img.classList.add('imagen-comentario');
                div.querySelector('.contenido-comentario').appendChild(img);
            } else {
                console.log('No hay imagen para este comentario.');
            }

            cDiv.appendChild(div);
        }

        // Comentario en vivo (unificado con agregarComentario)
        socket.on('mensaje_en_post', ({ postId, mensaje }) => {
            agregarComentario(postId, mensaje);
        });

        // Mostrar formulario de comentario
        function mostrarFormularioComentario(postId) {
            const fDiv = document.getElementById(`formulario-${postId}`);
            if (!fDiv || fDiv.querySelector('form')) return;

            const form = document.createElement('form');
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Escribe un comentario';
            input.required = true;

            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';

            const btn = document.createElement('button');
            btn.type = 'submit';
            btn.textContent = 'Enviar';

            form.appendChild(input);
            form.appendChild(fileInput);
            form.appendChild(btn);
            fDiv.appendChild(form);

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const contenido = input.value.trim();

                let imagenBase64 = null;
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];

                    if (file.size > 2 * 1024 * 1024) {
                        alert('La imagen es demasiado grande (máx. 2MB)');
                        return;
                    }

                    imagenBase64 = await toBase64(file);
                }

                if (!contenido && !imagenBase64) return;

                socket.emit('nuevo_comentario', {
                    foro_id: postId,
                    contenido,
                    imagen: imagenBase64,
                    autor: nombre,
                    avatar,
                    usuario_id: jugador_id
                });

                input.value = '';
                fileInput.value = '';
            });
        }

        // Convertir imagen a base64
        function toBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
            });
        }

        // Volver al menú
        document.getElementById('btn-volver-menu')
                .addEventListener('click', () => window.location.href = 'menu.html');

    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        alert('Hubo un problema al cargar tu perfil. Intenta volver a iniciar sesión.');
        window.location.href = 'index.html';
    }

    window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('ReinicioMusica', 'true');
    sessionStorage.setItem('tiempoMusica', audio.currentTime);
});

// Función para mostrar el ranking de jugadores
const listaRanking = document.getElementById('lista-ranking');

try {
    const rankingRes = await fetch("http://127.0.0.1:8000/api/ranking", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
    });

    if (!rankingRes.ok) throw new Error(`Error al obtener el ranking: ${rankingRes.statusText}`);

    const ranking = await rankingRes.json();
    const jugadorId = ranking.jugador?.id;

    ranking.top.forEach((usuario, index) => {
        const li = document.createElement('li');
        const avatarUrl = usuario.avatar
            ? (usuario.avatar.startsWith('http')
                ? usuario.avatar
                : `http://127.0.0.1:8000${usuario.avatar}`)
            : 'http://127.0.0.1:8000/storage/avatars/default.jpg';

        if (usuario.id === jugadorId) {
            li.classList.add('jugador-actual');
        }

        li.innerHTML = `
            <span>#${index + 1}</span>
            <a href="perfil.html?id=${usuario.id}">
                <img src="${avatarUrl}" alt="avatar" class="avatar-ranking">
            </a>
            <strong>${usuario.nombre}</strong> 
        `;
        listaRanking.appendChild(li);
    });

    // Si el jugador no está en el top 10, agregarlo como #11 destacado
    const enTop = ranking.top.some(u => u.id === jugadorId);

    if (!enTop && ranking.jugador) {
        const li = document.createElement('li');
        li.classList.add('jugador-actual');

        const avatarUrl = ranking.jugador.avatar
            ? (ranking.jugador.avatar.startsWith('http')
                ? ranking.jugador.avatar
                : `http://127.0.0.1:8000${ranking.jugador.avatar}`)
            : 'http://127.0.0.1:8000/storage/avatars/default.jpg';

        li.innerHTML = `
            <span>#${ranking.jugador.posicion}</span>
            <a href="perfil.html?id=${ranking.jugador.id}">
                <img src="${avatarUrl}" alt="avatar" class="avatar-ranking">
            </a>
            <strong>${ranking.jugador.nombre}</strong>
        `;

        listaRanking.appendChild(li);
    }

} catch (e) {
    console.error('Error mostrando el ranking:', e);
}

});

