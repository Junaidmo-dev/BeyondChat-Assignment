<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Article;

echo "Resetting enhanced_version for all articles...\n";

// Update all articles to have null enhanced_version
$count = Article::query()->update(['enhanced_version' => null]);

echo "Reset complete. {$count} articles reset to pending status.\n";
