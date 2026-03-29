import {
    addDoc,
    collection,
    doc,
    increment,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import { db } from "../firebase";

const LEGACY_LIMIT_KEY = "l\u00edmite";

function sortByCreatedAtDesc(items) {
    return [...items].sort((a, b) => {
        const ta = a.createdAt?.toDate?.() ?? new Date(0);
        const tb = b.createdAt?.toDate?.() ?? new Date(0);
        return tb - ta;
    });
}

function toNumber(value) {
    return parseFloat(value) || 0;
}

export function normalizeCreditCardPayload(card) {
    const limit = toNumber(card.limit ?? card[LEGACY_LIMIT_KEY]);

    return {
        ...card,
        limit,
        [LEGACY_LIMIT_KEY]: limit,
        initialDebt: toNumber(card.initialDebt),
        payments: toNumber(card.payments),
        manualAdjustment: toNumber(card.manualAdjustment),
    };
}

export function subscribeToCreditCards(userId, onData, onError) {
    const cardsQuery = query(
        collection(db, "creditCards"),
        where("userId", "==", userId),
    );

    return onSnapshot(
        cardsQuery,
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

export async function addCreditCard(userId, card) {
    await addDoc(collection(db, "creditCards"), {
        ...normalizeCreditCardPayload(card),
        userId,
        createdAt: serverTimestamp(),
    });
}

export async function updateCreditCard(cardId, data) {
    await updateDoc(doc(db, "creditCards", cardId), normalizeCreditCardPayload(data));
}

export async function addCardPayment(userId, cardId, amount, metadata = {}) {
    await updateDoc(doc(db, "creditCards", cardId), {
        payments: increment(amount),
    });

    await addDoc(collection(db, "transactions"), {
        store: metadata.store || "Pago a tarjeta",
        category: metadata.category || "Transferencia",
        paymentMethod: metadata.paymentMethod || "Efectivo",
        amount: toNumber(amount),
        type: "pago_tarjeta",
        cardId,
        userId,
        createdAt: serverTimestamp(),
        date: metadata.date || "Justo ahora",
        icon: metadata.icon || "payments",
        iconColor: metadata.iconColor || "emerald",
    });
}

export async function adjustCardPayments(cardId, amountDelta) {
    await updateDoc(doc(db, "creditCards", cardId), {
        payments: increment(toNumber(amountDelta)),
    });
}
