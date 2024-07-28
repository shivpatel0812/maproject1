import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import "./FriendRequestModal.css";

const FriendRequestModal = ({ onClose }) => {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [email, setEmail] = useState("");

  const fetchRequests = async () => {
    const q = query(
      collection(db, "friendRequests"),
      where("recipient", "==", auth.currentUser.email)
    );
    const querySnapshot = await getDocs(q);
    const requests = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setIncomingRequests(requests);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSendRequest = async () => {
    try {
      await addDoc(collection(db, "friendRequests"), {
        requester: auth.currentUser.email,
        recipient: email,
        status: "pending",
      });
      setEmail("");
    } catch (error) {
      console.error("Error sending friend request: ", error);
    }
  };

  const handleAccept = async (id) => {
    try {
      const requestRef = doc(db, "friendRequests", id);
      await updateDoc(requestRef, { status: "accepted" });
      fetchRequests();
    } catch (error) {
      console.error("Error accepting friend request: ", error);
    }
  };

  const handleDecline = async (id) => {
    try {
      const requestRef = doc(db, "friendRequests", id);
      await updateDoc(requestRef, { status: "declined" });
      fetchRequests();
    } catch (error) {
      console.error("Error declining friend request: ", error);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>Send Friend Request</h2>
        <div className="input-container">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter friend's email"
          />
          <button onClick={handleSendRequest}>Send Request</button>
        </div>
        <h2>Incoming Friend Requests</h2>
        <ul>
          {incomingRequests.map(
            (req) =>
              req.status === "pending" && (
                <li key={req.id}>
                  <span>{req.requester} wants to be friends</span>
                  <div className="button-container">
                    <button onClick={() => handleAccept(req.id)}>Accept</button>
                    <button onClick={() => handleDecline(req.id)}>
                      Decline
                    </button>
                  </div>
                </li>
              )
          )}
        </ul>
      </div>
    </div>
  );
};

export default FriendRequestModal;
