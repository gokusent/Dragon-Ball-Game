<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Usuario;

class MonedasController extends Controller
{
    public function gastar(Request $request)
{
    $usuario = Auth::user();
    $cantidad = $request->cantidad;

    if (!$usuario) {
        return response()->json(["error" => "Usuario no autenticado"], 401);
    }

    if ($usuario->monedas < $cantidad) {
        return response()->json(["error" => "No tienes suficientes monedas"], 400);
    }

    $usuario->monedas -= $cantidad;
    $usuario->save();

    return response()->json(["mensaje" => "Monedas gastadas", "monedas" => $usuario->monedas]);
}
}
