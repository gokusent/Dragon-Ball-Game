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
        // Definir las reglas de validación de los datos de la carta
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|unique:cartas', // Asegurarse de que el nombre sea único
            'rareza' => 'required|in:Común,Raro,Épico,Legendario', // Validar rareza
            'vida' => 'required|integer|min:1', // Asegurarse de que la vida sea un número entero positivo
            'daño' => 'required|integer|min:1', // Asegurarse de que el daño sea un número entero positivo
            'energia' => 'required|integer|min:1', // Asegurarse de que la energía sea un número entero positivo
            'tecnica_especial' => 'required|string', // Asegurarse de que la técnica especial sea una cadena de texto
            'daño_especial' => 'required|integer|min:1', // Asegurarse de que el daño especial sea un número entero positivo
            'imagen_url' => 'required|image|mimes:jpeg,png,jpg,webp|max:5048', // Validar que la imagen sea un archivo de imagen y tenga un tamaño máximo
            'imagen_url2' => 'required|image|mimes:jpeg,png,jpg,webp|max:5048' // Validar que la segunda imagen sea un archivo de imagen y tenga un tamaño máximo
        ]);

        // Si la validación falla, devolver un error
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        // Verificar si se subieron las imágenes
        if (!$request->hasFile('imagen_url')) {
            return response()->json(['error' => 'No se subió ninguna imagen.']);
        }
        
        $imagen = $request->file('imagen_url'); // Obtener la imagen del request
        $imagen2 = $request->file('imagen_url2'); // Obtener la segunda imagen del request
        
        // Validar tipo de archivo si hace falta
        if (!$imagen->isValid()) {
            return response()->json(['error' => 'Imagen no válida.']);
        }
        
        if (!$imagen2->isValid()) {
            return response()->json(['error' => 'Imagen no válida']);
        }
        // Guardar imagen
        $path = $imagen->store('cartas', 'public');
        $path2 = $imagen2->store('cartas', 'public');
        
        $url = asset(Storage::url($path));
        $url2 = asset(Storage::url($path2));
        // Guardar en base de datos
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
