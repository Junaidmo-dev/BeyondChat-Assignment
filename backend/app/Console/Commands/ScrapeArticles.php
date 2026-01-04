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
    protected $description = 'Scrape the 5 oldest articles from BeyondChats blog (last page)';

    public function handle()
    {
        $this->info('🚀 Starting BeyondChats Blog Scraper...');
        $this->info('Target: Fetch 5 oldest articles from the last page.');

        try {
            $client = new Client([
                'headers' => [
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language' => 'en-US,en;q=0.5',
                ],
                'timeout' => 30,
            ]);

            // Fetch the LAST page (page 15) to get the oldest articles
            $url = 'https://beyondchats.com/blogs/page/15/';
            $this->info("📥 Fetching: $url");
            
            $response = $client->get($url);
            $html = (string) $response->getBody();
            $crawler = new Crawler($html);

            // CSS Selectors based on actual BeyondChats blog structure
            $articleCount = 0;
            $maxArticles = 5;

            $crawler->filter('article.entry-card')->each(function (Crawler $node) use (&$articleCount, $maxArticles, $client) {
                if ($articleCount >= $maxArticles) return;

                try {
                    // Extract title
                    $titleNode = $node->filter('.entry-title a');
                    if ($titleNode->count() === 0) return;
                    
                    $title = trim($titleNode->text());
                    $link = $titleNode->attr('href');

                    // STRICT: Only allow beyondchats.com articles
                    if (!$link || !str_contains($link, 'beyondchats.com')) {
                        $this->warn("⚠️ Skipping non-BeyondChats link: $link");
                        return;
                    }

                    $this->info("📄 Found: $title");
                    $this->info("   URL: $link");

                    // Extract image
                    $imageUrl = null;
                    $imgNode = $node->filter('.ct-media-container img');
                    if ($imgNode->count() > 0) {
                        $imageUrl = $imgNode->attr('src') ?: $imgNode->attr('data-src');
                    }

                    // Extract date if available
                    $publishedAt = now();
                    $dateNode = $node->filter('.ct-meta-element-date, time');
                    if ($dateNode->count() > 0) {
                        try {
                            $publishedAt = \Carbon\Carbon::parse($dateNode->text());
                        } catch (\Exception $e) {
                            // Keep default
                        }
                    }

                    // Scrape the full article content
                    $this->info("   ⏳ Scraping full content...");
                    $content = $this->scrapeArticleContent($client, $link);

                    if (!$content) {
                        $this->warn("   ⚠️ Failed to scrape content. Using excerpt.");
                        $content = '<p>Content could not be scraped.</p>';
                    }

                    // Save to database
                    Article::updateOrCreate(
                        ['original_url' => $link],
                        [
                            'title' => $title,
                            'slug' => Str::slug($title),
                            'content' => $content,
                            'excerpt' => Str::limit(strip_tags($content), 150),
                            'author' => 'BeyondChats Team',
                            'published_at' => $publishedAt,
                            'image_url' => $imageUrl,
                            'status' => 'published',
                            'tags' => ['AI', 'Chatbots'],
                            'views' => rand(100, 500),
                            'read_time' => rand(3, 8) . ' min read',
                        ]
                    );

                    $articleCount++;
                    $this->info("   ✅ Saved to database!");

                } catch (\Exception $e) {
                    $this->error("   ❌ Error: " . $e->getMessage());
                }
            });

            // If page 15 has fewer than 5 articles, also fetch from page 14
            if ($articleCount < $maxArticles) {
                $this->info("\n📥 Fetching more from page 14...");
                $url14 = 'https://beyondchats.com/blogs/page/14/';
                $response14 = $client->get($url14);
                $html14 = (string) $response14->getBody();
                $crawler14 = new Crawler($html14);

                $crawler14->filter('article.entry-card')->each(function (Crawler $node) use (&$articleCount, $maxArticles, $client) {
                    if ($articleCount >= $maxArticles) return;

                    try {
                        $titleNode = $node->filter('.entry-title a');
                        if ($titleNode->count() === 0) return;
                        
                        $title = trim($titleNode->text());
                        $link = $titleNode->attr('href');

                        if (!$link || !str_contains($link, 'beyondchats.com')) return;

                        // Check if already exists
                        if (Article::where('original_url', $link)->exists()) return;

                        $this->info("📄 Found: $title");

                        $imageUrl = null;
                        $imgNode = $node->filter('.ct-media-container img');
                        if ($imgNode->count() > 0) {
                            $imageUrl = $imgNode->attr('src') ?: $imgNode->attr('data-src');
                        }

                        $publishedAt = now();
                        $dateNode = $node->filter('.ct-meta-element-date, time');
                        if ($dateNode->count() > 0) {
                            try {
                                $publishedAt = \Carbon\Carbon::parse($dateNode->text());
                            } catch (\Exception $e) {}
                        }

                        $this->info("   ⏳ Scraping full content...");
                        $content = $this->scrapeArticleContent($client, $link);

                        Article::updateOrCreate(
                            ['original_url' => $link],
                            [
                                'title' => $title,
                                'slug' => Str::slug($title),
                                'content' => $content ?: '<p>Content could not be scraped.</p>',
                                'excerpt' => Str::limit(strip_tags($content ?: ''), 150),
                                'author' => 'BeyondChats Team',
                                'published_at' => $publishedAt,
                                'image_url' => $imageUrl,
                                'status' => 'published',
                                'tags' => ['AI', 'Chatbots'],
                                'views' => rand(100, 500),
                                'read_time' => rand(3, 8) . ' min read',
                            ]
                        );

                        $articleCount++;
                        $this->info("   ✅ Saved!");

                    } catch (\Exception $e) {
                        $this->error("   ❌ Error: " . $e->getMessage());
                    }
                });
            }

            $this->info("\n🎉 Scrape complete! Total articles saved: $articleCount");

        } catch (\Exception $e) {
            $this->error("❌ Scrape failed: " . $e->getMessage());
        }
    }

    private function scrapeArticleContent(Client $client, string $url): ?string
    {
        try {
            $response = $client->get($url);
            $html = (string) $response->getBody();
            $crawler = new Crawler($html);

            // Try multiple selectors for article content (BeyondChats uses Elementor)
            $contentSelectors = [
                '.entry-content',
                '.elementor-widget-theme-post-content .elementor-widget-container',
                'article .elementor-widget-container',
                '.post-content',
                'article .content',
                'main article',
                '.blog-content',
                'article',
            ];

            foreach ($contentSelectors as $selector) {
                $contentNode = $crawler->filter($selector);
                if ($contentNode->count() > 0) {
                    $this->info("  ✓ Found content using selector: {$selector}");
                    
                    // Clean up the content - remove unwanted elements
                    $trashSelectors = [
                        'script', 'style', 'nav', 'footer', 'header', 'iframe', 'ins', 'svg', 'form',
                        '.sharedaddy', '.jp-relatedposts', '.social-share', '.share-buttons',
                        '.elementor-share-btn', '.elementor-share-buttons', '.elementor-widget-share-buttons',
                        '.elementor-widget-social-icons', '.elementor-icon', '.e-font-icon-svg',
                        '[class*="share-btn"]', '[class*="social-icon"]', '.comments-area',
                        '.sd-sharing-enabled', '.sd-content', '.sd-social', '.post-navigation',
                        '.related-posts', '.author-box', '.comment-form', '#respond', '.wp-block-comments'
                    ];
                    
                    $contentNode->filter(implode(', ', $trashSelectors))->each(function (Crawler $node) {
                        try {
                            $domNode = $node->getNode(0);
                            if ($domNode && $domNode->parentNode) {
                                $domNode->parentNode->removeChild($domNode);
                            }
                        } catch (\Exception $e) {}
                    });

                    // Always use clean extraction method for consistent, well-structured HTML
                    $this->info("  → Building clean HTML from content elements...");
                    return $this->extractContentFromNode($contentNode);
                }
            }

            // Fallback: Build HTML from all content elements
            $this->info("  ⚠ Using fallback content extraction");
            return $this->extractContentElements($crawler);
            
        } catch (\Exception $e) {
            $this->error("  ✗ Error scraping content: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Clean up HTML content while preserving structure
     */
    private function cleanUpHtml(string $html): string
    {
        // FIRST: Cut off content at comment/related sections
        $cutoffPatterns = [
            '/<h[1-6][^>]*>\s*leave a reply/i',
            '/<h[1-6][^>]*>\s*more from/i',
            '/id=["\']respond["\']/i',
            '/class=["\'][^"\']*comment-form/i',
            '/class=["\'][^"\']*related-posts/i',
        ];
        
        foreach ($cutoffPatterns as $pattern) {
            if (preg_match($pattern, $html, $matches, PREG_OFFSET_CAPTURE)) {
                $html = substr($html, 0, $matches[0][1]);
                break;
            }
        }
        
        // Remove empty paragraphs and whitespace
        $html = preg_replace('/<p[^>]*>\s*<\/p>/i', '', $html);
        $html = preg_replace('/<p[^>]*>&nbsp;<\/p>/i', '', $html);
        
        // Remove empty divs (Elementor leaves many)
        $html = preg_replace('/<div[^>]*>\s*<\/div>/i', '', $html);
        
        // Remove Elementor wrapper structure but keep content
        // Strip all classes containing 'elementor' or 'e-con'
        $html = preg_replace('/\s+class="[^"]*(?:elementor|e-con|wp-block-group)[^"]*"/i', '', $html);
        
        // Remove data attributes
        $html = preg_replace('/\s+data-[a-z-]+="[^"]*"/i', '', $html);
        $html = preg_replace('/\s+id="[^"]*elementor[^"]*"/i', '', $html);
        
        // Strip unnecessary wrapper divs while keeping content
        // This regex removes divs that only contain other divs or content elements
        for ($i = 0; $i < 5; $i++) {
            $html = preg_replace('/<div>\s*(<(?:p|h[1-6]|ul|ol|blockquote|figure)[^>]*>.*?<\/(?:p|h[1-6]|ul|ol|blockquote|figure)>)\s*<\/div>/is', '$1', $html);
        }
        
        // Remove completely empty divs (multiple passes)
        for ($i = 0; $i < 3; $i++) {
            $html = preg_replace('/<div[^>]*>\s*<\/div>/i', '', $html);
        }
        
        // Fix images - add proper styling
        $html = preg_replace('/<img([^>]*)>/i', '<img$1 style="max-width:100%;height:auto;border-radius:8px;margin:1rem 0;">', $html);
        
        // Convert strong/b nested in headings to just text (cleanup)
        $html = preg_replace('/<(h[1-6][^>]*)>\s*<strong>([^<]*)<\/strong>\s*<\/h[1-6]>/i', '<$1>$2</$1>', $html);
        
        // Clean excessive whitespace
        $html = preg_replace('/\n\s*\n\s*\n/s', "\n\n", $html);
        $html = preg_replace('/>\s+</s', ">\n<", $html);
        
        return trim($html);
    }

    /**
     * Extract content elements as fallback
     */
    private function extractContentElements(Crawler $crawler): ?string
    {
        $content = '';
        
        // Get article title as H1
        $title = $crawler->filter('h1.entry-title, h1.post-title, article h1');
        if ($title->count() > 0) {
            $content .= '<h1>' . htmlspecialchars($title->first()->text()) . '</h1>';
        }

        // Get all meaningful content from article area
        $articleArea = $crawler->filter('.entry-content, article, main');
        if ($articleArea->count() === 0) {
            return null;
        }

        // Extract headings, paragraphs, lists in order
        $articleArea->filter('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, figure')->each(function (Crawler $element) use (&$content) {
            $tagName = $element->nodeName();
            $text = trim($element->text());
            
            // Skip empty or very short elements
            if (strlen($text) < 2) return;
            
            // Skip navigation/footer content
            $lowerText = strtolower($text);
            if (strpos($lowerText, 'leave a reply') !== false ||
                strpos($lowerText, 'post comment') !== false ||
                strpos($lowerText, 'save my name') !== false ||
                strpos($lowerText, 'your email') !== false) {
                return;
            }

            // Handle different element types
            switch ($tagName) {
                case 'h1':
                case 'h2':
                case 'h3':
                case 'h4':
                case 'h5':
                case 'h6':
                    $content .= "<{$tagName}>" . htmlspecialchars($text) . "</{$tagName}>\n";
                    break;
                case 'p':
                    if (strlen($text) > 10) {
                        $content .= '<p>' . htmlspecialchars($text) . '</p>' . "\n";
                    }
                    break;
                case 'ul':
                case 'ol':
                    try {
                        $listItems = $element->filter('li');
                        if ($listItems->count() > 0) {
                            $content .= "<{$tagName}>\n";
                            $listItems->each(function (Crawler $li) use (&$content) {
                                $liText = trim($li->text());
                                if (strlen($liText) > 2) {
                                    $content .= '  <li>' . htmlspecialchars($liText) . '</li>' . "\n";
                                }
                            });
                            $content .= "</{$tagName}>\n";
                        }
                    } catch (\Exception $e) {}
                    break;
                case 'blockquote':
                    $content .= '<blockquote><p>' . htmlspecialchars($text) . '</p></blockquote>' . "\n";
                    break;
                case 'figure':
                    try {
                        $img = $element->filter('img');
                        if ($img->count() > 0) {
                            $src = $img->attr('src') ?? $img->attr('data-src');
                            $alt = $img->attr('alt') ?? '';
                            if ($src) {
                                $content .= '<figure><img src="' . htmlspecialchars($src) . '" alt="' . htmlspecialchars($alt) . '" style="max-width:100%;height:auto;"></figure>' . "\n";
                            }
                        }
                    } catch (\Exception $e) {}
                    break;
            }
        });

        return strlen($content) > 100 ? $content : null;
    }

    /**
     * Extract content from a specific content node (cleaner approach for Elementor)
     */
    private function extractContentFromNode(Crawler $contentNode): ?string
    {
        $content = '';
        $stopExtraction = false;
        
        // Extract all text content elements in order
        $contentNode->filter('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, figure, img')->each(function (Crawler $element) use (&$content, &$stopExtraction) {
            if ($stopExtraction) return;
            
            $tagName = $element->nodeName();
            $text = trim($element->text());
            
            // Skip empty elements
            if (strlen($text) < 2 && $tagName !== 'img') return;
            
            // Stop at footer/comment/related sections
            $lowerText = strtolower($text);
            $stopPhrases = ['leave a reply', 'post comment', 'save my name', 'your email', 'more from', 'related posts', 'cancel reply'];
            foreach ($stopPhrases as $phrase) {
                if (strpos($lowerText, $phrase) !== false) {
                    $stopExtraction = true;
                    return;
                }
            }

            // Build clean HTML
            switch ($tagName) {
                case 'h1':
                case 'h2':
                case 'h3':
                case 'h4':
                case 'h5':
                case 'h6':
                    $content .= "<{$tagName}>" . htmlspecialchars($text) . "</{$tagName}>\n\n";
                    break;
                    
                case 'p':
                    if (strlen($text) > 15) {
                        $content .= '<p>' . htmlspecialchars($text) . '</p>' . "\n\n";
                    }
                    break;
                    
                case 'ul':
                case 'ol':
                    try {
                        $listItems = $element->filter('li');
                        if ($listItems->count() > 0) {
                            $listContent = "<{$tagName}>\n";
                            $listItems->each(function (Crawler $li) use (&$listContent) {
                                $liText = trim($li->text());
                                if (strlen($liText) > 3) {
                                    $listContent .= '  <li>' . htmlspecialchars($liText) . '</li>' . "\n";
                                }
                            });
                            $listContent .= "</{$tagName}>\n\n";
                            $content .= $listContent;
                        }
                    } catch (\Exception $e) {}
                    break;
                    
                case 'blockquote':
                    if (strlen($text) > 20) {
                        $content .= '<blockquote><p>' . htmlspecialchars($text) . '</p></blockquote>' . "\n\n";
                    }
                    break;
                    
                case 'img':
                    try {
                        $src = $element->attr('src') ?? $element->attr('data-src') ?? $element->attr('data-lazy-src');
                        $alt = $element->attr('alt') ?? '';
                        if ($src && strpos($src, 'data:') !== 0) { // Skip embedded base64 images
                            $content .= '<figure><img src="' . htmlspecialchars($src) . '" alt="' . htmlspecialchars($alt) . '" style="max-width:100%;height:auto;border-radius:8px;"></figure>' . "\n\n";
                        }
                    } catch (\Exception $e) {}
                    break;
                    
                case 'figure':
                    try {
                        $img = $element->filter('img');
                        if ($img->count() > 0) {
                            $src = $img->attr('src') ?? $img->attr('data-src');
                            $alt = $img->attr('alt') ?? '';
                            if ($src && strpos($src, 'data:') !== 0) {
                                $content .= '<figure><img src="' . htmlspecialchars($src) . '" alt="' . htmlspecialchars($alt) . '" style="max-width:100%;height:auto;border-radius:8px;"></figure>' . "\n\n";
                            }
                        }
                    } catch (\Exception $e) {}
                    break;
            }
        });

        $this->info("  ✓ Extracted " . strlen($content) . " characters of clean HTML");
        return strlen($content) > 200 ? trim($content) : null;
    }
}
