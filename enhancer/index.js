import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: '../backend/.env' });

const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SERPER_API_KEY = process.env.SERPER_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function enhancePipeline() {
    console.log('🚀 Starting SEO Enhancement Pipeline (Node.js)...');

    try {
        // 1. Fetch articles needing enhancement
        const { data: response } = await axios.get(`${API_BASE_URL}/articles`);
        const articles = response.data || [];
        const pendingArticles = articles.filter(a => !a.enhanced_version).slice(0, 2);

        if (pendingArticles.length === 0) {
            console.log('✅ No pending articles found.');
            return;
        }

        for (const article of pendingArticles) {
            console.log(`\n📄 Processing: "${article.title}"`);

            // 2. Search Google (via Serper or Mock)
            const searchResults = await getSearchResults(article.title);
            console.log(`🔍 Found ${searchResults.length} relevant external sources.`);

            // 3. Scrape Top 2 Links
            const references = [];
            for (const result of searchResults.slice(0, 2)) {
                console.log(`🌐 Scraping: ${result.link}`);
                const content = await scrapeArticleContent(result.link);
                if (content) {
                    references.push({
                        title: result.title,
                        url: result.link,
                        content: content
                    });
                }
            }

            if (references.length === 0) {
                console.log('⚠️ No content could be scraped. Skipping.');
                continue;
            }

            // 4. Call LLM (Gemini) for SEO Enhancement
            console.log('🤖 Enhancing content with Gemini AI...');
            const enhancedData = await getAIEnhancement(article.content, references);

            // 5. Publish back to API
            if (enhancedData) {
                await axios.put(`${API_BASE_URL}/articles/${article.id}`, {
                    enhanced_version: {
                        content: enhancedData.content,
                        summary: enhancedData.summary,
                        references: references,
                        generated_at: new Date().toISOString()
                    }
                });
                console.log('✨ Successfully published enhanced version!');
            }
        }

    } catch (error) {
        console.error('❌ Pipeline Error:', error.message);
    }
}

async function getSearchResults(query) {
    if (!SERPER_API_KEY) {
        return [
            { title: `${query} - Expert Insights`, link: 'https://example.com/blog/1' },
            { title: `Ultimate Guide to ${query}`, link: 'https://example.com/blog/2' }
        ];
    }
    const { data } = await axios.post('https://google.serper.dev/search', { q: query }, {
        headers: { 'X-API-KEY': SERPER_API_KEY }
    });
    return data.organic || [];
}

async function scrapeArticleContent(url) {
    try {
        if (url.includes('example.com')) return 'Mock content for demonstration purposes.';
        const { data } = await axios.get(url, { timeout: 5000 });
        const $ = cheerio.load(data);
        $('script, style, nav, footer, header').remove();
        return $('p').text().substring(0, 3000);
    } catch (err) {
        return null;
    }
}

async function getAIEnhancement(original, refs) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const refContext = refs.map(r => `Title: ${r.title}\nContent: ${r.content.substring(0, 500)}`).join('\n\n');

    const prompt = `
        You are an SEO expert. Rewrite this article to be more engaging and search-optimized.
        Make the formatting similar to the high-ranking references provided.
        
        Original Article: ${original}
        
        References:
        ${refContext}
        
        Requirements:
        1. Use semantic HTML (h2, h3, b, i).
        2. Improve flow and depth.
        3. Add a summary.
        4. Add a "Sources" section citing the references.
        5. Maintain a word count range similar to the original article (do not make it significantly longer).
        
        Output JSON: {
            "content": "HTML_HERE",
            "summary": "SHORT_TEXT",
            "seo_analysis": {
                "score": 0-100,
                "checklist": [
                    { "label": "Title Optimization", "status": "pass|fail|warn", "message": "Reasoning..." },
                    { "label": "Content Depth", "status": "pass|fail|warn", "message": "Reasoning..." }
                ],
                "keyword_gaps": ["missed_keyword_1", "missed_keyword_2"]
            }
        }
    `;

    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            try {
                return JSON.parse(text.replace(/```json|```/g, ''));
            } catch (e) {
                return { content: text, summary: "Enhanced SEO version." };
            }
        } catch (error) {
            if (error.status === 429 || error.message.includes('429') || error.message.includes('Resource has been exhausted')) {
                console.log(`⚠️ Rate limited. Waiting 20s before retry ${attempt}/3...`);
                await new Promise(resolve => setTimeout(resolve, 20000));
            } else {
                console.error('Generative AI Error:', error.message);
                throw error;
            }
        }
    }
    return null;
}

enhancePipeline();
