<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Amigo extends Model
{
    use HasFactory;

    public $timestamps = false;  // Desactiva la gestión de created_at y updated_at

    protected $fillable = [
        'usuario_id',
        'amigo_id',
        'estado',
    ];

    // Relación con Usuario
    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function amigo()
    {
        return $this->belongsTo(User::class, 'amigo_id');
    }
}

