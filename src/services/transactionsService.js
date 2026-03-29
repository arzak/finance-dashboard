import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";
import { db } from "../firebase";

function sortByCreatedAtDesc(items) {
    return [...items].sort((a, b) => {
        const ta = a.createdAt?.toDate?.() ?? new Date(0);
        const tb = b.createdAt?.toDate?.() ?? new Date(0);
        return tb - ta;
    });
}

export function subscribeToTransactions(userId, onData, onError) {
    const transactionsQuery = query(
        collection(db, "transactions"),
        where("userId", "==", userId),
    );

    return onSnapshot(
        transactionsQuery,
        (snapshot) => {
            const items = snapshot.docs.map((docSnapshot) => ({
                id: docSnapshot.id,
                ...docSnapshot.data(),
            }));
            onData(sortByCreatedAtDesc(items));
        },
        onError,
    );
}

export async function addTransaction(userId, transaction) {
    await addDoc(collection(db, "transactions"), {
        ...transaction,
        userId,
        createdAt: serverTimestamp(),
    });
}

export async function deleteTransaction(transactionId) {
    await deleteDoc(doc(db, "transactions", transactionId));
}

export async function clearTransactions(userId) {
    const transactionsQuery = query(
        collection(db, "transactions"),
        where("userId", "==", userId),
    );
    const snapshot = await getDocs(transactionsQuery);
    await Promise.all(snapshot.docs.map((docSnapshot) => deleteDoc(docSnapshot.ref)));
    return snapshot.size;
}
