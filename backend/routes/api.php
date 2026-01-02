<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ArticleController;

Route::prefix('v1')->group(function () {
    Route::post('articles/{id}/enhance', [ArticleController::class, 'enhance']);
    Route::apiResource('articles', ArticleController::class);
});
