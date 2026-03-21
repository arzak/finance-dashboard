import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import {
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    serverTimestamp,
    increment,
    query,
    where,
    getDocs
} from "firebase/firestore";
import { useAuth } from "../AuthContext";

const FinanceContext = createContext(null);

export function useFinance() {
    return useContext(FinanceContext);
}

export function FinanceProvider({ children }) {
    const { currentUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [creditCards, setCreditCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Real-time sync for transactions and credit cards
    useEffect(() => {
        if (!db || !currentUser) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const uid = currentUser.uid;

        const qTxs = query(
            collection(db, "transactions"),
            where("userId", "==", uid)
        );
        const unsubscribeTxs = onSnapshot(qTxs, (snapshot) => {
            const items = [];
            snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });
            items.sort((a, b) => {
                const ta = a.createdAt?.toDate?.() ?? new Date(0);
                const tb = b.createdAt?.toDate?.() ?? new Date(0);
                return tb - ta;
            });
            setTransactions(items);
            setError(null);
        }, (err) => {
            console.error("Transactions listener error:", err);
            setError(err.message);
        });

        const qCards = query(
            collection(db, "creditCards"),
            where("userId", "==", uid)
        );
        const unsubscribeCards = onSnapshot(qCards, (snapshot) => {
            const items = [];
            snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });
            items.sort((a, b) => {
                const ta = a.createdAt?.toDate?.() ?? new Date(0);
                const tb = b.createdAt?.toDate?.() ?? new Date(0);
                return tb - ta;
            });
            setCreditCards(items);
            setError(null);
        }, (err) => {
            console.error("CreditCards listener error:", err);
            setError(err.message);
        });

        setLoading(false);

        return () => {
            unsubscribeTxs();
            unsubscribeCards();
        };
    }, [currentUser]);

    // CRUD Operations
    const addTransaction = useCallback(async (transaction) => {
        if (!db || !currentUser) throw new Error("No database connection");
        try {
            await addDoc(collection(db, "transactions"), {
                ...transaction,
                userId: currentUser.uid,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error adding transaction:", error);
            throw error;
        }
    }, [currentUser]);

    const deleteTransaction = useCallback(async (txId) => {
        if (!db || !currentUser) throw new Error("No database connection");
        try {
            await deleteDoc(doc(db, "transactions", txId));
        } catch (error) {
            console.error("Error deleting transaction:", error);
            throw error;
        }
    }, [currentUser]);

    const clearAllTransactions = useCallback(async () => {
        if (!db || !currentUser) throw new Error("No database connection");
        try {
            const q = query(
                collection(db, "transactions"),
                where("userId", "==", currentUser.uid)
            );
            const snapshot = await getDocs(q);
            const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);
        } catch (error) {
            console.error("Error clearing transactions:", error);
            throw error;
        }
    }, [currentUser]);

    const addCreditCard = useCallback(async (card) => {
        if (!db || !currentUser) throw new Error("No database connection");
        try {
            await addDoc(collection(db, "creditCards"), {
                ...card,
                userId: currentUser.uid,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error adding card:", error);
            throw error;
        }
    }, [currentUser]);

    const updateCreditCard = useCallback(async (cardId, data) => {
        if (!db || !currentUser) throw new Error("No database connection");
        try {
            const cardRef = doc(db, "creditCards", cardId);
            await updateDoc(cardRef, {
                ...data,
                límite: data.limit || 0
            });
        } catch (error) {
            console.error("Error updating card:", error);
            throw error;
        }
    }, [currentUser]);

    const addPayment = useCallback(async (cardId, amount) => {
        if (!db || !currentUser) throw new Error("No database connection");
        try {
            const cardRef = doc(db, "creditCards", cardId);
            await updateDoc(cardRef, {
                payments: increment(amount)
            });
            await addDoc(collection(db, "transactions"), {
                store: "Pago a tarjeta",
                category: "Transferencia",
                paymentMethod: "Pago de Tarjeta",
                amount: parseFloat(amount),
                type: "pago_tarjeta",
                cardId: cardId,
                userId: currentUser.uid,
                createdAt: serverTimestamp(),
                date: "Justo ahora",
                icon: "payments",
                iconColor: "emerald"
            });
        } catch (error) {
            console.error("Error adding payment:", error);
            throw error;
        }
    }, [currentUser]);

    const resetCardMonth = useCallback(async (card, spentByTx) => {
        if (!db || !currentUser) throw new Error("No database connection");
        const manualAdj = card.manualAdjustment || 0;
        const currentDebt = (card.initialDebt || 0) + spentByTx + manualAdj - (card.payments || 0);
        const newInitialDebt = Math.max(0, currentDebt);

        try {
            const cardRef = doc(db, "creditCards", card.id);
            await updateDoc(cardRef, {
                initialDebt: newInitialDebt,
                payments: 0,
                manualAdjustment: 0
            });
        } catch (error) {
            console.error("Error resetting card month:", error);
            throw error;
        }
    }, [currentUser]);

    // Computed values
    const spentPerCard = {};
    transactions.forEach(tx => {
        if (tx.type === 'gasto' && tx.paymentMethod) {
            spentPerCard[tx.paymentMethod] = (spentPerCard[tx.paymentMethod] || 0) + parseFloat(tx.amount);
        }
    });

    const totalIngresos = transactions.reduce((acc, tx) =>
        tx.type === 'ingreso' ? acc + parseFloat(tx.amount) : acc, 0);

    const totalGastos = transactions.reduce((acc, tx) =>
        tx.type === 'gasto' ? acc + parseFloat(tx.amount) : acc, 0);

    const totalPagosTarjetas = transactions.reduce((acc, tx) =>
        tx.type === 'pago_tarjeta' ? acc + parseFloat(tx.amount) : acc, 0);

    const totalDeudaTarjetas = creditCards.reduce((acc, card) => {
        const initialDebt = card.initialDebt || 0;
        const payments = card.payments || 0;
        const spentByTx = spentPerCard[card.name] || 0;
        const manualAdjustment = card.manualAdjustment || 0;
        return acc + Math.max(0, initialDebt + spentByTx + manualAdjustment - payments);
    }, 0);

    const gastosSinPagosTarjetas = totalGastos - totalPagosTarjetas;
    const efectivoDisponible = totalIngresos - gastosSinPagosTarjetas;
    const patrimonioNeto = efectivoDisponible - totalDeudaTarjetas;

    const value = {
        transactions,
        creditCards,
        loading,
        error,
        addTransaction,
        deleteTransaction,
        clearAllTransactions,
        addCreditCard,
        updateCreditCard,
        addPayment,
        resetCardMonth,
        spentPerCard,
        totalIngresos,
        totalGastos,
        totalPagosTarjetas,
        totalDeudaTarjetas,
        gastosSinPagosTarjetas,
        efectivoDisponible,
        patrimonioNeto
    };

    return (
        <FinanceContext.Provider value={value}>
            {children}
        </FinanceContext.Provider>
    );
}