<?php
// app/Http/Controllers/MovimientoController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Movimiento;
use App\Models\Partida;
use App\Models\Usuario;
use App\Models\Carta;

class MovimientoController extends Controller
{
    public function registrarMovimiento(Request $request)
    {
        // Validación de entrada
        $request->validate([
            'partida_id' => 'required|integer',
            'jugador_id' => 'required|integer',
            'carta_id' => 'required|integer|exists:cartas,id',
            'accion' => 'required|string',
            'valor' => 'required|integer',
            'turno' => 'required|integer',
        ]);

        // Obtener la partida
        $partida = Partida::find($request->partida_id);
        if (!$partida) {
            return response()->json(['status' => 'error', 'message' => 'Partida no encontrada'], 404);
        }

        // Verificar si es el turno del jugador
        $jugadorTurno = $partida->turno == 1 ? $partida->jugador1_id : $partida->jugador2_id;
        if ($request->jugador_id != $jugadorTurno) {
            return response()->json(['status' => 'error', 'message' => 'No es tu turno'], 403);
        }

        // Validar si el jugador tiene la carta
        $usuario = Usuario::find($request->jugador_id);
        if (!$usuario || !$usuario->cartas->contains($request->carta_id)) {
            return response()->json(['status' => 'error', 'message' => 'Carta no disponible para este jugador'], 400);
        }

        // Crear el movimiento
        $movimiento = Movimiento::create([
            'partida_id' => $request->partida_id,
            'jugador_id' => $request->jugador_id,
            'carta_id' => $request->carta_id,
            'accion' => $request->accion,
            'valor' => $request->valor,
            'turno' => $request->turno,
            'timestamp' => now(),
        ]);

        // Actualizar el turno de la partida
        $nextTurn = $partida->turno == 1 ? 2 : 1;
        $partida->update(['turno' => $nextTurn]);

        return response()->json([
            'status' => 'success',
            'message' => 'Movimiento registrado',
            'movimiento' => $movimiento,
        ]);
    }
}

