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
                <p>${post.contenido}</p>
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
            const cDiv = document.getElementById(`comentarios-${postId}`);
            if (!cDiv) return;
            const avatarUrl = normalizeAvatarUrl(comentario.avatar);
            const div = document.createElement('div');
            div.classList.add('comentario');
            div.innerHTML = `
                <a href="perfil.html?id=${comentario.usuario_id}">
                  <img src="${avatarUrl}" alt="avatar" class="avatar-comentario">
                </a>
                <div class="contenido-comentario">
                    <strong>${comentario.nombre}</strong>: ${comentario.contenido}
                </div>
            `;
            cDiv.appendChild(div);
        }

        // Comentario en vivo
        socket.on('mensaje_en_post', ({ postId, mensaje }) => {
            agregarComentario(postId, {
                usuario_id: mensaje.usuario_id, // asegúrate de incluirlo al emitir
                nombre: mensaje.autor,
                avatar: mensaje.avatar,
                contenido: mensaje.contenido
            });
        });

        // Formulario de comentario
        function mostrarFormularioComentario(postId) {
            const fDiv = document.getElementById(`formulario-${postId}`);
            if (!fDiv) return;
            const form = document.createElement('form');
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Escribe un comentario';
            input.required = true;
            const btn = document.createElement('button');
            btn.type = 'submit';
            btn.textContent = 'Enviar';
            form.appendChild(input);
            form.appendChild(btn);
            fDiv.appendChild(form);
            form.addEventListener('submit', e => {
                e.preventDefault();
                const contenido = input.value.trim();
                if (!contenido) return;
                socket.emit('nuevo_comentario', {
                    foro_id: postId,
                    contenido,
                    autor: nombre,
                    avatar,
                    usuario_id: jugador_id  // importante para luego linkear
                });
                input.value = '';
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
});

