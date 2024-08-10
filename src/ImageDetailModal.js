import React, { useState, useEffect } from "react";
import "./ImageDetailModal.css";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "./firebase";

const ImageDetailModal = ({ imageUrl, markerId, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    fetchComments();
  }, [markerId, imageUrl]);

  const fetchComments = async () => {
    const q = query(
      collection(db, "comments"),
      where("markerId", "==", markerId),
      where("imageUrl", "==", imageUrl)
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

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      const commentData = {
        markerId,
        imageUrl, // Include imageUrl to associate the comment with this image
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

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <img src={imageUrl} alt="Selected" className="detailed-image" />
        <div className="comment-container">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Enter your comment..."
            rows="4"
            className="comment-textarea"
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
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default ImageDetailModal;
