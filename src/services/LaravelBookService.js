// Laravel Backend Book Service
import authService from './AuthService';

class LaravelBookService {
  constructor() {
    this.baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    this.apiURL = `${this.baseURL}/api`;
  }

  // Get authorization headers
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authService.getToken() ? `Bearer ${authService.getToken()}` : '',
      'X-Requested-With': 'XMLHttpRequest'
    };
  }

  // Handle API response
  async handleResponse(response) {
    const data = await response.json();
    
    if (response.status === 401) {
      // Token expired, try to refresh
      const refreshResult = await authService.refreshToken();
      if (!refreshResult.success) {
        authService.clearAuthData();
        window.location.href = '/login';
      }
      throw new Error('Authentication required');
    }

    return data;
  }

  // Get user's personal library
  async getUserLibrary(page = 1, limit = 20, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...filters
      });

      // Updated to match Laravel routes: /api/books (user's library)
      const response = await fetch(`${this.apiURL}/books?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await this.handleResponse(response);

      return {
        success: data.success || response.ok,
        books: data.data || [],
        pagination: data.pagination || {},
        error: data.success ? null : data.message
      };
    } catch (error) {
      console.error('Get user library error:', error);
      return {
        success: false,
        books: [],
        error: error.message
      };
    }
  }

  // Add book to user's library
  async addBookToLibrary(book, categoryId = 'to-read', notes = '') {
    try {
      // Updated to match Laravel routes: /api/books (POST to add book)
      const response = await fetch(`${this.apiURL}/books`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          external_book_id: book.id,
          source: book.source || 'google-books',
          book_data: {
            title: book.title,
            authors: book.authors,
            description: book.description,
            published_date: book.publishedDate,
            publisher: book.publisher,
            page_count: book.pageCount,
            categories: book.categories,
            average_rating: book.averageRating,
            ratings_count: book.ratingsCount,
            image_links: book.imageLinks,
            language: book.language,
            isbn: book.isbn,
            external_id: book.id,
            source: book.source || 'google-books'
          },
          category_id: categoryId,
          notes
        })
      });

      const data = await this.handleResponse(response);

      return {
        success: data.success || response.ok,
        book: data.data,
        error: data.success ? null : data.message
      };
    } catch (error) {
      console.error('Add book to library error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update book in library
  async updateBookInLibrary(bookId, updates) {
    try {
      // Updated to match Laravel routes: /api/books/{id} (PUT)
      const response = await fetch(`${this.apiURL}/books/${bookId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      const data = await this.handleResponse(response);

      return {
        success: data.success || response.ok,
        book: data.data,
        error: data.success ? null : data.message
      };
    } catch (error) {
      console.error('Update book in library error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Remove book from library
  async removeBookFromLibrary(bookId) {
    try {
      // Updated to match Laravel routes: /api/books/{id} (DELETE)
      const response = await fetch(`${this.apiURL}/books/${bookId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const data = await this.handleResponse(response);

      return {
        success: data.success || response.ok,
        error: data.success ? null : data.message
      };
    } catch (error) {
      console.error('Remove book from library error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Move book to different category
  async moveBookToCategory(bookId, categoryId) {
    try {
      const response = await fetch(`${this.apiURL}/books/library/${bookId}/move`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          category_id: categoryId
        })
      });

      const data = await this.handleResponse(response);

      return {
        success: response.ok,
        book: data.book,
        error: data.success ? null : data.message
      };
    } catch (error) {
      console.error('Move book to category error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update book notes
  async updateBookNotes(bookId, notes) {
    try {
      const response = await fetch(`${this.apiURL}/books/library/${bookId}/notes`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ notes })
      });

      const data = await this.handleResponse(response);

      return {
        success: response.ok,
        book: data.book,
        error: data.success ? null : data.message
      };
    } catch (error) {
      console.error('Update book notes error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update book rating
  async updateBookRating(bookId, rating) {
    try {
      const response = await fetch(`${this.apiURL}/books/library/${bookId}/rating`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ rating })
      });

      const data = await this.handleResponse(response);

      return {
        success: response.ok,
        book: data.book,
        error: data.success ? null : data.message
      };
    } catch (error) {
      console.error('Update book rating error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update reading progress
  async updateReadingProgress(bookId, progress) {
    try {
      const response = await fetch(`${this.apiURL}/books/library/${bookId}/progress`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ progress })
      });

      const data = await this.handleResponse(response);

      return {
        success: response.ok,
        book: data.book,
        error: data.success ? null : data.message
      };
    } catch (error) {
      console.error('Update reading progress error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user categories
  async getUserCategories() {
    try {
      const response = await fetch(`${this.apiURL}/categories`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await this.handleResponse(response);

      return {
        success: response.ok,
        categories: data.categories || [],
        error: data.success ? null : data.message
      };
    } catch (error) {
      console.error('Get user categories error:', error);
      return {
        success: false,
        categories: [],
        error: error.message
      };
    }
  }

  // Create custom category
  async createCategory(categoryData) {
    try {
      const response = await fetch(`${this.apiURL}/categories`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(categoryData)
      });

      const data = await this.handleResponse(response);

      return {
        success: response.ok,
        category: data.category,
        error: data.success ? null : data.message
      };
    } catch (error) {
      console.error('Create category error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update category
  async updateCategory(categoryId, updates) {
    try {
      const response = await fetch(`${this.apiURL}/categories/${categoryId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      const data = await this.handleResponse(response);

      return {
        success: response.ok,
        category: data.category,
        error: data.success ? null : data.message
      };
    } catch (error) {
      console.error('Update category error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete category
  async deleteCategory(categoryId) {
    try {
      const response = await fetch(`${this.apiURL}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const data = await this.handleResponse(response);

      return {
        success: response.ok,
        error: data.success ? null : data.message
      };
    } catch (error) {
      console.error('Delete category error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Import books from Excel/CSV
  async importBooks(file, options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });

      const response = await fetch(`${this.apiURL}/books/import`, {
        method: 'POST',
        headers: {
          'Authorization': authService.getToken() ? `Bearer ${authService.getToken()}` : '',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
      });

      const data = await this.handleResponse(response);

      return {
        success: response.ok,
        imported: data.imported || 0,
        errors: data.errors || [],
        categories_created: data.categories_created || 0,
        error: data.success ? null : data.message
      };
    } catch (error) {
      console.error('Import books error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get reading statistics
  async getReadingStats() {
    try {
      const response = await fetch(`${this.apiURL}/books/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await this.handleResponse(response);

      return {
        success: response.ok,
        stats: data.stats || {},
        error: data.success ? null : data.message
      };
    } catch (error) {
      console.error('Get reading stats error:', error);
      return {
        success: false,
        stats: {},
        error: error.message
      };
    }
  }

  // Search in user library
  async searchUserLibrary(query, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        q: query,
        ...filters
      });

      // Updated to match Laravel routes: /api/books/search
      const response = await fetch(`${this.apiURL}/books/search?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await this.handleResponse(response);

      return {
        success: data.success || response.ok,
        books: data.data || [],
        error: data.success ? null : data.message
      };
    } catch (error) {
      console.error('Search user library error:', error);
      return {
        success: false,
        books: [],
        error: error.message
      };
    }
  }

  // Get personalized recommendations
  async getPersonalizedRecommendations(limit = 10) {
    try {
      const response = await fetch(`${this.apiURL}/books/recommendations?limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await this.handleResponse(response);

      return {
        success: response.ok,
        recommendations: data.recommendations || [],
        reason: data.reason || 'personalized',
        error: data.success ? null : data.message
      };
    } catch (error) {
      console.error('Get recommendations error:', error);
      return {
        success: false,
        recommendations: [],
        error: error.message
      };
    }
  }

  // Get related books
  async getRelatedBooks(bookId, limit = 6) {
    try {
      const response = await fetch(`${this.apiURL}/books/${bookId}/related?limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await this.handleResponse(response);

      return {
        success: response.ok,
        books: data.books || [],
        criteria: data.criteria || [],
        error: data.success ? null : data.message
      };
    } catch (error) {
      console.error('Get related books error:', error);
      return {
        success: false,
        books: [],
        error: error.message
      };
    }
  }

  // Add book review
  async addBookReview(bookId, review, rating = null) {
    try {
      const response = await fetch(`${this.apiURL}/books/library/${bookId}/review`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          review,
          rating
        })
      });

      const data = await this.handleResponse(response);

      return {
        success: response.ok,
        book: data.book,
        error: data.success ? null : data.message
      };
    } catch (error) {
      console.error('Add book review error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get public reviews for a book
  async getBookReviews(bookId, page = 1, limit = 10) {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit
      });

      const response = await fetch(`${this.apiURL}/books/${bookId}/reviews?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await this.handleResponse(response);

      return {
        success: response.ok,
        reviews: data.reviews || [],
        pagination: data.pagination || {},
        error: data.success ? null : data.message
      };
    } catch (error) {
      console.error('Get book reviews error:', error);
      return {
        success: false,
        reviews: [],
        error: error.message
      };
    }
  }
}

// Create singleton instance
const laravelBookService = new LaravelBookService();

export default laravelBookService;