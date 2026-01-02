<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Support\Collection;

/**
 * GeminiService - Ultimate Content Enhancement Service
 * 
 * A comprehensive service for leveraging Google's Gemini AI to transform
 * and enhance article content with SEO optimization, depth analysis,
 * and intelligent content synthesis from reference materials.
 * 
 * @package App\Services
 * @version 2.0.0
 */
class GeminiService
{
    /**
     * Gemini API Key
     * @var string
     */
    protected $apiKey;

    /**
     * Guzzle HTTP Client instance
     * @var Client
     */
    protected $client;

    /**
     * Base URL for Gemini API endpoint
     * @var string
     */
    protected $baseUrl;

    /**
     * Gemini model identifier
     * @var string
     */
    protected $model;

    /**
     * Current prompt version for tracking and debugging
     * @var string
     */
    const PROMPT_VERSION = 'v2.0';

    /**
     * Maximum tokens for output generation
     * @var int
     */
    const MAX_OUTPUT_TOKENS = 8192;

    /**
     * Maximum input content length (characters)
     * @var int
     */
    const MAX_CONTENT_LENGTH = 15000;

    /**
     * Maximum reference content length per reference (characters)
     * @var int
     */
    const MAX_REFERENCE_LENGTH = 1200;

    /**
     * Cache duration for successful API responses (minutes)
     * @var int
     */
    const CACHE_DURATION = 60;

    /**
     * Retry attempts for failed API calls
     * @var int
     */
    const RETRY_ATTEMPTS = 3;

    /**
     * Delay between retry attempts (milliseconds)
     * @var int
     */
    const RETRY_DELAY = 1000;

    /**
     * Temperature setting for AI generation (0.0 - 1.0)
     * @var float
     */
    const TEMPERATURE = 0.7;

    /**
     * Top-K sampling parameter
     * @var int
     */
    const TOP_K = 40;

    /**
     * Top-P (nucleus) sampling parameter
     * @var float
     */
    const TOP_P = 0.95;

    /**
     * Initialize the Gemini Service
     * 
     * Sets up API credentials, HTTP client, and configuration parameters
     * from the application's service configuration.
     */
    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
        $this->model = config('services.gemini.model', 'gemini-2.5-flash');
        $this->baseUrl = "https://generativelanguage.googleapis.com/v1/models/{$this->model}:generateContent";
        
        $this->client = new Client([
            'timeout' => config('services.gemini.timeout', 60),
            'connect_timeout' => config('services.gemini.connect_timeout', 15),
            'http_errors' => false, // Handle errors manually
            'verify' => true, // SSL verification
        ]);

        $this->validateConfiguration();
    }

    /**
     * Validate service configuration
     * 
     * @throws \RuntimeException if configuration is invalid
     */
    protected function validateConfiguration(): void
    {
        if (empty($this->apiKey)) {
            Log::warning('GeminiService: API key is not configured');
        }

        if (empty($this->model)) {
            throw new \RuntimeException('GeminiService: Model configuration is required');
        }
    }

    /**
     * Enhance article content using Gemini AI
     * 
     * Takes original article content and reference materials, then uses
     * Gemini AI to produce an enhanced, SEO-optimized version with
     * improved depth, structure, and authority.
     * 
     * @param string $originalContent The original article content to enhance
     * @param array $references Array of reference materials with 'title' and 'content' keys
     * @param array $options Additional options for customization
     * @return array Enhanced content payload with metadata
     */
    public function enhanceArticle(string $originalContent, array $references, array $options = []): array
    {
        // Validate inputs
        if (empty($originalContent)) {
            Log::error('GeminiService: Empty content provided');
            return $this->getFallbackPayload($originalContent, $references, 'Empty content provided');
        }

        // Check API key availability
        if (!$this->apiKey) {
            Log::warning('GeminiService: API Key missing. Returning fallback.');
            return $this->getFallbackPayload($originalContent, $references, 'API Key not configured');
        }

        // Preprocess inputs
        $processedContent = $this->preprocessContent($originalContent);
        $processedReferences = $this->preprocessReferences($references);

        // Check cache first
        $cacheKey = $this->generateCacheKey($processedContent, $processedReferences);
        if ($cached = $this->getCachedResult($cacheKey)) {
            Log::info('GeminiService: Returning cached result');
            return $cached;
        }

        // Attempt enhancement with retry logic
        $result = $this->attemptEnhancementWithRetry(
            $processedContent, 
            $processedReferences, 
            $options
        );

        // Cache successful results
        if (!isset($result['is_fallback']) || !$result['is_fallback']) {
            $this->cacheResult($cacheKey, $result);
        }

        return $result;
    }

    /**
     * Attempt content enhancement with automatic retry logic
     * 
     * @param string $content Processed content
     * @param array $references Processed references
     * @param array $options Enhancement options
     * @return array Enhancement result
     */
    protected function attemptEnhancementWithRetry(string $content, array $references, array $options): array
    {
        $lastException = null;
        
        for ($attempt = 1; $attempt <= self::RETRY_ATTEMPTS; $attempt++) {
            try {
                Log::info("GeminiService: Enhancement attempt {$attempt}/" . self::RETRY_ATTEMPTS);
                
                $result = $this->performEnhancement($content, $references, $options);
                
                if ($result) {
                    Log::info("GeminiService: Enhancement successful on attempt {$attempt}");
                    return $result;
                }
                
            } catch (\Exception $e) {
                $lastException = $e;
                Log::warning("GeminiService: Attempt {$attempt} failed: " . $e->getMessage());
                
                // Don't retry on certain errors
                if ($this->isNonRetryableError($e)) {
                    break;
                }
                
                // Wait before retrying
                if ($attempt < self::RETRY_ATTEMPTS) {
                    usleep(self::RETRY_DELAY * 1000 * $attempt); // Exponential backoff
                }
            }
        }

        // All attempts failed
        $errorMsg = $lastException 
            ? 'Enhancement failed after ' . self::RETRY_ATTEMPTS . ' attempts: ' . $lastException->getMessage()
            : 'Enhancement failed for unknown reason';
            
        Log::error('GeminiService: ' . $errorMsg);
        return $this->getFallbackPayload($content, $references, $errorMsg);
    }

    /**
     * Perform the actual content enhancement via Gemini API
     * 
     * @param string $content Processed content
     * @param array $references Processed references
     * @param array $options Enhancement options
     * @return array|null Enhancement result or null on failure
     */
    protected function performEnhancement(string $content, array $references, array $options): ?array
    {
        // Build the prompt
        $prompt = $this->buildPrompt($content, $references, $options);

        // Prepare API request payload
        $payload = $this->buildApiPayload($prompt, $options);

        // Make API request
        $response = $this->client->post("{$this->baseUrl}?key={$this->apiKey}", [
            'json' => $payload,
            'headers' => [
                'Content-Type' => 'application/json',
            ]
        ]);

        $statusCode = $response->getStatusCode();
        $data = json_decode($response->getBody(), true);

        // Handle HTTP errors
        if ($statusCode !== 200) {
            $errorMsg = data_get($data, 'error.message', 'Unknown API error');
            throw new \RuntimeException("Gemini API returned {$statusCode}: {$errorMsg}");
        }

        // Validate response structure
        if (!isset($data['candidates'])) {
            throw new \RuntimeException('Invalid API response structure: missing candidates');
        }

        // Process the response
        return $this->processApiResponse($data, $content, $references);
    }

    /**
     * Process and validate API response
     * 
     * @param array $data API response data
     * @param string $originalContent Original content for fallback
     * @param array $references References for fallback
     * @return array Processed enhancement result
     */
    protected function processApiResponse(array $data, string $originalContent, array $references): array
    {
        // Check finish reason
        $finishReason = data_get($data, 'candidates.0.finishReason');
        
        // Handle safety blocks
        if ($finishReason === 'SAFETY') {
            $safetyRatings = data_get($data, 'candidates.0.safetyRatings', []);
            Log::warning('GeminiService: Content blocked by safety filters', [
                'safety_ratings' => $safetyRatings
            ]);
            return $this->getFallbackPayload(
                $originalContent, 
                $references, 
                'Content blocked by AI safety filters'
            );
        }

        // Handle max token limits
        if ($finishReason === 'MAX_TOKENS') {
            Log::warning('GeminiService: Response truncated due to token limit');
        }

        // Extract generated text
        $generatedText = data_get($data, 'candidates.0.content.parts.0.text');

        if (empty($generatedText)) {
            Log::error('GeminiService: Empty response from API', [
                'finish_reason' => $finishReason,
                'response' => $data
            ]);
            throw new \RuntimeException('Empty response from Gemini API');
        }

        // Clean and validate the generated content
        $cleanedContent = $this->cleanGeneratedContent($generatedText);
        
        if (empty($cleanedContent)) {
            throw new \RuntimeException('Content cleaning resulted in empty output');
        }

        // Validate HTML structure
        $validationErrors = $this->validateHtmlStructure($cleanedContent);
        if (!empty($validationErrors)) {
            Log::warning('GeminiService: HTML validation warnings', $validationErrors);
        }

        // Extract metadata from response
        $metadata = $this->extractMetadata($data);

        // Generate summary
        $summary = $this->generateSummary($cleanedContent);

        // Analyze content quality
        $qualityMetrics = $this->analyzeContentQuality($cleanedContent, $originalContent);

        return [
            'content' => $cleanedContent,
            'summary' => $summary,
            'references' => $references,
            'generated_at' => now(),
            'prompt_version' => self::PROMPT_VERSION,
            'model' => $this->model,
            'finish_reason' => $finishReason,
            'metadata' => $metadata,
            'quality_metrics' => $qualityMetrics,
            'is_fallback' => false,
        ];
    }

    /**
     * Build API payload for Gemini request
     * 
     * @param string $prompt The formatted prompt
     * @param array $options Additional options
     * @return array API request payload
     */
    protected function buildApiPayload(string $prompt, array $options): array
    {
        return [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => $options['temperature'] ?? self::TEMPERATURE,
                'topK' => $options['top_k'] ?? self::TOP_K,
                'topP' => $options['top_p'] ?? self::TOP_P,
                'maxOutputTokens' => $options['max_tokens'] ?? self::MAX_OUTPUT_TOKENS,
                'stopSequences' => $options['stop_sequences'] ?? [],
            ],
            'safetySettings' => $this->getSafetySettings($options),
        ];
    }

    /**
     * Get safety settings for API request
     * 
     * @param array $options Configuration options
     * @return array Safety settings
     */
    protected function getSafetySettings(array $options): array
    {
        $defaultThreshold = 'BLOCK_MEDIUM_AND_ABOVE';
        
        return [
            [
                'category' => 'HARM_CATEGORY_HARASSMENT',
                'threshold' => $options['safety_harassment'] ?? $defaultThreshold,
            ],
            [
                'category' => 'HARM_CATEGORY_HATE_SPEECH',
                'threshold' => $options['safety_hate_speech'] ?? $defaultThreshold,
            ],
            [
                'category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                'threshold' => $options['safety_sexual'] ?? $defaultThreshold,
            ],
            [
                'category' => 'HARM_CATEGORY_DANGEROUS_CONTENT',
                'threshold' => $options['safety_dangerous'] ?? $defaultThreshold,
            ],
        ];
    }

    /**
     * Build comprehensive prompt for content enhancement
     * 
     * @param string $originalContent The original article content
     * @param array $references Processed reference materials
     * @param array $options Additional prompt customization options
     * @return string Formatted prompt
     */
    protected function buildPrompt(string $originalContent, array $references, array $options = []): string
    {
        // Format references with metadata
        $formattedRefs = $this->formatReferencesForPrompt($references);

        // Extract optional parameters
        $focusKeywords = $options['focus_keywords'] ?? [];
        $targetAudience = $options['target_audience'] ?? 'general audience';
        $contentGoals = $options['content_goals'] ?? 'comprehensive information';
        $toneStyle = $options['tone_style'] ?? 'professional and authoritative';

        // Calculate dynamic word count target
        $originalWordCount = str_word_count(strip_tags($originalContent));
        // Ensure a reasonable minimum floor (e.g., 300 words) to avoid too-short content, 
        // but respect the user's desire for similarity to original.
        $targetMin = max(300, round($originalWordCount * 0.8)); 
        $targetMax = max(500, round($originalWordCount * 1.5));
        $wordCountTarget = "{$targetMin}-{$targetMax} words";

        // Build keyword section if provided
        $keywordSection = '';
        if (!empty($focusKeywords)) {
            $keywordList = implode(', ', $focusKeywords);
            $keywordSection = "\n        TARGET KEYWORDS: {$keywordList}\n";
        }

        return "You are an elite SEO strategist, subject-matter expert, and professional content architect with expertise in search engine optimization, user experience design, and authoritative content creation.

==================================================
PRIMARY MISSION
==================================================

Transform the **Original Article** into a comprehensive, search-optimized, and authoritative resource that:
- Surpasses top-ranking competitor content in depth and value
- Aligns perfectly with user search intent
- Demonstrates E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
- Provides exceptional user experience and readability

==================================================
CONTENT STRATEGY FRAMEWORK
==================================================

1. SEARCH INTENT OPTIMIZATION
   - Identify and address primary, secondary, and latent user intents
   - Satisfy informational, navigational, commercial, and transactional queries
   - Answer questions users don't know they have yet
   - Provide actionable insights at every opportunity

2. ADVANCED SEO OPTIMIZATION
   - Natural keyword integration without stuffing (keyword density: 1-2%)
   - Strategic semantic keyword and LSI term usage{$keywordSection}
   - Semantic HTML5 structure:
     * Single, compelling <h1> (50-60 characters optimal)
     * Clear hierarchy: <h2> for main sections, <h3> for subsections
     * Use <h4>, <h5> sparingly for deep hierarchies
   - Optimize for featured snippets, PAA boxes, and rich results
   - Include relevant schema markup opportunities in comments

3. CONTENT DEPTH & AUTHORITY
   - Match or exceed reference content depth by 20-30%
   - Expand underdeveloped sections with expert insights
   - Add practical examples, case studies, data points
   - Include actionable takeaways and implementation steps
   - Address edge cases and advanced considerations
   - **CRITICAL**: Synthesize only from provided materials—NO fabrication

4. USER EXPERIENCE EXCELLENCE
   - Short paragraphs (2-4 lines, max 3-4 sentences)
   - Strategic use of <ul> and <ol> for scanability
   - Bold key concepts using <strong> tags
   - Use <em> for emphasis where appropriate
   - Include clear transitions between sections
   - Front-load important information (inverted pyramid)

5. INTELLIGENT SOURCE SYNTHESIS
   - Combine insights from multiple references naturally
   - Identify and resolve conflicts between sources
   - Add unique value through synthesis, not just summarization
   - **NEVER** copy verbatim—always paraphrase
   - Maintain factual accuracy and cite appropriately

6. CONTENT COMPLETENESS
   - Address topic comprehensively from multiple angles
   - Include practical tips, expert recommendations
   - Add troubleshooting, FAQs, or common misconceptions
   - Provide next steps or related topics for further exploration

==================================================
TARGET PARAMETERS
==================================================

Target Audience: {$targetAudience}
Content Goals: {$contentGoals}
Tone & Style: {$toneStyle}
Word Count Target: {$wordCountTarget} (Maintain a similar structure/length to the original; do not inflate length artificially)

==================================================
INPUT MATERIALS
==================================================

**ORIGINAL ARTICLE:**
{$originalContent}

**TOP-RANKING REFERENCE MATERIALS:**
{$formattedRefs}

==================================================
OUTPUT REQUIREMENTS & STRUCTURE
==================================================

**FORMAT RULES:**
- Output ONLY clean, semantic HTML5 body content
- NO markdown syntax (no #, ##, ```, etc.)
- NO code block wrappers
- NO explanatory text or meta-commentary
- Use proper HTML tags: <h1>, <h2>, <h3>, <p>, <strong>, <em>, <ul>, <ol>, <li>

**REQUIRED STRUCTURE:**

1. **Compelling Introduction** (Concise, ~10% of total length)
   - Hook that captures attention immediately
   - Clear value proposition
   - Brief overview of what's covered

2. **Core Content Sections** (logical H2 sections)
   - Each section substantive and valuable
   - Progressive disclosure of information
   - Mix of explanation, examples, and actionable advice

3. **Practical Application** (where relevant)
   - Step-by-step guides
   - Best practices
   - Common pitfalls to avoid

4. **Enhanced Conclusion**
   - Summarize key takeaways
   - Reinforce main value propositions
   - Include clear call-to-action or next steps

5. **Sources & Further Reading** (mandatory)
   - <h2>Sources & Further Reading</h2>
   - List reference titles as an organized <ul>
   - Optional: Brief description of what each source covers

**QUALITY CHECKLIST:**
- [ ] Clear H1 that matches search intent
- [ ] Logical content hierarchy with H2/H3 structure
- [ ] Short, scannable paragraphs
- [ ] Strategic use of bold and emphasis
- [ ] Bullet points for lists and key takeaways
- [ ] Natural keyword integration
- [ ] Actionable insights throughout
- [ ] Proper source attribution
- [ ] Engaging introduction and strong conclusion

**OUTPUT FORMAT (CRITICAL):**
Return a valid JSON object with the following structure:
{
    \"content\": \"HTML_STRING\",
    \"summary\": \"SHORT_TEXT\",
    \"seo_analysis\": {
        \"score\": 0-100,
        \"checklist\": [
            { \"label\": \"Title Optimization\", \"status\": \"pass|fail|warn\", \"message\": \"Reasoning...\" },
            { \"label\": \"Content Depth\", \"status\": \"pass|fail|warn\", \"message\": \"Reasoning...\" },
            { \"label\": \"Keyword Usage\", \"status\": \"pass|fail|warn\", \"message\": \"Reasoning...\" },
            { \"label\": \"Readability\", \"status\": \"pass|fail|warn\", \"message\": \"Reasoning...\" },
            { \"label\": \"E-E-A-T Signals\", \"status\": \"pass|fail|warn\", \"message\": \"Reasoning...\" }
        ],
        \"keyword_gaps\": [\"keyword1\", \"keyword2\"]
    }
}

Begin generating the enhanced content now.";
    }

    /**
     * Format references for inclusion in the prompt
     * 
     * @param array $references Array of reference materials
     * @return string Formatted references text
     */
    protected function formatReferencesForPrompt(array $references): string
    {
        if (empty($references)) {
            return "No references provided.";
        }

        $formatted = [];
        foreach ($references as $index => $ref) {
            $refNumber = $index + 1;
            $title = $ref['title'] ?? "Reference {$refNumber}";
            $content = is_array($ref['content']) 
                ? implode(' ', $ref['content']) 
                : $ref['content'];
            
            $url = $ref['url'] ?? '';
            $urlSection = $url ? "\nURL: {$url}" : '';
            
            $formatted[] = "--- REFERENCE {$refNumber} ---\nTitle: {$title}{$urlSection}\nContent:\n{$content}\n";
        }

        return implode("\n", $formatted);
    }

    /**
     * Preprocess original content before sending to API
     * 
     * @param string $content Raw content
     * @return string Processed content
     */
    protected function preprocessContent(string $content): string
    {
        // Remove excessive whitespace
        $content = preg_replace('/\s+/', ' ', $content);
        
        // Trim to maximum length
        if (strlen($content) > self::MAX_CONTENT_LENGTH) {
            Log::info('GeminiService: Truncating content from ' . strlen($content) . ' to ' . self::MAX_CONTENT_LENGTH . ' characters');
            $content = Str::limit($content, self::MAX_CONTENT_LENGTH, '...');
        }

        return trim($content);
    }

    /**
     * Preprocess references before sending to API
     * 
     * @param array $references Raw references
     * @return array Processed references
     */
    protected function preprocessReferences(array $references): array
    {
        return collect($references)->map(function ($ref) {
            $content = is_array($ref['content']) 
                ? implode(' ', $ref['content']) 
                : $ref['content'];
            
            // Clean and truncate content
            $content = preg_replace('/\s+/', ' ', strip_tags($content));
            $content = Str::limit($content, self::MAX_REFERENCE_LENGTH);

            return [
                'title' => $ref['title'] ?? 'Untitled Reference',
                'content' => trim($content),
                'url' => $ref['url'] ?? null,
            ];
        })->filter(function ($ref) {
            return !empty($ref['content']);
        })->values()->toArray();
    }

    /**
     * Clean generated content from LLM artifacts
     * 
     * @param string $content Raw generated content
     * @return string Cleaned content
     */
    protected function cleanGeneratedContent(string $content): string
    {
        // Remove markdown code blocks
        $content = preg_replace('/^```(?:html|xml)?/im', '', $content);
        $content = preg_replace('/```$/m', '', $content);
        
        // Remove markdown headings (## Heading) if they slipped through
        $content = preg_replace('/^#+\s+(.+)$/m', '<h2>$1</h2>', $content);
        
        // Normalize whitespace
        $content = preg_replace('/\n{3,}/', "\n\n", $content);
        
        // Remove any leading/trailing whitespace
        $content = trim($content);

        // Remove any XML/HTML declaration if present
        $content = preg_replace('/<\?xml[^?]*\?>/', '', $content);
        $content = preg_replace('/<!DOCTYPE[^>]*>/', '', $content);

        return $content;
    }

    /**
     * Validate HTML structure for common issues
     * 
     * @param string $html HTML content to validate
     * @return array Array of validation warnings
     */
    protected function validateHtmlStructure(string $html): array
    {
        $warnings = [];

        // Check for multiple H1 tags
        $h1Count = substr_count(strtolower($html), '<h1');
        if ($h1Count > 1) {
            $warnings[] = "Multiple H1 tags found ({$h1Count}). SEO best practice is one H1 per page.";
        } elseif ($h1Count === 0) {
            $warnings[] = "No H1 tag found. Every page should have one H1.";
        }

        // Check for unclosed tags (basic check)
        $openTags = preg_match_all('/<(h[1-6]|p|ul|ol|li|strong|em|div|section)>/i', $html);
        $closeTags = preg_match_all('/<\/(h[1-6]|p|ul|ol|li|strong|em|div|section)>/i', $html);
        
        if ($openTags !== $closeTags) {
            $warnings[] = "Potential unclosed HTML tags detected.";
        }

        return $warnings;
    }

    /**
     * Extract metadata from API response
     * 
     * @param array $data API response data
     * @return array Extracted metadata
     */
    protected function extractMetadata(array $data): array
    {
        return [
            'usage_metadata' => data_get($data, 'usageMetadata', []),
            'safety_ratings' => data_get($data, 'candidates.0.safetyRatings', []),
            'citation_metadata' => data_get($data, 'candidates.0.citationMetadata', []),
        ];
    }

    /**
     * Generate summary from enhanced content
     * 
     * @param string $content Enhanced content
     * @return string Generated summary
     */
    protected function generateSummary(string $content): string
    {
        // Strip all HTML tags
        $text = strip_tags($content);
        
        // Normalize whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);

        // Extract first meaningful paragraph (skip headings)
        preg_match('/^[^.!?]+[.!?]/', $text, $matches);
        $firstSentence = $matches[0] ?? substr($text, 0, 160);

        // Limit to 160 characters for meta description
        return Str::limit($firstSentence, 160, '...');
    }

    /**
     * Analyze content quality metrics
     * 
     * @param string $enhancedContent Enhanced content
     * @param string $originalContent Original content
     * @return array Quality metrics
     */
    protected function analyzeContentQuality(string $enhancedContent, string $originalContent): array
    {
        $enhancedText = strip_tags($enhancedContent);
        $originalText = strip_tags($originalContent);

        return [
            'word_count' => str_word_count($enhancedText),
            'original_word_count' => str_word_count($originalText),
            'character_count' => strlen($enhancedText),
            'paragraph_count' => substr_count($enhancedContent, '<p>'),
            'heading_count' => [
                'h1' => substr_count(strtolower($enhancedContent), '<h1'),
                'h2' => substr_count(strtolower($enhancedContent), '<h2'),
                'h3' => substr_count(strtolower($enhancedContent), '<h3'),
            ],
            'list_count' => substr_count($enhancedContent, '<ul>') + substr_count($enhancedContent, '<ol>'),
            'readability_score' => $this->calculateReadabilityScore($enhancedText),
        ];
    }

    /**
     * Calculate basic readability score (Flesch Reading Ease approximation)
     * 
     * @param string $text Plain text content
     * @return float Readability score
     */
    protected function calculateReadabilityScore(string $text): float
    {
        $sentences = preg_split('/[.!?]+/', $text, -1, PREG_SPLIT_NO_EMPTY);
        $words = str_word_count($text);
        $syllables = $this->countSyllables($text);

        if (count($sentences) === 0 || $words === 0) {
            return 0;
        }

        // Flesch Reading Ease formula
        $score = 206.835 - 1.015 * ($words / count($sentences)) - 84.6 * ($syllables / $words);
        
        return round(max(0, min(100, $score)), 2);
    }

    /**
     * Count syllables in text (approximation)
     * 
     * @param string $text Text to analyze
     * @return int Syllable count
     */
    protected function countSyllables(string $text): int
    {
        $words = str_word_count(strtolower($text), 1);
        $syllables = 0;

        foreach ($words as $word) {
            $syllables += max(1, preg_match_all('/[aeiouy]+/', $word));
        }

        return $syllables;
    }

    /**
     * Check if an exception is non-retryable
     * 
     * @param \Exception $e Exception to check
     * @return bool True if should not retry
     */
    protected function isNonRetryableError(\Exception $e): bool
    {
        $message = strtolower($e->getMessage());
        
        // Don't retry authentication errors
        if (strpos($message, 'api key') !== false || strpos($message, 'auth') !== false) {
            return true;
        }

        // Don't retry invalid request errors
        if (strpos($message, 'invalid') !== false || strpos($message, '400') !== false) {
            return true;
        }

        return false;
    }

    /**
     * Generate cache key for content enhancement
     * 
     * @param string $content Content to hash
     * @param array $references References to hash
     * @return string Cache key
     */
    protected function generateCacheKey(string $content, array $references): string
    {
        $referenceHash = md5(json_encode($references));
        $contentHash = md5($content);
        
        return "gemini_enhance:{$this->model}:{$contentHash}:{$referenceHash}:" . self::PROMPT_VERSION;
    }

    /**
     * Retrieve cached enhancement result
     * 
     * @param string $cacheKey Cache key
     * @return array|null Cached result or null
     */
    protected function getCachedResult(string $cacheKey): ?array
    {
        try {
            return Cache::get($cacheKey);
        } catch (\Exception $e) {
            Log::warning('GeminiService: Cache retrieval failed', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Cache enhancement result
     * 
     * @param string $cacheKey Cache key
     * @param array $result Result to cache
     * @return bool Success status
     */
    protected function cacheResult(string $cacheKey, array $result): bool
    {
        try {
            return Cache::put($cacheKey, $result, now()->addMinutes(self::CACHE_DURATION));
        } catch (\Exception $e) {
            Log::warning('GeminiService: Cache storage failed', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Generate fallback payload when enhancement fails
     * 
     * @param string $originalContent Original content
     * @param array $references References
     * @param string $errorMsg Error message
     * @return array
     */
    protected function getFallbackPayload(string $originalContent, array $references, string $errorMsg): array
    {
        return [
            'content' => $originalContent,
            'summary' => Str::limit(strip_tags($originalContent), 160),
            'references' => $references,
            'error' => $errorMsg,
            'is_fallback' => true,
            'generated_at' => now(),
            'model' => $this->model,
        ];
    }
}
