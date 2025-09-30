import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { useAuth } from '../../context/AuthContext';
import { useBooks } from '../../context/BooksContext';
import { Search, BookOpen, User, Settings, LogOut, Moon, Sun, Library, Plus } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

const Header = ({ theme, setTheme }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { getReadingStats } = useBooks();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const stats = isAuthenticated ? getReadingStats() : null;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isPublicRoute = location.pathname === '/' || location.pathname === '/search';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">{t('app.name')}</span>
            </Link>
            
            {/* Public Navigation */}
            {!isAuthenticated && (
              <nav className="hidden md:flex items-center space-x-4">
                <Link 
                  to="/" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {t('navigation.home')}
                </Link>
                <Link 
                  to="/search" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === '/search' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {t('navigation.search')}
                </Link>
              </nav>
            )}

            {/* Private Navigation */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center space-x-4">
                <Link 
                  to="/dashboard" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {t('navigation.dashboard')}
                </Link>
                <Link 
                  to="/library" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === '/library' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {t('navigation.library')}
                </Link>
                <Link 
                  to="/search" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === '/search' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {t('navigation.search')}
                </Link>
              </nav>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <LanguageSelector />
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Reading Stats for authenticated users */}
            {isAuthenticated && stats && (
              <div className="hidden lg:flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {stats.readBooks} {t('books.categories.read').toLowerCase()}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {stats.readingBooks} {t('books.categories.reading').toLowerCase()}
                </Badge>
              </div>
            )}

            {/* Authentication Actions */}
            {!isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" onClick={() => navigate('/login')}>
                  {t('navigation.login')}
                </Button>
                <Button onClick={() => navigate('/register')}>
                  {t('navigation.register')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Quick Add Book Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/search')}
                  className="hidden md:flex"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('books.actions.addToLibrary')}
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback>
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <Library className="mr-2 h-4 w-4" />
                      <span>{t('navigation.dashboard')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>{t('navigation.profile')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>{t('navigation.settings')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t('navigation.logout')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {(isPublicRoute || isAuthenticated) && (
          <div className="md:hidden border-t py-2">
            <nav className="flex items-center justify-center space-x-4">
              {!isAuthenticated ? (
                <>
                  <Link 
                    to="/" 
                    className="text-sm font-medium text-muted-foreground hover:text-primary"
                  >
                    {t('navigation.home')}
                  </Link>
                  <Link 
                    to="/search" 
                    className="text-sm font-medium text-muted-foreground hover:text-primary"
                  >
                    {t('navigation.search')}
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/dashboard" 
                    className="text-sm font-medium text-muted-foreground hover:text-primary"
                  >
                    {t('navigation.dashboard')}
                  </Link>
                  <Link 
                    to="/library" 
                    className="text-sm font-medium text-muted-foreground hover:text-primary"
                  >
                    {t('navigation.library')}
                  </Link>
                  <Link 
                    to="/search" 
                    className="text-sm font-medium text-muted-foreground hover:text-primary"
                  >
                    {t('navigation.search')}
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;