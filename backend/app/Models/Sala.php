<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sala extends Model
{
    protected $fillable = [
        'sala',
        'jugador1_id',
        'jugador2_id',
        'estado',
        'turno',
    ];
}
