import React, { useState, useEffect, useRef } from 'react';
import { useUserStore } from '../../stores/userStore';
import { UserRole } from '../../types/user';
import { Building2, User, LogIn, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Logo } from '../layout/Logo';
import { resetAllStores } from '../../utils/resetStores';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { checkDatabaseState } from '../../utils/checkDatabaseState';

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [productionName, setProductionName] = useState('');
  const [productionAddress, setProductionAddress] = useState('');
  const [productionLogo, setProductionLogo] = useState<string>('');
  const [productionTerms, setProductionTerms] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { createUser, loginUser, loadUserData } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset all stores and check database state on component mount
  useEffect(() => {
    resetAllStores();
    
    const verifyDatabaseState = async () => {
      setIsInitialLoading(true);
      const state = await checkDatabaseState();
      if (state.success && !state.isOffline) {
        console.log('Database state:', state.counts);
      } else if (state.isOffline) {
        console.log('Application running in offline mode');
      }
      setIsInitialLoading(false);
    };
    
    verifyDatabaseState();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProductionLogo(imageUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await loginUser(email, password);
        if (result.success) {
          // Load user data to ensure we have the latest production info
          await loadUserData();
          onSuccess();
        } else {
          setError(result.error || 'Erreur de connexion');
        }
      } else {
        if (role === 'production' && !productionName.trim()) {
          setError('Le nom de la production est requis');
          setIsLoading(false);
          return;
        }

        const result = await createUser({
          email,
          password,
          firstName,
          lastName,
          phoneNumber,
          role,
          productionName: role === 'production' ? productionName : undefined,
          productionAddress: role === 'production' ? productionAddress : undefined,
          productionLogo: role === 'production' ? productionLogo : undefined,
          productionTerms: role === 'production' ? productionTerms : undefined
        });

        if ('error' in result) {
          setError(result.error);
        } else {
          onSuccess();
        }
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError('Une erreur est survenue lors de la soumission du formulaire');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Se connecter' : 'Créer un compte'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? (
              <>
                Pas encore de compte ?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Créer un compte
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Se connecter
                </button>
              </>
            )}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              {/* Account type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`w-full flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      role === 'user'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <User size={24} />
                    <span className="text-sm font-medium">Utilisateur</span>
                  </button>
                  {/* User tooltip */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full w-64 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Je peux modifier les devis auxquels j'ai accès et en créer au nom de la production si j'y suis autorisé.
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                </div>

                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => setRole('production')}
                    className={`w-full flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      role === 'production'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Building2 size={24} />
                    <span className="text-sm font-medium">Production</span>
                  </button>
                  {/* Production tooltip */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full w-64 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Je gère tous les projets de ma structure et les délègue librement.
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                </div>
              </div>

              {/* Personal information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="sr-only">Prénom</label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Prénom"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="sr-only">Nom</label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Nom"
                  />
                </div>
              </div>

              {/* Phone number */}
              <div>
                <label htmlFor="phoneNumber" className="sr-only">Numéro de téléphone</label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Numéro de téléphone"
                />
              </div>

              {/* Production information */}
              {role === 'production' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="productionName" className="sr-only">Nom de la production</label>
                    <input
                      id="productionName"
                      name="productionName"
                      type="text"
                      required
                      value={productionName}
                      onChange={(e) => setProductionName(e.target.value)}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="Nom de la production"
                    />
                  </div>

                  <div>
                    <label htmlFor="productionAddress" className="sr-only">Adresse postale</label>
                    <textarea
                      id="productionAddress"
                      name="productionAddress"
                      required
                      value={productionAddress}
                      onChange={(e) => setProductionAddress(e.target.value)}
                      rows={3}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="Adresse postale complète"
                    />
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex items-start gap-4">
                      {productionLogo && (
                        <div className="relative group">
                          <img
                            src={productionLogo}
                            alt="Logo"
                            className="w-24 h-24 object-contain border rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setProductionLogo('')}
                            className="absolute top-1 right-1 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                      <div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          {productionLogo ? 'Changer le logo' : 'Ajouter un logo'}
                        </button>
                        <p className="mt-1 text-xs text-gray-500">
                          Format recommandé : PNG ou JPEG
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="productionTerms" className="sr-only">Conditions générales</label>
                    <textarea
                      id="productionTerms"
                      name="productionTerms"
                      value={productionTerms}
                      onChange={(e) => setProductionTerms(e.target.value)}
                      rows={4}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="Conditions générales de vente (optionnel)"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email"
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="sr-only">Mot de passe</label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm pr-10"
                placeholder="Mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff size={16} className="text-gray-400" />
                ) : (
                  <Eye size={16} className="text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {isLogin && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn size={16} className="text-blue-300" />
              </span>
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Chargement...
                </div>
              ) : (
                isLogin ? 'Se connecter' : 'Créer le compte'
              )}
            </button>
          </div>
        </form>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        email={email}
      />
    </div>
  );
}