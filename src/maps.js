import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
} from "firebase/storage";
import { useDropzone } from "react-dropzone";
import { db, storage, auth } from "./firebase";
import heic2any from "heic2any";
import "./ImageModal.css";

const containerStyle = {
  width: "100%",
  height: "1000px",
};

const center = {
  lat: -3.745,
  lng: -38.523,
};

const Map = ({ filteredUser, onMarkerSelect }) => {
  const [markers, setMarkers] = useState([]);
  const [allMarkers, setAllMarkers] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "markers"), (snapshot) => {
      const markersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllMarkers(markersData);
      setMarkers(markersData);
    });

    return () => unsubscribe();
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

  const handleMarkerClick = (marker) => {
    console.log("Marker clicked:", marker);
    onMarkerSelect(marker); // Notify App.js about marker selection
  };

  return (
    <div>
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
            onClick={() => handleMarkerClick(marker)}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export default Map;
