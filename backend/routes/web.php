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

// En routes/web.php

use Illuminate\Support\Facades\File;

Route::get('/check-storage-link', function () {
    $link = public_path('storage');
    $target = storage_path('app/public');

    if (File::exists($link)) {
        $isLink = File::isLink($link);
        $linkTarget = $isLink ? readlink($link) : 'No es enlace simbólico';
        return response()->json([
            'exists' => true,
            'is_link' => $isLink,
            'link_target' => $linkTarget,
            'expected_target' => $target,
        ]);
    } else {
        return response()->json([
            'exists' => false,
            'message' => 'El enlace simbólico public/storage no existe.',
        ]);
    }
});

Route::get('/check-avatar', function () {
    $avatarPath = storage_path('app/public/avatars/default.jpg');

    if (File::exists($avatarPath)) {
        return response()->json([
            'exists' => true,
            'path' => $avatarPath,
        ]);
    } else {
        return response()->json([
            'exists' => false,
            'message' => 'No se encontró default.jpg en storage/app/public/avatars',
        ]);
    }
});

Route::get('/create-storage-link', function () {
    $link = public_path('storage');
    $target = storage_path('app/public');

    if (!file_exists($link)) {
        try {
            symlink($target, $link);
            return 'Enlace simbólico creado con éxito.';
        } catch (Exception $e) {
            return 'Error al crear enlace simbólico: ' . $e->getMessage();
        }
    } else {
        return 'El enlace simbólico ya existe.';
    }
});
