import BookAPIAdapter from './BookAPIAdapter';

class GoogleBooksAdapter extends BookAPIAdapter {
  constructor(apiKey = null) {
    super('GoogleBooks');
    this.baseURL = 'https://www.googleapis.com/books/v1';
    this.apiKey = apiKey; // Optional: for higher rate limits
  }

  async search(query, options = {}) {
    try {
      const {
        maxResults = 20,
        startIndex = 0,
        orderBy = 'relevance', // relevance, newest
        langRestrict = 'es',
        printType = 'books'
      } = options;

      let url = `${this.baseURL}/volumes?q=${encodeURIComponent(query)}`;
      url += `&maxResults=${maxResults}`;
      url += `&startIndex=${startIndex}`;
      url += `&orderBy=${orderBy}`;
      url += `&langRestrict=${langRestrict}`;
      url += `&printType=${printType}`;
      
      if (this.apiKey) {
        url += `&key=${this.apiKey}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google Books API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        books: (data.items || []).map(item => this.normalizeBook(item)),
        totalItems: data.totalItems || 0,
        hasMore: (startIndex + maxResults) < (data.totalItems || 0)
      };
    } catch (error) {
      console.error('Google Books API Error:', error);
      return {
        success: false,
        error: error.message,
        books: [],
        totalItems: 0,
        hasMore: false
      };
    }
  }

  async getBookDetails(bookId) {
    try {
      let url = `${this.baseURL}/volumes/${bookId}`;
      if (this.apiKey) {
        url += `?key=${this.apiKey}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google Books API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        book: this.normalizeBook(data)
      };
    } catch (error) {
      console.error('Google Books API Error:', error);
      return {
        success: false,
        error: error.message,
        book: null
      };
    }
  }

  normalizeBook(rawBook) {
    const volumeInfo = rawBook.volumeInfo || {};
    const saleInfo = rawBook.saleInfo || {};
    
    // Extract ISBNs
    const identifiers = volumeInfo.industryIdentifiers || [];
    const isbn13 = identifiers.find(id => id.type === 'ISBN_13')?.identifier || '';
    const isbn10 = identifiers.find(id => id.type === 'ISBN_10')?.identifier || '';
    const isbn = isbn13 || isbn10;

    return this.createStandardBook({
      id: rawBook.id,
      title: volumeInfo.title,
      authors: volumeInfo.authors || [],
      description: volumeInfo.description,
      publishedDate: volumeInfo.publishedDate,
      publisher: volumeInfo.publisher,
      pageCount: volumeInfo.pageCount,
      categories: volumeInfo.categories || [],
      averageRating: volumeInfo.averageRating,
      ratingsCount: volumeInfo.ratingsCount,
      imageLinks: volumeInfo.imageLinks || {},
      language: volumeInfo.language,
      isbn: isbn,
      source: 'google-books'
    });
  }

  // Search by specific fields
  async searchByAuthor(author, options = {}) {
    return this.search(`inauthor:"${author}"`, options);
  }

  async searchByTitle(title, options = {}) {
    return this.search(`intitle:"${title}"`, options);
  }

  async searchByISBN(isbn, options = {}) {
    return this.search(`isbn:${isbn}`, options);
  }

  async searchBySubject(subject, options = {}) {
    return this.search(`subject:"${subject}"`, options);
  }
}

export default GoogleBooksAdapter;