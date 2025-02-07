import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLxzNdxqMcRNRIYixhkEP1_02je9cNCJo",
  authDomain: "prioritymanagerapp.firebaseapp.com",
  projectId: "prioritymanagerapp",
  storageBucket: "prioritymanagerapp.appspot.com", // ✅ Fixed
  messagingSenderId: "97645460657",
  appId: "1:97645460657:web:cb0b51caf73617b0e8f690",
  measurementId: "G-DWR6BF7X7F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider(); // 🔹 Add Google Auth
export default app;
