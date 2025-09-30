// Image caching utility for book covers
class ImageCache {
  constructor() {
    this.cache = new Map();
    this.loading = new Set();
    this.maxCacheSize = 200; // Maximum number of cached images
    this.cacheDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  // Generate cache key from image URL
  getCacheKey(url) {
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '');
  }

  // Check if image is in cache and still valid
  isValidCache(cacheEntry) {
    return Date.now() - cacheEntry.timestamp < this.cacheDuration;
  }

  // Get cached image or load new one
  async getCachedImage(imageUrl, fallbackUrl = null) {
    if (!imageUrl) {
      return this.getPlaceholderImage();
    }

    const cacheKey = this.getCacheKey(imageUrl);
    
    // Check if already cached and valid
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (this.isValidCache(cached)) {
        return cached.dataUrl;
      } else {
        // Remove expired cache entry
        this.cache.delete(cacheKey);
      }
    }

    // Check if already loading
    if (this.loading.has(cacheKey)) {
      return this.getPlaceholderImage();
    }

    // Load and cache image
    try {
      this.loading.add(cacheKey);
      const dataUrl = await this.loadImageAsDataUrl(imageUrl);
      
      // Clean cache if it's getting too large
      if (this.cache.size >= this.maxCacheSize) {
        this.cleanCache();
      }

      // Store in cache
      this.cache.set(cacheKey, {
        dataUrl,
        timestamp: Date.now(),
        originalUrl: imageUrl
      });

      this.loading.delete(cacheKey);
      return dataUrl;
    } catch (error) {
      this.loading.delete(cacheKey);
      
      // Try fallback URL if provided
      if (fallbackUrl && fallbackUrl !== imageUrl) {
        return this.getCachedImage(fallbackUrl);
      }
      
      console.warn('Failed to load image:', imageUrl, error);
      return this.getPlaceholderImage();
    }
  }

  // Load image and convert to data URL
  loadImageAsDataUrl(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${imageUrl}`));
      };

      // Add cache-busting and error handling
      const urlWithParams = this.addCacheBusting(imageUrl);
      img.src = urlWithParams;
    });
  }

  // Add cache-busting parameters to URL
  addCacheBusting(url) {
    try {
      const urlObj = new URL(url);
      // Only add cache-busting if it's not already there
      if (!urlObj.searchParams.has('_cb')) {
        urlObj.searchParams.set('_cb', Date.now().toString(36));
      }
      return urlObj.toString();
    } catch (error) {
      // If URL is malformed, return as-is
      return url;
    }
  }

  // Generate placeholder image
  getPlaceholderImage() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 200;
    canvas.height = 300;
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, '#f3f4f6');
    gradient.addColorStop(1, '#e5e7eb');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 200, 300);
    
    // Add book icon
    ctx.fillStyle = '#9ca3af';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📚', 100, 150);
    
    // Add text
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px Arial';
    ctx.fillText('Sin portada', 100, 200);
    
    return canvas.toDataURL('image/png');
  }

  // Clean old cache entries
  cleanCache() {
    const entries = Array.from(this.cache.entries());
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 25% of entries
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  // Get cache statistics
  getCacheStats() {
    const totalSize = this.cache.size;
    const loadingCount = this.loading.size;
    
    // Calculate total cache size in bytes (approximate)
    let totalBytes = 0;
    this.cache.forEach(entry => {
      // Approximate data URL size
      totalBytes += entry.dataUrl.length;
    });

    return {
      totalImages: totalSize,
      loadingImages: loadingCount,
      approximateSize: this.formatBytes(totalBytes),
      maxCacheSize: this.maxCacheSize
    };
  }

  // Format bytes for display
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Clear all cache
  clearCache() {
    this.cache.clear();
    this.loading.clear();
  }

  // Preload images for better UX
  async preloadImages(imageUrls) {
    const promises = imageUrls
      .filter(url => url)
      .map(url => this.getCachedImage(url).catch(() => null));
    
    await Promise.allSettled(promises);
  }

  // Get optimized image URL based on size requirements
  getOptimizedImageUrl(imageLinks, size = 'medium') {
    if (!imageLinks || typeof imageLinks !== 'object') {
      return null;
    }

    // Priority order for different sizes
    const sizePriority = {
      thumbnail: ['thumbnail', 'small', 'medium', 'large'],
      small: ['small', 'thumbnail', 'medium', 'large'],
      medium: ['medium', 'small', 'large', 'thumbnail'],
      large: ['large', 'medium', 'small', 'thumbnail']
    };

    const priorities = sizePriority[size] || sizePriority.medium;
    
    for (const priority of priorities) {
      if (imageLinks[priority]) {
        return imageLinks[priority];
      }
    }

    return null;
  }
}

// Create singleton instance
const imageCache = new ImageCache();

export default imageCache;