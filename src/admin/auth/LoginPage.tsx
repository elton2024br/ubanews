import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminProvider';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2, Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage: React.FC = () => {
  const { user, login, loading } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    otp?: string;
  }>({});

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Função para validar email
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email é obrigatório';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Email deve ter um formato válido';
    }
    if (email.length > 254) {
      return 'Email muito longo';
    }
    return undefined;
  };

  // Função para validar senha
  const validatePassword = (password: string): string | undefined => {
    if (!password.trim()) {
      return 'Senha é obrigatória';
    }
    if (password.length < 6) {
      return 'Senha deve ter pelo menos 6 caracteres';
    }
    if (password.length > 128) {
      return 'Senha muito longa';
    }
    return undefined;
  };

  // Função para validar código 2FA
  const validateOTP = (otp: string): string | undefined => {
    if (otp && !/^\d{6}$/.test(otp)) {
      return 'Código 2FA deve conter exatamente 6 dígitos';
    }
    return undefined;
  };

  // Função para validar todos os campos
  const validateForm = (): boolean => {
    console.log('[LoginPage] Iniciando validação do formulário');
    
    const errors = {
      email: validateEmail(email),
      password: validatePassword(password),
      otp: validateOTP(otp)
    };
    
    setValidationErrors(errors);
    
    const hasErrors = Object.values(errors).some(error => error !== undefined);
    
    if (hasErrors) {
      console.log('[LoginPage] Erros de validação encontrados:', errors);
      toast.error('Por favor, corrija os erros no formulário');
    } else {
      console.log('[LoginPage] Formulário válido');
    }
    
    return !hasErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[LoginPage] Iniciando processo de login:', {
      email: email.substring(0, 3) + '***',
      hasPassword: !!password,
      hasOTP: !!otp
    });
    
    setError('');
    setValidationErrors({});
    
    // Validar formulário antes de enviar
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      console.log('[LoginPage] Chamando função de login...');
      const result = await login(email.trim(), password, otp.trim() || undefined);
      
      if (result.success) {
        console.log('[LoginPage] Login bem-sucedido');
        toast.success('Login realizado com sucesso!');
      } else {
        console.error('[LoginPage] Falha no login:', result.error);
        setError(result.error || 'Erro ao fazer login');
        toast.error('Falha no login');
      }
    } catch (err: unknown) {
      console.error('[LoginPage] Erro crítico durante login:', err);
      
      let errorMessage = 'Erro interno do servidor';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      toast.error('Falha no login');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">UbaNews Admin</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Entrar no Sistema</CardTitle>
              <CardDescription className="text-center">
                Acesse o painel administrativo do UbaNews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      // Limpar erro de validação quando o usuário começar a digitar
                      if (validationErrors.email) {
                        setValidationErrors(prev => ({ ...prev, email: undefined }));
                      }
                    }}
                    className={validationErrors.email ? 'border-red-500 focus:ring-red-500' : ''}
                    required
                    disabled={isSubmitting}
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        // Limpar erro de validação quando o usuário começar a digitar
                        if (validationErrors.password) {
                          setValidationErrors(prev => ({ ...prev, password: undefined }));
                        }
                      }}
                      className={validationErrors.password ? 'border-red-500 focus:ring-red-500' : ''}
                      required
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {validationErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Código 2FA (opcional)</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Digite o código de 6 dígitos"
                    value={otp}
                    onChange={(e) => {
                      // Permitir apenas números
                      const value = e.target.value.replace(/\D/g, '');
                      setOtp(value);
                      // Limpar erro de validação quando o usuário começar a digitar
                      if (validationErrors.otp) {
                        setValidationErrors(prev => ({ ...prev, otp: undefined }));
                      }
                    }}
                    className={validationErrors.otp ? 'border-red-500 focus:ring-red-500' : ''}
                    maxLength={6}
                    disabled={isSubmitting}
                  />
                  {validationErrors.otp && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.otp}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !email || !password}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>

            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 text-center text-sm text-gray-500">
            © 2024 UbaNews. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;