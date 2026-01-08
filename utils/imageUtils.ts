// utils/imageUtils.ts

/**
 * Optimizes image URLs for performance.
 * Specifically targets Unsplash URLs to request WebP format and specific dimensions.
 */
export const getOptimizedImageUrl = (url: string, width: number = 1200): string => {
  if (!url) return '';

  // Check if it's an Unsplash image (common in your project)
  if (url.includes('images.unsplash.com')) {
    const separator = url.includes('?') ? '&' : '?';
    // 🚀 FORCE WEBP & RESIZE: This saves ~80% of file size
    return `${url}${separator}auto=format,compress&fit=crop&q=80&w=${width}`;
  }

  // If it's a raw Base64 string or other URL, return as is
  return url;
};

/**
 * Preloads critical images to boost LCP (Largest Contentful Paint)
 */
export const preloadImage = (url: string) => {
  if (!url) return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = getOptimizedImageUrl(url);
  document.head.appendChild(link);
};