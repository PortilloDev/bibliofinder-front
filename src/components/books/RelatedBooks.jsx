import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { BookOpen, Lightbulb, Users, TrendingUp, Loader2 } from 'lucide-react';
import BookCard from './BookCard';
import recommendationService from '../../services/RecommendationService';
import laravelBookService from '../../services/LaravelBookService';
import { useAuth } from '../../context/AuthContext';
import { useBooks } from '../../context/BooksContext';

const RelatedBooks = ({ book, variant = 'related' }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { userBooks } = useBooks();
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [criteria, setCriteria] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (book) {
      loadRelatedBooks();
    }
  }, [book, variant]);

  const loadRelatedBooks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let result;

      if (variant === 'recommendations' && isAuthenticated) {
        // Get personalized recommendations
        result = await laravelBookService.getPersonalizedRecommendations(8);
        if (!result.success) {
          // Fallback to local recommendation service
          result = await recommendationService.getPersonalizedRecommendations(userBooks, 8);
        }
      } else {
        // Get related books for specific book
        result = await laravelBookService.getRelatedBooks(book.id, 6);
        if (!result.success) {
          // Fallback to local recommendation service
          result = await recommendationService.getRelatedBooks(book, userBooks, 6);
        }
      }

      if (result.success) {
        setRelatedBooks(result.books || result.recommendations || []);
        setCriteria(result.criteria || []);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error loading related books:', error);
      setError('Failed to load related books');
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (variant) {
      case 'recommendations':
        return isAuthenticated 
          ? t('books.recommendations.personalized', 'Personalized Recommendations')
          : t('books.recommendations.popular', 'Popular Books');
      case 'related':
      default:
        return t('books.related.title', 'Related Books');
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'recommendations':
        return isAuthenticated ? <Lightbulb className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />;
      case 'related':
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const getDescription = () => {
    switch (variant) {
      case 'recommendations':
        return isAuthenticated
          ? t('books.recommendations.personalizedDesc', 'Books curated based on your reading history')
          : t('books.recommendations.popularDesc', 'Discover trending and highly-rated books');
      case 'related':
      default:
        return t('books.related.description', 'Books similar to this one');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getIcon()}
            <span>{getTitle()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">
              {t('common.loading', 'Loading...')}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getIcon()}
            <span>{getTitle()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={loadRelatedBooks}>
              {t('common.retry', 'Try Again')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (relatedBooks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getIcon()}
            <span>{getTitle()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {t('books.related.notFound', 'No related books found at this time.')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            {getIcon()}
            <span>{getTitle()}</span>
          </CardTitle>
          
          {variant === 'recommendations' && isAuthenticated && (
            <Button variant="ghost" size="sm" onClick={loadRelatedBooks}>
              <TrendingUp className="h-4 w-4 mr-2" />
              {t('books.recommendations.refresh', 'Refresh')}
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {getDescription()}
          </p>
          
          {criteria.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {criteria.slice(0, 3).map((criterion, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {criterion}
                </Badge>
              ))}
              {criteria.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{criteria.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {relatedBooks.slice(0, 6).map((relatedBook, index) => (
            <div key={`${relatedBook.source}_${relatedBook.id}_${index}`} className="relative">
              <BookCard
                book={relatedBook}
                variant="compact"
                className="h-full"
              />
              
              {/* Show recommendation reason for personalized recommendations */}
              {variant === 'recommendations' && relatedBook.recommendationReason && (
                <div className="absolute top-2 right-2">
                  <Badge 
                    variant="default" 
                    className="text-xs bg-primary/90 text-primary-foreground"
                    title={relatedBook.recommendationReason}
                  >
                    <Lightbulb className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Show more button if there are more books */}
        {relatedBooks.length > 6 && (
          <>
            <Separator className="my-4" />
            <div className="text-center">
              <Button variant="outline">
                <BookOpen className="h-4 w-4 mr-2" />
                {t('books.related.showMore', 'Show More Related Books')}
              </Button>
            </div>
          </>
        )}

        {/* Recommendation explanation for authenticated users */}
        {variant === 'recommendations' && isAuthenticated && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1">
                  {t('books.recommendations.howItWorks', 'How recommendations work')}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {t('books.recommendations.explanation', 
                    'We analyze your reading history, preferences, and similar users\' choices to suggest books you might enjoy.'
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RelatedBooks;