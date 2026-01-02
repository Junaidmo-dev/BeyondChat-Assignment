<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Article;
use Carbon\Carbon;

class ArticleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * populates with realistic "BeyondChats" style blog posts
     */
    public function run(): void
    {
        $articles = [
            [
                'title' => 'The Future of Chatbots in Customer Support',
                'excerpt' => 'Discover how AI-driven chatbots are revolutionizing the way businesses interact with customers.',
                'content' => '<p>Customer support is evolving rapidly. Gone are the days of waiting on hold for hours. Today, <strong>AI chatbots</strong> are taking center stage, offering instant responses and running 24/7.</p><p>This shift is not just about speed; it is about efficiency. Businesses using chatbots report a 30% reduction in operational costs.</p>',
                'original_url' => 'https://beyondchats.com/blogs/future-of-chatbots',
                'image_url' => 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a',
                'author' => 'Ritika Sankhla',
                'published_at' => Carbon::now()->subDays(5),
            ],
            [
                'title' => 'How to Optimize Your Chatbot for Lead Generation',
                'excerpt' => 'Turn your chatbot into a 24/7 sales machine with these simple optimization strategies.',
                'content' => '<p>Chatbots are not just for support; they are powerful marketing tools. By optimizing your chatbot scripts, you can qualify leads automatically.</p><p>Key strategies include personalized greetings, instant value offers, and seamless human handoff protocols.</p>',
                'original_url' => 'https://beyondchats.com/blogs/optimize-chatbot-leads',
                'image_url' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
                'author' => 'Devanshu',
                'published_at' => Carbon::now()->subDays(12),
            ],
            [
                'title' => 'Conversational Marketing: A Beginner\'s Guide',
                'excerpt' => 'A comprehensive guide to understanding conversational marketing and why it matters.',
                'content' => '<p>Conversational marketing is all about listening to your customers. It moves away from broadcast messages to one-on-one dialogues.</p><p>Platforms like WhatsApp and Messenger are leading this charge, allowing brands to build personal connections at scale.</p>',
                'original_url' => 'https://beyondchats.com/blogs/conversational-marketing-guide',
                'image_url' => 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
                'author' => 'Ritika Sankhla',
                'published_at' => Carbon::now()->subDays(20),
            ],
            [
                'title' => 'Top 5 Benefits of AI for Small Businesses',
                'excerpt' => 'AI is not just for tech giants. Small businesses can leverage AI to level the playing field.',
                'content' => '<p>Small businesses often operate with limited resources. AI tools can automate invoicing, schedule appointments, and even create content.</p><p>This article explores the top 5 accessible AI tools that can boost your productivity today.</p>',
                'original_url' => 'https://beyondchats.com/blogs/ai-benefits-small-business',
                'image_url' => 'https://images.unsplash.com/photo-1677442136019-21780ecad995',
                'author' => 'Guest Writer',
                'published_at' => Carbon::now()->subDays(25),
            ],
            [
                'title' => 'Understanding NLP: How Chatbots Understand You',
                'excerpt' => 'Demystifying Natural Language Processing (NLP) and its role in modern AI.',
                'content' => '<p>Have you ever wondered how Siri or Alexa understands your accent? The secret lies in Natural Language Processing (NLP).</p><p>NLP combines linguistics and computer science to help machines interpret human language, context, and intent.</p>',
                'original_url' => 'https://beyondchats.com/blogs/understanding-nlp',
                'image_url' => 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485',
                'author' => 'Tech Team',
                'published_at' => Carbon::now()->subDays(30),
            ]
        ];

        foreach ($articles as $data) {
            Article::updateOrCreate(
                ['title' => $data['title']], 
                array_merge($data, [
                    'slug' => \Illuminate\Support\Str::slug($data['title']),
                    'status' => 'published',
                    'tags' => ['AI', 'Chatbots', 'Tech'], // Placeholder tags
                    'views' => rand(100, 1000),
                    'read_time' => rand(3, 8) . ' min read',
                ])
            );
        }
    }
}
