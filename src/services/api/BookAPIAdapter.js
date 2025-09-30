// Abstract adapter pattern for book APIs
// This allows easy integration of any book API without affecting the core application

class BookAPIAdapter {
  constructor(apiService) {
    this.apiService = apiService;
  }

  async search(query, options = {}) {
    throw new Error('search method must be implemented by subclass');
  }

  async getBookDetails(bookId) {
    throw new Error('getBookDetails method must be implemented by subclass');
  }

  // Normalize book data to a standard format
  normalizeBook(rawBook) {
    throw new Error('normalizeBook method must be implemented by subclass');
  }

  // Standard book format that all adapters should return
  createStandardBook({
    id,
    title,
    authors = [],
    description = '',
    publishedDate = '',
    publisher = '',
    pageCount = 0,
    categories = [],
    averageRating = 0,
    ratingsCount = 0,
    imageLinks = {},
    language = 'es',
    isbn = '',
    source = 'unknown'
  }) {
    return {
      id: String(id),
      title: String(title || 'Sin título'),
      authors: Array.isArray(authors) ? authors : [authors].filter(Boolean),
      description: String(description || ''),
      publishedDate: String(publishedDate || ''),
      publisher: String(publisher || ''),
      pageCount: Number(pageCount) || 0,
      categories: Array.isArray(categories) ? categories : [categories].filter(Boolean),
      averageRating: Number(averageRating) || 0,
      ratingsCount: Number(ratingsCount) || 0,
      imageLinks: {
        thumbnail: imageLinks?.thumbnail || imageLinks?.small || '',
        small: imageLinks?.small || imageLinks?.thumbnail || '',
        medium: imageLinks?.medium || imageLinks?.small || imageLinks?.thumbnail || '',
        large: imageLinks?.large || imageLinks?.medium || imageLinks?.small || imageLinks?.thumbnail || ''
      },
      language: String(language || 'es'),
      isbn: String(isbn || ''),
      source: String(source)
    };
  }
}

export default BookAPIAdapter;