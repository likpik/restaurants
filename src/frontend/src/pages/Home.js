import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Search, Filter, ChefHat } from 'lucide-react';
import RestaurantCard from '../components/RestaurantCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import '../styles/Home.css';

const menuTypes = [
  'Polska', 'Włoska', 'Azjatycka', 'Amerykańska', 'Francuska',
  'Meksykańska', 'Indyjska', 'Grecka', 'Sushi', 'Pizza',
  'Burgery', 'Kebab', 'Vegan', 'Wegetariańska', 'Fast Food',
  'Fine Dining', 'Śniadania', 'Desery', 'Seafood', 'BBQ'
];

const Home = () => {
  const [filters, setFilters] = useState({
    search: '',
    menuType: '',
    sort: 'name',
    order: 'asc',
    page: 1,
    limit: 12,
    nearbyOnly: false
  });

  const [userLocation, setUserLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          console.log('Dostęp do lokalizacji odrzucony lub niedostępny');
          setUserLocation({ lat: 52.4082, lng: 16.9335 }); // Poznań
        }
      );
    } else {
      setUserLocation({ lat: 52.4082, lng: 16.9335 }); // Poznań
    }
  }, []);

  const fetchRestaurants = async () => {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.menuType) params.append('menuType', filters.menuType);
    if (userLocation && filters.nearbyOnly) {
      params.append('lat', userLocation.lat);
      params.append('lng', userLocation.lng);
      params.append('radius', '50000'); // 50 km
    }

    params.append('sort', filters.sort);
    params.append('order', filters.order);
    params.append('page', filters.page);
    params.append('limit', filters.limit);

    const response = await axios.get(`/api/restaurants?${params}`);
    return response.data;
  };

  const { data, isLoading, error, refetch } = useQuery(
    ['restaurants', filters, userLocation],
    fetchRestaurants,
    {
      enabled: !!userLocation,
      keepPreviousData: true
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      menuType: '',
      sort: 'name',
      order: 'asc',
      page: 1,
      limit: 12,
      nearbyOnly: false
    });
  };

  if (error) {
    return (
      <div className="error-message">
        <p>Błąd ładowania restauracji. Spróbuj ponownie później.</p>
        <button onClick={() => refetch()}>Spróbuj ponownie</button>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Odkrywaj świetne restauracje</h1>
          <p>Znajdź i oceniaj najlepsze restauracje w swojej okolicy</p>

          <div className="search-bar">
            <div className="search-input-container">
              <Search size={20} />
              <input
                type="text"
                placeholder="Szukaj restauracji po nazwie..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="search-input"
              />
            </div>

            <button
              className="filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} />
              Filtry
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="filters-section">
          <div className="filters-container">
            <div className="filter-group">
              <label>Rodzaj kuchni:</label>
              <select
                value={filters.menuType}
                onChange={(e) => handleFilterChange('menuType', e.target.value)}
              >
                <option value="">Wszystkie kuchnie</option>
                {menuTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Sortuj według:</label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                <option value="name">Nazwa</option>
                <option value="averageRating">Ocena</option>
                <option value="totalReviews">Liczba recenzji</option>
                <option value="createdAt">Data dodania</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Kolejność:</label>
              <select
                value={filters.order}
                onChange={(e) => handleFilterChange('order', e.target.value)}
              >
                <option value="asc">Rosnąco</option>
                <option value="desc">Malejąco</option>
              </select>
            </div>

            <div className="filter-group">
              <label>
                <input
                  type="checkbox"
                  checked={filters.nearbyOnly}
                  onChange={(e) => handleFilterChange('nearbyOnly', e.target.checked)}
                />
                Tylko restauracje w mojej okolicy
              </label>
            </div>

            <button onClick={clearFilters} className="clear-filters">
              Wyczyść filtry
            </button>
          </div>
        </div>
      )}

      <div className="restaurants-section">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="restaurants-grid">
              {data?.restaurants?.map((restaurant) => (
                <RestaurantCard key={restaurant._id} restaurant={restaurant} />
              ))}
            </div>

            {data?.restaurants?.length === 0 && (
              <div className="no-results">
                <ChefHat size={48} />
                <h3>Nie znaleziono restauracji</h3>
                <p>Spróbuj zmienić kryteria wyszukiwania lub filtry</p>
              </div>
            )}

            {data?.pagination && data.pagination.pages > 1 && (
              <Pagination
                currentPage={data.pagination.page}
                totalPages={data.pagination.pages}
                onPageChange={(page) => handleFilterChange('page', page)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
