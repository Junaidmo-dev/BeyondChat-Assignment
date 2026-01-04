import React, { useMemo, useState } from 'react';
import { analyzeSeo, extractHeadings, getKeywordGaps, generateSchema, getImprovementSuggestions } from '@/lib/seoAnalysis';
import { CheckCircle, AlertTriangle, XCircle, Search, FileCode, BarChart2, List, Clipboard, Download, Sparkles, Share2, TrendingUp, Clock, FileText, Link2, Image, Lightbulb, ArrowRight, Target, Zap } from 'lucide-react';

interface SeoTabProps {
    article: any;
    content: string;
}

const SeoOptimizerTab: React.FC<SeoTabProps> = ({ article, content }) => {

    const analysis = useMemo(() => {
        if (article.enhanced_version?.seo_analysis) {
            return {
                score: article.enhanced_version.seo_analysis.score,
                checks: article.enhanced_version.seo_analysis.checklist.map((c: any, i: number) => ({
                    id: `ai-check-${i}`,
                    label: c.label,
                    status: c.status,
                    message: c.message,
                    suggestion: c.suggestion,
                    impact: c.impact || 'medium'
                })),
                metrics: article.enhanced_version.seo_analysis.metrics || null
            };
        }
        return analyzeSeo(content, article.title, article.enhanced_version?.references || []);
    }, [content, article.title, article.enhanced_version]);

    const headings = useMemo(() => extractHeadings(content), [content]);
    const gaps = useMemo(() => {
        if (article.enhanced_version?.seo_analysis?.keyword_gaps) {
            return article.enhanced_version.seo_analysis.keyword_gaps.map((k: string) => ({ keyword: k, source: 'AI Suggestion' }));
        }
        return getKeywordGaps(content, article.enhanced_version?.references || []);
    }, [content, article.enhanced_version]);

    const schema = useMemo(() => generateSchema(article), [article]);
    const suggestions = useMemo(() => getImprovementSuggestions(analysis.checks), [analysis.checks]);

    const [copied, setCopied] = useState(false);
    const [activeSection, setActiveSection] = useState<'overview' | 'checklist' | 'suggestions'>('overview');

    const copySchema = () => {
        navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50' };
        if (score >= 60) return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50' };
        return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' };
    };

    const scoreColors = getScoreColor(analysis.score);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-purple-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-200">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">SEO Optimization Report</h2>
                        <p className="text-sm font-medium text-purple-600">Detailed analysis for "{article.title.substring(0, 40)}..."</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 bg-white text-gray-700 font-bold text-sm rounded-xl border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-2">
                        <Share2 size={16} />
                        Share
                    </button>
                    <button className="px-5 py-2.5 bg-purple-600 text-white font-bold text-sm rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center gap-2">
                        <Download size={16} />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                {[
                    { id: 'overview', label: 'Overview', icon: BarChart2 },
                    { id: 'checklist', label: 'Full Checklist', icon: List },
                    { id: 'suggestions', label: 'Improvements', icon: Lightbulb }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id as any)}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeSection === tab.id
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Main Content */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Score Card with Metrics */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full translate-x-32 -translate-y-32 opacity-50 blur-3xl" />

                        <div className="flex items-start justify-between relative z-10 mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">SEO Health Score</h3>
                                <p className="text-gray-500 max-w-sm leading-relaxed">
                                    {analysis.score >= 80
                                        ? '🎉 Excellent! Your content is well-optimized for search engines.'
                                        : analysis.score >= 60
                                            ? '⚡ Good progress! A few improvements can boost your rankings.'
                                            : '🔧 Needs work. Follow the suggestions below to improve.'}
                                </p>
                            </div>
                            <div className="relative w-28 h-28 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="56" cy="56" r="48" stroke="#f3f4f6" strokeWidth="10" fill="transparent" />
                                    <circle
                                        cx="56" cy="56" r="48"
                                        stroke={analysis.score > 80 ? '#10b981' : analysis.score > 50 ? '#eab308' : '#ef4444'}
                                        strokeWidth="10"
                                        fill="transparent"
                                        strokeDasharray={301.6}
                                        strokeDashoffset={301.6 - (301.6 * analysis.score) / 100}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-3xl font-black text-gray-900">{analysis.score}</span>
                                    <span className="text-xs text-gray-400 font-bold">/100</span>
                                </div>
                            </div>
                        </div>

                        {/* Metrics Dashboard */}
                        {analysis.metrics && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                                        <FileText size={14} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Words</span>
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">{analysis.metrics.wordCount}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                                        <Clock size={14} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Read Time</span>
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">{analysis.metrics.readingTime}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                                        <List size={14} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Sections</span>
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">{analysis.metrics.h2Count + analysis.metrics.h3Count}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                                        <Link2 size={14} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Links</span>
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">{analysis.metrics.linkCount}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Conditional Content Based on Active Section */}
                    {activeSection === 'overview' && (
                        <>
                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
                                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle size={20} />
                                    </div>
                                    <p className="text-3xl font-black text-green-700">{analysis.checks.filter((c: any) => c.status === 'pass').length}</p>
                                    <p className="text-sm font-bold text-green-600">Passed</p>
                                </div>
                                <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5 text-center">
                                    <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mx-auto mb-3">
                                        <AlertTriangle size={20} />
                                    </div>
                                    <p className="text-3xl font-black text-yellow-700">{analysis.checks.filter((c: any) => c.status === 'warn').length}</p>
                                    <p className="text-sm font-bold text-yellow-600">Warnings</p>
                                </div>
                                <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
                                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                                        <XCircle size={20} />
                                    </div>
                                    <p className="text-3xl font-black text-red-700">{analysis.checks.filter((c: any) => c.status === 'fail').length}</p>
                                    <p className="text-sm font-bold text-red-600">Critical</p>
                                </div>
                            </div>

                            {/* Top Priority Issues */}
                            {suggestions.filter(s => s.priority === 'critical').length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                            <Zap size={18} />
                                        </div>
                                        <h3 className="font-bold text-red-800">Critical Issues to Fix</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {suggestions.filter(s => s.priority === 'critical').slice(0, 3).map((s, i) => (
                                            <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-red-100">
                                                <ArrowRight size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{s.action}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{s.reason}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {activeSection === 'checklist' && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-gray-400">
                                        <List size={18} />
                                    </div>
                                    <h3 className="font-bold text-gray-900">Complete SEO Audit ({analysis.checks.length} checks)</h3>
                                </div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    {analysis.checks.filter((c: any) => c.status === 'pass').length} / {analysis.checks.length} PASSED
                                </span>
                            </div>
                            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                                {analysis.checks.map((check: any) => (
                                    <div key={check.id} className="p-6 hover:bg-gray-50/30 transition-colors group">
                                        <div className="flex items-start gap-5">
                                            <div className="mt-1 flex-shrink-0">
                                                {check.status === 'pass' && <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle size={14} strokeWidth={3} /></div>}
                                                {check.status === 'warn' && <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center"><AlertTriangle size={14} strokeWidth={3} /></div>}
                                                {check.status === 'fail' && <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><XCircle size={14} strokeWidth={3} /></div>}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h5 className="font-bold text-sm text-gray-900">{check.label}</h5>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${check.impact === 'high' ? 'bg-purple-50 text-purple-600' :
                                                                check.impact === 'medium' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'
                                                            }`}>
                                                            {check.impact} impact
                                                        </span>
                                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${check.status === 'pass' ? 'bg-green-50 text-green-600' :
                                                                check.status === 'warn' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
                                                            }`}>
                                                            {check.status === 'pass' ? 'Perfect' : check.status === 'warn' ? 'Improve' : 'Critical'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-500 font-medium leading-relaxed">{check.message}</p>
                                                {check.suggestion && check.status !== 'pass' && (
                                                    <div className="mt-3 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
                                                        <Lightbulb size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                                        <p className="text-xs text-blue-700 font-medium">{check.suggestion}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === 'suggestions' && (
                        <div className="space-y-6">
                            {/* Prioritized Suggestions */}
                            {['critical', 'important', 'optional'].map(priority => {
                                const items = suggestions.filter(s => s.priority === priority);
                                if (items.length === 0) return null;

                                return (
                                    <div key={priority} className={`rounded-2xl border p-6 ${priority === 'critical' ? 'bg-red-50 border-red-200' :
                                            priority === 'important' ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                                        }`}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`p-2 rounded-lg ${priority === 'critical' ? 'bg-red-100 text-red-600' :
                                                    priority === 'important' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-500'
                                                }`}>
                                                {priority === 'critical' ? <Zap size={18} /> : priority === 'important' ? <Target size={18} /> : <Lightbulb size={18} />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 capitalize">{priority} Improvements</h3>
                                                <p className="text-xs text-gray-500">{items.length} action{items.length > 1 ? 's' : ''} recommended</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {items.map((s, i) => (
                                                <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100">
                                                    <ArrowRight size={16} className={`mt-0.5 flex-shrink-0 ${priority === 'critical' ? 'text-red-500' :
                                                            priority === 'important' ? 'text-yellow-500' : 'text-gray-400'
                                                        }`} />
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{s.action}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{s.reason}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {suggestions.length === 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                                    <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-green-800 mb-2">Excellent Work!</h3>
                                    <p className="text-green-600">Your content passes all SEO checks. Keep up the great work!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Keyword Gaps */}
                    {gaps.length > 0 && activeSection === 'overview' && (
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl shadow-lg shadow-blue-200 text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full translate-x-20 -translate-y-20 blur-3xl" />

                            <div className="p-8 relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                                        <TrendingUp size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Keyword Opportunities</h3>
                                        <p className="text-blue-200 text-xs">Based on competitor analysis</p>
                                    </div>
                                </div>

                                <p className="text-blue-100 text-sm mb-6 font-medium leading-relaxed opacity-90">
                                    These high-impact keywords appear in top-ranking competitor articles but are missing from your content.
                                </p>

                                <div className="flex flex-wrap gap-2.5">
                                    {gaps.map((gap: any, i: number) => (
                                        <div key={i} className="group relative">
                                            <span className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-sm font-bold backdrop-blur-sm group-hover:bg-white group-hover:text-blue-600 transition-all cursor-default flex items-center gap-2">
                                                <PlusIcon /> {gap.keyword}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: SERP Preview & Schema */}
                <div className="space-y-8">

                    {/* SERP Preview */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                            <Search size={18} className="text-gray-400" />
                            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Google Preview</h3>
                        </div>
                        <div className="p-6">
                            <div className="font-sans bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                <div className="text-xs text-[#202124] mb-1.5 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 p-1">
                                        <img src="https://www.google.com/favicon.ico" alt="G" className="w-full h-full opacity-50" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-[#202124] leading-none">BeyondChats</span>
                                        <span className="text-[#5f6368] text-[10px] truncate">https://beyondchats.com › blog › articles</span>
                                    </div>
                                </div>
                                <div className="text-xl text-[#1a0dab] hover:underline truncate font-medium mb-1">
                                    {article.title}
                                </div>
                                <div className="text-sm text-[#4d5156] line-clamp-2 leading-relaxed">
                                    {article.excerpt || "Learn more about this topic with AI-powered insights..."}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Heading Structure */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                            <List size={18} className="text-gray-400" />
                            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Content Outline</h3>
                        </div>
                        <div className="p-6 max-h-[300px] overflow-y-auto custom-scrollbar">
                            <ul className="space-y-3 relative">
                                {headings.length === 0 && <li className="text-gray-400 italic text-sm">No headings detected.</li>}
                                {headings.map((h: any) => (
                                    <li key={h.id} className="text-sm text-gray-600 truncate flex items-center gap-3 group" style={{ paddingLeft: `${(h.level - 1) * 16}px` }}>
                                        <span className={`flex-shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded border ${h.level === 1 ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                h.level === 2 ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                                    'bg-white text-gray-400 border-gray-100'
                                            }`}>H{h.level}</span>
                                        <span className="group-hover:text-purple-600 transition-colors">{h.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Schema Generator */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileCode size={18} className="text-gray-400" />
                                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">JSON-LD Schema</h3>
                            </div>
                            <button onClick={copySchema} className="text-xs flex items-center gap-1.5 font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors border border-purple-100">
                                {copied ? <CheckCircle size={14} /> : <Clipboard size={14} />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <div className="relative group">
                            <pre className="bg-[#1e1e1e] text-gray-300 text-[10px] p-6 overflow-x-auto font-mono custom-scrollbar h-40">
                                {JSON.stringify(schema, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PlusIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
)

export default SeoOptimizerTab;
