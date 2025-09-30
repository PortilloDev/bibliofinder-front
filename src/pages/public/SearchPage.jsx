import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Search, Filter, BookOpen, Loader2, Grid, List, SortAsc, SortDesc } from 'lucide-react';
import BookCard from '../../components/books/BookCard';
import bookService from '../../services/BookService';
import { useToast } from '../../hooks/use-toast';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchType, setSearchType] = useState('general');
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    language: 'all',
    maxResults: 20,
    source: 'all'
  });

  // Load search results
  const performSearch = useCallback(async (searchQuery, page = 0, append = false) => {
    if (!searchQuery.trim()) {
      setBooks([]);
      setHasMore(false);
      setTotalResults(0);
      return;
    }

    setIsLoading(true);
    try {
      const options = {
        maxResults: filters.maxResults,
        startIndex: page * filters.maxResults,
        orderBy: sortBy,
        langRestrict: filters.language !== 'all' ? filters.language : undefined
      };

      let result;
      switch (searchType) {
        case 'author':
          result = await bookService.searchByAuthor(searchQuery, options);
          break;
        case 'title':
          result = await bookService.searchByTitle(searchQuery, options);
          break;
        case 'isbn':
          result = await bookService.searchByISBN(searchQuery, options);
          break;
        case 'subject':
          result = await bookService.searchBySubject(searchQuery, options);
          break;
        default:
          result = await bookService.searchBooks(searchQuery, options);
      }

      if (result.success) {
        const newBooks = result.books || [];
        setBooks(prev => append ? [...prev, ...newBooks] : newBooks);
        setHasMore(result.hasMore || false);
        setTotalResults(result.totalItems || 0);
        
        if (newBooks.length === 0 && !append) {
          toast({
            title: "Sin resultados",
            description: "No se encontraron libros para tu búsqueda. Intenta con otros términos.",
          });
        }
      } else {
        toast({
          title: "Error en la búsqueda",
          description: result.error || "No se pudo realizar la búsqueda. Inténtalo de nuevo.",
          variant: "destructive"
        });
        
        if (!append) {
          setBooks([]);
          setHasMore(false);
          setTotalResults(0);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con los servicios de búsqueda. Verifica tu conexión.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchType, sortBy, filters, toast]);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
      setCurrentPage(0);
      performSearch(query, 0);
    }
  };

  // Load more results
  const loadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    performSearch(query, nextPage, true);
  };

  // Load initial search if query exists
  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery, 0);
    }
  }, [searchParams, performSearch]);

  // Quick search suggestions
  const quickSearches = [
    'ficción contemporánea',
    'bestsellers 2024',
    'ciencia ficción',
    'novela histórica',
    'autoayuda',
    'biografías',
    'thriller psicológico',
    'literatura clásica'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Buscar Libros
          </h1>
          <p className="text-lg text-muted-foreground">
            Explora millones de libros desde Google Books y Open Library
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Buscar por título, autor, ISBN..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 text-lg"
              />
            </div>
            <Button type="submit" size="lg" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Search Options */}
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Búsqueda General</SelectItem>
                <SelectItem value="title">Por Título</SelectItem>
                <SelectItem value="author">Por Autor</SelectItem>
                <SelectItem value="isbn">Por ISBN</SelectItem>
                <SelectItem value="subject">Por Tema</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.language} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, language: value }))
            }>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los idiomas</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">Inglés</SelectItem>
                <SelectItem value="fr">Francés</SelectItem>
                <SelectItem value="de">Alemán</SelectItem>
                <SelectItem value="it">Italiano</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevancia</SelectItem>
                <SelectItem value="newest">Más Recientes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>

        {/* Quick Searches */}
        {!query && (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-3">Búsquedas populares:</p>
            <div className="flex flex-wrap gap-2">
              {quickSearches.map((search, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => {
                    setQuery(search);
                    setSearchParams({ q: search });
                    performSearch(search, 0);
                  }}
                >
                  {search}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {books.length > 0 && (
        <div className="max-w-7xl mx-auto">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-muted-foreground">
                {totalResults.toLocaleString()} resultados para "{query}"
              </p>
              {books.length > 0 && (
                <Badge variant="outline">
                  Mostrando {books.length} de {totalResults.toLocaleString()}
                </Badge>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Books Grid/List */}
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1 max-w-4xl mx-auto'
          }`}>
            {books.map((book, index) => (
              <BookCard
                key={`${book.source}_${book.id}_${index}`}
                book={book}
                variant="search"
                className={viewMode === 'list' ? 'w-full' : ''}
                onViewDetails={(book) => navigate(`/book/${book.source}/${book.id}`)}
                onAddToLibrary={(book) => {
                  toast({
                    title: "¡Libro añadido!",
                    description: `"${book.title}" se ha añadido a tu biblioteca.`,
                  });
                }}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-8">
              <Button
                onClick={loadMore}
                disabled={isLoading}
                size="lg"
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Cargar Más Libros
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && books.length === 0 && query && (
        <div className="max-w-md mx-auto text-center py-12">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No se encontraron resultados</h3>
          <p className="text-muted-foreground mb-4">
            Intenta con diferentes términos de búsqueda o revisa la ortografía.
          </p>
          <Button variant="outline" onClick={() => {
            setQuery('');
            setBooks([]);
            setSearchParams({});
          }}>
            Limpiar Búsqueda
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && books.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Buscando libros...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;