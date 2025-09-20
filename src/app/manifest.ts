import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Krushi - Harness the Power of Daily Effort',
        short_name: 'Krushi',
        description: 'Harness the power of your daily effort with Krushi, the minimalist app designed to help you focus on what truly matters: consistent progress.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#3b82f6',
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
        categories: ['productivity', 'utilities'],
        lang: 'en',
        orientation: 'portrait-primary',
    }
}