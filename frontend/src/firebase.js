import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBLxzNdxqMcRNRIYixhkEP1_02je9cNCJo",
  authDomain: "prioritymanagerapp.firebaseapp.com",
  projectId: "prioritymanagerapp",
  storageBucket: "prioritymanagerapp.appspot.com",
  messagingSenderId: "97645460657",
  appId: "1:97645460657:web:cb0b51caf73617b0e8f690",
  measurementId: "G-DWR6BF7X7F"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, googleProvider, db };
export default app;
