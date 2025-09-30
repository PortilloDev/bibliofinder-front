import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { BookOpen, Search, Users, Star, TrendingUp, Library, Heart, Upload, Zap } from 'lucide-react';
import BookCard from '../../components/books/BookCard';
import bookService from '../../services/BookService';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);

  useEffect(() => {
    loadFeaturedBooks();
  }, []);

  const loadFeaturedBooks = async () => {
    try {
      setIsLoadingBooks(true);
      const result = await bookService.getPopularBooks({ maxResults: 8 });
      if (result.success) {
        setFeaturedBooks(result.books);
      }
    } catch (error) {
      console.error('Error loading featured books:', error);
    } finally {
      setIsLoadingBooks(false);
    }
  };

  const features = [
    {
      icon: Library,
      title: t('landing.features.organize.title'),
      description: t('landing.features.organize.description'),
      color: 'text-blue-600'
    },
    {
      icon: Search,
      title: t('landing.features.search.title'),
      description: t('landing.features.search.description'),
      color: 'text-green-600'
    },
    {
      icon: Heart,
      title: t('landing.features.notes.title'),
      description: t('landing.features.notes.description'),
      color: 'text-red-600'
    },
    {
      icon: Upload,
      title: t('landing.features.import.title'),
      description: t('landing.features.import.description'),
      color: 'text-purple-600'
    },
    {
      icon: TrendingUp,
      title: t('landing.features.stats.title'),
      description: t('landing.features.stats.description'),
      color: 'text-orange-600'
    },
    {
      icon: Users,
      title: t('landing.features.community.title'),
      description: t('landing.features.community.description'),
      color: 'text-indigo-600'
    }
  ];

  const stats = [
    { label: t('landing.stats.booksAvailable'), value: '1M+', icon: BookOpen },
    { label: t('landing.stats.activeUsers'), value: '50K+', icon: Users },
    { label: t('landing.stats.reviewsWritten'), value: '200K+', icon: Star },
    { label: t('landing.stats.listsCreated'), value: '75K+', icon: Library }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-6">
              <Zap className="w-3 h-3 mr-1" />
              {t('app.tagline')}
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {t('landing.hero.title')}
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('landing.hero.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button size="lg" onClick={() => navigate('/register')} className="w-full sm:w-auto">
                <BookOpen className="mr-2 h-5 w-5" />
                {t('landing.hero.startFree')}
              </Button>
              
              <Button variant="outline" size="lg" onClick={() => navigate('/search')} className="w-full sm:w-auto">
                <Search className="mr-2 h-5 w-5" />
                {t('landing.hero.exploreBooks')}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-3">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('landing.features.title')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 bg-background/60 backdrop-blur">
                <CardHeader>
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-background mb-4 ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Books Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('landing.books.title')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('landing.books.subtitle')}
            </p>
          </div>

          {isLoadingBooks ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="h-64 animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-20 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredBooks.map((book) => (
                <BookCard
                  key={`${book.source}_${book.id}`}
                  book={book}
                  variant="featured"
                  onViewDetails={(book) => navigate(`/book/${book.source}/${book.id}`)}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" onClick={() => navigate('/search')}>
              <Search className="mr-2 h-5 w-5" />
              {t('landing.books.exploreMore')}
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('landing.cta.title')}
            </h2>
            <p className="text-xl mb-8 opacity-90">
              {t('landing.cta.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                {t('landing.cta.createAccount')}
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/search')}
                className="w-full sm:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                <Search className="mr-2 h-5 w-5" />
                {t('landing.cta.exploreWithout')}
              </Button>
            </div>

            <p className="text-sm mt-6 opacity-75">
              {t('landing.hero.noCredit')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;