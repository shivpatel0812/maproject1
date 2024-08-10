import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
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

const ImageModal = ({ marker, onClose }) => {
  const [images, setImages] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState("");
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [imageDetailVisible, setImageDetailVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(""); // State for the selected image URL
  const [comments, setComments] = useState([]); // State for comments
  const [newComment, setNewComment] = useState(""); // State for new comment
  const textInputRef = useRef(null); // Create a ref for the textbox

  useEffect(() => {
    if (marker) {
      console.log("ImageModal mounted with marker:", marker);
      fetchImages();
      fetchFriends();
      fetchComments();
    }
  }, [marker]);

  const fetchImages = async () => {
    if (marker) {
      console.log("Fetching images for marker:", marker.id);
      const listRef = ref(storage, `markerImages/${marker.id}`);
      try {
        const imageList = await listAll(listRef);
        const urls = await Promise.all(
          imageList.items.map((item) => getDownloadURL(item))
        );
        setImages(urls);
        console.log("Fetched images:", urls);
      } catch (error) {
        console.error("Error fetching image URLs:", error);
      }
    }
  };

  const fetchFriends = async () => {
    console.log("Fetching friends for current user:", auth.currentUser.email);
    const q = query(
      collection(db, "friendRequests"),
      where("status", "==", "accepted")
    );
    try {
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
      console.log("Fetched friends:", friendsData);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const fetchComments = async () => {
    if (marker) {
      console.log("Fetching comments for marker:", marker.id);
      const q = query(
        collection(db, "comments"),
        where("markerId", "==", marker.id),
        where("imageUrl", "==", "")
      );
      try {
        const querySnapshot = await getDocs(q);
        const commentsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(commentsData);
        console.log("Fetched comments:", commentsData);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      console.log("File dropped:", file);

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
          console.log("Converted HEIC to JPEG:", convertedFile);
        } catch (error) {
          console.error("Error converting HEIC file:", error);
          return;
        }
      }

      const storageRef = ref(
        storage,
        `markerImages/${marker.id}/${Date.now()}`
      );
      try {
        await uploadBytes(storageRef, convertedFile);
        console.log("Uploaded file to storage:", storageRef);
        fetchImages(); // Trigger fetchImages to update state and re-render
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    },
    [marker]
  );

  const shareImage = async (url) => {
    if (!selectedFriend) return;

    console.log("Sharing image:", url, "with friend:", selectedFriend);
    try {
      await addDoc(collection(db, "sharedImages"), {
        from: auth.currentUser.email,
        to: selectedFriend,
        url,
        markerId: marker.id,
        timestamp: new Date(),
      });
      console.log("Shared image with marker ID:", marker.id);
      setSelectedFriend("");
      setConfirmationVisible(true);
    } catch (error) {
      console.error("Error sharing image:", error);
    }
  };

  const deleteMarker = async () => {
    if (!marker) return;

    console.log("Deleting marker:", marker.id);
    try {
      await deleteDoc(doc(db, "markers", marker.id));

      const imagesRef = ref(storage, `markerImages/${marker.id}`);
      const imagesList = await listAll(imagesRef);
      const deletePromises = imagesList.items.map((imageRef) =>
        deleteObject(imageRef)
      );
      await Promise.all(deletePromises);

      console.log("Deleted marker and associated images.");
      onClose();
    } catch (error) {
      console.error("Error deleting marker and associated images:", error);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleImageClick = (url) => {
    console.log("Image clicked:", url);
    setSelectedImageUrl(url);
    setImageDetailVisible(true);
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      const commentData = {
        markerId: marker.id,
        imageUrl: "", // General comment, not associated with an image
        text: newComment,
        user: auth.currentUser.email,
        timestamp: new Date(),
      };
      const docRef = await addDoc(collection(db, "comments"), commentData);
      setComments([...comments, { id: docRef.id, ...commentData }]);
      setNewComment(""); // Clear the comment input after submission
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
      {console.log("Rendering ImageModal with images:", images)}
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
            <div
              key={index}
              className="image-frame"
              onClick={() => handleImageClick(url)}
            >
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
        <button onClick={onClose}>Close</button>
      </div>
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
          markerId={marker.id} // Pass markerId to ImageDetailModal
          onClose={() => setImageDetailVisible(false)}
        />
      )}
    </div>
  );
};

export default ImageModal;
