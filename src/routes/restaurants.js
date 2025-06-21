const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'restaurant-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.get('/', async (req, res) => {
  try {
    const {
      search,
      menuType,
      lat,
      lng,
      radius = 10000,
      sort = 'name',
      order = 'asc',
      page = 1,
      limit = 20
    } = req.query;

    const sortObj = {};
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);

    const validSortFields = ['name', 'averageRating', 'totalReviews', 'createdAt'];
    if (validSortFields.includes(sort)) {
      sortObj[sort] = order === 'desc' ? -1 : 1;
    } else {
      sortObj.name = 1;
    }

    // Jeśli lokalizacja jest podana, użyj agregacji
    if (lat && lng) {
      const pipeline = [];

      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          distanceField: 'distance',
          maxDistance: parseInt(radius),
          spherical: true
        }
      });

      if (search) {
        pipeline.push({
          $match: {
            name: { $regex: search, $options: 'i' }
          }
        });
      }

      if (menuType) {
        pipeline.push({
          $match: {
            menuTypes: { $in: Array.isArray(menuType) ? menuType : [menuType] }
          }
        });
      }

      pipeline.push({ $sort: sortObj });
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: parsedLimit });

      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'owner'
        }
      });

      pipeline.push({
        $unwind: {
          path: '$owner',
          preserveNullAndEmptyArrays: true
        }
      });

      const restaurants = await Restaurant.aggregate(pipeline);

      const total = await Restaurant.countDocuments();

      return res.json({
        restaurants,
        pagination: {
          page: parseInt(page),
          limit: parsedLimit,
          total,
          pages: Math.ceil(total / parsedLimit)
        }
      });
    }

    // Jeśli nie ma lokalizacji – klasyczne .find()
    const query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (menuType) {
      query.menuTypes = { $in: Array.isArray(menuType) ? menuType : [menuType] };
    }

    const restaurants = await Restaurant.find(query)
      .populate('owner', 'username')
      .sort(sortObj)
      .skip(skip)
      .limit(parsedLimit);

    const total = await Restaurant.countDocuments(query);

    res.json({
      restaurants,
      pagination: {
        page: parseInt(page),
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all restaurants created by the logged-in user
router.get('/my-restaurants', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);

    const restaurants = await Restaurant.find({ owner: req.user._id })
      .populate('owner', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    const total = await Restaurant.countDocuments({ owner: req.user._id });

    res.json({
      restaurants,
      pagination: {
        page: parseInt(page),
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error) {
    console.error('Get my restaurants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get restaurant by ID with reviews
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('owner', 'username');

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Get reviews with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ restaurant: restaurant._id })
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalReviews = await Review.countDocuments({ restaurant: restaurant._id });

    // Check if current user has reviewed this restaurant
    let userReview = null;
    if (req.user) {
      userReview = await Review.findOne({
        restaurant: restaurant._id,
        user: req.user._id
      });
    }

    res.json({
      restaurant,
      reviews,
      userReview,
      pagination: {
        page,
        limit,
        total: totalReviews,
        pages: Math.ceil(totalReviews / limit)
      }
    });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new restaurant
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, address, location, menuTypes, description } = req.body;

    const parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;

    let parsedCoordinates;
    if (location) {
      const loc = typeof location === 'string' ? JSON.parse(location) : location;
      parsedCoordinates = loc.coordinates;
    }

    const parsedMenuTypes = typeof menuTypes === 'string'
      ? JSON.parse(menuTypes)
      : menuTypes;

    const restaurantData = {
      name,
      address: parsedAddress,
      description,
      menuTypes: parsedMenuTypes,
      location: {
        type: 'Point',
        coordinates: parsedCoordinates
      },
      owner: req.user._id
    };

    if (req.file) {
      restaurantData.image = req.file.path.replace(/^public[\\/]/, '');
    }

    const restaurant = new Restaurant(restaurantData);
    await restaurant.save();
    await restaurant.populate('owner', 'username');

    res.status(201).json({
      message: 'Restaurant created successfully',
      restaurant
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    res.status(500).json({ message: 'Server error' });
  }
});


// Update restaurant
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user is the owner
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this restaurant' });
    }

    const { name, address, coordinates, menuTypes } = req.body;

    // Update fields if provided
    if (name) restaurant.name = name;
    if (address) {
      const parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
      restaurant.address = parsedAddress;
    }
    if (coordinates) {
      const parsedCoordinates = typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates;
      restaurant.location.coordinates = parsedCoordinates;
    }
    if (menuTypes) {
      const parsedMenuTypes = typeof menuTypes === 'string' ? JSON.parse(menuTypes) : menuTypes;
      restaurant.menuTypes = parsedMenuTypes;
    }

    // Handle image update
    if (req.file) {
      // Delete old image if it exists
      if (restaurant.image && fs.existsSync(restaurant.image)) {
        fs.unlinkSync(restaurant.image);
      }
      restaurant.image = req.file.path.replace(/^public[\\/]/, '');
    }

    await restaurant.save();
    await restaurant.populate('owner', 'username');

    res.json({
      message: 'Restaurant updated successfully',
      restaurant
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete restaurant
router.delete('/:id', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user is the owner
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this restaurant' });
    }

    // Delete associated reviews
    await Review.deleteMany({ restaurant: restaurant._id });

    // Delete restaurant image if it exists
    if (restaurant.image && fs.existsSync(restaurant.image)) {
      fs.unlinkSync(restaurant.image);
    }

    await Restaurant.findByIdAndDelete(req.params.id);

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get restaurants by menu type
router.get('/menu/:menuType', async (req, res) => {
  try {
    const { menuType } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const restaurants = await Restaurant.find({
      menuTypes: menuType
    })
      .populate('owner', 'username')
      .sort({ averageRating: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Restaurant.countDocuments({ menuTypes: menuType });

    res.json({
      restaurants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get restaurants by menu error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET nearby restaurants using $geoNear
router.get('/nearby/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const { radius = 10000, page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);

    const pipeline = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          distanceField: 'distance',
          maxDistance: parseInt(radius),
          spherical: true
        }
      },
      { $skip: skip },
      { $limit: parsedLimit }
      
    ];

    const restaurants = await Restaurant.aggregate(pipeline);

    res.json({ restaurants });
  } catch (error) {
    console.error('Get nearby restaurants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;