<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Carta
 * 
 * @property int $id
 * @property string $nombre
 * @property string $rareza
 * @property int $vida
 * @property int $daño
 * @property int $energia
 * @property string $tecnica_especial
 * @property int $daño_especial
 * @property string $imagen_url
 * 
 * @property Collection|Inventario[] $inventarios
 * @property Collection|Movimiento[] $movimientos
 *
 * @package App\Models
 */
class Carta extends Model
{
	protected $connection = 'mysql';
	protected $table = 'cartas';
	public $timestamps = false;

	protected $casts = [
		'vida' => 'int',
		'daño' => 'int',
		'energia' => 'int',
		'daño_especial' => 'int'
	];

	protected $fillable = [
		'nombre',
		'rareza',
		'vida',
		'daño',
		'energia',
		'tecnica_especial',
		'daño_especial',
		'imagen_url',
		'imagen_url2'
	];

	public function inventarios()
	{
		return $this->hasMany(Inventario::class);
	}

	public function movimientos()
	{
		return $this->hasMany(Movimiento::class);
	}

	public function aplicarEfecto($jugador)
{
    // Si la carta tiene daño
    if ($this->daño > 0) {
        $jugador->vida -= $this->daño;
    }

    // Si la carta tiene una técnica especial
    if ($this->tecnica_especial) {
        // Ejecutar lógica para técnica especial
        $jugador->vida -= $this->daño_especial; 
    }
}

}
