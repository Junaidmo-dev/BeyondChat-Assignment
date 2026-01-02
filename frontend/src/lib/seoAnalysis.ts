
interface SeoScore {
    score: number;
    checks: {
        id: string;
        label: string;
        status: 'pass' | 'fail' | 'warn';
        message: string;
    }[];
}

interface KeywordGap {
    keyword: string;
    source: string;
}

export const analyzeSeo = (htmlContent: string, title: string, references: any[] = []): SeoScore => {
    const checks: SeoScore['checks'] = [];
    let score = 100;

    // 1. Title Length
    if (title.length < 30) {
        checks.push({ id: 'title_len', label: 'Title Length', status: 'warn', message: 'Title is too short (<30 chars). Aim for 50-60.' });
        score -= 10;
    } else if (title.length > 60) {
        checks.push({ id: 'title_len', label: 'Title Length', status: 'warn', message: 'Title is likely truncated (>60 chars).' });
        score -= 5;
    } else {
        checks.push({ id: 'title_len', label: 'Title Length', status: 'pass', message: 'Optimal title length (30-60 chars).' });
    }

    // 2. H1 Check
    const hasH1 = /<h1[^>]*>.*?<\/h1>/i.test(htmlContent);
    // Enhanced content from backend might not include H1 if it returns BODY only. 
    // This check might need context. Assuming enhanced content *should* ideally have it if full page.
    // However, often H1 is the article title itself rendered outside content. 
    // We'll skip strict H1 check inside body for now, or check if body starts with it.

    // 3. Word Count
    const textContent = htmlContent.replace(/<[^>]*>/g, ' ');
    const wordCount = textContent.trim().split(/\s+/).length;
    if (wordCount < 600) {
        checks.push({ id: 'word_count', label: 'Word Count', status: 'fail', message: `Content is thin (${wordCount} words). Aim for 800+.` });
        score -= 20;
    } else if (wordCount < 1000) {
        checks.push({ id: 'word_count', label: 'Word Count', status: 'warn', message: `Good length (${wordCount} words), but could be deeper.` });
        score -= 5;
    } else {
        checks.push({ id: 'word_count', label: 'Word Count', status: 'pass', message: `Excellent depth (${wordCount} words).` });
    }

    // 4. Subheadings (H2/H3)
    const h2Count = (htmlContent.match(/<h2/gi) || []).length;
    if (h2Count < 2) {
        checks.push({ id: 'structure', label: 'Content Structure', status: 'fail', message: 'Few subheadings. Use H2s to break up text.' });
        score -= 15;
    } else {
        checks.push({ id: 'structure', label: 'Content Structure', status: 'pass', message: `Good structure (${h2Count} sections detected).` });
    }

    // 5. Readability (Basic Flesch Approximation)
    // Avg sentence length * 1.015 + Avg syllables per word * 84.6 - 206.835 (REVERSE for simplicity here)
    // Simplified: Check for long paragraphs
    const paragraphs = htmlContent.match(/<p[^>]*>.*?<\/p>/gi) || [];
    let longParagraphs = 0;
    paragraphs.forEach(p => {
        const pText = p.replace(/<[^>]*>/g, '');
        if (pText.split(' ').length > 60) longParagraphs++;
    });

    if (longParagraphs > 0) {
        checks.push({ id: 'readability', label: 'Readability', status: 'warn', message: `${longParagraphs} paragraphs are too long. Keep under 60 words.` });
        score -= 10;
    } else {
        checks.push({ id: 'readability', label: 'Readability', status: 'pass', message: 'Paragraphs are short and readable.' });
    }

    return { score: Math.max(0, score), checks };
};

export const extractHeadings = (html: string) => {
    const headings: { id: string, text: string, level: number }[] = [];
    const regex = /<(h[1-6])[^>]*>(.*?)<\/\1>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        headings.push({
            id: `h-${headings.length}`,
            level: parseInt(match[1].replace('h', '')),
            text: match[2].replace(/<[^>]*>/g, '').trim() // Strip inner tags if any
        });
    }
    return headings;
};

export const getKeywordGaps = (content: string, references: any[]) => {
    // Naive extraction: Get frequent words from reference titles that are missing in content
    const contentLower = content.toLowerCase();
    const gaps: KeywordGap[] = [];
    const stopWords = ['the', 'and', 'for', 'with', 'that', 'this', 'how', 'what', 'why', 'guide', 'best', 'top', '2023', '2024', 'review'];

    references.forEach(ref => {
        const words = ref.title.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
        words.forEach((w: string) => {
            if (w.length > 4 && !stopWords.includes(w) && !contentLower.includes(w)) {
                if (!gaps.find(g => g.keyword === w)) {
                    gaps.push({ keyword: w, source: ref.title });
                }
            }
        });
    });

    // Return top 5 unique gaps
    return gaps.slice(0, 5);
};

export const generateSchema = (article: any) => {
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.title,
        "image": [article.image_url],
        "datePublished": article.published_at,
        "author": [{
            "@type": "Person",
            "name": article.author,
            "url": "https://beyondchats.com" // Placeholder
        }]
    };
};
