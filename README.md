
# Map Sharing & Image Upload Application

I first started this project as a simple map application using JavaScript to upload images onto pins and save the results. Over time, I transitioned the project into a ReactJS application, adding several features and functionalities. While some of these features are not directly related, they all align with various use cases of the Google Maps API. Below are the technologies used and an explanation of the different structures within the application.
## Features

## Technologies

- **Frontend**: ReactJS (web), React Native (mobile)
- **Backend**: Express.js (for real-time map updates and server-side logic)
- **Cloud**: Google Cloud (for storage and authentication)
- **APIs/ML**: Google Vision API (use to create image validation algorithm), Google Trends API, Web scraping for news articles

### 1. Pin Sharing and Image Upload
- Users can place pins on the map and upload images at specific locations.
- Images are saved with the pins, allowing users to visually document events or locations.
- Pin data and images can be shared with friends through the built-in friend request system.

### 2. Friend Requests and Pin Sharing
- Users can send friend requests to other users.
- Shared pins and uploaded images can be viewed by friends, making it easy to collaborate and share experiences on the map.

### 3. Google Trends Integration
- A global news map highlights significant events worldwide, represented as glowing points on the map.
- Users can click on these points to view news articles and website links relevant to each event, powered by web scraping.
- 
### 4. Real-Time Reviews with Image Upload
- Users can leave reviews at specific locations (restaurants, attractions, etc.) by adding pins on the map.
- Each review can include an image that is validated for relevance and appropriateness before being published.

### 5. Image Validation using Google Vision API
- Correlating with the real-time reviews When users upload images at specific pins, the application checks the appropriateness of the image.
- The Google Vision API ensures the image matches the context (e.g., no irrelevant images such as a landmark photo at a restaurant pin).


## Getting Started

To get started with the development environment:

1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd maproject1-main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open the app in your browser at:
   ```bash
   http://localhost:3000
   ```

## Folder Structure

- `public/`: Public assets such as index.html and icons.
- `src/`: Contains all the React components, API integrations, and custom logic.
  - `components/`: Reusable React components for UI and map interactions.
  - `api/`: API integration files, including Google Vision API, Google Trends, and web scraping utilities.
  - `hooks/`: Custom React hooks for managing state and data fetching.
  
## Available Scripts

### `npm start`
Runs the app in development mode. The page will reload if you make edits.

### `npm test`
Launches the test runner in the interactive watch mode.

### `npm run build`
Builds the app for production in the `build` folder.

## Future Enhancements




