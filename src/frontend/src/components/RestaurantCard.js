import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, MessageCircle, ChefHat } from 'lucide-react';
import '../styles/RestaurantCard.css';

const RestaurantCard = ({ restaurant }) => {
  const {
    _id,
    name,
    address,
    menuTypes,
    image,
    averageRating,
    totalReviews,
    owner
  } = restaurant;

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} size={16} className="star filled" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" size={16} className="star half-filled" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} size={16} className="star empty" />
      );
    }

    return stars;
  };

  return (
    <div className="restaurant-card">
      <Link to={`/restaurant/${_id}`} className="card-link">
        <div className="card-image">
          {image ? (
            <img 
              src={`/${image}`} 
              alt={name}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="card-image-placeholder" style={{ display: image ? 'none' : 'flex' }}>
            <ChefHat size={40} />
          </div>
        </div>

        <div className="card-content">
          <h3 className="card-title">{name}</h3>
          
          <div className="card-address">
            <MapPin size={14} />
            <span>{address.street}, {address.city}</span>
          </div>

          <div className="card-menu-types">
            {menuTypes.slice(0, 3).map((type, index) => (
              <span key={index} className="menu-type-tag">
                {type}
              </span>
            ))}
            {menuTypes.length > 3 && (
              <span className="menu-type-more">
                +{menuTypes.length - 3} więcej
              </span>
            )}
          </div>

          <div className="card-rating">
            <div className="stars">
              {renderStars(averageRating)}
            </div>
            <span className="rating-text">
              {averageRating > 0 ? averageRating.toFixed(1) : 'Brak oceny'}
            </span>
            <div className="reviews-count">
              <MessageCircle size={14} />
              <span>{totalReviews} recenzji</span>
            </div>
          </div>

          <div className="card-owner">
            <span>Dodano przez: {owner?.username || 'Nieznany'}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default RestaurantCard;
