import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyDvWQXNk4-vcpTYHvPpz2XXw-C7ocsu6rE",
  authDomain: "booking-2dfd1.firebaseapp.com",
  projectId: "booking-2dfd1",
  storageBucket: "booking-2dfd1.appspot.com",  // ✅ fixed here
  messagingSenderId: "200521592031",
  appId: "1:200521592031:web:1d7dc53b5645a7540b0d6a",
  measurementId: "G-XP4VKSJV0D"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };