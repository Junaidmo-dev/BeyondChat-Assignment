import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, FileText, BarChart2, Users, Settings, Bell, Search, Plus } from 'lucide-react';

// Utility function for conditional class names (similar to clsx or classnames)
function cn(...classes: (string | boolean | undefined | null)[]) {
    return classes.filter(Boolean).join(' ');
}

// Define menu items for the sidebar
const menuItems = [
    { name: 'Articles', href: '/', icon: FileText, active: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-gray-50/50 font-sans text-gray-900">
            {/* Sidebar Navigation */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 z-50 overflow-y-auto">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <span className="text-white font-black text-xl italic">B</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-gray-900">BeyondChats</span>
                    </div>

                    <nav className="space-y-1">
                        {menuItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium",
                                    item.active
                                        ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-50/50"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <item.icon size={20} className={cn(
                                    "transition-colors",
                                    item.active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-700"
                                )} />
                                <span className="text-sm">{item.name}</span>
                            </Link>
                        ))}
                    </nav>
                </div>


            </aside>

            {/* Main Content Area */}
            <div className="pl-64 flex-1">
                {/* Clean Header */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex-1 max-w-xl">
                        {/* Search Removed */}
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200">
                            <Plus size={18} />
                            <span>New Article</span>
                        </button>
                        <div className="h-8 w-px bg-gray-100 mx-2" />
                        {/* Notification Removed */}
                    </div>
                </header>

                {/* Content Container */}
                <main className="p-8 bg-gray-50 min-h-[calc(100vh-5rem)]">
                    {children}
                </main>
            </div>
        </div>
    );
}

function NavItem({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${active
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
        >
            <span className={`transition-colors ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                {icon}
            </span>
            {label}
        </Link>
    );
}
