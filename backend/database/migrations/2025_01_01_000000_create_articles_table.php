<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('title')->index();
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->string('author')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->string('image_url')->nullable();
            $table->string('original_url')->nullable();
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->json('tags')->nullable();
            $table->integer('views')->default(0);
            
            // Enhanced version stored as JSON for simplicity, or could be separate table
            // We'll store it here to simplify the query
            $table->json('enhanced_version')->nullable(); 
            // Structure: { content: string, summary: string, references: [], generated_at: timestamp }

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
