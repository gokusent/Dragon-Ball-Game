<?php

namespace App\Http\Controllers;

use App\Models\Sala;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;


class SalaController extends Controller
{
   // Obtener todas las salas
    public function index()
    {
        $salas = Sala::all();
        return response()->json($salas);
    }

    // Crear una nueva sala
public function store(Request $request)
{
    $user = $request->user(); // usuario autenticado
    
    $sala = new Sala();
    $sala->jugador1_id = $user->id;
    $sala->estado = 'esperando';
    $sala->turno = 1;
    $sala->sala = $request->sala; // Generar un ID único para la sala
    $sala->save();
    
    // Usamos un recurso para convertir la sala
    return response()->json([
        'message' => 'Sala creada correctamente',
            'id' => $sala->id,
            'sala' => $sala->sala
        ]);
        
        
}
    
    // Obtener los detalles de una sala específica
    public function show($id)
{
    // Buscar la sala usando el campo "sala" que almacena el string completo (como pvp_174438...)
    $sala = Sala::where('sala', $id)->first();

    if (!$sala) {
        return response()->json(['message' => 'Sala no encontrada'], 404);
    }

    return response()->json([
        'message' => 'Sala encontrada',
        'sala' => $sala->sala,
        'jugador1_id' => $sala->jugador1_id,
        'jugador2_id' => $sala->jugador2_id,
        'estado' => $sala->estado,
    ]);
}

// Buscar salas disponibles
public function buscarDisponibles(Request $request)
{
    $usuario_id = $request->user()->id;

    $salasDisponibles = Sala::where('estado', 'esperando')
        ->whereNull('jugador2_id')
        ->where('jugador1_id', '!=', $usuario_id) // Evitar unirse a su propia sala
        ->get();

    return response()->json($salasDisponibles);
}


    // Actualizar el estado o los detalles de una sala
    public function update(Request $request, $id)
{
    $sala = Sala::findOrFail($id);

    $sala->jugador2_id = $request->jugador2_id;
    $sala->estado = 'llena';
    $sala->save();

    return response()->json([
        'id' => $sala->id,
        'sala' => $sala->sala,
        'jugador1_id' => $sala->jugador1_id,
        'jugador2_id' => $sala->jugador2_id,
        'estado' => $sala->estado,
    ]);
}

    // Eliminar una sala
    public function destroy($id)
    {
        $sala = Sala::find($id);

        if (!$sala) {
            return response()->json(['message' => 'Sala no encontrada'], 404);
        }

        $sala->delete();
        return response()->json(['message' => 'Sala eliminada correctamente']);
    }
}
