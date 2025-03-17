<?php

namespace App\Http\Controllers;

use App\Models\Inventario;
use App\Models\Carta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InventarioController extends Controller
{
    // 📌 VER INVENTARIO DEL USUARIO
    public function verInventario()
    {
        $usuario_id = Auth::id();
        $inventario = Inventario::where('usuario_id', $usuario_id)->with('carta')->get();
        
        return response()->json($inventario);
    }

    // 📌 AGREGAR UNA CARTA AL INVENTARIO
    public function agregarCarta(Request $request)
    {
        $usuario_id = Auth::id();
        $carta_id = $request->carta_id;

        $carta = Carta::find($carta_id);

        if (!$carta) {
            return response()->json(["error" => "Carta no encontrada"], 404);
        }

        $inventario = Inventario::where('usuario_id', $usuario_id)
                                ->where('carta_id', $carta_id)
                                ->first();

        if ($inventario) {
            $inventario->increment('cantidad');
        } else {
            Inventario::create([
                'usuario_id' => $usuario_id,
                'carta_id' => $carta_id,
                'cantidad' => 1
            ]);
        }

        return response()->json(["mensaje" => "Carta agregada al inventario"]);
    }
}
