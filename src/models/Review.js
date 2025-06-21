const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer'
    }
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index to ensure one review per user per restaurant
reviewSchema.index({ user: 1, restaurant: 1 }, { unique: true });

// Create text index for comment search
reviewSchema.index({ comment: 'text' }, { default_language: 'polish' });

// Update restaurant rating after review operations
reviewSchema.post('save', async function() {
  const Restaurant = mongoose.model('Restaurant');
  const restaurant = await Restaurant.findById(this.restaurant);
  if (restaurant) {
    await restaurant.updateRating();
  }
});

reviewSchema.post('remove', async function() {
  const Restaurant = mongoose.model('Restaurant');
  const restaurant = await Restaurant.findById(this.restaurant);
  if (restaurant) {
    await restaurant.updateRating();
  }
});

reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Restaurant = mongoose.model('Restaurant');
    const restaurant = await Restaurant.findById(doc.restaurant);
    if (restaurant) {
      await restaurant.updateRating();
    }
  }
});

// Update updatedAt before saving
reviewSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Review', reviewSchema);