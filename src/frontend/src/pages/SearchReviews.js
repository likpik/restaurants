import React, { useState, useEffect, useRef } from 'react';
import { Search, MessageCircle, Star, Calendar, UtensilsCrossed, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/SearchReviews.css';

const SearchReviews = ({ onClose }) => {
  const { isAuthenticated, token } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const performSearch = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(`/api/reviews/search?query=${encodeURIComponent(term)}&limit=10&page=1`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Błąd podczas pobierania danych');
      }

      const data = await response.json();

      const results = data.reviews.map((review) => ({
        id: review._id,
        text: review.comment,
        rating: review.rating,
        restaurantName: review.restaurant.name,
        restaurantId: review.restaurant._id,
        authorName: review.user.username,
        date: review.createdAt,
        highlighted: highlightText(review.comment, term),
      }));

      setSearchResults(results);
      setShowResults(true);
      setIsSearching(false);

    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowResults(true);
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    performSearch(value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="stars" aria-label={`Ocena: ${rating} z 5 gwiazdek`}>
        {Array.from({ length: 5 }, (_, i) => {
          const starClass = i < rating ? 'star filled' : 'star empty';
          return (
            <Star key={i} className={starClass} />
          );
        })}
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Zaloguj się</h2>
            <p className="text-gray-600 mb-4">
              Aby wyszukiwać recenzje, musisz być zalogowany.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="search-reviews-container">
      {/* Header */}
      <div className="search-reviews-header">
        <MessageCircle className="w-6 h-6 text-blue-600" />
        <h2>Wyszukiwanie recenzji</h2>
      </div>

      {/* Search Input */}
      <div className="search-input-wrapper">
        <Search className="icon-search" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Wyszukaj recenzje..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {searchTerm && (
          <button onClick={clearSearch} className="clear-btn">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Results */}
      <div className="search-results">
        {isSearching ? (
          <p className="info-message">Wyszukiwanie...</p>
        ) : showResults ? (
          searchResults.length > 0 ? (
            <ul>
              {searchResults.map((comment) => (
                <li key={comment.id}>
                  <div className="comment-meta">
                    <div>
                      <UtensilsCrossed className="w-4 h-4" />
                      <span>{comment.restaurantName}</span>
                    </div>
                    <div>
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(comment.date)}</span>
                    </div>
                  </div>
                  <div className="comment-text">{comment.highlighted}</div>
                  <div className="comment-footer">
                    {renderStars(comment.rating)}
                    <span className="comment-restaurant">– {comment.authorName}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="info-message">Brak wyników dla „{searchTerm}”.</p>
          )
        ) : (
          <p className="info-message">Zacznij wpisywać, aby zobaczyć wyniki.</p>
        )}
      </div>
    </div>
  );
};

export default SearchReviews;
