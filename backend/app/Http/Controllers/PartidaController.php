<?php

// app/Http/Controllers/PartidaController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Partida;
use App\Models\Movimiento;
use App\Models\Usuario;

class PartidaController extends Controller
{
    public function crear(Request $request)
    {
        $request->validate([
            'jugador1_id' => 'required|integer',
        ]);

        $partida = Partida::create([
            'jugador1' => $request->jugador1_id,
            'estado' => 'en curso',
            'turno' => 1,
        ]);

        return response()->json(['status' => 'success', 'message' => 'Partida creada', 'partida' => $partida]);
    }

    public function unirse($id, Request $request)
    {
        $request->validate([
            'jugador2_id' => 'required|integer',
        ]);

        $partida = Partida::find($id);
        if ($partida) {
            $partida->jugador2 = $request->jugador2_id;
            $partida->estado = 'en curso';
            $partida->save();

            return response()->json(['status' => 'success', 'message' => 'Jugador 2 se unió a la partida']);
        }

        return response()->json(['status' => 'error', 'message' => 'Partida no encontrada'], 404);
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
    $movimiento = Movimiento::create([
        'partida_id' => $partida_id,
        'jugador_id' => $request->jugador_id,
        'carta_id' => $request->carta_id,
        'accion' => $request->accion,
        'valor' => $request->valor,
        'turno' => $request->turno,
        'timestamp' => now(),
    ]);

    // Actualizar turno
    $partida = Partida::findOrFail($partida_id);
    $partida->turno = $partida->turno == 1 ? 2 : 1;  // Alternar turno entre jugador 1 y 2
    $partida->save();

    return response()->json($movimiento);
}

public function verificarGanador($partida_id)
{
    $partida = Partida::findOrFail($partida_id);

    $jugador1 = Usuario::findOrFail($partida->jugador1);
    $jugador2 = Usuario::findOrFail($partida->jugador2);

    // Supongamos que la partida se termina si la vida de un jugador llega a 0
    if ($jugador1->vida <= 0) {
        $partida->estado = 'finalizada';
        $partida->ganador = $jugador2->id;
    } elseif ($jugador2->vida <= 0) {
        $partida->estado = 'finalizada';
        $partida->ganador = $jugador1->id;
    }

    $partida->save();

    return response()->json($partida);
}

}

