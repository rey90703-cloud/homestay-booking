import React, { useEffect, useRef, useState } from 'react';
import './GoogleMap.css';

const GoogleMap = ({ location, title, apiKey }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (location?.coordinates?.coordinates && apiKey) {
      loadGoogleMaps();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, apiKey]);

  const loadGoogleMaps = () => {
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', initializeMap);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => initializeMap();
    script.onerror = () => console.error('Failed to load Google Maps');
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current || !location?.coordinates?.coordinates) return;

    const [lng, lat] = location.coordinates.coordinates;

    const mapOptions = {
      center: { lat, lng },
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    };

    const map = new window.google.maps.Map(mapRef.current, mapOptions);
    mapInstanceRef.current = map;

    // Add marker for homestay
    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: title,
      animation: window.google.maps.Animation.DROP,
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
      },
    });

    // Info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `<div style="padding: 8px;"><strong>${title}</strong><br/>${location.address}</div>`,
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    // Get nearby places using Places API
    getNearbyPlaces(map, { lat, lng });

    // Get user location for directions
    getUserLocation();
  };

  const getNearbyPlaces = (map, center) => {
    try {
      if (!window.google?.maps?.places?.PlacesService) {
        console.log('Places API not available');
        return;
      }

      const service = new window.google.maps.places.PlacesService(map);

      const request = {
        location: center,
        radius: 1000,
        type: ['restaurant', 'cafe', 'tourist_attraction', 'store'],
      };

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const places = results.slice(0, 5).map((place) => ({
            name: place.name,
            vicinity: place.vicinity,
            rating: place.rating,
            types: place.types,
          }));
          setNearbyPlaces(places);

          // Add markers for nearby places
          results.slice(0, 5).forEach((place) => {
            new window.google.maps.Marker({
              position: place.geometry.location,
              map: map,
              title: place.name,
              icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new window.google.maps.Size(32, 32),
              },
            });
          });
        } else {
          console.log('Places API error:', status);
        }
      });
    } catch (error) {
      console.log('Error getting nearby places:', error.message);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userPos);
          calculateDistance(userPos);
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  };

  const calculateDistance = (userPos) => {
    try {
      if (!location?.coordinates?.coordinates) return;
      if (!window.google?.maps?.DistanceMatrixService) return;

      const [lng, lat] = location.coordinates.coordinates;
      const homestayPos = { lat, lng };

      // Use Distance Matrix API
      const service = new window.google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [userPos],
          destinations: [homestayPos],
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
          if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
            const element = response.rows[0].elements[0];
            setDistance({
              distance: element.distance.text,
              duration: element.duration.text,
            });
          }
        }
      );
    } catch (error) {
      console.log('Error calculating distance:', error.message);
    }
  };

  const showDirectionsToHomestay = () => {
    try {
      if (!userLocation || !location?.coordinates?.coordinates) return;
      if (!window.google?.maps?.DirectionsService) return;

      const [lng, lat] = location.coordinates.coordinates;
      const homestayPos = { lat, lng };

      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer();
      directionsRenderer.setMap(mapInstanceRef.current);

      const request = {
        origin: userLocation,
        destination: homestayPos,
        travelMode: window.google.maps.TravelMode.DRIVING,
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
          setDirections(result);
          setShowDirections(true);
        } else {
          console.log('Directions error:', status);
        }
      });
    } catch (error) {
      console.log('Error showing directions:', error.message);
    }
  };

  const _getStaticMapUrl = () => {
    if (!location?.coordinates?.coordinates || !apiKey) return '';

    const [lng, lat] = location.coordinates.coordinates;
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&markers=color:red%7C${lat},${lng}&key=${apiKey}`;
  };

  return (
    <div className="google-map-container">
      <div ref={mapRef} className="google-map"></div>

      {distance && (
        <div className="map-info-card">
          <h4>📍 Khoảng cách từ vị trí của bạn</h4>
          <p>
            <strong>{distance.distance}</strong> - Khoảng {distance.duration} lái xe
          </p>
          {!showDirections && (
            <button className="btn-directions" onClick={showDirectionsToHomestay}>
              🚗 Xem chỉ đường
            </button>
          )}
        </div>
      )}

      {nearbyPlaces.length > 0 && (
        <div className="nearby-places">
          <h4>🏪 Địa điểm gần đây</h4>
          <ul>
            {nearbyPlaces.map((place, index) => (
              <li key={index}>
                <strong>{place.name}</strong>
                {place.rating && <span> ⭐ {place.rating}</span>}
                <br />
                <small>{place.vicinity}</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      {directions && showDirections && (
        <div className="directions-info">
          <h4>🚗 Hướng dẫn đường đi</h4>
          <p>
            <strong>Khoảng cách:</strong> {directions.routes[0].legs[0].distance.text}
          </p>
          <p>
            <strong>Thời gian:</strong> {directions.routes[0].legs[0].duration.text}
          </p>
          <button className="btn-close" onClick={() => setShowDirections(false)}>
            Đóng
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;
