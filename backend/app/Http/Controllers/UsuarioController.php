<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class UsuarioController extends Controller
{
    // Registro de usuario
    public function registrar(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:50|unique:usuarios',
            'email' => 'required|email|unique:usuarios',
            'password' => 'required|min:6'
        ]);

        $usuario = Usuario::create([
            'nombre' => $request->nombre,
            'email' => $request->email,
            'password' => Hash::make($request->password)
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

    /**
     * Obtener los datos del usuario autenticado (incluyendo monedas)
     */
    public function obtenerUsuario()
    {
        $usuario = Auth::user();
        
        return response()->json([
            'id' => $usuario->id,
            'nombre' => $usuario->nombre,
            'monedas' => $usuario->monedas
        ]);
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
}