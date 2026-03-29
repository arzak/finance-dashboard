import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "../AuthContext";
import {
    adjustCardPayments,
    addCardPayment,
    addCreditCard as createCreditCard,
    normalizeCreditCardPayload,
    subscribeToCreditCards,
    updateCreditCard as saveCreditCard,
} from "../services/creditCardsService";
import {
    addTransaction as createTransaction,
    clearTransactions as removeAllTransactions,
    deleteTransaction as removeTransaction,
    subscribeToTransactions,
} from "../services/transactionsService";
import { calculateFinancialSnapshot } from "../utils/financeCalculations";

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

    useEffect(() => {
        if (!currentUser) {
            setTransactions([]);
            setCreditCards([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribeTransactions = subscribeToTransactions(
            currentUser.uid,
            (items) => {
                setTransactions(items);
                setError(null);
            },
            (err) => {
                console.error("Transactions listener error:", err);
                setError(err.message);
            },
        );

        const unsubscribeCreditCards = subscribeToCreditCards(
            currentUser.uid,
            (items) => {
                setCreditCards(items);
                setError(null);
            },
            (err) => {
                console.error("Credit cards listener error:", err);
                setError(err.message);
            },
        );

        setLoading(false);

        return () => {
            unsubscribeTransactions();
            unsubscribeCreditCards();
        };
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser || creditCards.length === 0) {
            return;
        }

        const cardsNeedingBackfill = creditCards.filter((card) =>
            card.initialDebt === undefined ||
            card.payments === undefined ||
            card.manualAdjustment === undefined,
        );

        if (cardsNeedingBackfill.length === 0) {
            return;
        }

        Promise.all(
            cardsNeedingBackfill.map((card) =>
                saveCreditCard(card.id, normalizeCreditCardPayload(card)),
            ),
        ).catch((err) => {
            console.error("Credit card backfill error:", err);
            setError(err.message);
        });
    }, [creditCards, currentUser]);

    const addTransaction = useCallback(async (transaction) => {
        if (!currentUser) throw new Error("No database connection");
        if (transaction.type === "pago_tarjeta" && transaction.cardId) {
            await addCardPayment(currentUser.uid, transaction.cardId, transaction.amount, transaction);
            return;
        }

        await createTransaction(currentUser.uid, transaction);
    }, [currentUser]);

    const deleteTransaction = useCallback(async (transactionOrId) => {
        if (!currentUser) throw new Error("No database connection");
        const transaction = typeof transactionOrId === "object" ? transactionOrId : null;
        const transactionId = transaction?.id || transactionOrId;

        if (transaction?.type === "pago_tarjeta" && transaction.cardId) {
            await adjustCardPayments(transaction.cardId, -Math.abs(parseFloat(transaction.amount) || 0));
        }

        await removeTransaction(transactionId);
    }, [currentUser]);

    const clearAllTransactions = useCallback(async () => {
        if (!currentUser) throw new Error("No database connection");
        const paymentAdjustments = transactions.reduce((accumulator, transaction) => {
            if (transaction.type !== "pago_tarjeta" || !transaction.cardId) {
                return accumulator;
            }

            accumulator[transaction.cardId] = (accumulator[transaction.cardId] || 0) + (parseFloat(transaction.amount) || 0);
            return accumulator;
        }, {});

        await Promise.all(
            Object.entries(paymentAdjustments).map(([cardId, amount]) =>
                adjustCardPayments(cardId, -Math.abs(amount)),
            ),
        );

        return removeAllTransactions(currentUser.uid);
    }, [currentUser, transactions]);

    const addCreditCard = useCallback(async (card) => {
        if (!currentUser) throw new Error("No database connection");
        await createCreditCard(currentUser.uid, card);
    }, [currentUser]);

    const updateCreditCard = useCallback(async (cardId, data) => {
        if (!currentUser) throw new Error("No database connection");
        await saveCreditCard(cardId, data);
    }, [currentUser]);

    const {
        spentPerCard,
        totalIngresos,
        totalGastos,
        totalPagosTarjetas,
        totalDeudaTarjetas,
        gastosImpactoEfectivo,
        gastosSinPagosTarjetas,
        efectivoDisponible,
        patrimonioNeto,
        deudaPorcentaje,
        patrimonioPositivo,
    } = calculateFinancialSnapshot(transactions, creditCards);

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
        spentPerCard,
        totalIngresos,
        totalGastos,
        totalPagosTarjetas,
        totalDeudaTarjetas,
        gastosImpactoEfectivo,
        gastosSinPagosTarjetas,
        efectivoDisponible,
        patrimonioNeto,
        deudaPorcentaje,
        patrimonioPositivo,
    };

    return (
        <FinanceContext.Provider value={value}>
            {children}
        </FinanceContext.Provider>
    );
}
