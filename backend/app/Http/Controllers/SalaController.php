<?php

namespace App\Http\Controllers;

use App\Models\Sala;
use Illuminate\Http\Request;
use App\Events\MensajeEnviado;
use App\Events\JugadorSeUnio;
// use App\Http\Resources\SalaResource; // Commented out as SalaResource is not defined

use Illuminate\Support\Facades\Validator;


class SalaController extends Controller
{
public function enviarMensaje(Request $request)
{
    broadcast(new MensajeEnviado($request->mensaje));
    return response()->json(['status' => 'Mensaje enviado']);
}

    // Obtener todas las salas
    public function index()
    {
        $salas = Sala::all();
        return response()->json($salas);
    }

    // Crear una nueva sala
// En tu controlador:
public function store(Request $request)
{
    $user = $request->user(); // usuario autenticado
    
    $sala = new Sala();
    $sala->jugador1_id = $user->id;
    $sala->estado = 'esperando';
    $sala->turno = 1;
    $sala->save();
    
    // Usamos un recurso para convertir la sala
    return response()->json([
        'message' => 'Sala creada correctamente',
        'sala' => $sala, // Directly returning the Sala model instance
        'jugador1_nombre' => $user->name
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
        $sala = Sala::find($id);

        if (!$sala) {
            return response()->json(['message' => 'Sala no encontrada'], 404);
        }

        $validated = $request->validate([
            'jugador1_id' => 'nullable|exists:usuarios,id',
            'jugador2_id' => 'nullable|exists:usuarios,id',
            'estado' => 'nullable|string',
            'turno' => 'nullable|integer',
        ]);

        $sala->update($validated);
        return response()->json($sala);
    }

    // Unirse a una sala
    public function unirse(Request $request, $id)
    {
        $sala = Sala::find($id);

        if (!$sala) {
            return response()->json(['message' => 'Sala no encontrada'], 404);
        }

        $jugador2_id = $request->input('jugador2_id');

        if (!$jugador2_id) {
            return response()->json(['message' => 'Faltan datos para unirse a la sala'], 400);
        }

        $sala->jugador2_id = $jugador2_id;
        $sala->estado = 'en juego';
        $sala->save();

        broadcast(new JugadorSeUnio($sala->sala, $jugador2_id));

        return response()->json(['message' => 'Jugador se unió a la sala', 'sala' => $sala]);
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
