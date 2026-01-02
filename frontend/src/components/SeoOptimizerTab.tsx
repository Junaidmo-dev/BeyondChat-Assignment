import React, { useMemo, useState } from 'react';
import { analyzeSeo, extractHeadings, getKeywordGaps, generateSchema } from '@/lib/seoAnalysis';
import { CheckCircle, AlertTriangle, XCircle, Search, FileCode, BarChart2, List, Clipboard, Download, Sparkles, ChevronRight, Share2 } from 'lucide-react';

interface SeoTabProps {
    article: any;
    content: string;
}

const SeoOptimizerTab: React.FC<SeoTabProps> = ({ article, content }) => {

    const analysis = useMemo(() => {
        // Prefer AI-generated Analysis if available
        if (article.enhanced_version?.seo_analysis) {
            return {
                score: article.enhanced_version.seo_analysis.score,
                checks: article.enhanced_version.seo_analysis.checklist.map((c: any, i: number) => ({
                    id: `ai-check-${i}`,
                    label: c.label,
                    status: c.status,
                    message: c.message
                }))
            };
        }
        // Fallback to local analysis
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

    const [copied, setCopied] = useState(false);

    const copySchema = () => {
        navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-purple-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-200">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">AI Optimization Report</h2>
                        <p className="text-sm font-medium text-purple-600">Generated for "{article.title}"</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Scorecard & Checklist */}
                <div className="lg:col-span-2 space-y-8">

                    {/* 1. Scorecard */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full translate-x-32 -translate-y-32 opacity-50 blur-3xl" />

                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">SEO Health Score</h3>
                                <p className="text-gray-500 max-w-sm leading-relaxed">
                                    Your content is performing <span className="font-bold text-gray-900">{analysis.score > 80 ? 'excellently' : 'averagely'}</span>.
                                    Follow the checklist below to improve rankings.
                                </p>
                            </div>
                            <div className="relative w-24 h-24 flex items-center justify-center">
                                {/* Simple Circular Progress (SVG) */}
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="48" cy="48" r="40" stroke="#f3f4f6" strokeWidth="8" fill="transparent" />
                                    <circle
                                        cx="48" cy="48" r="40"
                                        stroke={analysis.score > 80 ? '#10b981' : analysis.score > 50 ? '#eab308' : '#ef4444'}
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray={251.2}
                                        strokeDashoffset={251.2 - (251.2 * analysis.score) / 100}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <span className="absolute text-2xl font-black text-gray-900">{analysis.score}</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Audit Checklist */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-gray-400">
                                    <List size={18} />
                                </div>
                                <h3 className="font-bold text-gray-900">Optimization Checklist</h3>
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{analysis.checks.filter(c => c.status === 'pass').length} / {analysis.checks.length} PASSED</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {analysis.checks.map((check) => (
                                <div key={check.id} className="p-6 flex items-start gap-5 hover:bg-gray-50/30 transition-colors group">
                                    <div className="mt-1 flex-shrink-0">
                                        {check.status === 'pass' && <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle size={14} strokeWidth={3} /></div>}
                                        {check.status === 'warn' && <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center"><AlertTriangle size={14} strokeWidth={3} /></div>}
                                        {check.status === 'fail' && <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><XCircle size={14} strokeWidth={3} /></div>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h5 className={`font-bold text-sm ${check.status === 'pass' ? 'text-gray-900' : 'text-gray-900'}`}>{check.label}</h5>
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${check.status === 'pass' ? 'bg-green-50 text-green-600' :
                                                check.status === 'warn' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
                                                }`}>
                                                {check.status === 'pass' ? 'Perfect' : check.status === 'warn' ? 'Improve' : 'Critical'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium leading-relaxed">{check.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Keyword Gaps */}
                    {gaps.length > 0 && (
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl shadow-lg shadow-blue-200 text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full translate-x-20 -translate-y-20 blur-3xl" />

                            <div className="p-8 relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                                        <BarChart2 size={20} className="text-white" />
                                    </div>
                                    <h3 className="font-bold text-lg">Keyword Opportunities</h3>
                                </div>

                                <p className="text-blue-100 text-sm mb-6 font-medium leading-relaxed opacity-90">
                                    Our AI detected these high-impact keywords in top-ranking competitor articles. Adding them could boost your visibility.
                                </p>

                                <div className="flex flex-wrap gap-2.5">
                                    {gaps.map((gap, i) => (
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

                    {/* 4. SERP Preview */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                            <Search size={18} className="text-gray-400" />
                            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Search Preview</h3>
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
                                    <div className="ml-auto text-gray-400">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                                    </div>
                                </div>
                                <div className="text-xl text-[#1a0dab] hover:underline truncate font-medium mb-1">
                                    {article.title}
                                </div>
                                <div className="text-sm text-[#4d5156] line-clamp-2 leading-relaxed">
                                    {article.published_at} — {article.excerpt || "Learn more about this topic with our in-depth analysis and expert insights generated by AI."}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. Heading Structure */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                            <List size={18} className="text-gray-400" />
                            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Structure Map</h3>
                        </div>
                        <div className="p-6 max-h-[350px] overflow-y-auto custom-scrollbar">
                            <ul className="space-y-3 relative">
                                {headings.length === 0 && <li className="text-gray-400 italic text-sm">No headings detected.</li>}
                                {headings.map((h, i) => (
                                    <li key={h.id} className="text-sm text-gray-600 truncate flex items-center gap-3 group relative" style={{ paddingLeft: `${(h.level - 1) * 16}px` }}>
                                        {i !== headings.length - 1 && <div className="absolute left-[7px] top-6 bottom-[-12px] w-px bg-gray-100" style={{ left: `${(h.level - 1) * 16 + 7}px` }} />}
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

                    {/* 6. Schema Generator */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileCode size={18} className="text-gray-400" />
                                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">JSON-LD Schema</h3>
                            </div>
                            <button onClick={copySchema} className="text-xs flex items-center gap-1.5 font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors border border-purple-100">
                                {copied ? <CheckCircle size={14} /> : <Clipboard size={14} />}
                                {copied ? 'Copied' : 'Copy Code'}
                            </button>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none group-hover:hidden" />
                            <pre className="bg-[#1e1e1e] text-gray-300 text-[10px] p-6 overflow-x-auto font-mono custom-scrollbar h-48">
                                {JSON.stringify(schema, null, 2)}
                            </pre>
                            <div className="absolute bottom-4 right-4 hidden group-hover:block animate-in fade-in slide-in-from-bottom-2">
                                <button onClick={copySchema} className="p-2 bg-white text-gray-900 rounded-lg shadow-xl hover:scale-105 transition-transform">
                                    <Clipboard size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Mini Component for SVG Plus
const PlusIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
)

export default SeoOptimizerTab;
