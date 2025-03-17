<?php

use App\Http\Controllers\UsuarioController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CartasController;
use App\Http\Controllers\InventarioController;
use App\Http\Controllers\EquipoController;

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

// Ruta protegida con Sanctum
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/inventario', [InventarioController::class, 'verInventario']);
    Route::post('/inventario/agregar', [InventarioController::class, 'agregarCarta']);
});

// Ruta protegida con Sanctum
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/equipo', [EquipoController::class, 'verEquipo']);
    Route::post('/equipo/seleccionar', [EquipoController::class, 'seleccionarCartas']);
});
