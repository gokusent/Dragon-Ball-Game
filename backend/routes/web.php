<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/debug-log', function () {
    $path = storage_path('logs/laravel.log');
    if (!file_exists($path)) {
        return 'El archivo de log no existe.';
    }
    $log = file($path);
    $lastLines = array_slice($log, -30); // Muestra las últimas 30 líneas
    return '<pre>' . implode("", $lastLines) . '</pre>';
});
