import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Star, BookOpen, Plus, MoreVertical, Heart, Eye, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBooks } from '../../context/BooksContext';
import { useCategories } from '../../context/CategoriesContext';
import imageCache from '../../utils/imageCache';
import { cn } from '../../lib/utils';

const BookCard = ({ book, variant = 'search', onAddToLibrary, onViewDetails, className }) => {
  const { isAuthenticated } = useAuth();
  const { addBookToLibrary, userBooks, moveBookToCategory, updateBookNotes } = useBooks();
  const { categories } = useCategories();
  const [imageUrl, setImageUrl] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('to-read');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if book is already in user library
  const userBook = userBooks.find(ub => 
    ub.id === `${book.source}_${book.id}` || 
    (ub.isbn && book.isbn && ub.isbn === book.isbn) ||
    (ub.title === book.title && ub.authors?.[0] === book.authors?.[0])
  );

  const isInLibrary = Boolean(userBook);

  // Load cached image
  useEffect(() => {
    const loadImage = async () => {
      const url = imageCache.getOptimizedImageUrl(book.imageLinks, 'small');
      if (url) {
        const cachedUrl = await imageCache.getCachedImage(url);
        setImageUrl(cachedUrl);
      } else {
        setImageUrl(imageCache.getPlaceholderImage());
      }
    };

    loadImage();
  }, [book.imageLinks]);

  const handleAddToLibrary = async () => {
    if (!isAuthenticated) {
      // Redirect to login or show auth modal
      return;
    }

    setIsLoading(true);
    try {
      const result = await addBookToLibrary(book, selectedCategory, notes);
      if (result.success) {
        setIsAddDialogOpen(false);
        setNotes('');
        if (onAddToLibrary) {
          onAddToLibrary(book);
        }
      }
    } catch (error) {
      console.error('Error adding book to library:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveToCategory = async (newCategoryId) => {
    if (userBook) {
      await moveBookToCategory(userBook.id, newCategoryId);
    }
  };

  const getCategoryIcon = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || '📚';
  };

  const getCategoryColor = (categoryId) => {
    switch (categoryId) {
      case 'reading': return 'bg-green-500';
      case 'read': return 'bg-purple-500';
      case 'favorites': return 'bg-red-500';
      case 'wishlist': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="h-3 w-3 fill-yellow-400/50 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="h-3 w-3 text-gray-300" />);
      }
    }

    return stars;
  };

  return (
    <Card className={cn("group hover:shadow-lg transition-all duration-200", className)}>
      <CardContent className="p-4">
        <div className="flex space-x-3">
          {/* Book Cover */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-24 md:w-20 md:h-28 rounded-md overflow-hidden bg-muted">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
            </div>
            
            {/* Library Status Indicator */}
            {isInLibrary && (
              <div 
                className={cn(
                  "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                  getCategoryColor(userBook.categoryId)
                )}
                title={`En ${categories.find(c => c.id === userBook.categoryId)?.name || 'Biblioteca'}`}
              >
                <span className="text-white text-xs flex items-center justify-center w-full h-full">
                  {getCategoryIcon(userBook.categoryId)}
                </span>
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm md:text-base line-clamp-2 mb-1">
                  {book.title}
                </h3>
                
                {book.authors && book.authors.length > 0 && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {book.authors.join(', ')}
                  </p>
                )}

                {/* Rating */}
                {book.averageRating > 0 && (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex items-center space-x-1">
                      {renderStars(book.averageRating)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ({book.averageRating}) · {book.ratingsCount || 0} reseñas
                    </span>
                  </div>
                )}

                {/* Categories */}
                {book.categories && book.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {book.categories.slice(0, 2).map((category, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                    {book.categories.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{book.categories.length - 2}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Description */}
                {book.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {book.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                  {book.publishedDate && (
                    <span>{new Date(book.publishedDate).getFullYear()}</span>
                  )}
                  {book.pageCount > 0 && (
                    <span>{book.pageCount} págs.</span>
                  )}
                  {book.language && (
                    <Badge variant="outline" className="text-xs">
                      {book.language.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Menu */}
              {isAuthenticated && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!isInLibrary ? (
                      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Añadir a Biblioteca
                          </DropdownMenuItem>
                        </DialogTrigger>
                      </Dialog>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => handleMoveToCategory('reading')}>
                          <BookOpen className="mr-2 h-4 w-4" />
                          Marcar como Leyendo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMoveToCategory('read')}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marcar como Leído
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMoveToCategory('favorites')}>
                          <Heart className="mr-2 h-4 w-4" />
                          Añadir a Favoritos
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuItem onClick={() => onViewDetails && onViewDetails(book)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalles
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Quick Actions Footer for non-library books */}
      {!isInLibrary && isAuthenticated && variant === 'search' && (
        <CardFooter className="p-3 pt-0">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Añadir a Biblioteca
              </Button>
            </DialogTrigger>
          </Dialog>
        </CardFooter>
      )}

      {/* Add to Library Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Añadir a Biblioteca</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex space-x-3">
              <div className="w-12 h-18 rounded bg-muted flex-shrink-0">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={book.title}
                    className="w-full h-full object-cover rounded"
                  />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-sm">{book.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {book.authors?.join(', ')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="flex items-center space-x-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Añade tus notas sobre este libro..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddToLibrary} disabled={isLoading}>
                {isLoading ? 'Añadiendo...' : 'Añadir'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BookCard;