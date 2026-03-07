import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project configuration
// These values were lost when the file was accidentally deleted.
// You can find these in your Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
    apiKey: "AIzaSyAymvJACXpnCfHv74pBbVUAkyJoINEZmWw",
    authDomain: "delighter.firebaseapp.com",
    projectId: "delighter",
    storageBucket: "delighter.appspot.com",
    messagingSenderId: "826720470395",
    appId: "1:826720470395:web:896aab81af7ddb9a6ce9de"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
