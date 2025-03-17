<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use App\Models\Inventario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EquipoController extends Controller
{
    // VER EQUIPO DEL USUARIO
    public function verEquipo()
    {
        $usuario_id = Auth::id();
        $equipo = Equipo::where('usuario_id', $usuario_id)->with('carta')->get();
        
        return response()->json($equipo);
    }

    // SELECCIONAR CARTAS PARA EL EQUIPO
    public function seleccionarCartas(Request $request)
    {
        $usuario_id = Auth::id();
        $cartas = $request->cartas; // Un array con los IDs de las cartas

        if (count($cartas) > 5) {
            return response()->json(["error" => "Solo puedes seleccionar hasta 5 cartas"], 400);
        }

        // Verificar si las cartas están en el inventario del usuario
        foreach ($cartas as $carta_id) {
            $enInventario = Inventario::where('usuario_id', $usuario_id)
                                      ->where('carta_id', $carta_id)
                                      ->exists();

            if (!$enInventario) {
                return response()->json(["error" => "La carta con ID $carta_id no está en tu inventario"], 400);
            }
        }

        // Borrar equipo anterior y guardar el nuevo
        Equipo::where('usuario_id', $usuario_id)->delete();

        foreach ($cartas as $carta_id) {
            Equipo::create([
                'usuario_id' => $usuario_id,
                'carta_id' => $carta_id
            ]);
        }

        return response()->json(["mensaje" => "Equipo seleccionado correctamente"]);
    }
}
