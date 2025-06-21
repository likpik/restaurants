import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/Login.css';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login, forgotPassword, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm();

  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    formState: { errors: errorsForgot, isSubmitting: isSubmittingForgot },
    reset: resetForgotForm
  } = useForm();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    const success = await login(data.email, data.password);
    if (success) {
      navigate('/');
    }
  };

  const onForgotPasswordSubmit = async (data) => {
    try {
      await forgotPassword(data.email);
      resetForgotForm();
      setShowForgotPassword(false);
    } catch (error) {
      // Error is handled in the context
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <LogIn size={32} />
            <h2>Witaj ponownie</h2>
            <p>Zaloguj się</p>
          </div>

          {!showForgotPassword ? (
            <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Adres e-mail</label>
                <div className="input-container">
                  <Mail size={20} />
                  <input
                    id="email"
                    type="email"
                    placeholder="Wprowadź swój e-mail"
                    {...register('email', {
                      required: 'E-mail jest wymagany',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Niepoprawny adres e-mail'
                      }
                    })}
                    className={errors.email ? 'error' : ''}
                  />
                </div>
                {errors.email && (
                  <span className="error-message">{errors.email.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">Hasło</label>
                <div className="input-container">
                  <Lock size={20} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Wprowadź hasło"
                    {...register('password', {
                      required: 'Hasło jest wymagane',
                      minLength: {
                        value: 6,
                        message: 'Hasło musi mieć co najmniej 6 znaków'
                      }
                    })}
                    className={errors.password ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="error-message">{errors.password.message}</span>
                )}
              </div>

              <button
                type="button"
                className="forgot-password"
                onClick={() => setShowForgotPassword(true)}
              >
                Zapomniałeś hasła?
              </button>

              <button
                type="submit"
                className="auth-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? <LoadingSpinner size="small" /> : 'Zaloguj się'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitForgot(onForgotPasswordSubmit)} className="auth-form">
              <div className="forgot-password-header">
                <h3>Zresetuj hasło</h3>
                <p>Wprowadź swój adres e-mail, a my wyślemy link do resetu.</p>
              </div>

              <div className="form-group">
                <label htmlFor="forgotEmail">Adres e-mail</label>
                <div className="input-container">
                  <Mail size={20} />
                  <input
                    id="forgotEmail"
                    type="email"
                    placeholder="Wprowadź swój e-mail"
                    {...registerForgot('email', {
                      required: 'E-mail jest wymagany',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Nieprawidłowy adres e-mail'
                      }
                    })}
                    className={errorsForgot.email ? 'error' : ''}
                  />
                </div>
                {errorsForgot.email && (
                  <span className="error-message">{errorsForgot.email.message}</span>
                )}
              </div>

              <div className="forgot-password-actions">
                <button
                  type="button"
                  className="auth-secondary"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Wróć do logowania
                </button>
                <button
                  type="submit"
                  className="auth-submit"
                  disabled={isSubmittingForgot}
                >
                  {isSubmittingForgot ? <LoadingSpinner size="small" /> : 'Wyślij link do resetu'}
                </button>
              </div>
            </form>
          )}

          <div className="auth-footer">
            <p>
              Nie masz konta?{' '}
              <Link to="/register" className="auth-link">
                Zarejestruj się tutaj
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;