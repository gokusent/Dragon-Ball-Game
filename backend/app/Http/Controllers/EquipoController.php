<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use App\Models\Inventario;
use App\Models\Carta;
use App\Models\Usuario;
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

    public function mostrarEquipo(Request $request)
    {
        try {
            $usuario_id = $request->query('usuario_id');
        
            if (!$usuario_id) {
                return response()->json(["error" => "Falta el parámetro usuario_id"], 400);
            }
        
            // Filtra las cartas solo del rival
            $equipo = Equipo::with('carta')->where('usuario_id', $usuario_id)->get();
        
            return response()->json(["personajesRival" => $equipo->map(function ($equipo) {
                return [
                    'carta_id' => $equipo->carta_id,
                    'nombre' => $equipo->carta->nombre,
                    'imagen_url' => $equipo->carta->imagen_url,
                    'rareza' => $equipo->carta->rareza
                ];
            })], 200);
        } catch (\Exception $e) {
            return response()->json(["error" => "Error en el servidor: " . $e->getMessage()], 500);
        }
    }

    public function seleccionarEquipo(Request $request)
    {
        $usuario_id = Auth::id();

        if (!isset($request->cartas) || !is_array($request->cartas)) {
            return response()->json(["error" => "Formato incorrecto. Se esperaba un array de cartas."], 400);
        }

        if (count($request->cartas) > 5) {
            return response()->json(["error" => "Solo puedes seleccionar hasta 5 personajes."], 400);
        }

        // Validar cartas
        $cartasValidas = Carta::whereIn('id', $request->cartas)->pluck('id')->toArray();

        foreach ($request->cartas as $carta_id) {
            if (!in_array($carta_id, $cartasValidas)) {
                return response()->json(["error" => "La carta con ID $carta_id no existe."], 400);
            }
        }

        // Borrar equipo anterior
        Equipo::where('usuario_id', $usuario_id)->delete();

        // Insertar nuevas cartas en el equipo
        foreach ($request->cartas as $carta_id) {
            Equipo::create([
                'usuario_id' => $usuario_id,
                'carta_id' => $carta_id,
            ]);
        }

        // Obtener un rival (aquí puedes mejorarlo según tus necesidades)
        $rival_id = Usuario::where('id', '!=', $usuario_id)->first()?->id;

        $personajesRival = $rival_id
            ? Equipo::where('usuario_id', $rival_id)->with('carta')->get()
            : [];

        return response()->json([
            "mensaje" => "Equipo seleccionado correctamente",
            "personajesRival" => $personajesRival
        ]);
    }

   // OBTENER EL EQUIPO SELECCIONADO PARA EL COMBATE
    public function equipoSeleccionado(Request $request)
    {
        // Si se proporciona un usuario_id en la solicitud (para PvP)
        $usuario_id = $request->input('usuario_id', Auth::id());

        // Recupera el equipo del jugador por su usuario_id
        $equipo = Equipo::where('usuario_id', $usuario_id)->with('carta')->get();

        // Si no hay equipo seleccionado
        if ($equipo->isEmpty()) {
            return response()->json(["error" => "Este usuario no ha seleccionado personajes para la batalla"], 400);
        }

        return response()->json($equipo->map(function ($item) {
            return [
                'id' => $item->carta->id,
                'nombre' => $item->carta->nombre,
                'rareza' => $item->carta->rareza,
                'vida' => $item->carta->vida ?? 100,
                'daño' => $item->carta->daño ?? 20,
                'energia' => $item->carta->energia ?? 30,
                'tecnicaEspecial' => $item->carta->tecnica_especial ?? "Técnica Especial",
                'dañoEspecial' => $item->carta->daño_especial ?? 50,
                'imagen_url' => $item->carta->imagen_url ?? "cartas/default.png"
            ];
        }));
    }
}