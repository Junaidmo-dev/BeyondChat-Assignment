<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ArticleController;

Route::prefix('v1')->group(function () {

    Route::apiResource('articles', ArticleController::class);
    
    // TEMPORARY: Reset database route (REMOVE AFTER USE!)
    Route::get('reset-database-temp', function () {
        \Illuminate\Support\Facades\Artisan::call('migrate:fresh', ['--seed' => true, '--force' => true]);
        return response()->json(['message' => 'Database reset complete!', 'output' => \Illuminate\Support\Facades\Artisan::output()]);
    });
});
