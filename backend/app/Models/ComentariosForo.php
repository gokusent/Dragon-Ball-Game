<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ComentariosForo
 * 
 * @property int $id
 * @property int $foro_id
 * @property int $usuario_id
 * @property string $contenido
 * @property Carbon $fecha
 * 
 * @property Foro $foro
 * @property Usuario $usuario
 *
 * @package App\Models
 */
class ComentariosForo extends Model
{
	protected $connection = 'mysql';
	protected $table = 'comentarios_foro';
	public $timestamps = false;

	protected $casts = [
		'foro_id' => 'int',
		'usuario_id' => 'int',
		'fecha' => 'datetime'
	];

	protected $fillable = [
		'foro_id',
		'usuario_id',
		'contenido',
		'fecha'
	];

	public function foro()
	{
		return $this->belongsTo(Foro::class);
	}

	public function usuario()
	{
		return $this->belongsTo(Usuario::class);
	}
}
