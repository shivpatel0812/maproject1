import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "./firebase";
import "./FilterModal.css";

const FilterModal = ({ onClose, setFilteredUser }) => {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
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
    fetchFriends();
  }, []);

  const handleFilter = (friend) => {
    setFilteredUser(friend);
    onClose();
  };

  const handleUnfilter = () => {
    setFilteredUser("");
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>Filter by Friend</h2>
        <ul>
          <li>
            <button onClick={handleUnfilter}>Show All</button>
          </li>
          {friends.map((friend, index) => (
            <li key={index}>
              <button onClick={() => handleFilter(friend)}>{friend}</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FilterModal;
