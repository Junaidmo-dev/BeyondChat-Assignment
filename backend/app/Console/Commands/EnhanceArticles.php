<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Article;
use App\Services\GoogleSearchService;
use App\Services\GeminiService;

class EnhanceArticles extends Command
{
    protected $signature = 'articles:enhance {id?}';
    protected $description = 'Enhance articles using Google Search and Gemini LLM';

    public function handle(GoogleSearchService $searchService, GeminiService $geminiService)
    {
        $query = Article::whereNull('enhanced_version');
        
        if ($this->argument('id')) {
            $query->where('id', $this->argument('id'));
        }

        $articles = $query->limit(5)->get(); // Process in batches
        
        if ($articles->isEmpty()) {
            $this->info("All articles have already been enhanced. Nothing to process.");
            return;
        }

        foreach ($articles as $article) {
            $this->info("Processing: {$article->title}");

            // 1. Search & Scrape
            $this->info("- Searching & Scraping...");
            $references = $searchService->searchAndScrape($article->title);

            if (empty($references)) {
                $this->warn("- No references found via Google Search. Skipping this article.");
                continue;
            }

            // 2. Enhance with LLM
            $this->info("- Enhancing with Gemini...");
            $enhancedData = $geminiService->enhanceArticle($article->content, $references);

            if ($enhancedData) {
                $enhancedData['generated_at'] = now()->toDateTimeString();
                $article->enhanced_version = $enhancedData;
                $article->save();
                $this->info("- Saved enhanced version.");
            } else {
                $this->error("- Failed to enhance.");
            }
        }
    }
}
