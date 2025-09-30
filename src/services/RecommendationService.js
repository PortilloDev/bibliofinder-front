// Service for book recommendations and related books
class RecommendationService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  // Generate recommendations based on user's reading history
  async getPersonalizedRecommendations(userBooks, limit = 10) {
    try {
      if (!userBooks || userBooks.length === 0) {
        return this.getPopularRecommendations(limit);
      }

      // Extract user preferences from reading history
      const preferences = this.analyzeUserPreferences(userBooks);
      
      // Mock API call to Laravel backend
      // TODO: Replace with real API call when Laravel backend is connected
      const recommendations = await this.mockPersonalizedRecommendations(preferences, limit);
      
      return {
        success: true,
        recommendations,
        reason: 'personalized'
      };
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return {
        success: false,
        error: error.message,
        recommendations: []
      };
    }
  }

  // Get related books based on a specific book
  async getRelatedBooks(book, userBooks = [], limit = 6) {
    try {
      const cacheKey = `related_${book.id}_${limit}`;
      
      // Check cache
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
        this.cache.delete(cacheKey);
      }

      // Find related books based on various criteria
      const relatedBooks = await this.findRelatedBooks(book, userBooks, limit);
      
      const result = {
        success: true,
        books: relatedBooks,
        criteria: this.getRelationCriteria(book)
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Error getting related books:', error);
      return {
        success: false,
        error: error.message,
        books: []
      };
    }
  }

  // Analyze user preferences from reading history
  analyzeUserPreferences(userBooks) {
    const preferences = {
      genres: {},
      authors: {},
      languages: {},
      publicationPeriods: {},
      averageRating: 0,
      averagePageCount: 0
    };

    let totalRating = 0;
    let totalPages = 0;
    let ratedBooks = 0;

    userBooks.forEach(book => {
      // Analyze genres/categories
      if (book.categories) {
        book.categories.forEach(category => {
          preferences.genres[category] = (preferences.genres[category] || 0) + 1;
        });
      }

      // Analyze authors
      if (book.authors) {
        book.authors.forEach(author => {
          preferences.authors[author] = (preferences.authors[author] || 0) + 1;
        });
      }

      // Analyze languages
      if (book.language) {
        preferences.languages[book.language] = (preferences.languages[book.language] || 0) + 1;
      }

      // Analyze publication periods
      if (book.publishedDate) {
        const year = new Date(book.publishedDate).getFullYear();
        const decade = Math.floor(year / 10) * 10;
        if (!isNaN(decade)) {
          preferences.publicationPeriods[decade] = (preferences.publicationPeriods[decade] || 0) + 1;
        }
      }

      // Analyze ratings
      if (book.rating && book.rating > 0) {
        totalRating += book.rating;
        ratedBooks++;
      }

      // Analyze page counts
      if (book.pageCount && book.pageCount > 0) {
        totalPages += book.pageCount;
      }
    });

    // Calculate averages
    preferences.averageRating = ratedBooks > 0 ? totalRating / ratedBooks : 0;
    preferences.averagePageCount = userBooks.length > 0 ? totalPages / userBooks.length : 0;

    // Sort preferences by frequency
    preferences.topGenres = Object.entries(preferences.genres)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);

    preferences.topAuthors = Object.entries(preferences.authors)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([author]) => author);

    return preferences;
  }

  // Mock personalized recommendations (replace with real API)
  async mockPersonalizedRecommendations(preferences, limit) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock recommendations based on preferences
    const mockBooks = [
      {
        id: 'rec_1',
        title: 'Recommended Book Based on Your Reading History',
        authors: preferences.topAuthors[0] ? [preferences.topAuthors[0]] : ['Similar Author'],
        categories: preferences.topGenres.slice(0, 2),
        averageRating: Math.max(4.0, preferences.averageRating - 0.5),
        description: 'A book tailored to your reading preferences and history.',
        publishedDate: '2023-01-01',
        pageCount: Math.round(preferences.averagePageCount * 1.1),
        imageLinks: { thumbnail: '' },
        source: 'recommendation',
        recommendationReason: 'Based on your love for ' + preferences.topGenres[0]
      }
      // Add more mock recommendations...
    ];

    return mockBooks.slice(0, limit);
  }

  // Find related books using various algorithms
  async findRelatedBooks(book, userBooks, limit) {
    const relatedBooks = [];

    // 1. Books by same authors
    if (book.authors && book.authors.length > 0) {
      const sameAuthorBooks = await this.findBooksByAuthors(book.authors, book.id);
      relatedBooks.push(...sameAuthorBooks.slice(0, 2));
    }

    // 2. Books in same categories
    if (book.categories && book.categories.length > 0) {
      const sameCategoryBooks = await this.findBooksByCategories(book.categories, book.id);
      relatedBooks.push(...sameCategoryBooks.slice(0, 2));
    }

    // 3. Books from similar time period
    if (book.publishedDate) {
      const similarPeriodBooks = await this.findBooksBySimilarPeriod(book.publishedDate, book.id);
      relatedBooks.push(...similarPeriodBooks.slice(0, 2));
    }

    // Remove duplicates and books already in user library
    const uniqueBooks = this.removeDuplicatesAndUserBooks(relatedBooks, userBooks);

    return uniqueBooks.slice(0, limit);
  }

  // Mock method to find books by authors (replace with API call)
  async findBooksByAuthors(authors, excludeId) {
    // Mock implementation - replace with real API call to Laravel
    return [
      {
        id: `author_${Date.now()}`,
        title: `Another book by ${authors[0]}`,
        authors: authors,
        categories: ['Fiction'],
        averageRating: 4.2,
        description: `Another great work by ${authors[0]}`,
        publishedDate: '2022-06-15',
        pageCount: 320,
        imageLinks: { thumbnail: '' },
        source: 'related-author'
      }
    ];
  }

  // Mock method to find books by categories
  async findBooksByCategories(categories, excludeId) {
    // Mock implementation - replace with real API call to Laravel
    return [
      {
        id: `category_${Date.now()}`,
        title: `Similar book in ${categories[0]}`,
        authors: ['Related Author'],
        categories: categories,
        averageRating: 4.0,
        description: `A book similar to your interests in ${categories[0]}`,
        publishedDate: '2023-03-20',
        pageCount: 280,
        imageLinks: { thumbnail: '' },
        source: 'related-category'
      }
    ];
  }

  // Mock method to find books from similar time period
  async findBooksBySimilarPeriod(publishedDate, excludeId) {
    const year = new Date(publishedDate).getFullYear();
    
    return [
      {
        id: `period_${Date.now()}`,
        title: `Contemporary book from ${year}`,
        authors: ['Period Author'],
        categories: ['Historical'],
        averageRating: 4.1,
        description: `A book from the same era (${year})`,
        publishedDate: publishedDate,
        pageCount: 350,
        imageLinks: { thumbnail: '' },
        source: 'related-period'
      }
    ];
  }

  // Get popular recommendations for new users
  async getPopularRecommendations(limit = 10) {
    try {
      // Mock popular books - replace with real API call
      const popularBooks = [
        {
          id: 'pop_1',
          title: 'The Seven Husbands of Evelyn Hugo',
          authors: ['Taylor Jenkins Reid'],
          categories: ['Fiction', 'Romance'],
          averageRating: 4.3,
          description: 'A captivating novel about a reclusive Hollywood icon.',
          publishedDate: '2017-06-13',
          pageCount: 400,
          imageLinks: { thumbnail: '' },
          source: 'popular'
        },
        {
          id: 'pop_2',
          title: 'Atomic Habits',
          authors: ['James Clear'],
          categories: ['Self-Help', 'Psychology'],
          averageRating: 4.4,
          description: 'Transform your life with tiny changes in behavior.',
          publishedDate: '2018-10-16',
          pageCount: 320,
          imageLinks: { thumbnail: '' },
          source: 'popular'
        }
      ];

      return {
        success: true,
        recommendations: popularBooks.slice(0, limit),
        reason: 'popular'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        recommendations: []
      };
    }
  }

  // Remove duplicates and books already in user library
  removeDuplicatesAndUserBooks(books, userBooks) {
    const userBookIds = new Set(userBooks.map(book => book.id));
    const seen = new Set();
    
    return books.filter(book => {
      if (seen.has(book.id) || userBookIds.has(book.id)) {
        return false;
      }
      seen.add(book.id);
      return true;
    });
  }

  // Get criteria used for finding related books
  getRelationCriteria(book) {
    const criteria = [];
    
    if (book.authors && book.authors.length > 0) {
      criteria.push(`Same authors: ${book.authors.join(', ')}`);
    }
    
    if (book.categories && book.categories.length > 0) {
      criteria.push(`Similar categories: ${book.categories.join(', ')}`);
    }
    
    if (book.publishedDate) {
      const year = new Date(book.publishedDate).getFullYear();
      criteria.push(`Similar time period: ${year}`);
    }

    return criteria;
  }

  // Clear recommendation cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      totalEntries: this.cache.size,
      cacheTimeout: this.cacheTimeout / 1000 / 60 // in minutes
    };
  }
}

// Create singleton instance
const recommendationService = new RecommendationService();

export default recommendationService;