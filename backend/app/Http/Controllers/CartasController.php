<?php

namespace App\Http\Controllers;

use App\Models\Carta;
use Illuminate\Http\Request;
use App\Models\Inventario;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
class CartasController extends Controller
{
    // Obtener todas las cartas
    public function index()
    {
        return response()->json(Carta::all());
    }

    public function agregarCarta(Request $request)
{
    $validator = Validator::make($request->all(), [
        'nombre' => 'required|string|unique:cartas',
        'rareza' => 'required|in:Común,Raro,Épico,Legendario',
        'vida' => 'required|integer|min:1',
        'daño' => 'required|integer|min:1',
        'energia' => 'required|integer|min:1',
        'tecnica_especial' => 'required|string',
        'daño_especial' => 'required|integer|min:1',
        'imagen_url' => 'required|string'
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 400);
    }

    $carta = Carta::create($request->all());

    return response()->json(["mensaje" => "Carta añadida correctamente", "carta" => $carta]);
}

    
    public function gacha()
{
    $usuario_id = Auth::id();

    if (!$usuario_id) {
        return response()->json(["error" => "Usuario no autenticado"], 401);
    }

    $probabilidad = rand(1, 100);
    $rareza = '';

    if ($probabilidad <= 50) {
        $rareza = 'Común';
    } elseif ($probabilidad <= 80) {
        $rareza = 'Raro';
    } elseif ($probabilidad <= 95) {
        $rareza = 'Épico';
    } else {
        $rareza = 'Legendario';
    }

    $carta = Carta::where('rareza', $rareza)->inRandomOrder()->first();

    if ($carta) {
        $invetario = Inventario::where('usuario_id', $usuario_id)
            ->where('carta_id', $carta->id)
            ->first();

        if ($invetario) {
            $invetario->increment('cantidad');
        } else {
            Inventario::create([
                'usuario_id' => $usuario_id,
                'carta_id' => $carta->id,
                'cantidad' => 1
            ]);
        }
    }

    return response()->json($carta);
}

public function obtenerCartasPorID(Request $request)
{
    // Validar que la solicitud contenga un array de IDs
    if (!isset($request->ids) || !is_array($request->ids)) {
        return response()->json(["error" => "Formato incorrecto. Se esperaba un array de IDs."], 400);
    }

    // Buscar cartas en la base de datos
    $cartas = Carta::whereIn('id', $request->ids)->get();

    // Si no se encuentran todas las cartas, devolver un error
    if ($cartas->isEmpty()) {
        return response()->json(["error" => "No se encontraron cartas con los IDs proporcionados."], 404);
    }

    return response()->json($cartas);
}

}
