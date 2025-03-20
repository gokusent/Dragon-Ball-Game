<?php

use App\Http\Controllers\UsuarioController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CartasController;
use App\Http\Controllers\InventarioController;
use App\Http\Controllers\EquipoController;
use App\Http\Controllers\MonedasController;
use App\Http\Controllers\PartidaController;
use App\Http\Controllers\MovimientoController;


Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/registrar', [UsuarioController::class, 'registrar']);
Route::post('/login', [UsuarioController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/perfil', [UsuarioController::class, 'perfil']);
});

Route::get('/cartas', [CartasController::class, 'index']);
Route::post('/cartas/agregar', [CartasController::class, 'agregarCarta']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/gacha', [CartasController::class, 'gacha']);
});

Route::middleware('auth:sanctum')->post('/monedas/gastar', [MonedasController::class, 'gastar']);

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

Route::post('/partidas', [PartidaController::class, 'crear']);  // Crear partida
Route::put('/partidas/{id}', [PartidaController::class, 'unirse']);  // Unirse a partida
Route::get('/partidas/{id}', [PartidaController::class, 'estado']);  // Obtener estado de la partida

Route::post('/movimientos', [MovimientoController::class, 'registrar']);  // Registrar movimiento
  
