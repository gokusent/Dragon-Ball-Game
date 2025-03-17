<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class Inventario
 * 
 * @property int $id
 * @property int $usuario_id
 * @property int $carta_id
 * @property int|null $cantidad
 * 
 * @property Usuario $usuario
 * @property Carta $carta
 *
 * @package App\Models
 */
class Inventario extends Model
{
	protected $connection = 'mysql';
	protected $table = 'inventario';
	public $timestamps = false;

	protected $casts = [
		'usuario_id' => 'int',
		'carta_id' => 'int',
		'cantidad' => 'int'
	];

	protected $fillable = [
		'usuario_id',
		'carta_id',
		'cantidad'
	];

	public function usuario()
	{
		return $this->belongsTo(Usuario::class);
	}

	public function carta()
	{
		return $this->belongsTo(Carta::class);
	}
}
