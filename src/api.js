import axios from "axios";

// Fetch Twitter trends data
export const fetchTwitterTrends = async (location) => {
  try {
    const response = await axios.get(
      `https://api.twitter.com/1.1/trends/place.json?id=${location}`,
      {
        headers: {
          Authorization: `Bearer AAAAAAAAAAAAAAAAAAAAACrnvAEAAAAA2U45dYraMJxUpLklcN9RjomxNTE%3DbHG1fBGunLJRLFkKVPFvyJjjbFsKcUfFijphRZA887SsEQW7bO`,
        },
      }
    );
    return response.data[0].trends;
  } catch (error) {
    console.error("Error fetching Twitter trends:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
    return [];
  }
};

// Fetch News trends data
export const fetchNewsTrends = async (query) => {
  try {
    const response = await axios.get(
      `https://newsapi.org/v2/everything?q=${query}&apiKey=4c7fe408f6ff4fc9a5fa0fcf44f404b0`
    );
    return response.data.articles;
  } catch (error) {
    console.error("Error fetching news trends:", error);
    return [];
  }
};

// Helper function to get latitude and longitude for a location
export const getLatLngForLocation = (location) => {
  const locations = {
    "New York": [40.712776, -74.005974],
    Paris: [48.856613, 2.352222],
    Bangladesh: [23.685, 90.3563],
    Palestine: [31.9474, 35.2272],
    // Add more predefined locations here
  };
  return locations[location] || [0, 0]; // Default to [0, 0] if location is not found
};

// Process and aggregate trends data
export const processTrendsData = (twitterData, newsData) => {
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
