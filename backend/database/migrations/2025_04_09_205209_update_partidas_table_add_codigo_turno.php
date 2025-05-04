<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::table('partidas', function (Blueprint $table) {
        $table->string('codigo_sala', 10)->unique()->after('id');
        $table->tinyInteger('turno')->default(1)->after('estado');
    });
    
    // Generar códigos para partidas existentes
    DB::table('partidas')->whereNull('codigo_sala')->each(function ($partida) {
        DB::table('partidas')
            ->where('id', $partida->id)
            ->update(['codigo_sala' => 'PVP-' . strtoupper(substr(md5($partida->id), 0, 6))]);
    });
}

public function down()
{
    Schema::table('partidas', function (Blueprint $table) {
        $table->dropColumn(['codigo_sala', 'turno']);
    });
}
};
