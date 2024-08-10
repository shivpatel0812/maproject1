import React, { useEffect, useState } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import axios from "axios";

const containerStyle = {
  width: "100%",
  height: "1000px",
};

const center = {
  lat: 0, // Center of the map
  lng: 0,
};

const RealTimeMediaMap = () => {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Twitter trends from the server-side proxy
        const twitterResponse = await axios.get("/api/twitter-trends");
        const twitterData = twitterResponse.data[0].trends;

        // Optionally, fetch news trends
        const newsResponse = await axios.get("/api/news-trends");
        const newsData = newsResponse.data.articles;

        // Process and aggregate trends data
        const locations = processTrendsData(twitterData, newsData);

        // Convert locations data to markers for the map
        const markerData = Object.keys(locations).map((location) => {
          const [lat, lng] = getLatLngForLocation(location);
          return {
            id: location,
            lat,
            lng,
            popularity: locations[location].popularity,
          };
        });

        setMarkers(markerData);
      } catch (error) {
        console.error("Error fetching trends data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={2}>
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={{ lat: marker.lat, lng: marker.lng }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: Math.log(marker.popularity * 100 + 1), // Scale marker size based on popularity
              fillColor: `rgba(255, 0, 0, ${marker.popularity})`, // Color logic based on popularity
              fillOpacity: 0.6,
              strokeWeight: 0,
            }}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

// Helper functions
const getLatLngForLocation = (location) => {
  const locations = {
    "New York": [40.712776, -74.005974],
    Paris: [48.856613, 2.352222],
    Bangladesh: [23.685, 90.3563],
    Palestine: [31.9474, 35.2272],
    // Add more predefined locations here
  };
  return locations[location] || [0, 0]; // Default to [0, 0] if location is not found
};

const processTrendsData = (twitterData, newsData) => {
  const locations = {};

  // Process Twitter data
  twitterData.forEach((trend) => {
    const location = trend.name;
    locations[location] = locations[location] || {
      twitter: 0,
      news: 0,
    };
    locations[location].twitter += trend.tweet_volume || 0;
  });

  // Process News data
  newsData.forEach((article) => {
    const location = article.source.name;
    locations[location] = locations[location] || {
      twitter: 0,
      news: 0,
    };
    locations[location].news += 1; // Count each article as 1
  });

  // Normalize and calculate popularity score
  const scores = Object.values(locations);
  const minScore = Math.min(
    ...scores.map((score) => score.twitter + score.news)
  );
  const maxScore = Math.max(
    ...scores.map((score) => score.twitter + score.news)
  );

  Object.keys(locations).forEach((location) => {
    const score = locations[location];
    locations[location].popularity =
      (score.twitter + score.news - minScore) / (maxScore - minScore);
  });

  return locations;
};

export default RealTimeMediaMap;
