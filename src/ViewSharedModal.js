import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "./firebase";
import "./ViewSharedModal.css";

const ViewSharedModal = ({ onClose }) => {
  const [sharedImages, setSharedImages] = useState([]);
  const [friends, setFriends] = useState([]);
  const [filteredUser, setFilteredUser] = useState("");

  useEffect(() => {
    const fetchSharedImages = async () => {
      const q = query(
        collection(db, "sharedImages"),
        where("to", "==", auth.currentUser.email)
      );
      const querySnapshot = await getDocs(q);
      const imagesData = querySnapshot.docs.map((doc) => doc.data());
      setSharedImages(imagesData);
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

    fetchSharedImages();
    fetchFriends();
  }, []);

  const handleFilter = () => {
    if (filteredUser) {
      const filteredImages = sharedImages.filter(
        (image) => image.from === filteredUser
      );
      setSharedImages(filteredImages);
    } else {
      const fetchSharedImages = async () => {
        const q = query(
          collection(db, "sharedImages"),
          where("to", "==", auth.currentUser.email)
        );
        const querySnapshot = await getDocs(q);
        const imagesData = querySnapshot.docs.map((doc) => doc.data());
        setSharedImages(imagesData);
      };
      fetchSharedImages();
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>Shared Images</h2>
        <div className="filter-container">
          <select
            value={filteredUser}
            onChange={(e) => setFilteredUser(e.target.value)}
          >
            <option value="">Select friend to filter by</option>
            {friends.map((friend, i) => (
              <option key={i} value={friend}>
                {friend}
              </option>
            ))}
          </select>
          <button onClick={handleFilter}>Filter</button>
        </div>
        <div className="shared-images-container">
          {sharedImages.map((image, index) => (
            <div key={index} className="shared-image-frame">
              <img
                src={image.url}
                alt={`shared-${index}`}
                className="shared-image"
              />
              <p>Shared by: {image.from}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViewSharedModal;
