import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useCategories } from './CategoriesContext';
import laravelBookService from '../services/LaravelBookService';

const BooksContext = createContext();

export const useBooks = () => {
  const context = useContext(BooksContext);
  if (!context) {
    throw new Error('useBooks must be used within a BooksProvider');
  }
  return context;
};

export const BooksProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { categories } = useCategories();
  const [userBooks, setUserBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});

  // Load user books when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserBooks();
      loadReadingStats();
    } else {
      setUserBooks([]);
      setStats({});
    }
  }, [isAuthenticated, user]);

  const loadUserBooks = async () => {
    try {
      setLoading(true);
      const result = await laravelBookService.getUserLibrary();
      
      if (result.success) {
        setUserBooks(result.books);
      } else {
        console.error('Failed to load user books:', result.error);
        // Fallback to localStorage for development
        const savedBooks = localStorage.getItem(`books_${user?.id}`);
        if (savedBooks) {
          setUserBooks(JSON.parse(savedBooks));
        }
      }
    } catch (error) {
      console.error('Error loading books:', error);
      // Fallback to localStorage
      try {
        const savedBooks = localStorage.getItem(`books_${user?.id}`);
        if (savedBooks) {
          setUserBooks(JSON.parse(savedBooks));
        }
      } catch (e) {
        console.error('Error loading books from localStorage:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadReadingStats = async () => {
    try {
      const result = await laravelBookService.getReadingStats();
      
      if (result.success) {
        setStats(result.stats);
      } else {
        // Calculate stats locally as fallback
        setStats(calculateLocalStats());
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(calculateLocalStats());
    }
  };

  const calculateLocalStats = () => {
    const totalBooks = userBooks.length;
    const readBooks = userBooks.filter(book => book.categoryId === 'read').length;
    const readingBooks = userBooks.filter(book => book.categoryId === 'reading').length;
    const toReadBooks = userBooks.filter(book => book.categoryId === 'to-read').length;
    const favoriteBooks = userBooks.filter(book => book.favorite || book.categoryId === 'favorites').length;
    
    const totalPages = userBooks.reduce((sum, book) => sum + (book.pageCount || 0), 0);
    const readPages = userBooks
      .filter(book => book.categoryId === 'read')
      .reduce((sum, book) => sum + (book.pageCount || 0), 0);

    const averageRating = totalBooks > 0 
      ? userBooks.reduce((sum, book) => sum + (book.rating || 0), 0) / totalBooks 
      : 0;

    return {
      totalBooks,
      readBooks,
      readingBooks,
      toReadBooks,
      favoriteBooks,
      totalPages,
      readPages,
      averageRating: Math.round(averageRating * 10) / 10
    };
  };

  const addBookToLibrary = async (book, categoryId = 'to-read', notes = '') => {
    try {
      const result = await laravelBookService.addBookToLibrary(book, categoryId, notes);
      
      if (result.success) {
        // Refresh library
        await loadUserBooks();
        await loadReadingStats();
        return result;
      } else {
        // Fallback to local storage
        return addBookToLibraryLocal(book, categoryId, notes);
      }
    } catch (error) {
      console.error('Error adding book to library:', error);
      return addBookToLibraryLocal(book, categoryId, notes);
    }
  };

  const addBookToLibraryLocal = (book, categoryId, notes) => {
    try {
      const userBook = {
        ...book,
        id: `${book.source}_${book.id}`,
        categoryId,
        notes,
        addedAt: new Date().toISOString(),
        rating: 0,
        progress: categoryId === 'read' ? 100 : 0,
        startedAt: categoryId === 'reading' ? new Date().toISOString() : null,
        finishedAt: categoryId === 'read' ? new Date().toISOString() : null,
        personalReview: '',
        tags: [],
        favorite: categoryId === 'favorites'
      };

      const existingBookIndex = userBooks.findIndex(b => b.id === userBook.id);
      
      let updatedBooks;
      if (existingBookIndex >= 0) {
        updatedBooks = userBooks.map((b, index) => 
          index === existingBookIndex ? { ...b, ...userBook, updatedAt: new Date().toISOString() } : b
        );
      } else {
        updatedBooks = [...userBooks, userBook];
      }

      setUserBooks(updatedBooks);
      if (user) {
        localStorage.setItem(`books_${user.id}`, JSON.stringify(updatedBooks));
      }

      return { success: true, book: userBook };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateBook = async (bookId, updates) => {
    try {
      const result = await laravelBookService.updateBookInLibrary(bookId, updates);
      
      if (result.success) {
        await loadUserBooks();
        return result;
      } else {
        return updateBookLocal(bookId, updates);
      }
    } catch (error) {
      console.error('Error updating book:', error);
      return updateBookLocal(bookId, updates);
    }
  };

  const updateBookLocal = (bookId, updates) => {
    try {
      const updatedBooks = userBooks.map(book =>
        book.id === bookId
          ? { ...book, ...updates, updatedAt: new Date().toISOString() }
          : book
      );

      setUserBooks(updatedBooks);
      if (user) {
        localStorage.setItem(`books_${user.id}`, JSON.stringify(updatedBooks));
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const moveBookToCategory = async (bookId, newCategoryId) => {
    try {
      const result = await laravelBookService.moveBookToCategory(bookId, newCategoryId);
      
      if (result.success) {
        await loadUserBooks();
        return result;
      } else {
        return moveBookToCategoryLocal(bookId, newCategoryId);
      }
    } catch (error) {
      console.error('Error moving book to category:', error);
      return moveBookToCategoryLocal(bookId, newCategoryId);
    }
  };

  const moveBookToCategoryLocal = (bookId, newCategoryId) => {
    const updates = {
      categoryId: newCategoryId,
      updatedAt: new Date().toISOString()
    };

    // Handle special category logic
    if (newCategoryId === 'reading' && !userBooks.find(b => b.id === bookId)?.startedAt) {
      updates.startedAt = new Date().toISOString();
      updates.progress = 0;
    } else if (newCategoryId === 'read') {
      updates.finishedAt = new Date().toISOString();
      updates.progress = 100;
    } else if (newCategoryId === 'favorites') {
      updates.favorite = true;
    }

    return updateBookLocal(bookId, updates);
  };

  const removeBookFromLibrary = async (bookId) => {
    try {
      const result = await laravelBookService.removeBookFromLibrary(bookId);
      
      if (result.success) {
        await loadUserBooks();
        return result;
      } else {
        return removeBookFromLibraryLocal(bookId);
      }
    } catch (error) {
      console.error('Error removing book from library:', error);
      return removeBookFromLibraryLocal(bookId);
    }
  };

  const removeBookFromLibraryLocal = (bookId) => {
    try {
      const updatedBooks = userBooks.filter(book => book.id !== bookId);
      setUserBooks(updatedBooks);
      if (user) {
        localStorage.setItem(`books_${user.id}`, JSON.stringify(updatedBooks));
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateBookNotes = async (bookId, notes) => {
    try {
      const result = await laravelBookService.updateBookNotes(bookId, notes);
      
      if (result.success) {
        await loadUserBooks();
        return result;
      } else {
        return updateBookLocal(bookId, { notes });
      }
    } catch (error) {
      return updateBookLocal(bookId, { notes });
    }
  };

  const updateBookRating = async (bookId, rating) => {
    try {
      const result = await laravelBookService.updateBookRating(bookId, rating);
      
      if (result.success) {
        await loadUserBooks();
        return result;
      } else {
        return updateBookLocal(bookId, { rating });
      }
    } catch (error) {
      return updateBookLocal(bookId, { rating });
    }
  };

  const updateBookProgress = async (bookId, progress) => {
    try {
      const result = await laravelBookService.updateReadingProgress(bookId, progress);
      
      if (result.success) {
        await loadUserBooks();
        return result;
      } else {
        return updateBookLocal(bookId, { progress });
      }
    } catch (error) {
      return updateBookLocal(bookId, { progress });
    }
  };

  const updateBookReview = async (bookId, personalReview, rating = null) => {
    try {
      const result = await laravelBookService.addBookReview(bookId, personalReview, rating);
      
      if (result.success) {
        await loadUserBooks();
        return result;
      } else {
        const updates = { personalReview };
        if (rating !== null) updates.rating = rating;
        return updateBookLocal(bookId, updates);
      }
    } catch (error) {
      const updates = { personalReview };
      if (rating !== null) updates.rating = rating;
      return updateBookLocal(bookId, updates);
    }
  };

  const importBooksFromData = async (booksData) => {
    try {
      setLoading(true);
      
      // Try to use Laravel backend first
      if (isAuthenticated) {
        // Convert data to a file-like format for the API
        const csvContent = convertBooksDataToCSV(booksData);
        const file = new Blob([csvContent], { type: 'text/csv' });
        file.name = 'imported_books.csv';
        
        const result = await laravelBookService.importBooks(file);
        
        if (result.success) {
          await loadUserBooks();
          await loadReadingStats();
          return result;
        }
      }
      
      // Fallback to local import
      return await importBooksFromDataLocal(booksData);
    } catch (error) {
      console.error('Error importing books:', error);
      return await importBooksFromDataLocal(booksData);
    } finally {
      setLoading(false);
    }
  };

  const convertBooksDataToCSV = (booksData) => {
    const headers = ['title', 'authors', 'description', 'category', 'publisher', 'publishedDate', 'pageCount', 'isbn', 'language', 'notes', 'review', 'rating'];
    const csvRows = [headers.join(',')];
    
    booksData.forEach(book => {
      const row = headers.map(header => {
        const value = book[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  };

  const importBooksFromDataLocal = async (booksData) => {
    try {
      const importedBooks = [];
      const errors = [];

      for (const bookData of booksData) {
        try {
          const category = categories.find(c => 
            c.name.toLowerCase() === bookData.category?.toLowerCase()
          ) || categories.find(c => c.id === 'to-read');

          const userBook = {
            id: `imported_${Date.now()}_${Math.random()}`,
            title: bookData.title || 'Sin título',
            authors: bookData.authors ? [bookData.authors] : [],
            description: bookData.description || '',
            publishedDate: bookData.publishedDate || '',
            publisher: bookData.publisher || '',
            pageCount: parseInt(bookData.pageCount) || 0,
            categories: bookData.categories ? [bookData.categories] : [],
            averageRating: parseFloat(bookData.rating) || 0,
            ratingsCount: 0,
            imageLinks: {},
            language: bookData.language || 'es',
            isbn: bookData.isbn || '',
            source: 'imported',
            categoryId: category.id,
            notes: bookData.notes || '',
            addedAt: new Date().toISOString(),
            rating: parseFloat(bookData.personalRating) || 0,
            progress: parseInt(bookData.progress) || 0,
            personalReview: bookData.review || '',
            tags: bookData.tags ? bookData.tags.split(',').map(t => t.trim()) : [],
            favorite: false
          };

          importedBooks.push(userBook);
        } catch (error) {
          errors.push({ book: bookData, error: error.message });
        }
      }

      const updatedBooks = [...userBooks, ...importedBooks];
      setUserBooks(updatedBooks);
      
      if (user) {
        localStorage.setItem(`books_${user.id}`, JSON.stringify(updatedBooks));
      }

      return { 
        success: true, 
        imported: importedBooks.length,
        errors: errors.length,
        books: importedBooks
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getBooksByCategory = (categoryId) => {
    return userBooks.filter(book => book.categoryId === categoryId);
  };

  const getReadingStats = () => {
    return stats.totalBooks ? stats : calculateLocalStats();
  };

  const searchUserBooks = async (query, filters = {}) => {
    try {
      const result = await laravelBookService.searchUserLibrary(query, filters);
      
      if (result.success) {
        return result.books;
      } else {
        return searchUserBooksLocal(query, filters);
      }
    } catch (error) {
      return searchUserBooksLocal(query, filters);
    }
  };

  const searchUserBooksLocal = (query, filters = {}) => {
    if (!query && !Object.keys(filters).length) return userBooks;

    return userBooks.filter(book => {
      const matchesQuery = !query || 
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.authors.some(author => author.toLowerCase().includes(query.toLowerCase())) ||
        book.description.toLowerCase().includes(query.toLowerCase());

      const matchesCategory = !filters.categoryId || book.categoryId === filters.categoryId;
      const matchesRating = !filters.minRating || book.rating >= filters.minRating;
      const matchesTags = !filters.tags?.length || 
        filters.tags.some(tag => book.tags.includes(tag));

      return matchesQuery && matchesCategory && matchesRating && matchesTags;
    });
  };

  const value = {
    userBooks,
    loading,
    stats: getReadingStats(),
    addBookToLibrary,
    updateBook,
    moveBookToCategory,
    removeBookFromLibrary,
    updateBookNotes,
    updateBookRating,
    updateBookProgress,
    updateBookReview,
    importBooksFromData,
    getBooksByCategory,
    getReadingStats,
    searchUserBooks,
    refreshLibrary: loadUserBooks
  };

  return (
    <BooksContext.Provider value={value}>
      {children}
    </BooksContext.Provider>
  );
};