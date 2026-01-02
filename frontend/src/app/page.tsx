"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ArticleCard from '@/components/ArticleCard';
import { Article } from '@/data/mockArticles';
import {
  FileText,
  Sparkles,
  TrendingUp,
  Download,
  Filter,
  Clock,
  RefreshCw,
  Plus,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/v1/articles')
      .then(res => res.json())
      .then(data => {
        setArticles(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const publishedArticles = articles.filter(a => a.status === 'published');

  return (
    <DashboardLayout>
      {/* Dashboard Header - Simplified & Clean */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Articles</h1>
          <p className="text-gray-500 font-medium text-sm">Manage and optimize your content library.</p>
        </div>

      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          title="Total Articles"
          value={publishedArticles.length.toString()}
          icon={FileText}
          trend="+12%"
          color="blue"
        />

        <StatCard
          title="AI Enhanced"
          value={publishedArticles.filter(a => a.enhanced_version).length.toString()}
          icon={RefreshCw}
          trend="+24%"
          color="emerald"
        />

      </div>

      {/* Content Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-8">
            <button className="text-sm font-bold text-gray-900 pb-5 border-b-2 border-blue-600 -mb-5 mt-1 transition-all">
              All Articles
            </button>
          </div>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-100 aspect-video rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : publishedArticles.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="mx-auto h-16 w-16 text-gray-300 mb-4 flex items-center justify-center">
                <FileText size={48} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No articles found</h3>
              <p className="text-sm text-gray-500 mb-6">Get started by creating your first article.</p>
              <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                Create Article
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {publishedArticles.map((article, idx) => (
                <div
                  key={article.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <ArticleCard article={article} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
  const isEmerald = color === 'emerald';
  const isBlue = color === 'blue';

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "p-2.5 rounded-xl transition-colors",
          isBlue ? "bg-blue-50 text-blue-600" :
            isEmerald ? "bg-emerald-50 text-emerald-600" :
              "bg-gray-50 text-gray-500"
        )}>
          <Icon size={20} />
        </div>
        <span className={cn(
          "text-[10px] font-black px-2 py-0.5 rounded-full",
          trend.startsWith('+') ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
        )}>
          {trend}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-gray-400 mb-1">{title}</span>
        <span className="text-2xl font-black text-gray-900 tracking-tight">{value}</span>
      </div>
    </div>
  );
}
