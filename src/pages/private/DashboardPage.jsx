import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { BookOpen, TrendingUp, Heart, Clock, Plus, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBooks } from '../../context/BooksContext';
import { useCategories } from '../../context/CategoriesContext';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { getReadingStats, userBooks } = useBooks();
  const { categories } = useCategories();
  
  const stats = getReadingStats();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {t('dashboard.welcome', { name: user?.name })}
        </h1>
        <p className="text-muted-foreground">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.stats.totalBooks')}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBooks}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.stats.totalBooksDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.stats.readBooks')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.readBooks}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.stats.readBooksDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.stats.readingNow')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.readingBooks}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.stats.readingNowDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.stats.favorites')}</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.favoriteBooks}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.stats.favoritesDesc')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {userBooks.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{t('dashboard.recentActivity.empty.title')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('dashboard.recentActivity.empty.description')}
                </p>
                <Button onClick={() => navigate('/search')}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('dashboard.recentActivity.empty.action')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {userBooks.slice(0, 5).map((book) => (
                  <div key={book.id} className="flex items-center space-x-3">
                    <div className="w-8 h-12 bg-muted rounded flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {book.authors?.join(', ')}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {categories.find(c => c.id === book.categoryId)?.name || 'Sin categoría'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/search')}
            >
              <Search className="mr-2 h-4 w-4" />
              {t('dashboard.quickActions.searchBooks')}
            </Button>
            
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/library')}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              {t('dashboard.quickActions.viewLibrary')}
            </Button>
            
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/import')}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('dashboard.quickActions.importExcel')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;