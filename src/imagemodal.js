import React, { useEffect, useState, useCallback } from "react";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { useDropzone } from "react-dropzone";
import { storage, db, auth } from "./firebase";
import heic2any from "heic2any";
import "./ImageModal.css";
import ShareConfirmationModal from "./ShareConfirmationModal";

const ImageModal = ({ marker, onClose }) => {
  const [images, setImages] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState("");
  const [confirmationVisible, setConfirmationVisible] = useState(false);

  const fetchImages = async () => {
    if (marker) {
      const listRef = ref(storage, `images/${marker.id}`);
      try {
        const imageList = await listAll(listRef);
        const urls = await Promise.all(
          imageList.items.map((item) => getDownloadURL(item))
        );
        setImages(urls);
      } catch (error) {
        console.error("Error fetching image URLs:", error);
      }
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

  useEffect(() => {
    fetchImages();
    fetchFriends();
  }, [marker]);

  const shareImage = async (url) => {
    try {
      await addDoc(collection(db, "sharedImages"), {
        from: auth.currentUser.email,
        to: selectedFriend,
        url,
        markerId: marker.id, // Include marker ID
        timestamp: new Date(),
      });
      console.log("Shared image with marker ID:", marker.id); // Log marker ID when sharing
      setSelectedFriend("");
      setConfirmationVisible(true); // Show confirmation modal
    } catch (error) {
      console.error("Error sharing image:", error);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

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

      const storageRef = ref(storage, `images/${marker.id}/${Date.now()}`);
      try {
        await uploadBytes(storageRef, convertedFile);
        fetchImages(); // Refresh images after upload
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    },
    [marker]
  );

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>Images for Pin {marker?.id}</h2>
        <div {...getRootProps({ className: "dropzone" })}>
          <input {...getInputProps()} />
          <p>Drag 'n' drop some files here, or click to select files</p>
        </div>
        <div className="image-container">
          {images.map((url, index) => (
            <div key={index} className="image-frame">
              <img
                src={url}
                alt={`pin-${marker.id}-${index}`}
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
      </div>
      {confirmationVisible && (
        <ShareConfirmationModal onClose={() => setConfirmationVisible(false)} />
      )}
    </div>
  );
};

export default ImageModal;
