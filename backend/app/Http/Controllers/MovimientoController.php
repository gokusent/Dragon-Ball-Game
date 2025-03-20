<?php

// app/Http/Controllers/MovimientoController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Movimiento;

class MovimientoController extends Controller
{
    public function registrar(Request $request)
    {
        $request->validate([
            'partida_id' => 'required|integer',
            'jugador_id' => 'required|integer',
            'carta_id' => 'required|integer',
            'accion' => 'required|string',
            'valor' => 'required|integer',
            'turno' => 'required|integer',
        ]);

        $movimiento = Movimiento::create([
            'partida_id' => $request->partida_id,
            'jugador_id' => $request->jugador_id,
            'carta_id' => $request->carta_id,
            'accion' => $request->accion,
            'valor' => $request->valor,
            'turno' => $request->turno,
        ]);

        return response()->json(['status' => 'success', 'message' => 'Movimiento registrado']);
    }
}
