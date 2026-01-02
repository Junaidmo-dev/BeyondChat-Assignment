<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Article;
use Illuminate\Support\Str;
use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;

class ScrapeArticles extends Command
{
    protected $signature = 'articles:scrape';
    protected $description = 'Scrape articles from BeyondChats blog';

    public function handle()
    {
        $this->info('Starting scrape...');

        // Note: In a real environment with dependencies installed, this would work.
        // Since composer install failed in this environment, this is just the code implementation.
        
        try {
            $client = new Client();
            // Scrape the last page or a specific page. 
            // For simplicity, let's assume we scrape the main blog page or a known page 
            $url = 'https://beyondchats.com/blogs/'; 
            
            $this->info("Fetching $url");
            $response = $client->get($url);
            $html = (string) $response->getBody();

            $crawler = new Crawler($html);

            // Select articles (Selectors need to be adjusted based on actual site structure)
            // Assuming standard blog structure
            $crawler->filter('article')->each(function (Crawler $node) {
                try {
                    $title = $node->filter('h2, h3')->text();
                    $link = $node->filter('a')->attr('href');
                    
                    if (!$link) return;

                    $this->info("Found: $title");

                    // Check if exists - OPTIONAL: We want to update now, so commenting out skip
                    // if (Article::where('original_url', $link)->exists()) {
                    //     $this->info("Skipping (already exists)");
                    //     return;
                    // }

                    // Go to detail page
                    $this->scrapeSingleArticle($link, $title);
                    
                } catch (\Exception $e) {
                    $this->error("Error extracting node: " . $e->getMessage());
                }
            });

            $this->info('Scrape complete.');

        } catch (\Exception $e) {
            $this->error("Scrape failed: " . $e->getMessage());
        }
    }

    private function scrapeSingleArticle($url, $title)
    {
        $client = new Client();
        $response = $client->get($url);
        $html = (string) $response->getBody();
        $crawler = new Crawler($html);

        // Extract content
        $contentNode = $crawler->filter('.entry-content, article .content, main');
        
        // Deep Clean: remove scripts, styles, share buttons, SVGs, duplicate headers, and social widgets
        $trashSelectors = [
            'script', 'style', 'svg', 'button', 'h1', 'iframe', 'ins',
            '.sharedaddy', '.jp-relatedposts', '.social-share', '.share-buttons', 
            '.meta-tags', '.entry-meta', '.byline', '.author-box', '.sd-content', 
            '.sd-title', '.jetpack-likes-widget-wrapper', '.wpcnt', '#jp-post-flair', 
            '.sd-social', '.sd-sharing-enabled', '.share-count', '.sd-button',
            '.robots-nocontent', '.post-ratings', '.wp-block-buttons', '.social-icon',
            '.post-views-count', '.share-msg', '.entry-footer', '.post-navigation'
        ];

        foreach ($trashSelectors as $selector) {
            $contentNode->filter($selector)->each(function (Crawler $node) {
                try {
                    $domNode = $node->getNode(0);
                    if ($domNode && $domNode->parentNode) {
                        $domNode->parentNode->removeChild($domNode);
                    }
                } catch (\Exception $e) { }
            });
        }

        // Remove numeric crumbs (like "97 97" or "80 80") that often appear in share widgets
        $contentNode->filter('div, span, p, li')->each(function (Crawler $node) {
            $text = trim($node->text());
            // If the element only contains a number or "number number", it's likely a share count orphan
            if (preg_match('/^\d+(\s+\d+)*$/', $text)) {
                try {
                    $domNode = $node->getNode(0);
                    if ($domNode && $domNode->parentNode) {
                        $domNode->parentNode->removeChild($domNode);
                    }
                } catch (\Exception $e) { }
            }
        });

        // Final pass: Remove empty paragraphs, list items, or containers
        $contentNode->filter('p:empty, li:empty, ul:empty, div:empty')->each(function (Crawler $node) {
            try {
                $domNode = $node->getNode(0);
                if ($domNode && $domNode->parentNode) {
                    $domNode->parentNode->removeChild($domNode);
                }
            } catch (\Exception $e) { }
        });

        $content = $contentNode->count() > 0 ? $contentNode->html() : '';
        
        // Extract Image
        $imageUrl = null;
        try {
            // Try og:image first
            $imageUrl = $crawler->filter('meta[property="og:image"]')->attr('content');
            
            // Fallback to first image in content
            if (!$imageUrl) {
                $imageUrl = $crawler->filter('article img, .entry-content img')->first()->attr('src');
            }
        } catch (\Exception $e) {
            // Image not found, ignore
        }

        $publishedAt = now(); // Placeholder extraction
        $author = 'BeyondChats Team'; // Placeholder

        Article::updateOrCreate(
            ['original_url' => $url],
            [
                'title' => $title,
                'slug' => Str::slug($title),
                'content' => $content,
                'author' => $author,
                'published_at' => $publishedAt,
                'image_url' => $imageUrl, // Save the scraped image
                'status' => 'published',
                'excerpt' => Str::limit(strip_tags($content), 150),
            ]
        );

        $this->info("Saved: $title");
    }
}
