import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { BookOpen, Mail, Lock, Loader2 } from 'lucide-react';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/use-toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email || !formData.password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast({
          title: t('auth.messages.loginSuccess'),
          description: t('auth.messages.loginSuccessDesc', { name: result.user.name }),
        });
        navigate('/dashboard');
      } else {
        setError(result.error || t('auth.messages.loginError'));
      }
    } catch (error) {
      setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = (result) => {
    toast({
      title: t('auth.messages.googleSuccess'),
      description: t('auth.messages.googleSuccessDesc', { name: result.user.name }),
    });
    navigate('/dashboard');
  };

  const handleGoogleError = (error) => {
    setError(error.message || t('auth.messages.googleError'));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">{t('app.name')}</span>
          </Link>
          <h1 className="text-3xl font-bold">{t('auth.login.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('auth.login.subtitle')}
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">{t('auth.login.welcomeBack')}</CardTitle>
            <CardDescription className="text-center">
              {t('auth.login.description')}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Google Login Button */}
            <GoogleAuthButton
              mode="login"
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              disabled={isLoading}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t('auth.login.continueWithEmail')}
                </span>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.login.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t('auth.login.emailPlaceholder')}
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.login.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder={t('auth.login.passwordPlaceholder')}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.login.signingIn')}
                  </>
                ) : (
                  t('auth.login.title')
                )}
              </Button>
            </form>

            {/* Forgot Password Link */}
            <div className="text-center">
              <Link 
                to="/forgot-password" 
                className="text-sm text-primary hover:underline"
              >
                {t('auth.login.forgotPassword')}
              </Link>
            </div>
          </CardContent>

          <CardFooter>
            <div className="text-center text-sm text-muted-foreground w-full">
              {t('auth.login.noAccount')}{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                {t('auth.login.registerHere')}
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Demo Credentials */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t('auth.login.demo.title')}
              </h3>
              <div className="text-xs space-y-1">
                <p><strong>Email:</strong> {t('auth.login.demo.email')}</p>
                <p><strong>{t('auth.login.password')}:</strong> {t('auth.login.demo.password')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Link 
            to="/" 
            className="text-sm text-muted-foreground hover:text-primary"
          >
            {t('auth.login.backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;