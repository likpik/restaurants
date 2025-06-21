const express = require('express');
const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create or update review
router.post('/', auth, async (req, res) => {
  try {
    const { restaurantId, rating, comment } = req.body;

    // Check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user already has a review for this restaurant
    let review = await Review.findOne({
      user: req.user._id,
      restaurant: restaurantId
    });

    if (review) {
      // Update existing review
      review.rating = rating;
      review.comment = comment || '';
      await review.save();
      
      await review.populate('user', 'username');
      
      res.json({
        message: 'Review updated successfully',
        review
      });
    } else {
      // Create new review
      review = new Review({
        user: req.user._id,
        restaurant: restaurantId,
        rating,
        comment: comment || ''
      });
      
      await review.save();
      await review.populate('user', 'username');
      
      res.status(201).json({
        message: 'Review created successfully',
        review
      });
    }
  } catch (error) {
    console.error('Create/Update review error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reviews for a restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    let sortObj = {};
    const validSortFields = ['createdAt', 'rating', 'updatedAt'];
    if (validSortFields.includes(sort)) {
      sortObj[sort] = order === 'desc' ? -1 : 1;
    } else {
      sortObj.createdAt = -1;
    }

    const reviews = await Review.find({ restaurant: restaurantId })
      .populate('user', 'username')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ restaurant: restaurantId });

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's review for a specific restaurant
router.get('/user/:restaurantId', auth, async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const review = await Review.findOne({
      user: req.user._id,
      restaurant: restaurantId
    }).populate('user', 'username');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ review });
  } catch (error) {
    console.error('Get user review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete review
router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user is the owner of the review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user's review for a specific restaurant
router.delete('/restaurant/:restaurantId', auth, async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const review = await Review.findOne({
      user: req.user._id,
      restaurant: restaurantId
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await Review.findByIdAndDelete(review._id);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete user review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search reviews by comment text
router.get('/search', auth, async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({
      $text: { $search: query },
      comment: { $exists: true, $ne: '' }
    })
      .populate('user', 'username')
      .populate('restaurant', 'name')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({
      $text: { $search: query },
      comment: { $exists: true, $ne: '' }
    });

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all reviews by current user
router.get('/my-reviews', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ user: req.user._id })
      .populate('restaurant', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ user: req.user._id });

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;