import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Star, UtensilsCrossed, Calendar } from 'lucide-react';
import '../styles/Profile.css';

const renderStars = (rating) => {
  return (
    <div className="stars" aria-label={`Ocena: ${rating} z 5 gwiazdek`}>
      {Array.from({ length: 5 }, (_, i) => {
        const starClass = i < rating ? 'star filled' : 'star empty';
        return <Star key={i} className={starClass} />;
      })}
    </div>
  );
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [profileRes, restaurantsRes, reviewsRes] = await Promise.all([
          axios.get('/api/auth/me'),
          axios.get('/api/restaurants/my-restaurants'),
          axios.get('/api/reviews/my-reviews')
        ]);
        setProfile(profileRes.data.user);
        setRestaurants(restaurantsRes.data.restaurants);
        setReviews(reviewsRes.data.reviews);
      } catch (err) {
        setError('Nie udało się pobrać danych użytkownika.');
      }
    };

    fetchUserData();
  }, []);

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!profile) {
    return <p>Ładowanie profilu...</p>;
  }

  return (
    <div className="profile-page" style={{ display: 'flex', gap: '2rem' }}>
      
      {/* Dane profilu */}
      <div style={{ flex: 1, borderRight: '1px solid #ccc', paddingRight: '2rem' }}>
        <h1>Twój profil</h1>
        <p><strong>Nazwa użytkownika:</strong> {profile.username}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Data utworzenia konta:</strong> {new Date(profile.createdAt).toLocaleDateString()}</p>
      </div>

      {/* Restauracje i recenzje */}
      <div style={{ flex: 2 }}>
        <section className="user-section">
          <h2>Twoje restauracje</h2>
          {restaurants.length === 0 ? (
            <p>Brak dodanych restauracji.</p>
          ) : (
            <ul className="user-list">
              {restaurants.map((restaurant) => (
                <li key={restaurant._id} style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link to={`/restaurant/${restaurant._id}`} className="restaurant-link">
                    {restaurant.name}
                  </Link>
                  <button className='delete-button'
                    onClick={async () => {
                      if (window.confirm(`Czy na pewno chcesz usunąć restaurację "${restaurant.name}"?`)) {
                        try {
                          await axios.delete(`/api/restaurants/${restaurant._id}`);
                          setRestaurants(restaurants.filter(r => r._id !== restaurant._id));
                        } catch (err) {
                          alert('Błąd podczas usuwania restauracji.');
                        }
                      }
                    }}
                  >
                    Usuń
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="user-section">
          <h2>Twoje recenzje</h2>
          {reviews.length === 0 ? (
            <p>Brak napisanych recenzji.</p>
          ) : (
            <ul className="user-list">
              {reviews.map((review) => (
                <li key={review._id} className="review-item">
                  <div className="comment-meta">
                    <div>
                      <UtensilsCrossed className="w-4 h-4" />
                      <Link to={`/restaurant/${review.restaurant._id}`} className="restaurant-link">
                        {review.restaurant.name}
                      </Link>
                    </div>
                    <div>
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                  <div className="comment-text">„{review.comment}”</div>
                  <div className="comment-footer">
                    {renderStars(review.rating)}
                    <span className="comment-rating">– Twoja ocena</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default Profile;
