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
            $table->increments('id'); // INT UNSIGNED
            $table->integer('jugador1_id');
            $table->integer('jugador2_id')->nullable();
            $table->string('estado')->default('esperando');
            $table->integer('turno')->default(1);
            $table->timestamps();

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
