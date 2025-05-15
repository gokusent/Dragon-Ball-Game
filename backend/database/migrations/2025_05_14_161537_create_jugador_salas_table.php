<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateJugadorSalasTable extends Migration
{
    public function up()
    {
        Schema::create('jugador_salas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sala_id')->constrained()->onDelete('cascade');
            $table->foreignId('jugador_id')->constrained('users')->onDelete('cascade');
            $table->string('socket_id')->nullable();
            $table->json('equipo')->nullable(); // opcional, si querés guardar el equipo
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('jugador_salas');
    }
}
