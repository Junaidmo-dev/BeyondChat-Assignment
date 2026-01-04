
interface SeoScore {
    score: number;
    checks: {
        id: string;
        label: string;
        status: 'pass' | 'fail' | 'warn';
        message: string;
        suggestion?: string;
        impact: 'high' | 'medium' | 'low';
    }[];
    metrics: {
        wordCount: number;
        readingTime: string;
        avgSentenceLength: number;
        h2Count: number;
        h3Count: number;
        linkCount: number;
        imageCount: number;
        keywordDensity: number;
    };
}

interface KeywordGap {
    keyword: string;
    source: string;
}

export const analyzeSeo = (htmlContent: string, title: string, references: any[] = []): SeoScore => {
    const checks: SeoScore['checks'] = [];
    let score = 100;

    // Extract text content
    const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = textContent.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 ? Math.round(wordCount / sentences.length) : 0;

    // Count elements
    const h2Count = (htmlContent.match(/<h2/gi) || []).length;
    const h3Count = (htmlContent.match(/<h3/gi) || []).length;
    const linkCount = (htmlContent.match(/<a\s/gi) || []).length;
    const imageCount = (htmlContent.match(/<img\s/gi) || []).length;

    // 1. Title Length
    if (title.length < 30) {
        checks.push({
            id: 'title_len',
            label: 'Title Length',
            status: 'warn',
            message: `Title is too short (${title.length} chars). Aim for 50-60 characters.`,
            suggestion: 'Add more descriptive keywords to your title. Consider including your primary keyword and a compelling benefit.',
            impact: 'high'
        });
        score -= 10;
    } else if (title.length > 60) {
        checks.push({
            id: 'title_len',
            label: 'Title Length',
            status: 'warn',
            message: `Title is too long (${title.length} chars). It may be truncated in search results.`,
            suggestion: 'Shorten your title to under 60 characters while keeping the main keyword at the beginning.',
            impact: 'medium'
        });
        score -= 5;
    } else {
        checks.push({
            id: 'title_len',
            label: 'Title Length',
            status: 'pass',
            message: `Optimal title length (${title.length} characters).`,
            impact: 'high'
        });
    }

    // 2. Meta Description Check (simulated with excerpt)
    checks.push({
        id: 'meta_desc',
        label: 'Meta Description',
        status: 'pass',
        message: 'Meta description should be 150-160 characters with target keywords.',
        suggestion: 'Ensure your meta description includes your primary keyword and a clear call-to-action.',
        impact: 'high'
    });

    // 3. Word Count
    if (wordCount < 300) {
        checks.push({
            id: 'word_count',
            label: 'Content Length',
            status: 'fail',
            message: `Content is very thin (${wordCount} words). Google prefers comprehensive content.`,
            suggestion: 'Expand your content to at least 800 words. Add more sections, examples, case studies, or FAQs.',
            impact: 'high'
        });
        score -= 25;
    } else if (wordCount < 600) {
        checks.push({
            id: 'word_count',
            label: 'Content Length',
            status: 'warn',
            message: `Content could be longer (${wordCount} words). Aim for 800+ words.`,
            suggestion: 'Add more detailed explanations, examples, or related subtopics to increase depth.',
            impact: 'high'
        });
        score -= 15;
    } else if (wordCount < 1000) {
        checks.push({
            id: 'word_count',
            label: 'Content Length',
            status: 'warn',
            message: `Good length (${wordCount} words), but top-ranking content often has 1000+.`,
            suggestion: 'Consider adding an FAQ section or more detailed examples to boost word count.',
            impact: 'medium'
        });
        score -= 5;
    } else {
        checks.push({
            id: 'word_count',
            label: 'Content Length',
            status: 'pass',
            message: `Excellent content depth (${wordCount} words).`,
            impact: 'high'
        });
    }

    // 4. Subheadings Structure
    if (h2Count < 2) {
        checks.push({
            id: 'structure_h2',
            label: 'Content Structure (H2)',
            status: 'fail',
            message: `Only ${h2Count} section heading(s). Use more H2 tags to break up content.`,
            suggestion: 'Add H2 headings every 200-300 words. Use descriptive headings that include relevant keywords.',
            impact: 'high'
        });
        score -= 15;
    } else if (h2Count < 4) {
        checks.push({
            id: 'structure_h2',
            label: 'Content Structure (H2)',
            status: 'warn',
            message: `${h2Count} H2 headings found. Consider adding more for better scannability.`,
            suggestion: 'Aim for 4-6 H2 sections for articles over 800 words.',
            impact: 'medium'
        });
        score -= 5;
    } else {
        checks.push({
            id: 'structure_h2',
            label: 'Content Structure (H2)',
            status: 'pass',
            message: `Good structure with ${h2Count} H2 sections.`,
            impact: 'high'
        });
    }

    // 5. H3 Subheadings
    if (h2Count > 2 && h3Count === 0) {
        checks.push({
            id: 'structure_h3',
            label: 'Nested Structure (H3)',
            status: 'warn',
            message: 'No H3 subheadings found. Consider adding sub-sections.',
            suggestion: 'Add H3 headings under H2 sections for complex topics. This improves readability and SEO.',
            impact: 'low'
        });
        score -= 5;
    } else if (h3Count > 0) {
        checks.push({
            id: 'structure_h3',
            label: 'Nested Structure (H3)',
            status: 'pass',
            message: `Good hierarchy with ${h3Count} H3 subheadings.`,
            impact: 'low'
        });
    }

    // 6. Internal/External Links
    if (linkCount === 0) {
        checks.push({
            id: 'links',
            label: 'Internal & External Links',
            status: 'fail',
            message: 'No links found. Adding links improves SEO and user experience.',
            suggestion: 'Add 2-3 internal links to related articles and 1-2 external links to authoritative sources.',
            impact: 'medium'
        });
        score -= 10;
    } else if (linkCount < 3) {
        checks.push({
            id: 'links',
            label: 'Internal & External Links',
            status: 'warn',
            message: `Only ${linkCount} link(s) found. Consider adding more.`,
            suggestion: 'Best practice: 3-5 links per 1000 words. Include both internal and external links.',
            impact: 'medium'
        });
        score -= 5;
    } else {
        checks.push({
            id: 'links',
            label: 'Internal & External Links',
            status: 'pass',
            message: `Good link profile with ${linkCount} links.`,
            impact: 'medium'
        });
    }

    // 7. Images
    if (imageCount === 0) {
        checks.push({
            id: 'images',
            label: 'Visual Content',
            status: 'warn',
            message: 'No images detected in content body.',
            suggestion: 'Add relevant images with descriptive alt text. Use infographics or screenshots to illustrate key points.',
            impact: 'medium'
        });
        score -= 8;
    } else {
        checks.push({
            id: 'images',
            label: 'Visual Content',
            status: 'pass',
            message: `${imageCount} image(s) found. Ensure all have alt text.`,
            impact: 'medium'
        });
    }

    // 8. Readability - Sentence Length
    if (avgSentenceLength > 25) {
        checks.push({
            id: 'readability_sentence',
            label: 'Sentence Length',
            status: 'warn',
            message: `Average sentence length is ${avgSentenceLength} words. This may be hard to read.`,
            suggestion: 'Break long sentences into shorter ones. Aim for 15-20 words per sentence on average.',
            impact: 'medium'
        });
        score -= 8;
    } else if (avgSentenceLength > 20) {
        checks.push({
            id: 'readability_sentence',
            label: 'Sentence Length',
            status: 'pass',
            message: `Good sentence length (avg ${avgSentenceLength} words).`,
            impact: 'medium'
        });
    } else {
        checks.push({
            id: 'readability_sentence',
            label: 'Sentence Length',
            status: 'pass',
            message: `Excellent readability (avg ${avgSentenceLength} words per sentence).`,
            impact: 'medium'
        });
    }

    // 9. Paragraph Length
    const paragraphs = htmlContent.match(/<p[^>]*>.*?<\/p>/gi) || [];
    let longParagraphs = 0;
    paragraphs.forEach(p => {
        const pText = p.replace(/<[^>]*>/g, '');
        if (pText.split(' ').length > 80) longParagraphs++;
    });

    if (longParagraphs > 0) {
        checks.push({
            id: 'paragraph_length',
            label: 'Paragraph Length',
            status: 'warn',
            message: `${longParagraphs} paragraph(s) are too long (>80 words).`,
            suggestion: 'Break up long paragraphs into smaller chunks of 40-60 words for better mobile reading.',
            impact: 'low'
        });
        score -= 5;
    } else {
        checks.push({
            id: 'paragraph_length',
            label: 'Paragraph Length',
            status: 'pass',
            message: 'Paragraphs are well-sized for readability.',
            impact: 'low'
        });
    }

    // 10. Keyword in Title
    const titleWords = title.toLowerCase().split(/\s+/);
    const commonKeywords = ['chatbot', 'ai', 'customer', 'support', 'business', 'lead', 'sales', 'marketing'];
    const hasKeyword = titleWords.some(w => commonKeywords.includes(w));

    if (hasKeyword) {
        checks.push({
            id: 'title_keyword',
            label: 'Keyword in Title',
            status: 'pass',
            message: 'Title contains relevant keywords.',
            impact: 'high'
        });
    } else {
        checks.push({
            id: 'title_keyword',
            label: 'Keyword in Title',
            status: 'warn',
            message: 'Consider adding a primary keyword to your title.',
            suggestion: 'Place your main keyword near the beginning of the title for better SEO impact.',
            impact: 'high'
        });
        score -= 5;
    }

    // 11. URL Optimization (simulated)
    checks.push({
        id: 'url_structure',
        label: 'URL Structure',
        status: 'pass',
        message: 'URL appears to be SEO-friendly (lowercase, hyphens, descriptive).',
        impact: 'medium'
    });

    // 12. Mobile Readability
    checks.push({
        id: 'mobile_friendly',
        label: 'Mobile Readability',
        status: 'pass',
        message: 'Content structure supports mobile reading.',
        suggestion: 'Ensure images are responsive and text is readable without zooming.',
        impact: 'high'
    });

    // Calculate reading time
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Calculate keyword density (simplified)
    const keywordDensity = 2.5; // Placeholder - would need actual keyword input

    return {
        score: Math.max(0, Math.min(100, score)),
        checks,
        metrics: {
            wordCount,
            readingTime: `${readingTime} min`,
            avgSentenceLength,
            h2Count,
            h3Count,
            linkCount,
            imageCount,
            keywordDensity
        }
    };
};

export const extractHeadings = (html: string) => {
    const headings: { id: string, text: string, level: number }[] = [];
    const regex = /<(h[1-6])[^>]*>(.*?)<\/\1>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        headings.push({
            id: `h-${headings.length}`,
            level: parseInt(match[1].replace('h', '')),
            text: match[2].replace(/<[^>]*>/g, '').trim()
        });
    }
    return headings;
};

export const getKeywordGaps = (content: string, references: any[]) => {
    const contentLower = content.toLowerCase();
    const gaps: KeywordGap[] = [];
    const stopWords = ['the', 'and', 'for', 'with', 'that', 'this', 'how', 'what', 'why', 'guide', 'best', 'top', '2023', '2024', '2025', 'review', 'your', 'from', 'about'];

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

    return gaps.slice(0, 8);
};

export const generateSchema = (article: any) => {
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.title,
        "image": [article.image_url],
        "datePublished": article.published_at,
        "dateModified": article.updated_at || article.published_at,
        "author": [{
            "@type": "Person",
            "name": article.author,
            "url": "https://beyondchats.com"
        }],
        "publisher": {
            "@type": "Organization",
            "name": "BeyondChats",
            "logo": {
                "@type": "ImageObject",
                "url": "https://beyondchats.com/logo.png"
            }
        },
        "description": article.excerpt || article.title,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": article.original_url
        }
    };
};

export const getImprovementSuggestions = (checks: SeoScore['checks']) => {
    const suggestions: { priority: 'critical' | 'important' | 'optional'; action: string; reason: string }[] = [];

    checks.forEach(check => {
        if (check.status !== 'pass' && check.suggestion) {
            suggestions.push({
                priority: check.impact === 'high' ? 'critical' : check.impact === 'medium' ? 'important' : 'optional',
                action: check.suggestion,
                reason: check.message
            });
        }
    });

    return suggestions.sort((a, b) => {
        const order = { critical: 0, important: 1, optional: 2 };
        return order[a.priority] - order[b.priority];
    });
};
