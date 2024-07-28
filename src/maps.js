import React, { useState, useEffect } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "./firebase";

const containerStyle = {
  width: "100%",
  height: "1000px",
};

const center = {
  lat: -3.745,
  lng: -38.523,
};

const Map = ({ onMarkerSelect, filteredUser }) => {
  const [markers, setMarkers] = useState([]);
  const [allMarkers, setAllMarkers] = useState([]);

  useEffect(() => {
    const fetchMarkers = async () => {
      const querySnapshot = await getDocs(collection(db, "markers"));
      const markersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Fetched markers:", markersData); // Log fetched markers
      setAllMarkers(markersData);
      setMarkers(markersData);
    };
    fetchMarkers();
  }, []);

  useEffect(() => {
    if (filteredUser) {
      const fetchSharedMarkers = async () => {
        const q = query(
          collection(db, "sharedImages"),
          where("to", "==", filteredUser)
        );
        const querySnapshot = await getDocs(q);
        const sharedMarkersData = querySnapshot.docs.map((doc) => doc.data());
        const sharedMarkerIds = sharedMarkersData.map((data) => data.markerId);
        console.log(
          "Filtered markers by user:",
          filteredUser,
          sharedMarkersData
        ); // Log filtered markers
        console.log("Shared marker IDs:", sharedMarkerIds); // Log shared marker IDs
        setMarkers(
          allMarkers.filter((marker) => sharedMarkerIds.includes(marker.id))
        );
      };
      fetchSharedMarkers();
    } else {
      setMarkers(allMarkers);
    }
  }, [filteredUser, allMarkers]);

  const handleMapClick = async (event) => {
    const newMarker = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
      id: Date.now().toString(),
      userId: auth.currentUser.uid,
    };
    try {
      await addDoc(collection(db, "markers"), newMarker);
      console.log("Added new marker:", newMarker); // Log new marker
      setMarkers([...markers, newMarker]);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={10}
      onClick={handleMapClick}
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={{ lat: marker.lat, lng: marker.lng }}
          onClick={() => onMarkerSelect(marker)}
        />
      ))}
    </GoogleMap>
  );
};

export default Map;
