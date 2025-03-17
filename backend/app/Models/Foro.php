<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Foro
 * 
 * @property int $id
 * @property int $usuario_id
 * @property string $titulo
 * @property string $contenido
 * @property Carbon $fecha
 * 
 * @property Usuario $usuario
 * @property Collection|ComentariosForo[] $comentarios_foros
 *
 * @package App\Models
 */
class Foro extends Model
{
	protected $connection = 'mysql';
	protected $table = 'foro';
	public $timestamps = false;

	protected $casts = [
		'usuario_id' => 'int',
		'fecha' => 'datetime'
	];

	protected $fillable = [
		'usuario_id',
		'titulo',
		'contenido',
		'fecha'
	];

	public function usuario()
	{
		return $this->belongsTo(Usuario::class);
	}

	public function comentarios_foros()
	{
		return $this->hasMany(ComentariosForo::class);
	}
}
