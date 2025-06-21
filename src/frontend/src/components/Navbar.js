import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Plus, Search, Menu, X, UtensilsCrossed } from 'lucide-react';
import "../styles/Navbar.css";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          <UtensilsCrossed size={28} />
          <span>GdzieZjeść</span>
        </Link>

        <button className="hamburger-icon" onClick={toggleMenu} aria-label="Toggle menu">
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        <div className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>

          {isAuthenticated ? (
            <>
              <Link to="/add-restaurant" className="nav-link" onClick={closeMenu}>
                <Plus size={18} />
                Dodaj restaurację
              </Link>

              <Link to="/search-reviews" className="nav-link" onClick={closeMenu}>
                <Search size={18} />
                Wyszukaj recenzje
              </Link>

              <Link to="/profile" className="nav-link" onClick={closeMenu}>
                <User size={18} />
                Profil
              </Link>

              <div className="nav-user">
                <button onClick={handleLogout} className="nav-logout">
                  <LogOut size={18} />
                  Wyloguj
                </button>
              </div>
            </>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="nav-link" onClick={closeMenu}>
                Logowanie
              </Link>
              <Link to="/register" className="nav-link nav-register" onClick={closeMenu}>
                Rejestracja
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
