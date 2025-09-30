import BookAPIAdapter from './BookAPIAdapter';

class OpenLibraryAdapter extends BookAPIAdapter {
  constructor() {
    super('OpenLibrary');
    this.baseURL = 'https://openlibrary.org';
    this.coversURL = 'https://covers.openlibrary.org/b';
  }

  async search(query, options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        sort = 'relevance', // relevance, rating, new, old
        lang = 'es'
      } = options;

      let url = `${this.baseURL}/search.json?q=${encodeURIComponent(query)}`;
      url += `&limit=${limit}`;
      url += `&offset=${offset}`;
      url += `&sort=${sort}`;
      url += `&lang=${lang}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Open Library API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        books: (data.docs || []).map(item => this.normalizeBook(item)),
        totalItems: data.numFound || 0,
        hasMore: (offset + limit) < (data.numFound || 0)
      };
    } catch (error) {
      console.error('Open Library API Error:', error);
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
      // bookId should be in format like '/works/OL45804W' or 'OL45804W'
      const workId = bookId.startsWith('/works/') ? bookId : `/works/${bookId}`;
      const url = `${this.baseURL}${workId}.json`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Open Library API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        book: this.normalizeBook(data, true)
      };
    } catch (error) {
      console.error('Open Library API Error:', error);
      return {
        success: false,
        error: error.message,
        book: null
      };
    }
  }

  normalizeBook(rawBook, isDetailView = false) {
    // Handle different response formats
    const id = rawBook.key || rawBook.work_id || rawBook.edition_key?.[0] || '';
    const title = rawBook.title || '';
    const authors = this.extractAuthors(rawBook);
    const description = this.extractDescription(rawBook);
    
    // Extract publish date
    const publishedDate = rawBook.first_publish_year || 
                         rawBook.publish_date?.[0] || 
                         rawBook.publish_year?.[0] || '';

    // Extract publisher
    const publisher = rawBook.publisher?.[0] || rawBook.publishers?.[0] || '';
    
    // Extract page count
    const pageCount = rawBook.number_of_pages_median || 0;
    
    // Extract categories/subjects
    const categories = rawBook.subject?.slice(0, 5) || [];
    
    // Extract rating info
    const averageRating = rawBook.ratings_average || 0;
    const ratingsCount = rawBook.ratings_count || 0;
    
    // Generate image links
    const imageLinks = this.generateImageLinks(rawBook);
    
    // Extract language
    const language = rawBook.language?.[0] || 'es';
    
    // Extract ISBN
    const isbn = rawBook.isbn?.[0] || rawBook.isbn_13?.[0] || rawBook.isbn_10?.[0] || '';

    return this.createStandardBook({
      id: id.replace('/works/', ''),
      title,
      authors,
      description,
      publishedDate: String(publishedDate),
      publisher,
      pageCount,
      categories,
      averageRating,
      ratingsCount,
      imageLinks,
      language,
      isbn,
      source: 'open-library'
    });
  }

  extractAuthors(rawBook) {
    if (rawBook.author_name) {
      return rawBook.author_name;
    }
    if (rawBook.authors) {
      return rawBook.authors.map(author => author.name || author).filter(Boolean);
    }
    return [];
  }

  extractDescription(rawBook) {
    if (typeof rawBook.description === 'string') {
      return rawBook.description;
    }
    if (rawBook.description?.value) {
      return rawBook.description.value;
    }
    return rawBook.first_sentence?.join(' ') || '';
  }

  generateImageLinks(rawBook) {
    const coverId = rawBook.cover_i || rawBook.cover_id;
    const isbn = rawBook.isbn?.[0] || rawBook.isbn_13?.[0] || rawBook.isbn_10?.[0];
    const olid = rawBook.edition_key?.[0];

    if (coverId) {
      return {
        thumbnail: `${this.coversURL}/id/${coverId}-S.jpg`,
        small: `${this.coversURL}/id/${coverId}-M.jpg`,
        medium: `${this.coversURL}/id/${coverId}-L.jpg`,
        large: `${this.coversURL}/id/${coverId}-L.jpg`
      };
    }
    
    if (isbn) {
      return {
        thumbnail: `${this.coversURL}/isbn/${isbn}-S.jpg`,
        small: `${this.coversURL}/isbn/${isbn}-M.jpg`,
        medium: `${this.coversURL}/isbn/${isbn}-L.jpg`,
        large: `${this.coversURL}/isbn/${isbn}-L.jpg`
      };
    }
    
    if (olid) {
      return {
        thumbnail: `${this.coversURL}/olid/${olid}-S.jpg`,
        small: `${this.coversURL}/olid/${olid}-M.jpg`,
        medium: `${this.coversURL}/olid/${olid}-L.jpg`,
        large: `${this.coversURL}/olid/${olid}-L.jpg`
      };
    }

    return {};
  }

  // Search by specific fields
  async searchByAuthor(author, options = {}) {
    return this.search(`author:"${author}"`, options);
  }

  async searchByTitle(title, options = {}) {
    return this.search(`title:"${title}"`, options);
  }

  async searchByISBN(isbn, options = {}) {
    return this.search(`isbn:${isbn}`, options);
  }

  async searchBySubject(subject, options = {}) {
    return this.search(`subject:"${subject}"`, options);
  }
}

export default OpenLibraryAdapter;