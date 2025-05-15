<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JugadorSala extends Model
{
    protected $fillable = ['sala_id', 'jugador_id', 'socket_id', 'equipo'];

    protected $casts = [
        'equipo' => 'array',
    ];

    public function jugador()
    {
        return $this->belongsTo(User::class, 'jugador_id');
    }

    public function sala()
    {
        return $this->belongsTo(Sala::class);
    }
}
