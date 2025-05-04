<?php

// app/Http/Controllers/PartidaController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Partida;
use App\Models\Movimiento;
use App\Models\Usuario;
use Illuminate\Support\Facades\Auth;
use App\Models\Equipo;
use App\Models\Carta;
use App\Models\Inventario;
use App\Models\Monedas;
use App\Events\JugadorSeUnio; // Asegúrate de importar el evento


class PartidaController extends Controller
{
    public function crearPartida(Request $request)
{
    // Validar que el usuario tenga equipo seleccionado
    $usuario = Auth::user();
    $equipo = Equipo::where('usuario_id', $usuario->id)->count();
    
    if ($equipo === 0) {
        return response()->json([
            'status' => 'error',
            'mensaje' => 'Debes seleccionar un equipo primero'
        ], 400);
    }

    // Buscar partida disponible (excluyendo al propio jugador)
    $partidaDisponible = Partida::where('estado', 'esperando')
        ->where('jugador1_id', '!=', $usuario->id)
        ->first();

    if ($partidaDisponible) {
        // Asignar jugador 2 y cambiar estado
        $partidaDisponible->update([
            'jugador2_id' => $usuario->id,
            'estado' => 'en_curso',
            'turno' => rand(1, 2) // Turno aleatorio al iniciar
        ]);

        return response()->json([
            'status' => 'success',
            'mensaje' => 'Te has unido a una partida existente',
            'partida_id' => $partidaDisponible->id,
            'codigo_sala' => $partidaDisponible->codigo_sala,
            'es_creador' => false,
            'rival_id' => $partidaDisponible->jugador1_id
        ]);
    }

    // Crear nueva partida con código único
    $partida = Partida::create([
        'jugador1_id' => $usuario->id,
        'codigo_sala' => 'PVP-' . strtoupper(substr(md5(uniqid()), 0, 6)),
        'estado' => 'esperando',
        'turno' => 1
    ]);

    return response()->json([
        'status' => 'success',
        'mensaje' => 'Partida creada. Esperando rival...',
        'partida_id' => $partida->id,
        'codigo_sala' => $partida->codigo_sala,
        'es_creador' => true,
        'rival_id' => null
    ]);
}

    
public function unirsePartida()
{
    // Asegurarse de que el jugador no esté ya en una partida
    $partida = Partida::where('estado', 'esperando')
        ->where('jugador1_id', '!=', Auth::id())
        ->first();

    if (!$partida) {
        return response()->json(['error' => 'No hay partidas disponibles'], 404);
    }

    // Verificar que el jugador no esté ya en la partida
    if ($partida->jugador2_id) {
        return response()->json(['error' => 'La partida ya está completa'], 400);
    }

    event(new JugadorSeUnio($partida->codigo_sala, Auth::id()));

    $partida->update([
        'jugador2_id' => Auth::id(),
        'estado' => 'en_curso'
    ]);

    return response()->json([
        'mensaje' => 'Te has unido a la partida',
        'partida_id' => $partida->id
    ]);
}

public function unirsePorCodigo(Request $request)
{
    $request->validate([
        'codigo_sala' => 'required|string|size:10'
    ]);

    $usuario = Auth::user();
    $codigo = strtoupper($request->codigo_sala);

    // Buscar la partida por el código de sala
    $partida = Partida::where('codigo_sala', $codigo)->first();

    if (!$partida || $partida->estado !== 'esperando') {
        return response()->json(['error' => 'La partida no está disponible o ya ha comenzado'], 400);
    }

    // Asignar jugador 2
    $partida->update([
        'jugador2_id' => $usuario->id,
        'estado' => 'en_curso',
        'turno' => rand(1, 2)
    ]);

    // 🔔 Disparar el evento para notificar vía WebSocket
    event(new JugadorSeUnio($partida->codigo_sala, $usuario->id));

    return response()->json([
        'status' => 'success',
        'partida_id' => $partida->id,
        'codigo_sala' => $partida->codigo_sala,
        'rival_id' => $partida->jugador1_id,
        'es_creador' => false,
        'turno_actual' => $partida->turno
    ]);
}


public function seleccionarEquipo(Request $request)
{
    $usuario_id = Auth::id();
    $partida_id = $request->partida_id;

    // Verificar si la partida existe y está en el estado correcto
    $partida = Partida::find($partida_id);
    if (!$partida || $partida->estado !== 'esperando_rival') {
        return response()->json(["error" => "La partida no está disponible para selección de equipo."], 400);
    }

    // Verificar si las cartas son válidas
    if (!isset($request->cartas) || !is_array($request->cartas)) {
        return response()->json(["error" => "Formato incorrecto. Se esperaba un array de cartas."], 400);
    }

    if (count($request->cartas) > 5) {
        return response()->json(["error" => "Solo puedes seleccionar hasta 5 personajes."], 400);
    }

    // Obtener las cartas válidas
    $cartasValidas = Carta::whereIn('id', $request->cartas)->pluck('id')->toArray();
    $cartasInvalidas = array_diff($request->cartas, $cartasValidas);
    if (!empty($cartasInvalidas)) {
        return response()->json(["error" => "Las siguientes cartas no son válidas: " . implode(", ", $cartasInvalidas)], 400);
    }

    // Verificar si el jugador ya ha seleccionado su equipo
    $equipoExistente = Equipo::where('partida_id', $partida_id)
                            ->where('usuario_id', $usuario_id)
                            ->exists();
   
    if ($equipoExistente) {
        return response()->json(["error" => "Ya has seleccionado tu equipo."], 400);
    }

    // Borrar cartas anteriores del usuario para esta partida
    Equipo::where('partida_id', $partida_id)
        ->where('usuario_id', $usuario_id)
        ->delete();

    // Insertar nuevas cartas seleccionadas
    foreach ($request->cartas as $carta_id) {
        Equipo::create([
            'partida_id' => $partida_id,
            'usuario_id' => $usuario_id,
            'carta_id' => $carta_id,
        ]);
    }

    // Obtener el equipo rival
    $equipoRival = Equipo::where('partida_id', $partida_id)
        ->where('usuario_id', '!=', $usuario_id)
        ->with('carta')
        ->get();

    if ($equipoRival->isEmpty()) {
        return response()->json([
            "mensaje" => "Equipo seleccionado correctamente, pero el rival aún no ha seleccionado su equipo.",
            "personajesRival" => []
        ]);
    }

    return response()->json([
        "mensaje" => "Equipo seleccionado correctamente",
        "personajesRival" => $equipoRival
    ]);
}

    
    public function estado($id)
    {
        $partida = Partida::find($id);
        if ($partida) {
            return response()->json($partida);
        }

        return response()->json(['status' => 'error', 'message' => 'Partida no encontrada'], 404);
    }

    // Método para obtener el estado actual de la partida (turno actual, movimientos anteriores, etc.)
    public function obtenerEstadoPartida($partida_id)
    {
        $partida = Partida::with(['jugador1', 'jugador2', 'movimientos'])->findOrFail($partida_id);
        return response()->json($partida);
    }

    public function realizarMovimiento(Request $request, $partida_id)
{
    // Actualizar turno
    $partida = Partida::findOrFail($partida_id);

    $jugadorTurno = $partida->turno == 1 ? $partida->jugador1_id : $partida->jugador2_id;

    if ($request->jugador_id != $jugadorTurno) {
        return response()->json(['error' => 'No es tu turno'], 403);
    }

    // Validar datos
    $request->validate([
        'jugador_id' => 'required|integer|exists:usuarios,id',
        'carta_id' => 'required|integer|exists:cartas,id',
        'accion' => 'required|string',
        'valor' => 'required|numeric',
        'turno' => 'required|integer',
    ]);

    // Cambiar el turno
    $partida->turno = $partida->turno == 1 ? 2 : 1;
    $partida->save();

    // Crear el movimiento
    $movimiento = Movimiento::create([
        'partida_id' => $partida_id,
        'jugador_id' => $request->jugador_id,
        'carta_id' => $request->carta_id,
        'accion' => $request->accion,
        'valor' => $request->valor,
        'turno' => $request->turno,
        'timestamp' => now(),
    ]);

    return response()->json($movimiento);
}


public function verificarGanador($partida_id)
{
    $partida = Partida::findOrFail($partida_id);

    $jugador1 = Usuario::findOrFail($partida->jugador1_id);
    $jugador2 = Usuario::findOrFail($partida->jugador2_id);

    // Supongamos que la partida se termina si la vida de un jugador llega a 0
    if ($jugador1->vida <= 0) {
        $partida->estado = 'finalizada';
        $partida->ganador_id = $jugador2->id;
    } elseif ($jugador2->vida <= 0) {
        $partida->estado = 'finalizada';
        $partida->ganador_id = $jugador1->id;
    }

    $partida->save();

    return response()->json($partida);
}

}

