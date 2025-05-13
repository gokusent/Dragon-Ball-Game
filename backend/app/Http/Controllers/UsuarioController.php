<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Models\Amigo; 
use Illuminate\Support\Facades\Log;
use App\Models\SolicitudAmistad; // Asegúrate de importar el modelo correcto
use Carbon\Carbon;

class UsuarioController extends Controller
{
    // Registro de usuario
    public function registrar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:50|unique:usuarios',
            'email' => 'required|email|unique:usuarios',
            'password' => 'required|min:6'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => $validator->errors()
            ], 400);
        }

        $usuario = Usuario::create([
            'nombre' => $request->nombre,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'monedas' => 50
        ]);

        return response()->json([
            'message' => 'Usuario registrado con éxito'
        ], 201);
    }

    // Inicio de sesión
    public function login(Request $request)
    {
        $usuario = Usuario::where('email', $request->email)->first();

        if (!$usuario || !Hash::check($request->password, $usuario->password)) {
            return response()->json(["error" => "Credenciales incorrectas"], 401);
        }

        // Generar el token correctamente
        $token = $usuario->createToken('authToken')->plainTextToken;

        return response()->json([
            "mensaje" => "Inicio de sesión exitoso",
            "usuario" => $usuario,
            "token" => $token
        ]);
    }

    public function perfil(Request $request)
    {
        return response()->json($request->user());

    }

    public function actualizarNombre(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errores' => $validator->errors()
            ], 422);
        }

        $usuario = Auth::user();
        $usuario->nombre = $request->nombre;
        $usuario->save();

        return response()->json([
            'mensaje' => 'Nombre actualizado correctamente'
        ]);
    }

    public function actualizarAvatar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // máximo 2MB
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errores' => $validator->errors()
                ], 422);
            }
            
            $usuario = Auth::user();

            // Guardar el avatar
        if ($request->hasFile('avatar')) {
            $avatar = $request->file('avatar');
            $ruta = $avatar->store('avatars', 'public'); // guarda en storage/app/public/avatars
            
            // Actualizar la ruta del avatar en el usuario
            $usuario->avatar = '/storage/' . $ruta;
            $usuario->save();
        }

        return response()->json([
            'mensaje' => 'Avatar actualizado correctamente',
            'nuevo_avatar_url' => asset('storage/' . $ruta) // aquí devolvemos la ruta pública
        ]);
    }


    public function borrarAvatar(Request $request)
    {

        $usuario = Auth::user();
        // Verificamos si el avatar actual no es el predeterminado
        if ($usuario->avatar != '/storage/avatars/default.jpg') {
            // Eliminamos el archivo del avatar actual en el servidor
            $avatarPath = public_path($usuario->avatar); // Ruta completa del archivo en el servidor
            if (file_exists($avatarPath)) {
                unlink($avatarPath); // Eliminar el archivo
            }
        }

        // Restablecer el avatar a la imagen por defecto
        $usuario->avatar = '/storage/avatars/default.jpg';
        $usuario->save();

        return response()->json([
            'message' => 'Avatar borrado y restablecido correctamente',
            'avatar' => $usuario->avatar
        ]);
    }
    public function cambiarPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'contraseña_actual' => 'required|min:6',
            'nueva_contraseña' => 'required|min:6|confirmed'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errores' => $validator->errors()
            ], 422);
        }

        $usuario = Auth::user();

        if (!Hash::check($request->contraseña_actual, $usuario->password)) {
            return response()->json([
                'error' => 'La contraseña actual es incorrecta'
            ], 401);
        }

        $usuario->password = Hash::make($request->nueva_contraseña);
        $usuario->save();

        return response()->json([
            'mensaje' => 'Contraseña actualizada correctamente'
        ]);
    }

    public function perfilID($id) 
    {
        $usuario = Usuario::find($id);
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }
        return response()->json([
            'id' => $usuario->id,
            'nombre' => $usuario->nombre,
            'avatar' => $usuario->avatar    ]);
    }

    /**
     * Obtener los datos del usuario autenticado (incluyendo monedas)
     */
    public function obtenerUsuario($id)
    {
        $usuario = Usuario::find($id);
    
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }
    
        return response()->json([
            'id' => $usuario->id,
            'nombre' => $usuario->nombre,
            'monedas' => $usuario->monedas
        ]);
    }

    public function obtenerUsuarios()
    {
        // Obtiene todos los usuarios de la base de datos
        $usuarios = Usuario::all(); 

        // Devuelve una respuesta JSON con los datos de los usuarios
        return response()->json($usuarios);
    }

    /**
     * Actualizar las monedas del usuario después de una pelea
     */
    public function actualizarMonedas(Request $request)
    {
        $usuario = Auth::user();

        // Validar que se envíe un número válido de monedas
        $request->validate([
            'monedas' => 'required|integer|min:0'
        ]);

        // Actualizar las monedas del usuario
        $usuario->monedas = $request->monedas;
        $usuario->save();

        return response()->json([
            'mensaje' => 'Monedas actualizadas correctamente',
            'monedas' => $usuario->monedas
        ]);
    }

    public function solicitarAmistad(Request $request)
    {
        $solicitanteId = auth()->id(); // ID autenticado por token
        $solicitadoId = $request->input('solicitado_id');

        if (!$solicitanteId || !$solicitadoId) {
            return response()->json(['message' => 'Datos incompletos.'], 400);
        }

        $solicitud = DB::table('solicitudes_amistad')
            ->where('solicitante_id', $solicitanteId)
            ->where('solicitado_id', $solicitadoId)
            ->first();

        if ($solicitud) {
            if ($solicitud->estado === 'rechazada') {
                DB::table('solicitudes_amistad')
                    ->where('solicitante_id', $solicitanteId)
                    ->where('solicitado_id', $solicitadoId)
                    ->update([
                        'estado' => 'pendiente',
                        'updated_at' => Carbon::now(),
                    ]);
                return response()->json(['message' => 'Solicitud reenviada correctamente.']);
            } else {
                return response()->json(['message' => 'Ya has enviado una solicitud.'], 409);
            }
        } else {
            DB::table('solicitudes_amistad')->insert([
                'solicitante_id' => $solicitanteId,
                'solicitado_id' => $solicitadoId,
                'estado' => 'pendiente',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
            return response()->json(['message' => 'Solicitud enviada correctamente.']);
        }
    }


    public function responderSolicitudAmistad(Request $request)
    {
        try {
            // Validar la solicitud
        $validator = Validator::make($request->all(), [
            'solicitud_id' => 'required|exists:solicitudes_amistad,id',
            'respuesta' => 'required|in:aceptada,rechazada',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Error en la validación', 'errors' => $validator->errors()], 400);
        }

            $usuario = auth()->user();
            $solicitud = SolicitudAmistad::where('id', $request->input('solicitud_id'))
                                        ->where('solicitado_id', $usuario->id)
                                        ->first();

            if (!$solicitud) {
                return response()->json(['message' => 'Solicitud no encontrada.'], 404);
            }

            $solicitud->estado = $request->input('respuesta');
            $solicitud->save();

            if ($solicitud->estado == 'aceptada') {
                Amigo::create([
                    'usuario_id' => $usuario->id,
                    'amigo_id' => $solicitud->solicitante_id,
                    'estado' => 'aceptada',
                ]);

                Amigo::create([
                    'usuario_id' => $solicitud->solicitante_id,
                    'amigo_id' => $usuario->id,
                    'estado' => 'aceptada',
                ]);
            }

            return response()->json(['message' => 'Solicitud respondida.']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al procesar la solicitud',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    public function listarSolicitudesPendientes()
    {
        $usuario = auth()->user();

        $solicitudes = SolicitudAmistad::where('solicitado_id', $usuario->id)
                                        ->where('estado', 'pendiente')
                                        ->with('solicitante') // para traer nombre/avatar del que envió
                                        ->get();

        return response()->json($solicitudes);
    }

    // Método para agregar un amigo
    public function agregarAmigo(Request $request)
    {
        $request->validate([
            'amigo_id' => 'required|exists:usuarios,id',  // Validar que el amigo exista
        ]);

        $usuario = auth()->user(); // Obtener el usuario autenticado
        $amigoId = $request->input('amigo_id');

        // Verificar si ya son amigos
        $existingFriendship = Amigo::where(function($query) use ($usuario, $amigoId) {
            $query->where('usuario_id', $usuario->id)
                ->where('amigo_id', $amigoId);
        })->orWhere(function($query) use ($usuario, $amigoId) {
            $query->where('usuario_id', $amigoId)
                ->where('amigo_id', $usuario->id);
        })->first();

        if ($existingFriendship) {
            return response()->json(['message' => 'Ya son amigos.'], 400);
        }

        Amigo::create([
            'usuario_id' => $usuario->id,
            'amigo_id' => $amigoId,
            'estado' => 'aceptada', 
        ]);

        Amigo::create([
            'usuario_id' => $amigoId,
            'amigo_id' => $usuario->id,
            'estado' => 'aceptada',
        ]);

        return response()->json(['message' => 'Amigo agregado correctamente.']);
    }

    public function obtenerAmigos($id)
    {
        $usuario = Usuario::find($id);
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado.'], 404);
        }

        $amigos = $usuario->amigos()->with('amigo')->get(); // Obtener todos los amigos
        return response()->json($amigos);
    }

    public function estadoAmistad(Request $request)
    {
        try {
            if (!Auth::check()) {
                return response()->json(['error' => 'No autenticado'], 401);
            }

            if (!$request->has('id')) {
                return response()->json(['error' => 'ID no proporcionado'], 400);
            }

            $userId = Auth::id();
            $otroId = $request->query('id');

            $amistad = Amigo::where(function ($q) use ($userId, $otroId) {
                $q->where('usuario_id', $userId)->where('amigo_id', $otroId);
            })->orWhere(function ($q) use ($userId, $otroId) {
                $q->where('usuario_id', $otroId)->where('amigo_id', $userId);
            })->first();
            

            if (!$amistad) {
                return response()->json(['estado' => 'ninguno']);
            }

            return response()->json(['estado' => $amistad->estado]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function buscarUsuarios(Request $request)
    {
        $nombre = $request->query('nombre');

        $usuarios = DB::table('usuarios')
        ->select('id', 'nombre', 'avatar')
        ->where('nombre', 'like', "%{$nombre}%")
        ->groupBy('id', 'nombre', 'avatar') // hace el DISTINCT real por ID
        ->limit(10)
        ->get();


        return response()->json($usuarios);
    }

    public function misAmigos(Request $request)
    {
        Log::info('Usuario autenticado: ' . json_encode($request->user()));

        $usuario = $request->user();

        if (!$usuario) {
            return response()->json(['error' => 'No autenticado'], 401);
        }

        $amigos = DB::table('amigos')
            ->join('usuarios', function($join) use ($usuario) {
                $join->on(function ($query) use ($usuario) {
                    $query->on('usuarios.id', '=', 'amigos.usuario_id')
                        ->orOn('usuarios.id', '=', 'amigos.amigo_id');
                });
            })
            ->where(function ($query) use ($usuario) {
                $query->where('amigos.usuario_id', $usuario->id)
                    ->orWhere('amigos.amigo_id', $usuario->id);
            })
            ->where('usuarios.id', '!=', $usuario->id) // No incluirse a sí mismo
            ->select('usuarios.id', 'usuarios.nombre', 'usuarios.avatar')
            ->distinct()
            ->get();

            return response()->json(['amigos' => $amigos]); // Cambiado para que sea un objeto con propiedad 'amigos'
        }
    }