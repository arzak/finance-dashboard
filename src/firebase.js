import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAYN0N7JnFxb2oXxbplrHFDN5xtxT4BOW8",
    authDomain: "dineros-c0629.firebaseapp.com",
    projectId: "dineros-c0629",
    storageBucket: "dineros-c0629.firebasestorage.app",
    messagingSenderId: "892170836889",
    appId: "1:892170836889:web:694f7f1dadd7ff65d29108",
    measurementId: "G-LLB3XBVLLK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
