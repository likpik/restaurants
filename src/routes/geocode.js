const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const { street, city, postalCode, country } = req.query;

  const query = encodeURIComponent(`${street}, ${postalCode} ${city}, ${country}`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Geocoding error:', err);
    res.status(500).json({ message: 'Geocoding failed' });
  }
});

module.exports = router;
