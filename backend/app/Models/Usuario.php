<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Class Usuario
 * 
 * @property int $id
 * @property string $nombre
 * @property string $email
 * @property string $password
 * @property string|null $avatar
 * @property Carbon $fecha_registro
 * 
 * @property Collection|ComentariosForo[] $comentarios_foros
 * @property Collection|Foro[] $foros
 * @property Collection|Inventario[] $inventarios
 * @property Collection|Movimiento[] $movimientos
 * @property Collection|Partida[] $partidas
 *
 * @package App\Models
 */
class Usuario extends Authenticatable
{
	use HasApiTokens, HasFactory;
	protected $connection = 'mysql';
	protected $table = 'usuarios';
	public $timestamps = false;

	protected $casts = [
		'fecha_registro' => 'datetime'
	];

	protected $hidden = [
		'password'
	];

	protected $fillable = [
		'nombre',
		'email',
		'password',
		'avatar',
		'fecha_registro'
	];

	public function comentarios_foros()
	{
		return $this->hasMany(ComentariosForo::class);
	}

	public function foros()
	{
		return $this->hasMany(Foro::class);
	}

	public function inventarios()
	{
		return $this->hasMany(Inventario::class);
	}

	public function movimientos()
	{
		return $this->hasMany(Movimiento::class, 'jugador_id');
	}

	public function partidas()
	{
		return $this->hasMany(Partida::class, 'ganador_id');
	}
}
