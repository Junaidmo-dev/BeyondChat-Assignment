import Link from 'next/link';
import { getApiUrl } from '@/lib/utils';
import { Calendar, Sparkles, Loader2, Zap } from 'lucide-react';
import { Article } from '@/data/mockArticles';
import { useState } from 'react';

export default function ArticleCard({ article, onEnhance }: { article: Article, onEnhance?: () => void }) {
    const [isEnhanced, setIsEnhanced] = useState(!!article.enhanced_version);
    const [isEnhancing, setIsEnhancing] = useState(false);

    const handleEnhance = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isEnhancing || isEnhanced) return;

        setIsEnhancing(true);
        try {
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/articles/${article.id}/enhance`, {
                method: 'POST'
            });
            if (res.ok) {
                setIsEnhanced(true);
                if (onEnhance) onEnhance();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsEnhancing(false);
        }
    };

    return (
        <Link href={`/articles/${article.id}`} className="block group">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 h-full flex flex-col group-hover:border-blue-200">
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Badge */}
                    <div className="absolute top-3 right-3 flex gap-2">
                        {isEnhanced ? (
                            <span className="bg-white/90 backdrop-blur-sm shadow-sm text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-100 flex items-center gap-1 animate-in fade-in zoom-in">
                                <Sparkles size={10} />
                                AI Enhanced
                            </span>
                        ) : (
                            <button
                                onClick={handleEnhance}
                                className="bg-black/80 hover:bg-black text-white backdrop-blur-sm shadow-sm text-xs font-bold px-3 py-1 rounded-full border border-gray-800 flex items-center gap-1.5 transition-all hover:scale-105"
                            >
                                {isEnhancing ? (
                                    <>
                                        <Loader2 size={10} className="animate-spin" />
                                        Enhancing...
                                    </>
                                ) : (
                                    <>
                                        <Zap size={10} className="text-yellow-400" fill="currentColor" />
                                        Enhance Now
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                    {/* Source / Host */}
                    <div className="flex items-center gap-2 mb-2.5">
                        {article.image_url ? (
                            <img src={article.image_url} alt="" className="w-4 h-4 rounded-full object-cover ring-1 ring-gray-100" />
                        ) : (
                            <div className="w-4 h-4 rounded-full bg-blue-50 flex items-center justify-center text-[7px] font-bold text-blue-600 border border-blue-100 uppercase">
                                {article.author.charAt(0)}
                            </div>
                        )}
                        <span className="text-[11px] font-semibold text-gray-700 tracking-tight">{article.author}</span>
                        <span className="text-gray-300 text-[10px]">•</span>
                        <span className="text-[11px] text-gray-500 font-medium">{article.published_at?.split('T')[0] || 'Recently'}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-[1.3] group-hover:text-blue-600 transition-colors line-clamp-2">
                        {article.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed mb-4">
                        {article.excerpt}
                    </p>

                    {/* Tags - Minimal Pills */}
                    {article.tags && article.tags.length > 0 && (
                        <div className="mt-auto flex flex-wrap gap-1.5 pt-4 border-t border-gray-50">
                            {article.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100/50 uppercase tracking-wider">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
