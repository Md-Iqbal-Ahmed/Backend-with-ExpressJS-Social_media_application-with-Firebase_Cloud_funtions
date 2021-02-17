const functions = require("firebase-functions");
const express = require("express");
const app = express();
const {
  getAllScreams,
  postOneScreams,
  getScream,
  commentOnScream,
  likeScream,
  unlikeScream,
  deleteScreams,
} = require("./handlers/screams");
const {
  logIn,
  signUp,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead,
} = require("./handlers/users");
const fbAuth = require("./utils/fbAuth");
const { user } = require("firebase-functions/lib/providers/auth");
const { db } = require("./utils/admin");

app.get("/screams", getAllScreams);
app.post("/screams", fbAuth, postOneScreams);
app.delete("/screams/:screamId", fbAuth, deleteScreams);
app.get("/screams/:screamId", getScream);
app.post("/screams/:screamId/comment", fbAuth, commentOnScream);
app.get("/screams/:screamId/like", fbAuth, likeScream);
app.get("/screams/:screamId/unlike", fbAuth, unlikeScream);

app.post("/signup", signUp);
app.post("/login", logIn);
app.post("/user/upload", fbAuth, uploadImage);
app.post("/user", fbAuth, addUserDetails);
app.get("/user", fbAuth, getAuthenticatedUser);
app.get("/user/:handle", getUserDetails);
app.post("/notifications", fbAuth, markNotificationsRead);

exports.api = functions.region("asia-south1").https.onRequest(app);

exports.createNotificationOnLike = functions
  .region("asia-south1")
  .firestore.document("likes/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().handle !== snapshot.data().handle) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createAt: new Date().toISOString(),
            recepient: doc.data().handle,
            sender: snapshot.data().handle,
            type: "like",
            read: false,
            screamId: doc.id,
          });
        }
      })
      .catch((err) => console.error(err));
  });

exports.deleteNotificationOnUnlike = functions
  .region("asia-south1")
  .firestore.document("/likes/{id}")
  .onDelete((snapshot) => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions
  .region("asia-south1")
  .firestore.document("comments/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().handle !== snapshot.data().handle) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createAt: new Date().toISOString(),
            recepient: doc.data().handle,
            sender: snapshot.data().handle,
            type: "comment",
            read: false,
            screamId: doc.id,
          });
        }
      })

      .catch((err) => console.error(err));
  });

exports.onUserImageChange = functions
  .region("asia-south1")
  .firestore.document("/users/{userid}")
  .onUpdate((change) => {
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log("Image has changed");
      const batch = db.batch();
      return db
        .collection("screams")
        .where("handle", "==", change.after.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const scream = db.doc(`/screams/${doc.id}`);
            batch.update(scream, { imageUrl: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else {
      return true;
    }
  });

exports.onScreamDelete = functions
  .region("asia-south1")
  .firestore.document("/screams/{screamId}")
  .onDelete((snapshot, context) => {
    const screamId = context.params.screamId;
    const batch = db.batch();
    return db
      .collection("comments")
      .where("screamId", "==", screamId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db.collection("likes").where("screamId", "==", screamId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection("notifications")
          .where("screamId", "==", screamId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  });
