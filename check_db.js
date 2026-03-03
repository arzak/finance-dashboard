import "dotenv/config";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAYN0N7JnFxb2oXxbplrHFDN5xtxT4BOW8",
    authDomain: "dineros-c0629.firebaseapp.com",
    projectId: "dineros-c0629",
    storageBucket: "dineros-c0629.firebasestorage.app",
    messagingSenderId: "892170836889",
    appId: "1:892170836889:web:694f7f1dadd7ff65d29108"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
    console.log("Checking DB directly script...");
    const snap = await getDocs(collection(db, "transactions"));
    console.log(`Transactions total: ${snap.size}`);

    let withUserId = 0;
    let withoutUserId = 0;

    snap.forEach(d => {
        if (d.data().userId) withUserId++;
        else withoutUserId++;
    });

    console.log(`With userId: ${withUserId}`);
    console.log(`Without userId: ${withoutUserId}`);
}

check().catch(console.error).finally(() => process.exit(0));
