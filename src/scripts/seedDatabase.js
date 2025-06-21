const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');

// Sample data
const sampleUsers = [
  { username: 'admin', email: 'admin@example.com', password: 'admin123' },
  { username: 'user1', email: 'user1@example.com', password: 'user123' },
  { username: 'user2', email: 'user2@example.com', password: 'user123' }
];

const sampleRestaurants = [
  {
    name: 'Restauracja Polska',
    description: 'Tradycyjna kuchnia polska serwowana w przytulnej atmosferze Starego Rynku.',
    address: {
      street: 'Stary Rynek 1',
      city: 'Poznań',
      postalCode: '61-772',
      country: 'Polska'
    },
    location: {
      type: 'Point',
      coordinates: [16.9335, 52.4082]
    },
    menuTypes: ['Polska', 'Fine Dining'],
    image: 'images/restauracja-polska.jpg'
  },
  {
    name: 'Pizza Italiana',
    description: 'Autentyczna włoska pizza wypiekana na tradycyjnym kamiennym piecu.',
    address: {
      street: 'Floriańska 10',
      city: 'Kraków',
      postalCode: '31-019',
      country: 'Polska'
    },
    location: {
      type: 'Point',
      coordinates: [19.9445, 50.0614]
    },
    menuTypes: ['Włoska', 'Pizza'],
    image: 'images/pizza-italiana.jpg'
  },
  {
    name: 'Sushi Bar',
    description: 'Świeże sushi i dania kuchni japońskiej przygotowywane przez doświadczonych szefów kuchni.',
    address: {
      street: 'Święty Marcin 80',
      city: 'Poznań',
      postalCode: '61-809',
      country: 'Polska'
    },
    location: {
      type: 'Point',
      coordinates: [16.9018, 52.4082]
    },
    menuTypes: ['Azjatycka', 'Sushi'],
    image: 'images/sushi-bar.jpg'
  },
  {
    name: 'Burger House',
    description: 'Miejsce z najlepszymi burgerami w Poznaniu, świeże składniki i szybka obsługa.',
    address: {
      street: 'Garbary 15',
      city: 'Poznań',
      postalCode: '61-757',
      country: 'Polska'
    },
    location: {
      type: 'Point',
      coordinates: [16.9304, 52.4064]
    },
    menuTypes: ['Amerykańska', 'Burgery', 'Fast Food'],
    image: 'images/burger-house.jpg'
  },
  {
    name: 'Green Vegan',
    description: 'Zdrowa i smaczna kuchnia wegańska, idealna dla osób dbających o dietę.',
    address: {
      street: 'Żydowska 25',
      city: 'Poznań',
      postalCode: '61-761',
      country: 'Polska'
    },
    location: {
      type: 'Point',
      coordinates: [16.9399, 52.4089]
    },
    menuTypes: ['Vegan', 'Wegetariańska'],
    image: 'images/green-vegan.jpg'
  },
  {
    name: 'Bistro Wrocławskie',
    description: 'Przytulne bistro w centrum Wrocławia z lokalnymi i sezonowymi potrawami.',
    address: {
      street: 'Rynek 15',
      city: 'Wrocław',
      postalCode: '50-101',
      country: 'Polska'
    },
    location: {
      type: 'Point',
      coordinates: [17.0325, 51.1079]
    },
    menuTypes: ['Polska'],
    image: 'images/bistro-wroclawskie.jpg'
  }
];

const sampleReviews = [
  { rating: 5, comment: 'Wyśmienite jedzenie i obsługa! Atmosfera idealna na romantyczną kolację.' },
  { rating: 4, comment: 'Świetna pizza, autentyczny włoski smak. Na pewno wrócę!' },
  { rating: 5, comment: 'Świeże sushi, bardzo dobrej jakości ryba. Profesjonalna obsługa.' },
  { rating: 3, comment: 'Dobre burgery, ale trochę drogie. Miejsce jednak przyjemne.' },
  { rating: 4, comment: 'Niesamowite opcje wegańskie! Nawet osoby nie będące na diecie polubią to miejsce.' },
  { rating: 5, comment: 'Najlepsza restauracja we Wrocławiu! Tradycyjna polska kuchnia w najlepszym wydaniu.' },
  { rating: 2, comment: 'Obsługa była powolna, a jedzenie dotarło zimne.' },
  { rating: 4, comment: 'Fajna atmosfera, dobre jedzenie. Polecam dla grup.' },
  { rating: 3, comment: 'Pyszne jedzenie, ale czekaliśmy na nie ponad 2 godziny.' },
  { rating: 5, comment: 'Pycha :))' }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_portal');
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await Review.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const users = [];
    for (let userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      users.push(user);
    }
    console.log('Created users');

    // Create restaurants
    const restaurants = [];
    for (let i = 0; i < sampleRestaurants.length; i++) {
      const restaurant = new Restaurant({
        ...sampleRestaurants[i],
        owner: users[i % users.length]._id
      });
      await restaurant.save();
      restaurants.push(restaurant);
    }
    console.log('Created restaurants');

    // Create unique user-restaurant review pairs
    const usedPairs = new Set();

    for (let i = 0; i < sampleReviews.length; i++) {
      let userIndex = (i + 1) % users.length;
      let restaurantIndex = i % restaurants.length;
      let pairKey = `${users[userIndex]._id}_${restaurants[restaurantIndex]._id}`;

      if (usedPairs.has(pairKey)) {
        let found = false;
        for (let u = 0; u < users.length && !found; u++) {
          for (let r = 0; r < restaurants.length && !found; r++) {
            let altKey = `${users[u]._id}_${restaurants[r]._id}`;
            if (!usedPairs.has(altKey)) {
              userIndex = u;
              restaurantIndex = r;
              pairKey = altKey;
              found = true;
            }
          }
        }
        if (!found) {
          console.warn(`⚠️ Skipping review at index ${i}: no unique user-restaurant pair available.`);
          continue;
        }
      }

      const review = new Review({
        ...sampleReviews[i],
        user: users[userIndex]._id,
        restaurant: restaurants[restaurantIndex]._id
      });

      await review.save();
      usedPairs.add(pairKey);
    }

    console.log('Created reviews');

    for (let restaurant of restaurants) {
      await restaurant.updateRating();
    }

    console.log('Updated restaurant ratings');
    console.log('✅ Database seeded successfully!');
    console.log('\nTest accounts:');
    console.log('- admin@example.com / admin123');
    console.log('- user1@example.com / user123');
    console.log('- user2@example.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();