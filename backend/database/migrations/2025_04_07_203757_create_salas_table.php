<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('salas', function (Blueprint $table) {
            $table->id();  // Esto crea una columna 'id' de tipo BIGINT
            $table->unsignedInteger('jugador1_id');  // Asegúrate de que sea del tipo INT sin signo
            $table->unsignedInteger('jugador2_id')->nullable();  // Del mismo tipo para la segunda columna de jugador
            $table->string('estado')->default('esperando');
            $table->integer('turno')->default(1);
            $table->timestamps();
        
            // Definir las claves foráneas
            $table->foreign('jugador1_id')->references('id')->on('usuarios')->onDelete('cascade');
            $table->foreign('jugador2_id')->references('id')->on('usuarios')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salas');
    }
};
