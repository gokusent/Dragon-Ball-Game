<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Movimiento
 * 
 * @property int $id
 * @property int $partida_id
 * @property int $jugador_id
 * @property int $carta_id
 * @property string $accion
 * @property int $valor
 * @property int $turno
 * @property Carbon $timestamp
 * 
 * @property Partida $partida
 * @property Usuario $usuario
 * @property Carta $carta
 *
 * @package App\Models
 */
class Movimiento extends Model
{
	protected $connection = 'mysql';
	protected $table = 'movimientos';
	public $timestamps = false;

	protected $casts = [
		'partida_id' => 'int',
		'jugador_id' => 'int',
		'carta_id' => 'int',
		'valor' => 'int',
		'turno' => 'int',
		'timestamp' => 'datetime'
	];

	protected $fillable = [
		'partida_id',
		'jugador_id',
		'carta_id',
		'accion',
		'valor',
		'turno',
		'timestamp'
	];

	public function partida()
	{
		return $this->belongsTo(Partida::class);
	}

	public function usuario()
	{
		return $this->belongsTo(Usuario::class, 'jugador_id');
	}

	public function carta()
	{
		return $this->belongsTo(Carta::class);
	}
}
