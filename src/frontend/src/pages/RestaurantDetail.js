import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { MapPin, Star, MessageCircle, ChefHat, User, Trash2 } from 'lucide-react';
import ReviewModal from '../components/ReviewModal';
import '../styles/RestaurantDetail.css';
import { useAuth } from '../contexts/AuthContext';

const RestaurantDetail = () => {
  const { id } = useParams();
  const { user: currentUser, token } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  const fetchRestaurant = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/restaurants/${id}`);
      setRestaurant(response.data.restaurant);
      setReviews(response.data.reviews);
    } catch (err) {
      setError('Nie udało się załadować szczegółów restauracji.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchUserReview = useCallback(async () => {
    if (!currentUser) {
      setUserReview(null);
      return;
    }
    try {
      const res = await axios.get(`/api/reviews/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserReview(res.data.review);
    } catch (err) {
      if (err.response?.status === 404) {
        setUserReview(null);
      } else {
        console.error('Błąd pobierania recenzji użytkownika:', err);
      }
    }
  }, [id, currentUser, token]);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  useEffect(() => {
    fetchUserReview();
  }, [fetchUserReview]);

  const handleReviewSubmit = async (reviewData) => {
    if (!currentUser) {
      alert('Musisz być zalogowany, aby dodać opinię.');
      return;
    }

    const data = {
      restaurantId: id,
      rating: reviewData.rating,
      comment: reviewData.comment || ''
    };

    try {
      if (editingReview) {
        // aktualizacja recenzji
        await axios.post(`/api/reviews`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // nowa recenzja
        await axios.post(`/api/reviews`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsModalOpen(false);
      setEditingReview(null);
      await fetchRestaurant();
      await fetchUserReview();
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert('Nie udało się zapisać opinii.');
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;
    if (!window.confirm('Czy na pewno chcesz usunąć swoją recenzję?')) return;

    try {
      await axios.delete(`/api/reviews/restaurant/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserReview(null);
      await fetchRestaurant();
      alert('Recenzja usunięta.');
    } catch (err) {
      console.error('Błąd usuwania recenzji:', err);
      alert('Nie udało się usunąć recenzji.');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={20} className="star filled" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" size={20} className="star half-filled" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={20} className="star empty" />);
    }

    return stars;
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">{error}</div>;
  if (!restaurant) return <div className="no-data">Brak danych o restauracji.</div>;

  const {
    name,
    address,
    menuTypes,
    image,
    averageRating,
    totalReviews,
    owner,
    description
  } = restaurant;

  return (
    <div className="restaurant-detail-page">
      <h1 className="restaurant-name">{name}</h1>

      <div className="restaurant-image-container">
        {image ? (
          <img
            src={`/${image}`}
            alt={name}
            className="restaurant-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="restaurant-image-placeholder" style={{ display: image ? 'none' : 'flex' }}>
          <ChefHat size={60} />
        </div>
      </div>

      <div className="restaurant-info">
        <div className="restaurant-address">
          <MapPin size={20} />
          <span>
            {[address?.street, address?.postalCode, address?.city, address?.country]
              .filter(Boolean)
              .join(', ')}
          </span>
        </div>

        <div className="restaurant-menu-types">
          {menuTypes && menuTypes.length > 0 ? (
            <>
              {menuTypes.slice(0, 3).map((type, index) => (
                <span key={index} className="menu-type-tag">{type}</span>
              ))}
              {menuTypes.length > 3 && (
                <span className="menu-type-more">+{menuTypes.length - 3} więcej</span>
              )}
            </>
          ) : (
            <span>Brak informacji o kuchniach</span>
          )}
        </div>

        <div className="restaurant-rating">
          <div className="stars">{renderStars(averageRating || 0)}</div>
          <span className="rating-text">
            {averageRating > 0 ? averageRating.toFixed(1) : 'Brak oceny'}
          </span>
          <div className="reviews-count">
            <MessageCircle size={18} />
            <span>{totalReviews || 0} recenzji</span>
          </div>
        </div>

        <div className="restaurant-owner">
          <span>Dodane przez: {owner?.username || 'Nieznany'}</span>
        </div>

        <div className="restaurant-description">
          <h3>Opis:</h3>
          <p>{description || 'Brak opisu.'}</p>
        </div>

        <div className="restaurant-reviews">
          <div className="reviews-header">
            <h3>Recenzje ({reviews.length})</h3>
            {currentUser && (
              <div className="review-actions">
                <button
                  className="add-review-btn"
                  onClick={() => {
                    setEditingReview(userReview || null);
                    setIsModalOpen(true);
                  }}
                >
                  {userReview ? 'Edytuj swoją opinię' : 'Dodaj opinię'}
                </button>
                {userReview && (
                  <button
                    className="delete-review-btn"
                    onClick={handleDeleteReview}
                    title="Usuń swoją recenzję"
                  >
                    <Trash2 size={16} />
                    Usuń recenzję
                  </button>
                )}
              </div>
            )}
          </div>
          
          {reviews.length === 0 ? (
            <p>Brak recenzji.</p>
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <User size={18} />
                  <strong>{review.user?.username || 'Anonim'}</strong>
                  <div className="review-rating">
                    {renderStars(review.rating)}
                    <span className="rating-number">{review.rating}/5</span>
                  </div>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReview(null);
        }}
        onSubmit={handleReviewSubmit}
        restaurant={restaurant}
        existingReview={editingReview}
        isEditing={!!editingReview}
      />
    </div>
  );
};

export default RestaurantDetail;