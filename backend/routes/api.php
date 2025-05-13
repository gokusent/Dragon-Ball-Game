<?php

use App\Http\Controllers\UsuarioController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CartasController;
use App\Http\Controllers\InventarioController;
use App\Http\Controllers\EquipoController;
use App\Http\Controllers\MonedasController;
use App\Http\Controllers\SalaController;
use App\Http\Controllers\PartidaController;
use App\Http\Controllers\MovimientoController;
use App\Models\Usuario;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/registrar', [UsuarioController::class, 'registrar']);
Route::post('/login', [UsuarioController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', function (Request $request) {
    $request->user()->currentAccessToken()->delete();
    return response()->json(["mensaje" => "Sesión cerrada correctamente"], 200);
});
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/perfil', [UsuarioController::class, 'perfil']);
    Route::put('/perfil/nombre', [UsuarioController::class, 'actualizarNombre']);
    Route::post('/perfil/avatar', [UsuarioController::class, 'actualizarAvatar']);
    Route::put('/perfil/borrar-avatar', [UsuarioController::class, 'borrarAvatar']);
    Route::put('/perfil/password', [UsuarioController::class, 'cambiarPassword']);
    Route::get('/perfil/{id}', [UsuarioController::class, 'perfilID']);
});

Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['csrf' => csrf_token()]);
});


Route::get('/cartas', [CartasController::class, 'index']);
Route::get('/cartas/{id}', [CartasController::class, 'CartasPorID']);
Route::post('/cartas/agregar', [CartasController::class, 'agregarCarta']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/gacha', [CartasController::class, 'gacha']);
});
Route::post('/cartas/obtener', [CartasController::class, 'obtenerCartasPorID']);

Route::middleware('auth:sanctum')->group(function () {

Route::post('/monedas/gastar', [MonedasController::class, 'gastar']);
Route::get('/usuario', [UsuarioController::class, 'obtenerUsuario']);
Route::get('/usuario/{id}', [UsuarioController::class, 'obtenerUsuario']);
Route::put('/usuario/monedas', [UsuarioController::class, 'actualizarMonedas']);
Route::put('/usuarios', [UsuarioController::class, 'obtenerUsuarios']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/solicitar-amistad', [UsuarioController::class, 'solicitarAmistad']);
    Route::post('/responder-solicitud', [UsuarioController::class, 'responderSolicitudAmistad']);
    Route::get('/solicitudes-pendientes', [UsuarioController::class, 'listarSolicitudesPendientes']);
    Route::get('/estado-amistad', [UsuarioController::class, 'estadoAmistad']);
    Route::get('/buscar-usuarios', [UsuarioController::class, 'buscarUsuarios']);
    Route::get('/mis-amigos', [UsuarioController::class, 'misAmigos']);

});

// Ruta protegida con Sanctum
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/inventario', [InventarioController::class, 'verInventario']);
    Route::post('/inventario/agregar', [InventarioController::class, 'agregarCarta']);
});

// Ruta protegida con Sanctum
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/equipo', [EquipoController::class, 'verEquipo']);
    Route::middleware('auth:sanctum')->post('/equipo/seleccionar', [EquipoController::class, 'seleccionarEquipo']);
});
Route::get('/equipo/mostrar', [EquipoController::class, 'mostrarEquipo']);

// Rutas para las partidas
    Route::middleware('auth:sanctum')->post('/crear', [PartidaController::class, 'crearPartida']);
    Route::post('/unirse', [PartidaController::class, 'unirsePartida']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/partidas/unirse-por-codigo', [PartidaController::class, 'unirsePorCodigo']);
    });
    Route::get('partidas/esperar_rival', [PartidaController::class, 'esperarRival']);
    Route::get('/salas', [SalaController::class, 'index']); // Para obtener todas las salas
    Route::delete('/salas/{id}', [SalaController::class, 'destroy']); // Para eliminar una sala
        Route::post('/seleccionar-equipo', [PartidaController::class, 'seleccionarEquipo']);
    Route::get('/estado/{id}', [PartidaController::class, 'estado']);
    Route::get('/{partida_id}/estado', [PartidaController::class, 'obtenerEstadoPartida']);
    Route::post('/{partida_id}/verificar-ganador', [PartidaController::class, 'verificarGanador']);

    Route::middleware('auth:sanctum')->group(function () {
    Route::post('/crear-sala', [SalaController::class, 'store']); // Para crear una nueva sala
    Route::get('/salas/{id}', [SalaController::class, 'show'])->where('id', '.*');
    Route::put('/salas/{id}', [SalaController::class, 'update'])->where('id', '.*');
    Route::get('/salas-disponibles', [SalaController::class, 'buscarDisponibles']);
    Route::put('/salas/eliminar/{id}', [SalaController::class, 'destroy'])->where('id', '.*');
    });
// Rutas para los movimientos
Route::prefix('movimientos')->group(function () {
    Route::post('/', [MovimientoController::class, 'registrarMovimiento']);
});