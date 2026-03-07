import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testWrite() {
    try {
        console.log("Attempting write to:", process.env.VITE_FIREBASE_PROJECT_ID);
        const testRef = doc(db, 'users', 'anonymous_test_user');
        await setDoc(testRef, { test: 'data' }, { merge: true });
        console.log("Write success!");
        process.exit(0);
    } catch (e) {
        console.error("Write failed:", e.message);
        process.exit(1);
    }
}

testWrite();
