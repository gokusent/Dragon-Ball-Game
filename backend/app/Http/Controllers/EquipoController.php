<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use App\Models\Inventario;
use App\Models\Carta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EquipoController extends Controller
{
    // VER EQUIPO DEL USUARIO
    public function verEquipo()
    {
        $usuario_id = Auth::id();
        $equipo = Equipo::where('usuario_id', $usuario_id)->with('carta')->get();

        return response()->json($equipo->map(function ($item) {
            return [
                'id' => $item->id,
                'nombre' => $item->carta->nombre,
                'rareza' => $item->carta->rareza,
                'vida' => $item->carta->vida,
                'daño' => $item->carta->daño,
                'energia' => $item->carta->energia,
                'tecnicaEspecial' => $item->carta->tecnica_especial,
                'dañoEspecial' => $item->carta->daño_especial,
                'imagen_url' => $item->carta->imagen_url
            ];
        }));
    }

    // SELECCIONAR CARTAS PARA EL EQUIPO Y GUARDARLAS EN LA BASE DE DATOS
    public function seleccionarEquipo(Request $request)
    {
        $usuario_id = Auth::id();

        if (!isset($request->cartas) || !is_array($request->cartas)) {
            return response()->json(["error" => "Formato incorrecto. Se esperaba un array de cartas."], 400);
        }

        if (count($request->cartas) > 5) {
            return response()->json(["error" => "Solo puedes seleccionar hasta 5 personajes."], 400);
        }

        // Validar que todas las cartas existen en la base de datos
        $cartasValidas = Carta::whereIn('id', $request->cartas)->pluck('id')->toArray();

        foreach ($request->cartas as $carta_id) {
            if (!in_array($carta_id, $cartasValidas)) {
                return response()->json(["error" => "La carta con ID $carta_id no existe en la base de datos."], 400);
            }
        }

        // Borrar equipo anterior
        Equipo::where('usuario_id', $usuario_id)->delete();

        // Insertar nuevas cartas
        foreach ($request->cartas as $carta_id) {
            Equipo::create([
                'usuario_id' => $usuario_id,
                'carta_id' => $carta_id,
            ]);
        }

        return response()->json(["mensaje" => "Equipo seleccionado correctamente"]);
    }


    // OBTENER EL EQUIPO SELECCIONADO PARA EL COMBATE
    public function equipoSeleccionado()
{
    $usuario_id = Auth::id();
    
    $equipo = Equipo::where('usuario_id', $usuario_id)->with('carta')->get();

    if ($equipo->isEmpty()) {
        return response()->json(["error" => "No has seleccionado personajes para la batalla"], 400);
    }

    return response()->json($equipo->map(function ($item) {
        return [
            'id' => $item->carta->id,
            'nombre' => $item->carta->nombre,
            'rareza' => $item->carta->rareza,
            'vida' => $item->carta->vida ?? 100,
            'daño' => $item->carta->daño ?? 20,
            'energia' => $item->carta->energia ?? 30,
            'tecnicaEspecial' => $item->carta->tecnica_especial, // 💡 Aquí nos aseguramos de que no es null
            'dañoEspecial' => $item->carta->daño_especial,
            'imagen_url' => $item->carta->imagen_url ?? "cartas/default.png"
        ];
    }));
}

}
