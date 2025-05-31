<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/debug-log', function () {
    return response()->file(storage_path('logs/laravel.log'));
});
