import React from "react";
import "./ShareConfirmationModal.css";

const ShareConfirmationModal = ({ onClose }) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>Image Shared Successfully!</h2>
        <p>The image has been shared with your friend.</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default ShareConfirmationModal;
