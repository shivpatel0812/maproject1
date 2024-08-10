import React, { useEffect, useState, useCallback, useRef } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import axios from "axios";
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
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
import ImageDetailModal from "./ImageDetailModal";

const containerStyle = {
  width: "100%",
  height: "1000px",
};

const center = {
  lat: -3.745,
  lng: -38.523,
};

const RealTimeMap = () => {
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [images, setImages] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState("");
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [imageDetailVisible, setImageDetailVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const textInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "normalMarkers"),
      (snapshot) => {
        const markerData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMarkers(markerData);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedMarker) {
      fetchImages(selectedMarker.id);
      fetchFriends();
      fetchComments(selectedMarker.id);
    }
  }, [selectedMarker]);

  const fetchImages = async (markerId) => {
    const listRef = ref(storage, `normalImages/${markerId}`);
    try {
      const imageList = await listAll(listRef);
      const urls = await Promise.all(
        imageList.items.map((item) => getDownloadURL(item))
      );
      setImages(urls);
    } catch (error) {
      console.error("Error fetching image URLs:", error);
    }
  };

  const fetchFriends = async () => {
    const q = query(
      collection(db, "friendRequests"),
      where("status", "==", "accepted")
    );
    const querySnapshot = await getDocs(q);
    const friendsData = querySnapshot.docs
      .filter(
        (doc) =>
          doc.data().recipient === auth.currentUser.email ||
          doc.data().requester === auth.currentUser.email
      )
      .map((doc) =>
        doc.data().recipient === auth.currentUser.email
          ? doc.data().requester
          : doc.data().recipient
      );
    setFriends(friendsData);
  };

  const fetchComments = async (markerId) => {
    const q = query(
      collection(db, "comments"),
      where("markerId", "==", markerId)
    );
    try {
      const querySnapshot = await getDocs(q);
      const commentsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(commentsData);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!selectedMarker) return;

      const file = acceptedFiles[0];
      if (!file) return;

      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await axios.post("/api/check-image", formData);

        if (response.data.safe) {
          let convertedFile = file;
          if (file.type === "image/heic") {
            try {
              const blob = await heic2any({ blob: file, toType: "image/jpeg" });
              convertedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, ".jpg"),
                {
                  type: "image/jpeg",
                }
              );
            } catch (error) {
              console.error("Error converting HEIC file:", error);
              return;
            }
          }

          const storageRef = ref(
            storage,
            `normalImages/${selectedMarker.id}/${Date.now()}`
          );
          await uploadBytes(storageRef, convertedFile);
          fetchImages(selectedMarker.id);
        } else {
          console.log("Image is not appropriate for upload");
        }
      } catch (error) {
        console.error("Error checking image content:", error);
      }
    },
    [selectedMarker]
  );

  const shareImage = async (url) => {
    if (!selectedFriend) return;

    try {
      await addDoc(collection(db, "sharedImages"), {
        from: auth.currentUser.email,
        to: selectedFriend,
        url,
        markerId: selectedMarker.id,
        timestamp: new Date(),
      });
      setSelectedFriend("");
      setConfirmationVisible(true);
    } catch (error) {
      console.error("Error sharing image:", error);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleMapClick = async (event) => {
    const newMarker = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
      id: Date.now().toString(),
      userId: auth.currentUser.uid,
    };
    try {
      await addDoc(collection(db, "normalMarkers"), newMarker);
      setMarkers([...markers, newMarker]);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
    setModalVisible(true);
  };

  const deleteMarker = async () => {
    if (!selectedMarker) return;

    try {
      await deleteDoc(doc(db, "normalMarkers", selectedMarker.id));

      const imagesRef = ref(storage, `normalImages/${selectedMarker.id}`);
      const imagesList = await listAll(imagesRef);
      const deletePromises = imagesList.items.map((imageRef) =>
        deleteObject(imageRef)
      );
      await Promise.all(deletePromises);

      setMarkers(markers.filter((marker) => marker.id !== selectedMarker.id));
      setSelectedMarker(null);
      setModalVisible(false);
    } catch (error) {
      console.error("Error deleting marker and associated images:", error);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      const commentData = {
        markerId: selectedMarker.id,
        text: newComment,
        user: auth.currentUser.email,
        timestamp: new Date(),
      };
      const docRef = await addDoc(collection(db, "comments"), commentData);
      setComments([...comments, { id: docRef.id, ...commentData }]);
      setNewComment("");
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
  };

  const handleCommentDelete = async (commentId) => {
    try {
      await deleteDoc(doc(db, "comments", commentId));
      setComments(comments.filter((comment) => comment.id !== commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleImageClick = (url) => {
    setSelectedImageUrl(url);
    setImageDetailVisible(true);
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

      {modalVisible && selectedMarker && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setModalVisible(false)}>
              &times;
            </span>
            <h2>Images for Pin {selectedMarker.id}</h2>
            <div {...getRootProps({ className: "dropzone" })}>
              <input {...getInputProps()} />
              <p>Drag 'n' drop some files here, or click to select files</p>
            </div>
            <div className="image-container">
              {images.map((url, index) => (
                <div
                  key={index}
                  className="image-frame"
                  onClick={() => handleImageClick(url)}
                >
                  <img
                    src={url}
                    alt={`pin-${selectedMarker.id}-${index}`}
                    className="uploaded-image"
                  />
                  <div className="share-container">
                    <select
                      value={selectedFriend}
                      onChange={(e) => setSelectedFriend(e.target.value)}
                    >
                      <option value="">Select friend to share with</option>
                      {friends.map((friend, i) => (
                        <option key={i} value={friend}>
                          {friend}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => shareImage(url)}>Share</button>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <input
                type="text"
                ref={textInputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Enter your comment..."
              />
              <button onClick={handleCommentSubmit}>Submit</button>
            </div>
            <div className="comments-section">
              {comments.map((comment) => (
                <div key={comment.id} className="comment">
                  <p>
                    {comment.user}: {comment.text}
                  </p>
                  <button onClick={() => handleCommentDelete(comment.id)}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <button onClick={deleteMarker}>Delete Point</button>
            <button onClick={() => setModalVisible(false)}>Close</button>
          </div>
        </div>
      )}

      {confirmationVisible && (
        <div className="modal">
          <div className="modal-content">
            <span
              className="close"
              onClick={() => setConfirmationVisible(false)}
            >
              &times;
            </span>
            <h2>Image Shared Successfully!</h2>
            <p>The image has been shared with your friend.</p>
            <button onClick={() => setConfirmationVisible(false)}>Close</button>
          </div>
        </div>
      )}

      {imageDetailVisible && (
        <ImageDetailModal
          imageUrl={selectedImageUrl}
          markerId={selectedMarker.id}
          onClose={() => setImageDetailVisible(false)}
        />
      )}
    </div>
  );
};

export default RealTimeMap;
