export interface Article {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    author: string;
    published_at: string;
    image_url: string;
    original_url: string;
    status: 'draft' | 'published';
    tags: string[];
    read_time: string;
    views: number;
    enhanced_version?: {
        content: string;
        summary: string;
        references: { title: string; url?: string; link?: string }[];
        generated_at: string;
        seo_analysis?: {
            score: number;
            checklist: { label: string; status: 'pass' | 'fail' | 'warn'; message: string }[];
            keyword_gaps: string[];
        };
    };
}

export const mockArticles: Article[] = [
    {
        id: 1,
        title: "The Future of Conversational AI in Customer Support",
        slug: "future-conversational-ai-customer-support",
        excerpt: "Artificial intelligence is rapidly transforming the customer service landscape. From automated chatbots to predictive analytics...",
        content: `
      <h2>The Impact on Efficiency</h2>
      <p>Artificial intelligence is rapidly transforming the customer service landscape. From automated chatbots to predictive analytics, companies are leveraging these tools to improve efficiency and customer satisfaction. The days of waiting on hold for 45 minutes to reset a password are numbered, thanks to the advent of sophisticated Large Language Models (LLMs).</p>
      <p>One of the most significant benefits of conversational AI is its ability to handle a high volume of inquiries simultaneously without fatigue. Unlike human agents who can only handle one chat at a time, an AI powered system can manage thousands of conversations concurrently.</p>
      <h2>Personalization at Scale</h2>
      <p>Modern AI systems can analyze user data in real-time to provide highly personalized recommendations and solutions. This level of personalization was previously impossible to achieve at scale.</p>
    `,
        author: "Jane Doe",
        published_at: "Oct 24, 2023",
        image_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1000",
        original_url: "https://beyondchats.com/blogs/future-ai",
        status: "published",
        tags: ["Artificial Intelligence", "Customer Experience"],
        read_time: "8 min read",
        views: 1240,
        enhanced_version: {
            content: `
        <h2>The Impact on Efficiency & ROI</h2>
        <p>Artificial Intelligence (AI) is fundamentally reshaping the customer service landscape, driving unprecedented levels of efficiency and customer satisfaction. By integrating automated chatbots and predictive analytics, enterprises are not only reducing operational costs but also enhancing the user experience. The era of prolonged wait times for routine tasks, such as password resets, is effectively over, driven by the emergence of sophisticated Large Language Models (LLMs).</p>
        <p class="highlight">One of the most transformative advantages of conversational AI is its capacity for massive scalability. Unlike human agents, who are constrained by linear processing capabilities, AI systems can process and resolve thousands of inquiries concurrently with zero latency.</p>
        <h2>Hyper-Personalization at Scale</h2>
        <p>Advanced AI algorithms now possess the capability to analyze vast datasets in real-time, delivering hyper-personalized recommendations and solutions. This allows businesses to offer a bespoke customer journey that was previously unattainable, fostering deeper brand loyalty.</p>
      `,
            summary: "AI is revolutionizing customer support by enabling massive scalability and hyper-personalization, significantly reducing wait times and operational costs.",
            references: [
                { title: "The State of AI in 2023 - McKinsey", url: "https://mckinsey.com" },
                { title: "Customer Service Trends - Forbes", url: "https://forbes.com" }
            ],
            generated_at: "2023-10-25 10:00:00"
        }
    },
    {
        id: 2,
        title: "Optimizing Chatbot Responses for ROI",
        slug: "optimizing-chatbot-responses-roi",
        excerpt: "Learn how to fine-tune your AI model to deliver better customer support outcomes by analyzing conversation logs...",
        content: "<p>Chatbots are only as good as their training data. In this article, we explore strategies to optimize response quality.</p>",
        author: "Tom Cook",
        published_at: "Oct 24, 2023",
        image_url: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&q=80&w=1000",
        original_url: "https://beyondchats.com/blogs/chatbot-roi",
        status: "published",
        tags: ["Chatbots", "ROI"],
        read_time: "5 min read",
        views: 856
    },
    {
        id: 3,
        title: "Understanding AI Ethics in 2024",
        slug: "understanding-ai-ethics-2024",
        excerpt: "A deep dive into the ethical considerations of deploying large language models in enterprise environments...",
        content: "<p>As AI becomes more prevalent, ethical considerations such as bias and transparency become critical.</p>",
        author: "Sarah Smith",
        published_at: "Sep 12, 2023",
        image_url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1000",
        original_url: "https://beyondchats.com/blogs/ai-ethics",
        status: "published",
        tags: ["Ethics", "AI Safety"],
        read_time: "12 min read",
        views: 2100
    },
    {
        id: 4,
        title: "Remote Work Strategies",
        slug: "remote-work-strategies",
        excerpt: "Effective strategies for managing remote teams and maintaining productivity without sacrificing work-life balance.",
        content: "<p>Remote work is here to stay. key strategies include asynchronous communication and clear goal setting.</p>",
        author: "Mike Johnson",
        published_at: "Aug 29, 2023",
        image_url: "https://images.unsplash.com/photo-1593642532973-d31b6557fa68?auto=format&fit=crop&q=80&w=1000",
        original_url: "https://beyondchats.com/blogs/remote-work",
        status: "published",
        tags: ["Remote Work", "Management"],
        read_time: "6 min read",
        views: 940
    },
    {
        id: 5,
        title: "Designing for Voice Interfaces",
        slug: "designing-voice-interfaces",
        excerpt: "Best practices for creating intuitive voice-first user experiences in smart home applications.",
        content: "<p>Voice interfaces require a different design approach than visual UIs. Conversational flow is key.</p>",
        author: "Emily Chen",
        published_at: "Jul 30, 2023",
        image_url: "https://images.unsplash.com/photo-1589254065878-42c9da9e2059?auto=format&fit=crop&q=80&w=1000",
        original_url: "https://beyondchats.com/blogs/voice-ui",
        status: "published",
        tags: ["Voice UI", "UX Design"],
        read_time: "7 min read",
        views: 1532
    }
];
