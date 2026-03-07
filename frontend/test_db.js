import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "test",
  authDomain: "test",
  projectId: "demoproject",
  storageBucket: "test",
  messagingSenderId: "test",
  appId: "test"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const snapshot = await getDocs(collection(db, "products"));
  console.log("Found " + snapshot.size + " products");
  snapshot.forEach(doc => console.log(doc.data().name));
}
check();
