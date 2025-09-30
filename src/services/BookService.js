import GoogleBooksAdapter from './api/GoogleBooksAdapter';
import OpenLibraryAdapter from './api/OpenLibraryAdapter';

class BookService {
  constructor() {
    // Initialize adapters
    this.googleBooks = new GoogleBooksAdapter();
    this.openLibrary = new OpenLibraryAdapter();
    
    // Default primary and fallback APIs
    this.primaryAPI = this.googleBooks;
    this.fallbackAPI = this.openLibrary;
    
    // Cache for search results
    this.searchCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Configure which API to use as primary
  setPrimaryAPI(apiName, apiKey = null) {
    switch (apiName.toLowerCase()) {
      case 'google':
      case 'googlebooks':
        this.primaryAPI = new GoogleBooksAdapter(apiKey);
        break;
      case 'openlibrary':
        this.primaryAPI = this.openLibrary;
        break;
      default:
        console.warn(`Unknown API: ${apiName}, keeping current primary API`);
    }
  }

  // Add a new API adapter
  addAPIAdapter(name, adapter) {
    this[name] = adapter;
  }

  // Generate cache key
  getCacheKey(method, params) {
    return `${method}_${JSON.stringify(params)}`;
  }

  // Check cache validity
  isCacheValid(cacheEntry) {
    return Date.now() - cacheEntry.timestamp < this.cacheTimeout;
  }

  // Search books with fallback mechanism
  async searchBooks(query, options = {}) {
    if (!query.trim()) {
      return {
        success: false,
        error: 'Query cannot be empty',
        books: [],
        totalItems: 0,
        hasMore: false
      };
    }

    const cacheKey = this.getCacheKey('search', { query, options });
    
    // Check cache first
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      if (this.isCacheValid(cached)) {
        return cached.data;
      } else {
        this.searchCache.delete(cacheKey);
      }
    }

    try {
      // Try primary API first
      let result = await this.primaryAPI.search(query, options);
      
      // If primary API fails or returns no results, try fallback
      if (!result.success || result.books.length === 0) {
        console.log('Primary API failed or no results, trying fallback API...');
        result = await this.fallbackAPI.search(query, options);
        
        if (result.success) {
          result.source = 'fallback';
        }
      } else {
        result.source = 'primary';
      }

      // Cache successful results
      if (result.success && result.books.length > 0) {
        this.searchCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      console.error('Book search error:', error);
      return {
        success: false,
        error: error.message,
        books: [],
        totalItems: 0,
        hasMore: false
      };
    }
  }

  // Get book details with fallback
  async getBookDetails(bookId, source = null) {
    const cacheKey = this.getCacheKey('details', { bookId, source });
    
    // Check cache first
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      if (this.isCacheValid(cached)) {
        return cached.data;
      } else {
        this.searchCache.delete(cacheKey);
      }
    }

    try {
      let result;
      
      // If source is specified, use that API
      if (source === 'google-books' && this.googleBooks) {
        result = await this.googleBooks.getBookDetails(bookId);
      } else if (source === 'open-library' && this.openLibrary) {
        result = await this.openLibrary.getBookDetails(bookId);
      } else {
        // Try primary API first
        result = await this.primaryAPI.getBookDetails(bookId);
        
        // If primary fails, try fallback
        if (!result.success) {
          result = await this.fallbackAPI.getBookDetails(bookId);
        }
      }

      // Cache successful results
      if (result.success && result.book) {
        this.searchCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      console.error('Book details error:', error);
      return {
        success: false,
        error: error.message,
        book: null
      };
    }
  }

  // Search by specific criteria
  async searchByAuthor(author, options = {}) {
    try {
      let result = await this.primaryAPI.searchByAuthor(author, options);
      
      if (!result.success || result.books.length === 0) {
        result = await this.fallbackAPI.searchByAuthor(author, options);
      }

      return result;
    } catch (error) {
      console.error('Author search error:', error);
      return {
        success: false,
        error: error.message,
        books: [],
        totalItems: 0,
        hasMore: false
      };
    }
  }

  async searchByTitle(title, options = {}) {
    try {
      let result = await this.primaryAPI.searchByTitle(title, options);
      
      if (!result.success || result.books.length === 0) {
        result = await this.fallbackAPI.searchByTitle(title, options);
      }

      return result;
    } catch (error) {
      console.error('Title search error:', error);
      return {
        success: false,
        error: error.message,
        books: [],
        totalItems: 0,
        hasMore: false
      };
    }
  }

  async searchByISBN(isbn, options = {}) {
    try {
      let result = await this.primaryAPI.searchByISBN(isbn, options);
      
      if (!result.success || result.books.length === 0) {
        result = await this.fallbackAPI.searchByISBN(isbn, options);
      }

      return result;
    } catch (error) {
      console.error('ISBN search error:', error);
      return {
        success: false,
        error: error.message,
        books: [],
        totalItems: 0,
        hasMore: false
      };
    }
  }

  async searchBySubject(subject, options = {}) {
    try {
      let result = await this.primaryAPI.searchBySubject(subject, options);
      
      if (!result.success || result.books.length === 0) {
        result = await this.fallbackAPI.searchBySubject(subject, options);
      }

      return result;
    } catch (error) {
      console.error('Subject search error:', error);
      return {
        success: false,
        error: error.message,
        books: [],
        totalItems: 0,
        hasMore: false
      };
    }
  }

  // Get popular/trending books (mock implementation)
  async getPopularBooks(options = {}) {
    const queries = [
      'bestseller 2024',
      'popular fiction',
      'top rated books',
      'award winning books'
    ];
    
    try {
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      return await this.searchBooks(randomQuery, { ...options, maxResults: 10 });
    } catch (error) {
      console.error('Popular books error:', error);
      return {
        success: false,
        error: error.message,
        books: [],
        totalItems: 0,
        hasMore: false
      };
    }
  }

  // Clear cache
  clearCache() {
    this.searchCache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    const totalEntries = this.searchCache.size;
    const validEntries = Array.from(this.searchCache.values())
      .filter(entry => this.isCacheValid(entry)).length;
    
    return {
      totalEntries,
      validEntries,
      invalidEntries: totalEntries - validEntries
    };
  }
}

// Create singleton instance
const bookService = new BookService();

export default bookService;