import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { LoadScript } from "@react-google-maps/api";
import "./App.css";
import Map from "./maps";
import ImageModal from "./imagemodal";
import Login from "./Login";
import SignUp from "./SignUp";
import FriendRequestModal from "./FriendRequestModal";
import ViewFriendsModal from "./ViewFriendsModal";
import ViewSharedModal from "./ViewSharedModal";
import FilterModal from "./FilterModal"; // Import the FilterModal component
import { auth } from "./firebase";

const AppContent = ({ user, setUser }) => {
  const [showSignUp, setShowSignUp] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [friendRequestModalVisible, setFriendRequestModalVisible] =
    useState(false);
  const [viewFriendsModalVisible, setViewFriendsModalVisible] = useState(false);
  const [viewSharedModalVisible, setViewSharedModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false); // State for the filter modal
  const [filteredUser, setFilteredUser] = useState(""); // State for the filtered user

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const handleMarkerSelect = (marker) => {
    setSelectedMarker(marker);
    setModalVisible(true);
  };

  const handleLogin = () => {
    setUser(getAuth().currentUser);
  };

  const handleSignUp = () => {
    setUser(getAuth().currentUser);
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
    <div className="App">
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
      <button onClick={() => setFilterModalVisible(true)}>Filter</button>{" "}
      {/* Add Filter button */}
      <Map
        onMarkerSelect={handleMarkerSelect}
        filteredUser={filteredUser}
      />{" "}
      {/* Pass filteredUser to Map */}
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
