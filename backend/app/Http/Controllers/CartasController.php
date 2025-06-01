<?php

namespace App\Http\Controllers;

use App\Models\Carta;
use Illuminate\Http\Request;
use App\Models\Inventario;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
class CartasController extends Controller
{
    // Obtener todas las cartas
    public function index()
    {
        return response()->json(Carta::all());
    }

    // Obtener cartas por id
    public function CartasPorID($id)
    {
        $carta = Carta::find($id);
        if ($carta) {
            return response()->json($carta);
        } else {
            return response()->json(["error" => "Carta no encontrada"], 404);
        }
    }

    // Agregar una nueva carta
    public function agregarCarta(Request $request)
{
    // Validación
    $validator = Validator::make($request->all(), [
        'nombre' => 'required|string|unique:cartas',
        'rareza' => 'required|in:Común,Raro,Épico,Legendario',
        'vida' => 'required|integer|min:1',
        'daño' => 'required|integer|min:1',
        'energia' => 'required|integer|min:1',
        'tecnica_especial' => 'required|string',
        'daño_especial' => 'required|integer|min:1',
        'imagen_url' => 'required|image|mimes:jpeg,png,jpg,webp|max:5048',
        'imagen_url2' => 'required|image|mimes:jpeg,png,jpg,webp|max:5048'
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 400);
    }

    // Verificar archivos
    if (!$request->hasFile('imagen_url') || !$request->hasFile('imagen_url2')) {
        return response()->json(['error' => 'Faltan una o ambas imágenes.'], 400);
    }

    $imagen = $request->file('imagen_url');
    $imagen2 = $request->file('imagen_url2');

    if (!$imagen->isValid() || !$imagen2->isValid()) {
        return response()->json(['error' => 'Una o ambas imágenes no son válidas.'], 400);
    }

    // Guardar imágenes manualmente en public/cartas
    $nombre1 = uniqid('carta_') . '.' . $imagen->getClientOriginalExtension();
    $nombre2 = uniqid('carta2_') . '.' . $imagen2->getClientOriginalExtension();

    $imagen->move(public_path('cartas'), $nombre1);
    $imagen2->move(public_path('cartas'), $nombre2);

    $url = asset("cartas/$nombre1");
    $url2 = asset("cartas/$nombre2");

    // Crear la carta en la base de datos
    $carta = Carta::create([
        'nombre' => $request->nombre,
        'rareza' => $request->rareza,
        'vida' => $request->vida,
        'daño' => $request->daño,
        'energia' => $request->energia,
        'tecnica_especial' => $request->tecnica_especial,
        'daño_especial' => $request->daño_especial,
        'imagen_url' => $url,
        'imagen_url2' => $url2
    ]);

    return response()->json(["mensaje" => "Carta añadida correctamente", "carta" => $carta]);
}

  
    // Método para realizar un gacha
    public function gacha()
    {
        // Verificar si el usuario está autenticado
        $usuario_id = Auth::id();

        if (!$usuario_id) {
            return response()->json(["error" => "Usuario no autenticado"], 401);
        }

        // Generar una carta aleatoria basada en la rareza
        $probabilidad = rand(1, 100);
        $rareza = '';

        if ($probabilidad <= 50) {
            $rareza = 'Común'; // 50% de probabilidad
        } elseif ($probabilidad <= 80) {
            $rareza = 'Raro'; // 30% de probabilidad
        } elseif ($probabilidad <= 95) {
            $rareza = 'Épico'; // 15% de probabilidad
        } else {
            $rareza = 'Legendario'; // 5% de probabilidad
        }

        // Buscar una carta aleatoria de la rareza seleccionada
        $carta = Carta::where('rareza', $rareza)->inRandomOrder()->first();


        if ($carta) {
            // Verificar si la carta ya existe en el inventario del usuario
            
            $invetario = Inventario::where('usuario_id', $usuario_id)
                ->where('carta_id', $carta->id)
                ->first();

                
            if ($invetario) {
                // Si ya existe, incrementar la cantidad
                $invetario->increment('cantidad');
            } else {
                // Si no existe, crear una nueva entrada en el inventario
                Inventario::create([
                    'usuario_id' => $usuario_id,
                    'carta_id' => $carta->id,
                    'cantidad' => 1
                ]);
            }
        }

        return response()->json($carta);
    }

    // Método para obtener cartas por IDs
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
