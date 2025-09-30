import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  ArrowLeft, 
  Star, 
  BookOpen, 
  Calendar, 
  User, 
  Building, 
  Hash,
  Plus,
  Heart,
  Share2,
  ExternalLink,
  Loader2,
  Eye
} from 'lucide-react';
import BookCard from '../../components/books/BookCard';
import RelatedBooks from '../../components/books/RelatedBooks';
import bookService from '../../services/BookService';
import imageCache from '../../utils/imageCache';
import { useAuth } from '../../context/AuthContext';
import { useBooks } from '../../context/BooksContext';
import { useCategories } from '../../context/CategoriesContext';
import { useToast } from '../../hooks/use-toast';

const BookDetailsPage = () => {
  const { source, id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { addBookToLibrary, userBooks } = useBooks();
  const { categories } = useCategories();

  const [book, setBook] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('to-read');
  const [notes, setNotes] = useState('');
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Check if book is already in user library
  const userBook = userBooks.find(ub => 
    ub.id === `${source}_${id}` || 
    (ub.isbn && book?.isbn && ub.isbn === book.isbn) ||
    (ub.title === book?.title && ub.authors?.[0] === book?.authors?.[0])
  );
  const isInLibrary = Boolean(userBook);

  useEffect(() => {
    loadBookDetails();
  }, [source, id]);

  useEffect(() => {
    if (book) {
      loadBookImage();
      if (isAuthenticated) {
        loadBookReviews();
      }
    }
  }, [book, isAuthenticated]);

  const loadBookDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await bookService.getBookDetails(id, source);
      
      if (result.success && result.book) {
        setBook(result.book);
      } else {
        setError(result.error || 'Book not found');
      }
    } catch (error) {
      console.error('Error loading book details:', error);
      setError('Failed to load book details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookImage = async () => {
    if (book && book.imageLinks) {
      const url = imageCache.getOptimizedImageUrl(book.imageLinks, 'large');
      if (url) {
        const cachedUrl = await imageCache.getCachedImage(url);
        setImageUrl(cachedUrl);
      }
    }
    
    if (!imageUrl) {
      setImageUrl(imageCache.getPlaceholderImage());
    }
  };

  const loadBookReviews = async () => {
    try {
      setIsLoadingReviews(true);
      // TODO: Implement with Laravel backend when available
      // const result = await laravelBookService.getBookReviews(book.id);
      
      // Mock reviews for now
      const mockReviews = [
        {
          id: 1,
          user_name: 'María García',
          rating: 5,
          review: 'Un libro excepcional que te mantiene enganchado desde la primera página.',
          created_at: '2024-01-15'
        },
        {
          id: 2,
          user_name: 'Carlos Ruiz',
          rating: 4,
          review: 'Muy buena narrativa, aunque el final podría haber sido mejor desarrollado.',
          created_at: '2024-01-10'
        }
      ];
      
      setReviews(mockReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleAddToLibrary = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsAddingToLibrary(true);
    try {
      const result = await addBookToLibrary(book, selectedCategory, notes);
      
      if (result.success) {
        setIsAddDialogOpen(false);
        setNotes('');
        toast({
          title: t('books.messages.added'),
          description: t('books.messages.addedDesc', { title: book.title }),
        });
      } else {
        toast({
          title: t('common.error'),
          description: result.error || 'Failed to add book to library',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding book to library:', error);
      toast({
        title: t('common.error'),
        description: 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setIsAddingToLibrary(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: `Check out "${book.title}" by ${book.authors?.join(', ')}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Book link copied to clipboard",
      });
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
      }
    }

    return stars;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Book Not Found</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/search')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Book Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Book Cover */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  <div className="w-48 h-72 rounded-lg overflow-hidden bg-muted shadow-lg">
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>

                {/* Book Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
                    {book.authors && book.authors.length > 0 && (
                      <p className="text-lg text-muted-foreground">
                        by {book.authors.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Rating */}
                  {book.averageRating > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {renderStars(book.averageRating)}
                      </div>
                      <span className="text-sm font-medium">{book.averageRating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({book.ratingsCount?.toLocaleString() || 0} {t('books.info.reviews')})
                      </span>
                    </div>
                  )}

                  {/* Categories */}
                  {book.categories && book.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {book.categories.slice(0, 5).map((category, index) => (
                        <Badge key={index} variant="secondary">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {!isInLibrary ? (
                      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="lg">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('books.actions.addToLibrary')}
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    ) : (
                      <div className="flex gap-3">
                        <Button variant="outline" size="lg" disabled>
                          <BookOpen className="mr-2 h-4 w-4" />
                          In Your Library
                        </Button>
                        
                        <Button 
                          size="lg" 
                          onClick={() => navigate(`/library/book/${userBook.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View My Copy
                        </Button>
                      </div>
                    )}

                    <Button variant="outline" size="lg" onClick={handleShare}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>

                    <Button variant="outline" size="lg" asChild>
                      <a 
                        href={`https://www.google.com/search?q=${encodeURIComponent(book.title + ' ' + book.authors?.[0])}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Search Online
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Book Details */}
          <Card>
            <CardHeader>
              <CardTitle>Book Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              {book.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {book.description}
                  </p>
                </div>
              )}

              <Separator />

              {/* Metadata */}
              <div className="grid md:grid-cols-2 gap-4">
                {book.publishedDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Published</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(book.publishedDate).getFullYear()}
                      </p>
                    </div>
                  </div>
                )}

                {book.publisher && (
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Publisher</p>
                      <p className="text-sm text-muted-foreground">{book.publisher}</p>
                    </div>
                  </div>
                )}

                {book.pageCount > 0 && (
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Pages</p>
                      <p className="text-sm text-muted-foreground">
                        {book.pageCount.toLocaleString()} {t('books.info.pages')}
                      </p>
                    </div>
                  </div>
                )}

                {book.isbn && (
                  <div className="flex items-center space-x-3">
                    <Hash className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">ISBN</p>
                      <p className="text-sm text-muted-foreground font-mono">{book.isbn}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Reviews (if authenticated) */}
          {isAuthenticated && (
            <Card>
              <CardHeader>
                <CardTitle>Community Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingReviews ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading reviews...</span>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map((review, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span className="text-sm font-medium">{review.user_name}</span>
                            {review.rating && (
                              <div className="flex items-center space-x-1">
                                {renderStars(review.rating)}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.review}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No reviews yet. Be the first to review this book!
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Related Books */}
          <RelatedBooks book={book} variant="related" />

          {/* Personalized Recommendations (if authenticated) */}
          {isAuthenticated && (
            <RelatedBooks variant="recommendations" />
          )}
        </div>
      </div>

      {/* Add to Library Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('books.actions.addToLibrary')}</DialogTitle>
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
              <Label htmlFor="category">{t('books.actions.selectCategory')}</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t('books.actions.selectCategory')} />
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
              <Label htmlFor="notes">{t('books.actions.optionalNotes')}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('books.actions.notesPlaceholder')}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleAddToLibrary} disabled={isAddingToLibrary}>
                {isAddingToLibrary ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('books.actions.adding')}
                  </>
                ) : (
                  t('common.add')
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookDetailsPage;