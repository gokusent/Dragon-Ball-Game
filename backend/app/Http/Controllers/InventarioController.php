<?php

namespace App\Http\Controllers;

use App\Models\Inventario;
use App\Models\Carta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InventarioController extends Controller
{
    // VER INVENTARIO DEL USUARIO
    public function verInventario()
{
    $usuario_id = Auth::id();
    $inventario = Inventario::where('usuario_id', $usuario_id)->with('carta')->get();

    return response()->json($inventario->map(function ($item) {
        return [
            'id' => $item->id, // ID del inventario
            'carta_id' => $item->carta->id, // ID real de la carta en la tabla `cartas`
            'cantidad' => $item->cantidad,
            'nombre' => $item->carta->nombre,
            'rareza' => $item->carta->rareza,
            'imagen_url' => $item->carta->imagen_url
        ];
    }));
}
}
