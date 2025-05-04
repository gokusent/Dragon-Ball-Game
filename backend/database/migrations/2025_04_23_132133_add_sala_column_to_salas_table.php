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
    Schema::table('salas', function (Blueprint $table) {
        $table->string('sala')->unique()->after('id'); // Asegúrate de que sea del tipo correcto
    });
}


    /**
     * Reverse the migrations.
     */
    public function down()
{
    Schema::table('salas', function (Blueprint $table) {
        $table->dropColumn('sala');
    });
}

};
