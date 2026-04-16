import { getTransactionDate } from "./transactionDates";

export function toAmount(value) {
    return parseFloat(value) || 0;
}

function toCashOutAmount(value) {
    return Math.abs(toAmount(value));
}

function getCardLookupMap(creditCards = []) {
    return new Map(creditCards.map((card) => [card.name, card.id]));
}

export function getDaysUntilDue(dayOfMonth, referenceDate = new Date()) {
    const parsedDay = parseInt(dayOfMonth, 10);
    if (!Number.isFinite(parsedDay) || parsedDay < 1 || parsedDay > 31) {
        return null;
    }

    const today = new Date(referenceDate);
    const baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueThisMonth = new Date(today.getFullYear(), today.getMonth(), parsedDay);
    const candidateDate = dueThisMonth >= baseDate
        ? dueThisMonth
        : new Date(today.getFullYear(), today.getMonth() + 1, parsedDay);
    const diffMs = candidateDate.getTime() - baseDate.getTime();

    return Math.round(diffMs / (1000 * 60 * 60 * 24));
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

export function calculatePaymentsPerCard(transactions, creditCards = []) {
    const paymentsPerCard = {};

    transactions.forEach((transaction) => {
        if (transaction?.type !== "pago_tarjeta") return;

        const cardId = getTransactionCardId(transaction, creditCards);
        if (!cardId) return;

        paymentsPerCard[cardId] = (paymentsPerCard[cardId] || 0) + toCashOutAmount(transaction.amount);
    });

    return paymentsPerCard;
}

export function calculateTransactionTotals(transactions) {
    return transactions.reduce((totals, transaction) => {
        const amount = transaction.type === "pago_tarjeta"
            ? toCashOutAmount(transaction.amount)
            : toAmount(transaction.amount);

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

export function calculateCardFinancialDetails(card, spentPerCard, referenceDate = new Date(), paymentsPerCard = {}) {
    const initialDebt = toAmount(card?.initialDebt);
    const payments = toAmount(card?.payments);
    const manualAdjustment = toAmount(card?.manualAdjustment);
    const spentByTx = toAmount(spentPerCard?.[card?.id] ?? spentPerCard?.[card?.name]);
    const recordedPaymentTransactions = toCashOutAmount(paymentsPerCard?.[card?.id] ?? paymentsPerCard?.[card?.name]);
    const manualPayments = Math.max(0, payments - recordedPaymentTransactions);
    const totalGastosMes = spentByTx + manualAdjustment;
    const totalDebt = Math.max(0, initialDebt + spentByTx + manualAdjustment - payments);
    const daysUntilDue = getDaysUntilDue(card?.dueDay, referenceDate);
    const isDueSoon = daysUntilDue !== null && daysUntilDue <= 2;
    const isDueWithinFiveDays = daysUntilDue !== null && daysUntilDue <= 5;
    const hasPaymentRegistered = payments > 0;
    const shouldHideDueAlert = hasPaymentRegistered && totalDebt <= Math.max(initialDebt + spentByTx + manualAdjustment, 0);

    return {
        initialDebt,
        payments,
        recordedPaymentTransactions,
        manualPayments,
        hasPaymentRegistered,
        shouldHideDueAlert,
        manualAdjustment,
        spentByTx,
        totalGastosMes,
        totalDebt,
        daysUntilDue,
        isDueSoon,
        isDueWithinFiveDays,
    };
}

export function calculateTotalCardDebt(creditCards, spentPerCard, referenceDate = new Date(), paymentsPerCard = {}) {
    return creditCards.reduce((total, card) => {
        const { totalDebt } = calculateCardFinancialDetails(card, spentPerCard, referenceDate, paymentsPerCard);
        return total + totalDebt;
    }, 0);
}

function sortCardsForPriority(cardDetails) {
    return [...cardDetails].sort((cardA, cardB) => {
        const dayA = cardA.daysUntilDue;
        const dayB = cardB.daysUntilDue;

        if (dayA === null && dayB !== null) return 1;
        if (dayA !== null && dayB === null) return -1;
        if (dayA !== null && dayB !== null && dayA !== dayB) return dayA - dayB;
        if (cardB.totalDebt !== cardA.totalDebt) return cardB.totalDebt - cardA.totalDebt;
        return (cardA.name || "").localeCompare(cardB.name || "");
    });
}

function getMonthlyCashSpending(transactions, referenceDate = new Date()) {
    const periods = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 5 + index, 1);
        return {
            year: date.getFullYear(),
            month: date.getMonth(),
            label: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
            amount: 0,
        };
    });

    transactions.forEach((transaction) => {
        if (transaction.type !== "gasto") {
            return;
        }

        const txDate = getTransactionDate(transaction);
        if (!txDate) {
            return;
        }

        const period = periods.find((item) =>
            item.year === txDate.getFullYear() && item.month === txDate.getMonth(),
        );

        if (period) {
            period.amount += toAmount(transaction.amount);
        }
    });

    return periods;
}

function buildCurrentMonthSpendingInsight(transactions, referenceDate = new Date()) {
    const recentMonths = getMonthlyCashSpending(transactions, referenceDate);
    const currentMonth = recentMonths[recentMonths.length - 1] || {
        label: "",
        amount: 0,
    };
    const previousMonths = recentMonths.slice(0, -1);
    const averagePreviousMonths = previousMonths.length
        ? previousMonths.reduce((sum, item) => sum + item.amount, 0) / previousMonths.length
        : 0;
    const deltaAmount = currentMonth.amount - averagePreviousMonths;
    const deltaPercent = averagePreviousMonths > 0 ? (deltaAmount / averagePreviousMonths) * 100 : 0;

    let status = "stable";
    let label = "En linea";
    if (averagePreviousMonths === 0 && currentMonth.amount > 0) {
        status = "above";
        label = "Sobre ritmo";
    } else if (currentMonth.amount > averagePreviousMonths * 1.1) {
        status = "above";
        label = "Sobre ritmo";
    } else if (currentMonth.amount < averagePreviousMonths * 0.9) {
        status = "below";
        label = "Por debajo";
    }

    return {
        status,
        label,
        currentMonthLabel: currentMonth.label,
        currentMonthAmount: currentMonth.amount,
        averagePreviousMonths,
        deltaAmount,
        deltaPercent,
        recentMonths,
    };
}

function buildLiquidityAlerts(cashBeforeCardPayments, totalPagosTarjetas, efectivoDisponible) {
    const alerts = [];

    if (totalPagosTarjetas > cashBeforeCardPayments) {
        const shortfall = totalPagosTarjetas - cashBeforeCardPayments;
        alerts.push({
            id: "payment-coverage",
            severity: efectivoDisponible < 0 ? "danger" : "warning",
            title: "Pagos de tarjeta por encima de tu liquidez",
            message: `Tus pagos a tarjetas superan el efectivo disponible por $${shortfall.toFixed(2)}.`,
            shortfall,
        });
    }

    if (efectivoDisponible < 0) {
        alerts.push({
            id: "negative-cash",
            severity: "danger",
            title: "Liquidez negativa",
            message: `Tu efectivo disponible quedo en -$${Math.abs(efectivoDisponible).toFixed(2)} despues de cubrir gastos y pagos.`,
            shortfall: Math.abs(efectivoDisponible),
        });
    }

    return alerts;
}

export function calculateFinancialSnapshot(transactions, creditCards, referenceDate = new Date()) {
    const spentPerCard = calculateSpentPerCard(transactions, creditCards);
    const paymentsPerCard = calculatePaymentsPerCard(transactions, creditCards);
    const {
        totalIngresos,
        totalGastos,
        totalPagosTarjetas,
    } = calculateTransactionTotals(transactions);
    const cardDetails = creditCards.map((card) => ({
        ...card,
        ...calculateCardFinancialDetails(card, spentPerCard, referenceDate, paymentsPerCard),
    }));
    const totalDeudaTarjetas = cardDetails.reduce((sum, card) => sum + card.totalDebt, 0);
    const gastosImpactoEfectivo = transactions.reduce((total, transaction) => {
        if (transaction.type !== "gasto") {
            return total;
        }

        if (isCreditCardExpense(transaction, creditCards)) {
            return total;
        }

        return total + toAmount(transaction.amount);
    }, 0);
    const manualCardPayments = cardDetails.reduce((sum, card) => sum + card.manualPayments, 0);
    const totalPagosAplicados = totalPagosTarjetas + manualCardPayments;

    const gastosSinPagosTarjetas = gastosImpactoEfectivo;
    const cashBeforeCardPayments = totalIngresos - gastosImpactoEfectivo;
    const efectivoDisponible = cashBeforeCardPayments - totalPagosAplicados;
    const patrimonioNeto = efectivoDisponible - totalDeudaTarjetas;
    const deudaPorcentaje = totalIngresos > 0 ? (totalDeudaTarjetas / totalIngresos) * 100 : 0;
    const patrimonioPositivo = patrimonioNeto >= 0;
    const liquidityAlerts = buildLiquidityAlerts(cashBeforeCardPayments, totalPagosAplicados, efectivoDisponible);
    const paymentPriority = sortCardsForPriority(cardDetails.filter((card) => card.totalDebt > 0));
    const cardsDueSoon = paymentPriority.filter((card) => card.isDueSoon && !card.shouldHideDueAlert);
    const currentMonthSpendingInsight = buildCurrentMonthSpendingInsight(transactions, referenceDate);

    return {
        spentPerCard,
        paymentsPerCard,
        cardDetails,
        totalIngresos,
        totalGastos,
        totalPagosTarjetas,
        manualCardPayments,
        totalPagosAplicados,
        totalDeudaTarjetas,
        gastosImpactoEfectivo,
        gastosSinPagosTarjetas,
        cashBeforeCardPayments,
        efectivoDisponible,
        patrimonioNeto,
        deudaPorcentaje,
        patrimonioPositivo,
        liquidityAlerts,
        cardsDueSoon,
        paymentPriority,
        currentMonthSpendingInsight,
    };
}
