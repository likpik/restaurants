import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import '../styles/ReviewModal.css';

const ReviewModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  restaurant, 
  existingReview = null,
  isEditing = false 
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
    setError('');
  }, [existingReview, isOpen]);

  // Zamknięcie modalu po Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Ocena jest wymagana');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit({
        rating,
        comment: comment.trim(),
        restaurantId: restaurant.id
      });
      
      setRating(0);
      setComment('');
      onClose();
    } catch (err) {
      setError(err.message || 'Wystąpił błąd podczas zapisywania opinii');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(existingReview?.rating || 0);
      setComment(existingReview?.comment || '');
      setError('');
      onClose();
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return [address.street, address.postalCode, address.city, address.country]
        .filter(Boolean)
        .join(', ');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="review-modal-overlay" 
      onClick={handleClose} 
      aria-modal="true" 
      role="dialog" 
      aria-labelledby="review-modal-title"
    >
      <div 
        className="review-modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="review-modal-header">
          <h2 id="review-modal-title">
            {isEditing ? 'Edytuj opinię' : 'Dodaj opinię'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Zamknij modal"
            className="review-modal-close"
          >
            <X />
          </button>
        </div>

        {/* Restaurant Info */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontWeight: '500', color: '#2c3e50', marginBottom: '4px' }}>{restaurant.name}</h3>
          <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>{formatAddress(restaurant.address)}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="review-form">
          {error && (
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '6px' }}>
              {error}
            </div>
          )}

          {/* Rating */}
          <div className="review-form-group">
            <label htmlFor="rating" className="review-form-label">
              Ocena <span className="required-star">*</span>
            </label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  disabled={isSubmitting}
                  aria-label={`Ocena ${star} gwiazdek`}
                  className="star-button"
                >
                  <Star
                    className={`star ${
                      star <= (hoverRating || rating) ? 'filled' : 'empty'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="review-form-group">
            <label htmlFor="comment" className="review-form-label">
              Komentarz (opcjonalnie)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Podziel się swoimi wrażeniami z wizyty w tej restauracji..."
              className="review-form-textarea"
              disabled={isSubmitting}
            />
            <div className="textarea-footer">
              <small>Maksymalnie 500 znaków</small>
              <small>{comment.length}/500</small>
            </div>
          </div>

          {/* Actions */}
          <div className="review-modal-buttons" style={{ marginTop: '25px' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="review-modal-cancel-btn"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="review-modal-submit-btn"
            >
              {isSubmitting ? 'Zapisywanie...' : (isEditing ? 'Zapisz zmiany' : 'Dodaj opinię')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
