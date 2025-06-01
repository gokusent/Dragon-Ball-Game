<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Modo mantenimiento
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Autoload
require __DIR__.'/../vendor/autoload.php';

// Bootstrap
$app = require_once __DIR__.'/../bootstrap/app.php';

// Crear kernel HTTP
$kernel = $app->make(Kernel::class);

// Capturar petición y manejar respuesta
$request = Request::capture();
$response = $kernel->handle($request);

// Enviar respuesta al cliente
$response->send();

// Terminar kernel para cerrar tareas pendientes
$kernel->terminate($request, $response);
