import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { LoadScript } from "@react-google-maps/api";
import "./App.css";
import Map from "./maps";
import RealTimeMap from "./RealTimeMap";
import RealTimeMediaMap from "./RealTimeMediaMap"; // Import the new component
import ImageModal from "./imagemodal";
import Login from "./Login";
import SignUp from "./SignUp";
import FriendRequestModal from "./FriendRequestModal";
import ViewFriendsModal from "./ViewFriendsModal";
import ViewSharedModal from "./ViewSharedModal";
import FilterModal from "./FilterModal";
import { auth } from "./firebase";

const AppContent = ({ user, setUser }) => {
  const [showSignUp, setShowSignUp] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [friendRequestModalVisible, setFriendRequestModalVisible] =
    useState(false);
  const [viewFriendsModalVisible, setViewFriendsModalVisible] = useState(false);
  const [viewSharedModalVisible, setViewSharedModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filteredUser, setFilteredUser] = useState("");

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const handleMarkerSelect = (marker) => {
    setSelectedMarker(marker);
    setModalVisible(true);
  };

  const handleLogin = () => {
    const currentUser = getAuth().currentUser;
    setUser(currentUser);
  };

  const handleSignUp = () => {
    const currentUser = getAuth().currentUser;
    setUser(currentUser);
    setShowSignUp(false);
  };

  if (!user) {
    return showSignUp ? (
      <SignUp onSignUp={handleSignUp} />
    ) : (
      <Login onLogin={handleLogin} onShowSignUp={() => setShowSignUp(true)} />
    );
  }

  return (
    <Router>
      <div className="App">
        <nav>
          <button onClick={handleLogout}>Logout</button>
          <button onClick={() => setFriendRequestModalVisible(true)}>
            Friend Requests
          </button>
          <button onClick={() => setViewFriendsModalVisible(true)}>
            View Friends
          </button>
          <button onClick={() => setViewSharedModalVisible(true)}>
            View Shared
          </button>
          <button onClick={() => setFilterModalVisible(true)}>Filter</button>
          <Link to="/map">
            <button>Map</button>
          </Link>
          <Link to="/real-time-map">
            <button>Real-Time Map</button>
          </Link>
          <Link to="/real-time-media-map">
            <button>Real-Time Media Map</button>
          </Link>
        </nav>

        <Routes>
          <Route
            path="/map"
            element={
              <Map
                onMarkerSelect={handleMarkerSelect}
                filteredUser={filteredUser}
              />
            }
          />
          <Route path="/real-time-map" element={<RealTimeMap />} />
          <Route path="/real-time-media-map" element={<RealTimeMediaMap />} />
          <Route path="/" element={<div>Welcome to the app!</div>} />
        </Routes>

        {modalVisible && (
          <ImageModal
            marker={selectedMarker}
            onClose={() => setModalVisible(false)}
          />
        )}
        {friendRequestModalVisible && (
          <FriendRequestModal
            onClose={() => setFriendRequestModalVisible(false)}
          />
        )}
        {viewFriendsModalVisible && (
          <ViewFriendsModal onClose={() => setViewFriendsModalVisible(false)} />
        )}
        {viewSharedModalVisible && (
          <ViewSharedModal onClose={() => setViewSharedModalVisible(false)} />
        )}
        {filterModalVisible && (
          <FilterModal
            onClose={() => setFilterModalVisible(false)}
            setFilteredUser={setFilteredUser}
          />
        )}
      </div>
    </Router>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <LoadScript googleMapsApiKey="AIzaSyD7x6pfgK7H_t3nd3Nrg1PpMjuFPOVwFG8">
      <AppContent user={user} setUser={setUser} />
    </LoadScript>
  );
}

export default App;
