<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Article;

class ArticleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Triggers the scraper to fetch REAL articles from BeyondChats blog.
     */
    public function run(): void
    {
        $this->command->info('🚀 Invoking BeyondChats Blog Scraper...');
        $this->command->info('   This will fetch the 5 oldest articles from https://beyondchats.com/blogs/');
        
        // Call the scraper command
        \Illuminate\Support\Facades\Artisan::call('articles:scrape');
        
        $output = \Illuminate\Support\Facades\Artisan::output();
        $this->command->info($output);
        
        // Verify what was scraped
        $count = Article::count();
        $this->command->info("📊 Total articles in database: $count");
    }
}
