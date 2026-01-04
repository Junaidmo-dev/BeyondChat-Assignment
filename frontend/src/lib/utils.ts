import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getApiUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    // Remove trailing slash if present
    const cleanUrl = baseUrl.replace(/\/$/, '');
    // Append /api/v1 if not present
    if (!cleanUrl.endsWith('/api/v1')) {
        return `${cleanUrl}/api/v1`;
    }
    return cleanUrl;
}
