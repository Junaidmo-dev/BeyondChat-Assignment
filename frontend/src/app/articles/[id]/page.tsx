"use client";

import React, { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Article } from '@/data/mockArticles';
import { Calendar, Globe, Clock, ArrowLeft, RefreshCw, CheckCircle, Copy, Linkedin, Twitter, Facebook, Sparkles, Sliders } from 'lucide-react';
import Link from 'next/link';
import SeoOptimizerTab from '@/components/SeoOptimizerTab';
import { cn } from '@/lib/utils';

// Helper component for social icons
const SocialButton = ({ icon: Icon }: { icon: any }) => (
    <button className="hidden">
        <Icon size={20} />
    </button>
);

export default function ArticleDetailPage() {
    const params = useParams();
    const id = params?.id as string;

    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'original' | 'enhanced' | 'comparison' | 'seo'>('enhanced');
    const [syncScroll, setSyncScroll] = useState(true);

    useEffect(() => {
        if (!id) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
        fetch(`${apiUrl}/articles/${id}`)
            .then(res => res.json())
            .then(data => {
                setArticle(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="max-w-5xl mx-auto pt-20 flex flex-col items-center">
                    <RefreshCw size={40} className="animate-spin text-blue-600 mb-4" />
                    <p className="text-gray-500 font-medium">Loading article...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!article) {
        return (
            <DashboardLayout>
                <div className="text-center pt-20">Article not found</div>
            </DashboardLayout>
        );
    }

    const isEnhancedAvailable = !!article.enhanced_version;

    const cleanContent = (content: string) => {
        if (!content) return '';
        // Remove markdown code blocks if present
        let cleaned = content.trim();
        if (cleaned.startsWith('```html')) {
            cleaned = cleaned.replace(/^```html\n?/, '').replace(/\n?```$/, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }

        // AGGRESSIVE: Remove Markdown Heading Hashtags
        // Convert # Heading to <h1>Heading</h1>, ## to <h2> etc if they exist
        cleaned = cleaned.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
        cleaned = cleaned.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
        cleaned = cleaned.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
        cleaned = cleaned.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');

        return cleaned;
    };

    const currentContent = viewMode === 'original'
        ? article.content
        : cleanContent(article.enhanced_version?.content || article.content);

    return (
        <DashboardLayout>
            {viewMode === 'seo' ? (
                <div className="max-w-5xl mx-auto pb-10">
                    {/* Breadcrumb & Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Link href="/" className="hover:text-gray-900">Dashboard</Link>
                            <span>/</span>
                            <Link href="/" className="hover:text-gray-900">Articles</Link>
                            <span>/</span>
                            <span className="text-gray-900 font-medium truncate max-w-xs">{article.title}</span>
                            <span>/</span>
                            <span className="text-purple-600 font-bold">SEO Optimization</span>
                        </div>
                        {/* View Toggle (Quick Switch Back) */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('enhanced')}
                                className="px-4 py-2 bg-white text-gray-700 text-sm font-bold rounded-lg border border-gray-200 hover:bg-gray-50 shadow-sm"
                            >
                                Back to Article
                            </button>
                        </div>
                    </div>

                    <SeoOptimizerTab
                        article={article}
                        content={article.enhanced_version ? cleanContent(article.enhanced_version.content) : article.content}
                    />
                </div>
            ) : (
                <div className="max-w-5xl mx-auto pb-10">
                    {/* Breadcrumb & Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Link href="/" className="hover:text-gray-900">Dashboard</Link>
                            <span>/</span>
                            <Link href="/" className="hover:text-gray-900">Articles</Link>
                            <span>/</span>
                            <span className="text-gray-900 font-medium truncate max-w-xs">{article.title}</span>
                        </div>
                    </div>

                    {/* Main Content Layout */}
                    <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                        {/* Hero Image - Larger & Cleaner with Gradient */}
                        <div className="h-80 md:h-[500px] w-full relative group bg-gray-50">
                            <img
                                src={article.image_url}
                                alt={article.title}
                                className="w-full h-full object-cover"
                            />
                            {/* Subtle Overlay for Legibility */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60" />

                            {/* Enhanced Badge - Minimal Shimmer */}
                            <div className="absolute top-8 right-8 z-10">
                                {isEnhancedAvailable && (
                                    <span className="bg-white/95 backdrop-blur shadow-xl text-blue-700 font-bold text-[11px] tracking-widest px-5 py-2.5 rounded-2xl border border-blue-50 flex items-center gap-2.5 animate-in fade-in zoom-in duration-500">
                                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                                        AI ENHANCED
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* View Toggle - Clean Tabs with better active states */}
                        {isEnhancedAvailable && (
                            <div className="border-b border-gray-100 flex justify-center sticky top-0 bg-white/90 backdrop-blur-xl z-30 px-8">
                                <div className="flex gap-10">
                                    <button
                                        className={cn(
                                            "px-2 py-5 text-sm font-bold border-b-2 transition-all duration-300 relative",
                                            viewMode === 'original'
                                                ? 'border-gray-900 text-gray-900'
                                                : 'border-transparent text-gray-400 hover:text-gray-900'
                                        )}
                                        onClick={() => setViewMode('original')}
                                    >
                                        Original
                                    </button>
                                    <button
                                        className={cn(
                                            "px-2 py-5 text-sm font-bold border-b-2 transition-all duration-300 flex items-center gap-2",
                                            viewMode === 'enhanced'
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-400 hover:text-blue-600'
                                        )}
                                        onClick={() => setViewMode('enhanced')}
                                    >
                                        <Sparkles size={16} className={cn(viewMode === 'enhanced' ? 'text-blue-500' : 'text-gray-300')} />
                                        Enhanced
                                    </button>
                                    <button
                                        className={cn(
                                            "px-2 py-5 text-sm font-bold border-b-2 transition-all duration-300 flex items-center gap-2",
                                            viewMode === 'comparison'
                                                ? 'border-emerald-500 text-emerald-600'
                                                : 'border-transparent text-gray-400 hover:text-emerald-500'
                                        )}
                                        onClick={() => setViewMode('comparison')}
                                    >
                                        <Globe size={16} className={cn(viewMode === 'comparison' ? 'text-emerald-500' : 'text-gray-300')} />
                                        Comparison
                                    </button>
                                    <button
                                        className={cn(
                                            "px-2 py-5 text-sm font-bold border-b-2 transition-all duration-300 flex items-center gap-2",
                                            (viewMode as string) === 'seo'
                                                ? 'border-purple-600 text-purple-600'
                                                : 'border-transparent text-gray-400 hover:text-purple-600'
                                        )}
                                        onClick={() => setViewMode('seo')}
                                    >
                                        <Sliders size={16} className={cn((viewMode as string) === 'seo' ? 'text-purple-500' : 'text-gray-300')} />
                                        SEO
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Comparison Banner - Refined UI */}
                        {viewMode === 'comparison' && (
                            <div className="bg-gray-50/80 border-b border-gray-100 px-10 py-5 flex items-center justify-between backdrop-blur-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm text-emerald-600">
                                        <Globe size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Side-by-Side Review</h2>
                                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Draft • Auto-saving enabled</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                                        <input
                                            type="checkbox"
                                            id="sync-scroll"
                                            checked={syncScroll}
                                            onChange={(e) => setSyncScroll(e.target.checked)}
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-200"
                                        />
                                        <label htmlFor="sync-scroll" className="text-xs font-bold text-gray-600 cursor-pointer select-none">
                                            Sync Scroll
                                        </label>
                                    </div>
                                    <div className="h-8 w-px bg-gray-200" />
                                    <div className="flex items-center gap-2">
                                        <button className="px-5 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">Discard</button>
                                        <button className="px-6 py-2.5 bg-gray-900 text-white text-xs font-black rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-200 flex items-center gap-2">
                                            <CheckCircle size={14} />
                                            Merge & Publish
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={cn(
                            "p-10 md:p-16 lg:p-20",
                            viewMode === 'comparison' ? 'grid grid-cols-1 lg:grid-cols-2 gap-0' : ''
                        )}>
                            {viewMode === 'comparison' ? (
                                <>
                                    {/* Left Pane: Original */}
                                    <div className="pr-12 space-y-10 border-r border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-3 py-1 bg-gray-50 rounded-lg">Original Source</span>
                                            <span className="text-[10px] text-gray-400 font-bold tracking-tight">Last edited 2d ago</span>
                                        </div>
                                        <div className="prose prose-lg max-w-none text-gray-600 prose-headings:text-gray-900 prose-headings:font-black">
                                            <h2 className="text-4xl font-black text-gray-900 mb-8 leading-tight">{article.title}</h2>
                                            <div dangerouslySetInnerHTML={{ __html: article.content }} />
                                        </div>
                                    </div>

                                    {/* Right Pane: Enhanced */}
                                    <div className="pl-12 space-y-10">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 px-3 py-1 bg-blue-50 rounded-lg">AI Optimized Version</span>
                                            <span className="text-[10px] text-emerald-500 font-black flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-lg">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Active Session
                                            </span>
                                        </div>
                                        <div className="prose prose-lg max-w-none text-gray-900 prose-headings:text-gray-900 prose-headings:font-black prose-p:font-medium prose-p:text-gray-800">
                                            <h2 className="text-4xl font-black text-gray-900 mb-8 leading-tight">
                                                {article.title}
                                                <span className="inline-flex items-center ml-3 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-tighter shadow-sm border border-emerald-200">Refined Content</span>
                                            </h2>
                                            <div dangerouslySetInnerHTML={{ __html: cleanContent(article.enhanced_version?.content || article.content) }} />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Single View Mode (Normal) */}
                                    {/* Header Section */}
                                    <div className="mb-12 pb-12 border-b border-gray-100">
                                        <div className="flex flex-wrap items-center gap-2.5 mb-8">
                                            {article.tags?.map(tag => (
                                                <span key={tag} className="px-3.5 py-1.5 bg-gray-50 text-gray-500 text-[11px] font-black uppercase tracking-[0.15em] rounded-xl border border-gray-100/50">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-10 leading-[1.1] tracking-tight">
                                            {article.title}
                                        </h1>

                                        <div className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 flex items-center justify-center font-black text-xl shadow-sm border border-blue-50">
                                                    {article.author.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-gray-900 text-lg tracking-tight">{article.author}</span>
                                                    <div className="flex items-center gap-3 text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">
                                                        <span>{article.published_at}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-200" />
                                                        <span>5 MIN READ</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="hidden">
                                                <SocialButton icon={Twitter} />
                                                <SocialButton icon={Linkedin} />
                                                <SocialButton icon={Facebook} />
                                                <div className="w-px h-10 bg-gray-100 mx-2" />
                                                <SocialButton icon={Copy} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Enhanced AI Summary Box - Clean & Professional */}
                                    {viewMode === 'enhanced' && article.enhanced_version && (
                                        <div className="mb-12 p-8 md:p-10 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="p-3 bg-white text-blue-600 rounded-xl shadow-sm border border-gray-100">
                                                    <RefreshCw size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900">AI Analysis & Key Takeaways</h3>
                                                    <p className="text-gray-500 text-sm">Generated by Google Gemini</p>
                                                </div>
                                            </div>

                                            {/* Summary Quote */}
                                            <div className="text-xl md:text-2xl font-display text-gray-800 leading-relaxed mb-10 pl-6 border-l-4 border-blue-500">
                                                {article.enhanced_version.summary}
                                            </div>

                                            {/* References Section - Card Grid */}
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                    <Globe size={14} /> Citations & Sources
                                                </h4>
                                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {(article.enhanced_version.references || []).map((ref, idx) => (
                                                        <li key={idx}>
                                                            <a
                                                                href={ref.url || ref.link}
                                                                target="_blank"
                                                                className="flex items-start gap-4 h-full p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                                                            >
                                                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">
                                                                    {idx + 1}
                                                                </span>
                                                                <div className="flex-1 min-w-0">
                                                                    <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors block mb-1">
                                                                        {ref.title}
                                                                    </span>
                                                                    <span className="text-xs text-gray-400 truncate block">
                                                                        {ref.url || ref.link}
                                                                    </span>
                                                                </div>
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {/* Article Content - Optimized Typography */}
                                    <div className="prose prose-lg md:prose-xl max-w-none text-gray-700 prose-headings:font-black prose-headings:text-gray-900 prose-p:leading-[1.7] prose-img:rounded-3xl prose-img:shadow-2xl prose-img:shadow-gray-200 prose-img:my-16 prose-blockquote:border-l-8 prose-blockquote:border-blue-600 prose-blockquote:bg-blue-50/20 prose-blockquote:rounded-r-2xl prose-blockquote:py-8 prose-blockquote:px-10 prose-blockquote:not-italic prose-blockquote:text-gray-900 prose-blockquote:font-bold prose-a:text-blue-600 prose-a:font-bold prose-a:no-underline hover:prose-a:underline">
                                        <div dangerouslySetInnerHTML={{ __html: currentContent }} />
                                    </div>
                                </>
                            )}





                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}


