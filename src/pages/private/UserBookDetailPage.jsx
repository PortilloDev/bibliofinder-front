import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Progress } from '../../components/ui/progress';
import { Input } from '../../components/ui/input';
import { 
  ArrowLeft, 
  Star, 
  BookOpen, 
  Calendar, 
  User, 
  Building, 
  Hash,
  Edit3,
  Save,
  X,
  Trash2,
  Clock,
  CheckCircle,
  Heart,
  FileText,
  TrendingUp,
  Award,
  Loader2,
  Eye
} from 'lucide-react';
import RelatedBooks from '../../components/books/RelatedBooks';
import imageCache from '../../utils/imageCache';
import { useAuth } from '../../context/AuthContext';
import { useBooks } from '../../context/BooksContext';
import { useCategories } from '../../context/CategoriesContext';
import { useToast } from '../../hooks/use-toast';

const UserBookDetailPage = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    userBooks, 
    updateBook, 
    updateBookNotes, 
    updateBookRating, 
    updateBookProgress,
    updateBookReview,
    moveBookToCategory,
    removeBookFromLibrary
  } = useBooks();
  const { categories } = useCategories();

  const [userBook, setUserBook] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingReview, setEditingReview] = useState(false);
  const [editingProgress, setEditingProgress] = useState(false);
  const [tempNotes, setTempNotes] = useState('');
  const [tempReview, setTempReview] = useState('');
  const [tempProgress, setTempProgress] = useState(0);
  const [tempRating, setTempRating] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadUserBook();
  }, [bookId, userBooks]);

  useEffect(() => {
    if (userBook) {
      loadBookImage();
      setTempNotes(userBook.notes || '');
      setTempReview(userBook.personalReview || '');
      setTempProgress(userBook.progress || 0);
      setTempRating(userBook.rating || 0);
    }
  }, [userBook]);

  const loadUserBook = () => {
    setIsLoading(true);
    const book = userBooks.find(b => b.id === bookId);
    if (book) {
      setUserBook(book);
    } else {
      // Book not found, redirect to library
      navigate('/library');
    }
    setIsLoading(false);
  };

  const loadBookImage = async () => {
    if (userBook && userBook.imageLinks) {
      const url = imageCache.getOptimizedImageUrl(userBook.imageLinks, 'large');
      if (url) {
        const cachedUrl = await imageCache.getCachedImage(url);
        setImageUrl(cachedUrl);
      }
    }
    
    if (!imageUrl) {
      setImageUrl(imageCache.getPlaceholderImage());
    }
  };

  const handleSaveNotes = async () => {
    setIsUpdating(true);
    try {
      const result = await updateBookNotes(bookId, tempNotes);
      if (result.success) {
        setEditingNotes(false);
        toast({
          title: t('common.success'),
          description: 'Notes updated successfully',
        });
        loadUserBook(); // Refresh data
      } else {
        toast({
          title: t('common.error'),
          description: result.error || 'Failed to update notes',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      toast({
        title: t('common.error'),
        description: 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveReview = async () => {
    setIsUpdating(true);
    try {
      const result = await updateBookReview(bookId, tempReview, tempRating);
      if (result.success) {
        setEditingReview(false);
        toast({
          title: t('common.success'),
          description: 'Review updated successfully',
        });
        loadUserBook(); // Refresh data
      } else {
        toast({
          title: t('common.error'),
          description: result.error || 'Failed to update review',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating review:', error);
      toast({
        title: t('common.error'),
        description: 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveProgress = async () => {
    setIsUpdating(true);
    try {
      const result = await updateBookProgress(bookId, tempProgress);
      if (result.success) {
        setEditingProgress(false);
        toast({
          title: t('common.success'),
          description: 'Progress updated successfully',
        });
        loadUserBook(); // Refresh data
      } else {
        toast({
          title: t('common.error'),
          description: result.error || 'Failed to update progress',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: t('common.error'),
        description: 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCategoryChange = async (newCategoryId) => {
    setIsUpdating(true);
    try {
      const result = await moveBookToCategory(bookId, newCategoryId);
      if (result.success) {
        toast({
          title: t('common.success'),
          description: 'Category updated successfully',
        });
        loadUserBook(); // Refresh data
      } else {
        toast({
          title: t('common.error'),
          description: result.error || 'Failed to update category',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: t('common.error'),
        description: 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveBook = async () => {
    if (!window.confirm('Are you sure you want to remove this book from your library?')) {
      return;
    }

    setIsUpdating(true);
    try {
      const result = await removeBookFromLibrary(bookId);
      if (result.success) {
        toast({
          title: t('common.success'),
          description: 'Book removed from library',
        });
        navigate('/library');
      } else {
        toast({
          title: t('common.error'),
          description: result.error || 'Failed to remove book',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error removing book:', error);
      toast({
        title: t('common.error'),
        description: 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const renderStars = (rating, onRatingChange = null) => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      const filled = i <= rating;
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => onRatingChange && onRatingChange(i)}
          disabled={!onRatingChange}
          className={`${onRatingChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
        >
          <Star className={`h-5 w-5 ${filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
        </button>
      );
    }

    return stars;
  };

  const getProgressColor = (progress) => {
    if (progress === 0) return 'bg-gray-200';
    if (progress < 25) return 'bg-red-500';
    if (progress < 50) return 'bg-orange-500';
    if (progress < 75) return 'bg-yellow-500';
    if (progress < 100) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (categoryId) => {
    switch (categoryId) {
      case 'reading': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'read': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'favorites': return <Heart className="h-4 w-4 text-red-500" />;
      default: return <BookOpen className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading || !userBook) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/library')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Book Header with Personal Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Book Cover */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  <div className="w-48 h-72 rounded-lg overflow-hidden bg-muted shadow-lg">
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={userBook.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>

                {/* Book Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{userBook.title}</h1>
                    {userBook.authors && userBook.authors.length > 0 && (
                      <p className="text-lg text-muted-foreground">
                        by {userBook.authors.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Personal Status */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(userBook.categoryId)}
                      <Select
                        value={userBook.categoryId}
                        onValueChange={handleCategoryChange}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
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

                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`/book/${userBook.source}/${userBook.external_book_id || userBook.id.split('_')[1]}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Public View
                    </Button>
                  </div>

                  {/* Personal Rating */}
                  <div className="space-y-2">
                    <Label>My Rating</Label>
                    <div className="flex items-center space-x-2">
                      {renderStars(tempRating, (rating) => {
                        setTempRating(rating);
                        updateBookRating(bookId, rating);
                      })}
                      {tempRating > 0 && (
                        <span className="text-sm text-muted-foreground">
                          ({tempRating}/5)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reading Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Reading Progress</Label>
                      {!editingProgress ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingProgress(true)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingProgress(false);
                              setTempProgress(userBook.progress || 0);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSaveProgress}
                            disabled={isUpdating}
                          >
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {editingProgress ? (
                      <div className="space-y-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={tempProgress}
                          onChange={(e) => setTempProgress(parseInt(e.target.value) || 0)}
                          placeholder="Progress %"
                        />
                        <Progress value={tempProgress} className="w-full" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Progress value={userBook.progress || 0} className="w-full" />
                        <p className="text-sm text-muted-foreground">
                          {userBook.progress || 0}% complete
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Reading Dates */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Started</Label>
                      <p className="text-muted-foreground">{formatDate(userBook.startedAt)}</p>
                    </div>
                    <div>
                      <Label>Finished</Label>
                      <p className="text-muted-foreground">{formatDate(userBook.finishedAt)}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4">
                    <Button 
                      variant="destructive" 
                      onClick={handleRemoveBook}
                      disabled={isUpdating}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove from Library
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>My Notes</span>
                </CardTitle>
                {!editingNotes ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingNotes(true)}
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingNotes(false);
                        setTempNotes(userBook.notes || '');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingNotes ? (
                <Textarea
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder="Add your personal notes about this book..."
                  rows={6}
                  className="resize-none"
                />
              ) : (
                <div className="min-h-[120px]">
                  {userBook.notes ? (
                    <p className="text-muted-foreground whitespace-pre-wrap">{userBook.notes}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No notes yet. Click Edit to add your thoughts.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Review */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>My Review</span>
                </CardTitle>
                {!editingReview ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingReview(true)}
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingReview(false);
                        setTempReview(userBook.personalReview || '');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveReview}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingReview ? (
                <Textarea
                  value={tempReview}
                  onChange={(e) => setTempReview(e.target.value)}
                  placeholder="Write your review of this book..."
                  rows={6}
                  className="resize-none"
                />
              ) : (
                <div className="min-h-[120px]">
                  {userBook.personalReview ? (
                    <p className="text-muted-foreground whitespace-pre-wrap">{userBook.personalReview}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No review yet. Click Edit to share your thoughts.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Book Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Book Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              {userBook.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {userBook.description}
                  </p>
                </div>
              )}

              <Separator />

              {/* Metadata */}
              <div className="grid md:grid-cols-2 gap-4">
                {userBook.publishedDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Published</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(userBook.publishedDate).getFullYear()}
                      </p>
                    </div>
                  </div>
                )}

                {userBook.publisher && (
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Publisher</p>
                      <p className="text-sm text-muted-foreground">{userBook.publisher}</p>
                    </div>
                  </div>
                )}

                {userBook.pageCount > 0 && (
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Pages</p>
                      <p className="text-sm text-muted-foreground">
                        {userBook.pageCount.toLocaleString()} pages
                      </p>
                    </div>
                  </div>
                )}

                {userBook.isbn && (
                  <div className="flex items-center space-x-3">
                    <Hash className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">ISBN</p>
                      <p className="text-sm text-muted-foreground font-mono">{userBook.isbn}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Added to library date */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Added to library on {formatDate(userBook.addedAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reading Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Reading Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Progress</span>
                  <span className="text-sm font-medium">{userBook.progress || 0}%</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm">My Rating</span>
                  <div className="flex items-center space-x-1">
                    {userBook.rating > 0 ? (
                      <>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{userBook.rating}</span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not rated</span>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm">Category</span>
                  <Badge variant="secondary" className="text-xs">
                    {categories.find(c => c.id === userBook.categoryId)?.name || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Books */}
          <RelatedBooks book={userBook} variant="related" />
        </div>
      </div>
    </div>
  );
};

export default UserBookDetailPage;