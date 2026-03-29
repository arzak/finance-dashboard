export function toAmount(value) {
    return parseFloat(value) || 0;
}

function getCardLookupMap(creditCards = []) {
    return new Map(creditCards.map((card) => [card.name, card.id]));
}

export function getTransactionCardId(transaction, creditCards = []) {
    if (transaction?.cardId) {
        return transaction.cardId;
    }

    if (!transaction?.paymentMethod) {
        return null;
    }

    const cardLookup = getCardLookupMap(creditCards);
    return cardLookup.get(transaction.paymentMethod) || null;
}

export function isCreditCardExpense(transaction, creditCards = []) {
    return transaction?.type === "gasto" && Boolean(getTransactionCardId(transaction, creditCards));
}

export function calculateSpentPerCard(transactions, creditCards = []) {
    const spentPerCard = {};

    transactions.forEach((transaction) => {
        if (!isCreditCardExpense(transaction, creditCards)) return;

        const cardId = getTransactionCardId(transaction, creditCards);
        spentPerCard[cardId] = (spentPerCard[cardId] || 0) + toAmount(transaction.amount);
    });

    return spentPerCard;
}

export function calculateTransactionTotals(transactions) {
    return transactions.reduce((totals, transaction) => {
        const amount = toAmount(transaction.amount);

        if (transaction.type === "ingreso") {
            totals.totalIngresos += amount;
        }

        if (transaction.type === "gasto") {
            totals.totalGastos += amount;
        }

        if (transaction.type === "pago_tarjeta") {
            totals.totalPagosTarjetas += amount;
        }

        return totals;
    }, {
        totalIngresos: 0,
        totalGastos: 0,
        totalPagosTarjetas: 0,
    });
}

export function calculateCardFinancialDetails(card, spentPerCard) {
    const initialDebt = toAmount(card?.initialDebt);
    const payments = toAmount(card?.payments);
    const manualAdjustment = toAmount(card?.manualAdjustment);
    const spentByTx = toAmount(spentPerCard?.[card?.id] ?? spentPerCard?.[card?.name]);
    const totalGastosMes = spentByTx + manualAdjustment;
    const totalDebt = Math.max(0, initialDebt + spentByTx + manualAdjustment - payments);

    return {
        initialDebt,
        payments,
        manualAdjustment,
        spentByTx,
        totalGastosMes,
        totalDebt,
    };
}

export function calculateTotalCardDebt(creditCards, spentPerCard) {
    return creditCards.reduce((total, card) => {
        const { totalDebt } = calculateCardFinancialDetails(card, spentPerCard);
        return total + totalDebt;
    }, 0);
}

export function calculateFinancialSnapshot(transactions, creditCards) {
    const spentPerCard = calculateSpentPerCard(transactions, creditCards);
    const {
        totalIngresos,
        totalGastos,
        totalPagosTarjetas,
    } = calculateTransactionTotals(transactions);
    const totalDeudaTarjetas = calculateTotalCardDebt(creditCards, spentPerCard);
    const gastosImpactoEfectivo = transactions.reduce((total, transaction) => {
        if (transaction.type !== "gasto") {
            return total;
        }

        if (isCreditCardExpense(transaction, creditCards)) {
            return total;
        }

        return total + toAmount(transaction.amount);
    }, 0);

    const gastosSinPagosTarjetas = gastosImpactoEfectivo;
    const efectivoDisponible = totalIngresos - gastosImpactoEfectivo - totalPagosTarjetas;
    const patrimonioNeto = efectivoDisponible - totalDeudaTarjetas;
    const deudaPorcentaje = totalIngresos > 0 ? (totalDeudaTarjetas / totalIngresos) * 100 : 0;
    const patrimonioPositivo = patrimonioNeto >= 0;

    return {
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
}
