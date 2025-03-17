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
}