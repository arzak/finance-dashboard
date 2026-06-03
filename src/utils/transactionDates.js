export function getTransactionDate(transaction) {
    if (transaction?.createdAt) {
        if (typeof transaction.createdAt.toDate === "function") {
            return transaction.createdAt.toDate();
        }
        if (transaction.createdAt instanceof Date) {
            return transaction.createdAt;
        }
    }

    if (transaction?.date === "Hoy" || transaction?.date === "Justo ahora") {
        return new Date();
    }

    return null;
}

export function parseLocalDate(dateString) {
    if (!dateString) return null;
    const [year, month, day] = dateString.split("-").map(Number);
    const now = new Date();
    return new Date(
        year,
        month - 1,
        day,
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds()
    );
}

export function getTransactionMonthKey(transaction) {
    const date = getTransactionDate(transaction);

    if (!date) {
        return null;
    }

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
