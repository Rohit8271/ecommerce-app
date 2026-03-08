import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Replace with your actual Firebase project configuration
// These values were lost when the file was accidentally deleted.
// You can find these in your Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
    apiKey: "AIzaSyAwLsmUvamjxNZ4tb9lEL-ilwhI7e_moPg",
    authDomain: "shop-delighted.firebaseapp.com",
    projectId: "shop-delighted",
    storageBucket: "shop-delighted.firebasestorage.app",
    messagingSenderId: "258591547055",
    appId: "1:258591547055:web:0486064095c8ba1abdfe5a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
