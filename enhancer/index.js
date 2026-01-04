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

        // NUCLEAR OPTION: Force process the first 5 articles no matter what
        const pendingArticles = articles.slice(0, 5);
        console.log(`☢️ NUCLEAR MODE: Forcing sync/update on ${pendingArticles.length} articles.`);

        if (pendingArticles.length === 0) {
            console.log('✅ No pending articles found.');
            return;
        }

        for (const article of pendingArticles) {
            console.log(`\n📄 Processing: "${article.title}"`);

            // 2. Search Google (via Serper or Mock)
            const searchResults = await getSearchResults(article.title);
            console.log(`🔍 Found ${searchResults.length} relevant external sources.`);

            // 3. Scrape Top 3 Links
            const references = [];
            for (const result of searchResults.slice(0, 3)) {
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
        const { data } = await axios.get(url, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });
        const $ = cheerio.load(data);
        $('script, style, nav, footer, header').remove();
        return $('p').text().substring(0, 20000);
    } catch (err) {
        return null;
    }
}

async function getAIEnhancement(original, refs) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const refContext = refs.map(r => `Title: ${r.title}\nContent: ${r.content.substring(0, 10000)}`).join('\n\n');


    const prompt = `
        You are an expert SEO content strategist and writer. Your goal is to create a comprehensive, deep-dive article that significantly outranks the provided references.

        Original Article Topic: ${original}

        REFERENCE MATERIALS (Use these to expand depth, but do not plagiarize):
        ${refContext}

        INSTRUCTIONS:
        1. **Expansion & Depth**: The enhanced article MUST be a detailed, long-form piece (aim for 1500+ words if possible). Expand on every point. Use the references to add statistics, examples, case studies, and nuance.
        2. **Structure**: Use a proper hierarchy (H2, H3, H4).
        3. **Formatting**: Use bolding for key terms, bullet points for readability, and blockquotes for emphasis.
        4. **Summary**: Provide a concise, engaging summary at the beginning.
        5. **Sources**: Include a "Sources & References" section at the very bottom, citing the external URLs provided.
        6. **Tone**: Professional, authoritative, yet engaging.

        OUTPUT FORMAT (JSON ONLY):
        {
            "content": "<p>Your long-form HTML content here...</p>",
            "summary": "A roughly 2-sentence summary...",
            "seo_analysis": {
                "score": 0-100,
                "checklist": [
                    { "label": "Word Count > 1500", "status": "pass|fail", "message": "..." },
                    { "label": "Keyword Usage", "status": "pass|fail", "message": "..." }
                ],
                "keyword_gaps": []
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


const POLL_INTERVAL = 5000; // 5 seconds

async function runService() {
    console.log('🚀 SEO Enhancer Service Started (Continuous Mode - 5s polling)');
    while (true) {
        try {
            await enhancePipeline();
        } catch (error) {
            console.error('💥 Critical Service Error:', error);
        }
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
}

runService();
