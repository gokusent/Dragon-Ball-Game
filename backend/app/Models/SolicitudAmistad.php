<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Usuario;

class SolicitudAmistad extends Model
{
    protected $table = 'solicitudes_amistad';

    protected $fillable = [
        'solicitante_id',
        'solicitado_id',
        'estado', // 'pendiente', 'aceptada', 'rechazada'
    ];

    // Relación con el solicitante
    public function solicitante()
    {
        return $this->belongsTo(Usuario::class, 'solicitante_id');
    }

    // Relación con el solicitado
    public function solicitado()
    {
        return $this->belongsTo(Usuario::class, 'solicitado_id');
    }
}
