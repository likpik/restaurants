import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm();

  const watchPassword = watch('password');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    const success = await registerUser(data.username, data.email, data.password);
    if (success) {
      navigate('/');
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
            <UserPlus size={32} />
            <h2>Utwórz konto</h2>
            <p>Dołącz do naszej społeczności restauracji</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Nazwa użytkownika</label>
              <div className="input-container">
                <User size={20} />
                <input
                  id="username"
                  type="text"
                  placeholder="Wybierz nazwę użytkownika"
                  {...register('username', {
                    required: 'Nazwa użytkownika jest wymagana',
                    minLength: {
                      value: 3,
                      message: 'Nazwa użytkownika musi mieć co najmniej 3 znaki'
                    },
                    maxLength: {
                      value: 30,
                      message: 'Nazwa użytkownika nie może przekraczać 30 znaków'
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: 'Nazwa użytkownika może zawierać tylko litery, cyfry i podkreślenia'
                    }
                  })}
                  className={errors.username ? 'error' : ''}
                />
              </div>
              {errors.username && (
                <span className="error-message">{errors.username.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Adres e-mail</label>
              <div className="input-container">
                <Mail size={20} />
                <input
                  id="email"
                  type="email"
                  placeholder="Wpisz swój e-mail"
                  {...register('email', {
                    required: 'E-mail jest wymagany',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Nieprawidłowy adres e-mail'
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
                  placeholder="Utwórz hasło"
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
                  aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <span className="error-message">{errors.password.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Potwierdź hasło</label>
              <div className="input-container">
                <Lock size={20} />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Potwierdź hasło"
                  {...register('confirmPassword', {
                    required: 'Proszę potwierdzić hasło',
                    validate: value =>
                      value === watchPassword || 'Hasła nie są zgodne'
                  })}
                  className={errors.confirmPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword.message}</span>
              )}
            </div>

            <div className="form-terms">
              <p>
                Tworząc konto, akceptujesz nasze warunki korzystania z serwisu oraz politykę prywatności.
              </p>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingSpinner size="small" /> : 'Utwórz konto'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Masz już konto?{' '}
              <Link to="/login" className="auth-link">
                Zaloguj się tutaj
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
