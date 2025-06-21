import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/AddRestaurant.css';

const menuTypes = [
  'Polska', 'Włoska', 'Azjatycka', 'Amerykańska', 'Francuska',
  'Meksykańska', 'Indyjska', 'Grecka', 'Sushi', 'Pizza',
  'Burgery', 'Kebab', 'Vegan', 'Wegetariańska', 'Fast Food',
  'Fine Dining', 'Śniadania', 'Desery', 'Seafood', 'BBQ'
];

const AddRestaurant = () => {
  const [formData, setFormData] = useState({
    name: '',
    menuType: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: ''
    },
    description: '',
  });
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const geocodeAddress = async () => {
    const { street, city, postalCode, country } = formData.address;

    try {
      const response = await axios.get('/api/geocode', {
        params: { street, city, postalCode, country }
      });

      const data = response.data;

      if (data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      } else {
        setError('Nie znaleziono współrzędnych dla podanego adresu.');
        return null;
      }
    } catch (error) {
      setError('Błąd podczas pobierania współrzędnych.');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const coords = await geocodeAddress();
    if (!coords) return;

    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('menuTypes', JSON.stringify([formData.menuType]));
    payload.append('description', formData.description);
    payload.append('address', JSON.stringify(formData.address));
    payload.append('location', JSON.stringify({
      type: 'Point',
      coordinates: [coords.longitude, coords.latitude]
    }));

    if (image) {
      payload.append('image', image);
    }

    try {
      await axios.post('/api/restaurants', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      navigate('/');
    } catch (err) {
      setError('Nie udało się dodać restauracji. Spróbuj ponownie.');
    }
  };

  return (
    <div className="add-restaurant-container">
      <h1 className="form-title">Dodaj nową restaurację</h1>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>

        <label className="form-label">
          Nazwa:
          <input
            className="form-input"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </label>

        <label className="form-label">
          Kuchnia:
          <select
            className="form-input"
            name="menuType"
            value={formData.menuType}
            onChange={handleChange}
            required
          >
            <option value="">-- Wybierz typ kuchni --</option>
            {menuTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="address-fieldset">
          <label className="form-label">
            Ulica:
            <input
              className="form-input"
              name="address.street"
              type="text"
              value={formData.address.street}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-label">
            Miasto:
            <input
              className="form-input"
              name="address.city"
              type="text"
              value={formData.address.city}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-label">
            Kod pocztowy:
            <input
              className="form-input"
              name="address.postalCode"
              type="text"
              value={formData.address.postalCode}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-label">
            Kraj:
            <input
              className="form-input"
              name="address.country"
              type="text"
              value={formData.address.country}
              onChange={handleChange}
              required
            />
          </label>
        </fieldset>

        <label className="form-label">
          Opis:
          <textarea
            className="form-textarea"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
          />
        </label>

        <label className="form-label">
          Zdjęcie restauracji:
          <input
            className="form-input"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </label>

        <button type="submit" className="submit-button">
          Dodaj restaurację
        </button>
      </form>
    </div>
  );
};

export default AddRestaurant;
