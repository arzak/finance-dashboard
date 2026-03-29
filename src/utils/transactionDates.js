export function getTransactionDate(transaction) {
    if (transaction?.createdAt && typeof transaction.createdAt.toDate === "function") {
        return transaction.createdAt.toDate();
    }

    if (transaction?.date === "Hoy" || transaction?.date === "Justo ahora") {
        return new Date();
    }

    return null;
}

export function getTransactionMonthKey(transaction) {
    const date = getTransactionDate(transaction);

    if (!date) {
        return null;
    }

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
