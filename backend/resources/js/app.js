import './bootstrap';
import './cliente.js';
import Echo from 'laravel-echo';
window.Pusher = require('pusher-js');

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: 'app-key', // reemplaza con el real
    wsHost: window.location.hostname,
    wsPort: 6001,
    forceTLS: false,
    disableStats: true,
});

window.Echo.join(`sala.${sala}`)
    .listen('.jugador.unido', (e) => {
        console.log('Jugador unido:', e.jugador);
        // Aquí puedes actualizar tu UI para mostrar que el jugador se unió
    });

window.Echo.private(`sala.${salaId}`)
    .listen('.jugador.unido', (e) => {
        console.log('Se unió un jugador:', e.jugador);
        // Aquí puedes iniciar la partida
    }); 

window.Echo.channel('chat')
    .listen('.message.sent', (e) => {
        console.log('Nuevo mensaje:', e.message);
    });