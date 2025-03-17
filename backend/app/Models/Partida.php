<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Partida
 * 
 * @property int $id
 * @property int $jugador1_id
 * @property int $jugador2_id
 * @property string|null $estado
 * @property int|null $turno
 * @property int|null $ganador_id
 * 
 * @property Usuario|null $usuario
 * @property Collection|Movimiento[] $movimientos
 *
 * @package App\Models
 */
class Partida extends Model
{
	protected $connection = 'mysql';
	protected $table = 'partidas';
	public $timestamps = false;

	protected $casts = [
		'jugador1_id' => 'int',
		'jugador2_id' => 'int',
		'turno' => 'int',
		'ganador_id' => 'int'
	];

	protected $fillable = [
		'jugador1_id',
		'jugador2_id',
		'estado',
		'turno',
		'ganador_id'
	];

	public function usuario()
	{
		return $this->belongsTo(Usuario::class, 'ganador_id');
	}

	public function movimientos()
	{
		return $this->hasMany(Movimiento::class);
	}
}
