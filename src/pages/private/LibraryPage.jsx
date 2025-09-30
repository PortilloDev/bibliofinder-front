import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { BookOpen, Search, Filter, Grid, List, Plus, Upload } from 'lucide-react';
import { useBooks } from '../../context/BooksContext';
import { useCategories } from '../../context/CategoriesContext';
import BookCard from '../../components/books/BookCard';
import { useNavigate } from 'react-router-dom';

const LibraryPage = () => {
  const navigate = useNavigate();
  const { userBooks, getBooksByCategory, searchUserBooks } = useBooks();
  const { categories } = useCategories();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  // Filter books based on search and category
  const filteredBooks = React.useMemo(() => {
    let books = userBooks;

    if (selectedCategory !== 'all') {
      books = getBooksByCategory(selectedCategory);
    }

    if (searchQuery.trim()) {
      books = searchUserBooks(searchQuery, {
        categoryId: selectedCategory !== 'all' ? selectedCategory : undefined
      });
    }

    return books;
  }, [userBooks, selectedCategory, searchQuery, getBooksByCategory, searchUserBooks]);

  const categoryWithCounts = React.useMemo(() => {
    return categories.map(category => ({
      ...category,
      count: getBooksByCategory(category.id).length
    }));
  }, [categories, getBooksByCategory]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mi Biblioteca</h1>
          <p className="text-muted-foreground">
            {userBooks.length} libros en tu colección
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate('/search')}>
            <Plus className="mr-2 h-4 w-4" />
            Añadir Libros
          </Button>
          <Button variant="outline" onClick={() => navigate('/import')}>
            <Upload className="mr-2 h-4 w-4" />
            Importar Excel
          </Button>
        </div>
      </div>

      {userBooks.length === 0 ? (
        /* Empty State */
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tu biblioteca está vacía</h3>
            <p className="text-muted-foreground mb-6">
              Comienza añadiendo algunos libros a tu colección personal
            </p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/search')} className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Buscar Libros
              </Button>
              <Button variant="outline" onClick={() => navigate('/import')} className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Importar desde Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Buscar en tu biblioteca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Todas las categorías ({userBooks.length})
                </SelectItem>
                {categoryWithCounts.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <span className="flex items-center space-x-2">
                      <span>{category.icon}</span>
                      <span>{category.name} ({category.count})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
              <TabsTrigger value="all">
                Todos ({userBooks.length})
              </TabsTrigger>
              {categories.slice(0, 4).map((category) => (
                <TabsTrigger key={category.id} value={category.id} className="hidden lg:flex">
                  {category.icon} {category.name} ({getBooksByCategory(category.id).length})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Results */}
          {filteredBooks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron libros</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? 'Intenta con otros términos de búsqueda'
                    : 'No hay libros en esta categoría'
                  }
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery('')}
                    className="mt-4"
                  >
                    Limpiar búsqueda
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {filteredBooks.length} libro{filteredBooks.length !== 1 ? 's' : ''} 
                  {searchQuery && ` encontrado${filteredBooks.length !== 1 ? 's' : ''} para "${searchQuery}"`}
                </p>
              </div>

              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1 max-w-4xl mx-auto'
              }`}>
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    variant="library"
                    className={viewMode === 'list' ? 'w-full' : ''}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default LibraryPage;