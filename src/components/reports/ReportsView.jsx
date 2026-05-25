import React, { lazy, Suspense, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import EmptyState from "../common/EmptyState";
import SectionCard from "../common/SectionCard";
import { formatCurrency } from "../../utils/formatters";
import { getTransactionDate } from "../../utils/transactionDates";
import { isCreditCardExpense } from "../../utils/financeCalculations";

const FinancialProjections = lazy(() => import("../../FinancialProjections"));
const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function ReportsView({
    transactions,
    last6Months,
    chartData,
    totalGastado,
    efectivoDisponible,
    totalDeudaTarjetas,
    creditCards,
    manualCardPayments,
    totalPagosAplicados,
    liquidityAlerts,
    cardsDueSoon,
    paymentPriority,
    currentMonthSpendingInsight,
}) {
    const [creditRange, setCreditRange] = useState("year");
    const [monthlyChartMode, setMonthlyChartMode] = useState("simple");
    const today = new Date();

    const totalIngresos = transactions
        .filter((transaction) => transaction.type === "ingreso")
        .reduce((accumulator, transaction) => accumulator + parseFloat(transaction.amount), 0);

    const totalGastosReales = transactions
        .filter((transaction) => transaction.type === "gasto")
        .reduce((accumulator, transaction) => accumulator + parseFloat(transaction.amount), 0);

    const totalPagosTarjetas = transactions
        .filter((transaction) => transaction.type === "pago_tarjeta")
        .reduce((accumulator, transaction) => accumulator + parseFloat(transaction.amount), 0);
    const priorityCard = paymentPriority?.[0] || null;

    const ahorroReal = totalIngresos - totalGastosReales;
    let savingsRate = totalIngresos > 0 ? (ahorroReal / totalIngresos) * 100 : 0;
    savingsRate = Math.max(-100, Math.min(100, savingsRate));

    const savingsColor = savingsRate >= 50 ? "emerald" : savingsRate >= 20 ? "blue" : savingsRate >= 0 ? "amber" : "rose";

    const storeTotals = {};
    transactions
        .filter((transaction) => transaction.type === "gasto")
        .forEach((transaction) => {
            storeTotals[transaction.store] = (storeTotals[transaction.store] || 0) + parseFloat(transaction.amount);
        });

    const topStores = Object.entries(storeTotals)
        .sort(([, amountA], [, amountB]) => amountB - amountA)
        .slice(0, 5);

    const monthlyComparison = last6Months.map(({ label, year, month }) => {
        const income = transactions
            .filter((transaction) => {
                if (transaction.type !== "ingreso") return false;
                const date = getTransactionDate(transaction);
                return date && date.getFullYear() === year && date.getMonth() === month;
            })
            .reduce((accumulator, transaction) => accumulator + parseFloat(transaction.amount), 0);

        const expense = transactions
            .filter((transaction) => {
                if (transaction.type !== "gasto") return false;
                const date = getTransactionDate(transaction);
                return date && date.getFullYear() === year && date.getMonth() === month;
            })
            .reduce((accumulator, transaction) => accumulator + parseFloat(transaction.amount), 0);

        const credit = transactions
            .filter((transaction) => {
                if (!isCreditCardExpense(transaction, creditCards)) return false;
                const date = getTransactionDate(transaction);
                return date && date.getFullYear() === year && date.getMonth() === month;
            })
            .reduce((accumulator, transaction) => accumulator + parseFloat(transaction.amount), 0);

        const cashOut = transactions
            .filter((transaction) => {
                if (transaction.type !== "gasto") return false;
                if (isCreditCardExpense(transaction, creditCards)) return false;
                const date = getTransactionDate(transaction);
                return date && date.getFullYear() === year && date.getMonth() === month;
            })
            .reduce((accumulator, transaction) => accumulator + parseFloat(transaction.amount), 0);

        const cardPayments = transactions
            .filter((transaction) => {
                if (transaction.type !== "pago_tarjeta") return false;
                const date = getTransactionDate(transaction);
                return date && date.getFullYear() === year && date.getMonth() === month;
            })
            .reduce((accumulator, transaction) => accumulator + parseFloat(transaction.amount), 0);

        const savings = income - expense;
        const realCashFlow = income - cashOut - cardPayments;

        return {
            label,
            income,
            expense,
            cashOut,
            credit,
            cardPayments,
            savings,
            realCashFlow,
        };
    });

    const monthlyComparisonExtremes = monthlyComparison.flatMap((item) => ([
        item.income,
        item.expense,
        item.cashOut,
        item.credit,
        item.cardPayments,
        item.savings,
        item.realCashFlow,
    ]));
    const maxValue = Math.max(...monthlyComparisonExtremes, 1);
    const minValue = Math.min(...monthlyComparisonExtremes, 0);
    const activeComparisonMonths = monthlyComparison.filter((item) =>
        item.income > 0 ||
        item.expense > 0 ||
        item.cashOut > 0 ||
        item.credit > 0 ||
        item.cardPayments > 0,
    );
    const averageMonthlyIncome = activeComparisonMonths.length > 0
        ? activeComparisonMonths.reduce((accumulator, item) => accumulator + item.income, 0) / activeComparisonMonths.length
        : 0;
    const averageMonthlyExpense = activeComparisonMonths.length > 0
        ? activeComparisonMonths.reduce((accumulator, item) => accumulator + item.expense, 0) / activeComparisonMonths.length
        : 0;
    const averageMonthlyCashOut = activeComparisonMonths.length > 0
        ? activeComparisonMonths.reduce((accumulator, item) => accumulator + item.cashOut, 0) / activeComparisonMonths.length
        : 0;
    const averageMonthlyCredit = activeComparisonMonths.length > 0
        ? activeComparisonMonths.reduce((accumulator, item) => accumulator + item.credit, 0) / activeComparisonMonths.length
        : 0;
    const averageMonthlyCardPayments = activeComparisonMonths.length > 0
        ? activeComparisonMonths.reduce((accumulator, item) => accumulator + item.cardPayments, 0) / activeComparisonMonths.length
        : 0;
    const averageMonthlySavings = activeComparisonMonths.length > 0
        ? activeComparisonMonths.reduce((accumulator, item) => accumulator + item.savings, 0) / activeComparisonMonths.length
        : 0;
    const averageMonthlyRealCashFlow = activeComparisonMonths.length > 0
        ? activeComparisonMonths.reduce((accumulator, item) => accumulator + item.realCashFlow, 0) / activeComparisonMonths.length
        : 0;
    const latestMonthlyMovement = [...monthlyComparison].reverse().find((item) =>
        item.income > 0 ||
        item.expense > 0 ||
        item.cashOut > 0 ||
        item.credit > 0 ||
        item.cardPayments > 0,
    ) || null;
    const formatCompactAmount = (value) => {
        if (value >= 1000) {
            return `$${(value / 1000).toFixed(1)}k`;
        }

        return `$${value.toFixed(0)}`;
    };

    const creditPeriods = useMemo(() => {
        if (creditRange === "6m") {
            return last6Months;
        }

        if (creditRange === "12m") {
            return Array.from({ length: 12 }, (_, index) => {
                const date = new Date(today.getFullYear(), today.getMonth() - 11 + index, 1);
                return {
                    label: MONTHS_ES[date.getMonth()],
                    year: date.getFullYear(),
                    month: date.getMonth(),
                };
            });
        }

        return Array.from({ length: 12 }, (_, index) => ({
            label: MONTHS_ES[index],
            year: today.getFullYear(),
            month: index,
        }));
    }, [creditRange, last6Months, today]);

    const monthlyCreditVsPayments = creditPeriods.map(({ label, year, month }) => {
        const credit = transactions
            .filter((transaction) => {
                if (!isCreditCardExpense(transaction, creditCards)) return false;
                const date = getTransactionDate(transaction);
                return date && date.getFullYear() === year && date.getMonth() === month;
            })
            .reduce((accumulator, transaction) => accumulator + parseFloat(transaction.amount), 0);

        const payments = transactions
            .filter((transaction) => {
                if (transaction.type !== "pago_tarjeta") return false;
                const date = getTransactionDate(transaction);
                return date && date.getFullYear() === year && date.getMonth() === month;
            })
            .reduce((accumulator, transaction) => accumulator + parseFloat(transaction.amount), 0);

        return { label, credit, payments };
    });

    const totalCreditExpenses = monthlyCreditVsPayments.reduce((accumulator, item) => accumulator + item.credit, 0);
    const totalCreditPayments = monthlyCreditVsPayments.reduce((accumulator, item) => accumulator + item.payments, 0);
    const averageCreditExpense = monthlyCreditVsPayments.length > 0 ? totalCreditExpenses / monthlyCreditVsPayments.length : 0;
    const averageCreditPayments = monthlyCreditVsPayments.length > 0 ? totalCreditPayments / monthlyCreditVsPayments.length : 0;
    const healthyMonthsCount = monthlyCreditVsPayments.filter((item) => item.payments >= item.credit && (item.payments > 0 || item.credit > 0)).length;
    const monthsWithCreditActivity = monthlyCreditVsPayments.filter((item) => item.payments > 0 || item.credit > 0).length;
    const creditRangeLabel = creditRange === "6m" ? "6 meses" : creditRange === "12m" ? "12 meses" : `Año ${today.getFullYear()}`;

    const CreditTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) {
            return null;
        }

        const creditValue = payload.find((item) => item.dataKey === "credit")?.value || 0;
        const paymentsValue = payload.find((item) => item.dataKey === "payments")?.value || 0;
        const delta = creditValue - paymentsValue;

        return (
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{label}</p>
                <p className="text-sm font-bold text-primary">Compras: ${formatCurrency(creditValue)}</p>
                <p className="text-sm font-bold text-emerald-500">Pagos: ${formatCurrency(paymentsValue)}</p>
                <p className={`text-xs mt-2 font-semibold ${delta >= 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    Diferencia: {delta >= 0 ? "+" : ""}${formatCurrency(delta)}
                </p>
            </div>
        );
    };

    const MonthlyFlowTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) {
            return null;
        }

        const incomeValue = payload.find((item) => item.dataKey === "income")?.value || 0;
        const cashOutValue = payload.find((item) => item.dataKey === "cashOut")?.value || 0;
        const creditValue = payload.find((item) => item.dataKey === "credit")?.value || 0;
        const cardPaymentsValue = payload.find((item) => item.dataKey === "cardPayments")?.value || 0;
        const realCashFlowValue = payload.find((item) => item.dataKey === "realCashFlow")?.value || 0;
        const savingsValue = payload.find((item) => item.dataKey === "savings")?.value || 0;

        return (
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{label}</p>
                <p className="text-sm font-bold text-emerald-500">Ingresos: ${formatCurrency(incomeValue)}</p>
                <p className="text-sm font-bold text-rose-500">Salidas de efectivo: ${formatCurrency(cashOutValue)}</p>
                <p className="text-sm font-bold text-blue-500">Compras a credito: ${formatCurrency(creditValue)}</p>
                <p className="text-sm font-bold text-indigo-500">Pagos de tarjeta: ${formatCurrency(cardPaymentsValue)}</p>
                <p className={`text-sm font-bold ${realCashFlowValue >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    Flujo real: {realCashFlowValue >= 0 ? "+" : ""}${formatCurrency(realCashFlowValue)}
                </p>
                <p className={`text-sm font-bold ${savingsValue >= 0 ? "text-blue-500" : "text-amber-600"}`}>
                    Ahorro: {savingsValue >= 0 ? "+" : ""}${formatCurrency(savingsValue)}
                </p>
                <p className="text-xs mt-2 font-semibold text-slate-600 dark:text-slate-300">
                    Gasto total registrado: ${formatCurrency(cashOutValue + creditValue)}
                </p>
            </div>
        );
    };

    return (
        <div className="px-4 md:px-8 pb-12 mt-4 space-y-4 md:space-y-6">
            <div className="grid grid-cols-12 gap-4 md:gap-6">
                <SectionCard
                    className="col-span-12 lg:col-span-4 p-4 md:p-6"
                >
                    <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className=""
                >
                    <h3 className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Tasa de Ahorro</h3>
                    <div className="flex items-center justify-center py-2 md:py-4">
                        <div className="relative size-24 md:size-32">
                            <svg className="size-full rotate-[-90deg]" viewBox="0 0 36 36">
                                <circle className="text-slate-100 dark:text-slate-800" cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" />
                                <motion.circle
                                    className={savingsColor === "emerald" ? "text-emerald-500" : savingsColor === "blue" ? "text-blue-500" : savingsColor === "amber" ? "text-amber-500" : "text-rose-500"}
                                    cx="18"
                                    cy="18"
                                    r="16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeDasharray={`${Math.max(0, savingsRate)}, 100`}
                                    initial={{ strokeDasharray: "0, 100" }}
                                    animate={{ strokeDasharray: `${Math.max(0, savingsRate)}, 100` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-xl md:text-2xl font-black ${savingsRate >= 0 ? "text-slate-900 dark:text-white" : "text-rose-500"}`}>
                                    {savingsRate.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-center mt-2">
                        <span className={`text-[10px] md:text-xs font-semibold px-2 py-1 rounded-full ${savingsColor === "emerald"
                            ? "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30"
                            : savingsColor === "blue"
                                ? "text-blue-700 bg-blue-100 dark:bg-blue-900/30"
                                : savingsColor === "amber"
                                    ? "text-amber-700 bg-amber-100 dark:bg-amber-900/30"
                                    : "text-rose-700 bg-rose-100 dark:bg-rose-900/30"
                            }`}>
                            {savingsRate >= 50 ? "Excelente" : savingsRate >= 20 ? "Buen trabajo" : savingsRate >= 0 ? "Puede mejorar" : "Atencion"}
                        </span>
                    </div>
                    <p className="hidden md:block text-xs text-center text-slate-500 mt-3">
                        Tu ahorro es de <span className="text-emerald-500 font-bold">${formatCurrency(ahorroReal)}</span> sobre ingresos de <span className="text-slate-600 dark:text-slate-400 font-bold">${formatCurrency(totalIngresos)}</span>.
                        {totalPagosTarjetas > 0 && (
                            <span className="block mt-1">Incluye ${formatCurrency(totalPagosTarjetas)} en pagos a tarjetas.</span>
                        )}
                        {manualCardPayments > 0 && (
                            <span className="block mt-1">Tambien se aplican ${formatCurrency(manualCardPayments)} en pagos capturados directamente en la tarjeta.</span>
                        )}
                    </p>
                    </motion.div>
                </SectionCard>

                <SectionCard className="col-span-12 lg:col-span-8 p-4 md:p-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                            <div>
                                <h3 className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Diagnostico de liquidez</h3>
                                <p className="text-[10px] md:text-xs text-slate-400 mt-1">Pagos aplicados al efectivo y prioridades de vencimiento</p>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-3 py-2">
                                <p className="text-[10px] uppercase font-bold text-slate-400">Pagos aplicados</p>
                                <p className="text-sm md:text-base font-black text-slate-900 dark:text-white">${formatCurrency(totalPagosAplicados)}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-[10px] uppercase font-bold text-slate-400">Liquidez actual</p>
                                <p className={`text-lg font-black ${efectivoDisponible >= 0 ? "text-slate-900 dark:text-white" : "text-rose-500"}`}>
                                    ${formatCurrency(efectivoDisponible)}
                                </p>
                                {liquidityAlerts?.length > 0 ? (
                                    <div className="mt-2 space-y-2">
                                        {liquidityAlerts.map((alert) => (
                                            <p key={alert.id} className={`text-xs font-semibold ${alert.severity === "danger" ? "text-rose-600" : "text-amber-600"}`}>
                                                {alert.message}
                                            </p>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-2 text-xs text-slate-500">Sin alertas de liquidez.</p>
                                )}
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-[10px] uppercase font-bold text-slate-400">Tarjeta prioritaria</p>
                                {priorityCard ? (
                                    <>
                                        <p className="text-lg font-black text-slate-900 dark:text-white">{priorityCard.name}</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {priorityCard.daysUntilDue !== null
                                                ? `Vence en ${priorityCard.daysUntilDue} dia${priorityCard.daysUntilDue === 1 ? "" : "s"}`
                                                : "Sin fecha de pago registrada"} con deuda de ${formatCurrency(priorityCard.totalDebt)}.
                                        </p>
                                    </>
                                ) : (
                                    <p className="mt-2 text-xs text-slate-500">No hay deuda pendiente para priorizar.</p>
                                )}
                            </div>
                        </div>
                        {(cardsDueSoon?.length > 0 || currentMonthSpendingInsight) && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                                    <p className="text-[10px] uppercase font-bold text-amber-700">Vencen en menos de 48 horas</p>
                                    {cardsDueSoon?.length > 0 ? (
                                        cardsDueSoon.map((card) => (
                                            <p key={card.id} className="mt-2 text-xs text-amber-800">
                                                {card.name}: ${formatCurrency(card.totalDebt)} y vence {card.daysUntilDue === 0 ? "hoy" : `en ${card.daysUntilDue} dia${card.daysUntilDue === 1 ? "" : "s"}`}.
                                            </p>
                                        ))
                                    ) : (
                                        <p className="mt-2 text-xs text-amber-800">No hay vencimientos urgentes.</p>
                                    )}
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Ritmo del mes actual</p>
                                    {currentMonthSpendingInsight ? (
                                        <>
                                            <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{currentMonthSpendingInsight.label}</p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Actual ${formatCurrency(currentMonthSpendingInsight.currentMonthAmount)} vs promedio ${formatCurrency(currentMonthSpendingInsight.averagePreviousMonths)}.
                                            </p>
                                        </>
                                    ) : (
                                        <p className="mt-2 text-xs text-slate-500">Sin datos suficientes para el analisis.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </SectionCard>

                <SectionCard
                    className="col-span-12 lg:col-span-8 p-4 md:p-6"
                >
                    <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className=""
                >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4 md:mb-6">
                        <div>
                            <h3 className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Indicadores Mensuales de Caja y Credito</h3>
                            <p className="text-[10px] md:text-xs text-slate-400 mt-1">Comparativo mensual de ingresos, caja real, credito, pagos y ahorro</p>
                        </div>
                        <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 self-start">
                            {[
                                { value: "simple", label: "Simple" },
                                { value: "full", label: "Completa" },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setMonthlyChartMode(option.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                        monthlyChartMode === option.value
                                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <div className="hidden sm:flex flex-wrap gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="size-2 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Ingresos</span>
                            </div>
                            {monthlyChartMode === "full" && (
                                <>
                                    <div className="flex items-center gap-1.5">
                                        <div className="size-2 rounded-full bg-rose-500" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Salidas efectivo</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="size-2 rounded-full bg-blue-500" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Compras credito</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="size-2 rounded-full bg-indigo-500" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Pagos tarjeta</span>
                                    </div>
                                </>
                            )}
                            <div className="flex items-center gap-1.5">
                                <div className="size-2 rounded-full bg-emerald-700" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Flujo real</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="size-2 rounded-full bg-sky-500" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Ahorro</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Promedio ingresos</p>
                            <p className="text-sm md:text-base font-black text-emerald-500">${formatCurrency(averageMonthlyIncome, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Promedio caja</p>
                            <p className="text-sm md:text-base font-black text-rose-500">${formatCurrency(averageMonthlyCashOut, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Promedio credito</p>
                            <p className="text-sm md:text-base font-black text-blue-500">${formatCurrency(averageMonthlyCredit, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Promedio pagos</p>
                            <p className="text-sm md:text-base font-black text-indigo-500">${formatCurrency(averageMonthlyCardPayments, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Promedio ahorro</p>
                            <p className={`text-sm md:text-base font-black ${averageMonthlySavings >= 0 ? "text-blue-500" : "text-amber-600"}`}>
                                {averageMonthlySavings >= 0 ? "+" : ""}${formatCurrency(averageMonthlySavings, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Promedio flujo real</p>
                            <p className={`text-sm md:text-base font-black ${averageMonthlyRealCashFlow >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                {averageMonthlyRealCashFlow >= 0 ? "+" : ""}${formatCurrency(averageMonthlyRealCashFlow, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 xl:col-span-1">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Ultimo mes con movimiento</p>
                            <p className="text-sm md:text-base font-black text-slate-900 dark:text-white">{latestMonthlyMovement?.label || "Sin datos"}</p>
                            {latestMonthlyMovement && (
                                <p className="mt-1 text-xs text-slate-500">
                                    Flujo real {latestMonthlyMovement.realCashFlow >= 0 ? "+" : ""}${formatCurrency(latestMonthlyMovement.realCashFlow)}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="h-64 md:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlyComparison} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="incomeArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.24} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                                    </linearGradient>
                                    <linearGradient id="cashOutArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.16} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                <YAxis
                                    domain={[
                                        minValue < 0 ? Math.floor(minValue * 1.1) : 0,
                                        Math.ceil(maxValue * 1.1),
                                    ]}
                                    tick={{ fontSize: 12, fill: "#64748b" }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => formatCompactAmount(value)}
                                />
                                <Tooltip content={<MonthlyFlowTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="income"
                                    stroke="#10b981"
                                    strokeWidth={0}
                                    fill="url(#incomeArea)"
                                    fillOpacity={1}
                                    animationDuration={1200}
                                />
                                {monthlyChartMode === "full" && (
                                    <Area
                                        type="monotone"
                                        dataKey="cashOut"
                                        stroke="#f43f5e"
                                        strokeWidth={0}
                                        fill="url(#cashOutArea)"
                                        fillOpacity={1}
                                        animationDuration={1200}
                                    />
                                )}
                                <Line
                                    type="monotone"
                                    dataKey="income"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                    animationDuration={1200}
                                />
                                {monthlyChartMode === "full" && (
                                    <>
                                        <Line
                                            type="monotone"
                                            dataKey="cashOut"
                                            stroke="#f43f5e"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: "#f43f5e", strokeWidth: 0 }}
                                            activeDot={{ r: 6 }}
                                            animationDuration={1200}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="credit"
                                            stroke="#3b82f6"
                                            strokeWidth={2.5}
                                            dot={{ r: 3.5, fill: "#3b82f6", strokeWidth: 0 }}
                                            activeDot={{ r: 5 }}
                                            animationDuration={1200}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="cardPayments"
                                            stroke="#6366f1"
                                            strokeWidth={2.5}
                                            dot={{ r: 3.5, fill: "#6366f1", strokeWidth: 0 }}
                                            activeDot={{ r: 5 }}
                                            animationDuration={1200}
                                        />
                                    </>
                                )}
                                <Line
                                    type="monotone"
                                    dataKey="realCashFlow"
                                    stroke="#047857"
                                    strokeWidth={3}
                                    strokeDasharray="6 4"
                                    dot={{ r: 4, fill: "#047857", strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                    animationDuration={1200}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="savings"
                                    stroke="#0ea5e9"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "#0ea5e9", strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                    animationDuration={1200}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {activeComparisonMonths.length === 0 && (
                        <EmptyState
                            icon="show_chart"
                            title="Sin movimientos mensuales"
                            description="Agrega ingresos y gastos para ver la comparativa mensual en linea"
                            className="py-6"
                        />
                    )}
                    </motion.div>
                </SectionCard>

                <SectionCard
                    className="col-span-12 p-4 md:p-6"
                >
                    <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    className=""
                >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 md:mb-6">
                        <div>
                            <h3 className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Credito vs Pagos por Mes</h3>
                            <p className="text-[10px] md:text-xs text-slate-400 mt-1">Compras a credito como area y pagos como linea para comparar tendencia y ritmo de pago</p>
                        </div>
                        <div className="flex gap-3 md:gap-6">
                            <div>
                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">Compras {creditRangeLabel}</p>
                                <p className="text-sm md:text-base font-black text-slate-900 dark:text-white">${formatCurrency(totalCreditExpenses, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                            </div>
                            <div>
                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">Pagos {creditRangeLabel}</p>
                                <p className="text-sm md:text-base font-black text-emerald-500">${formatCurrency(totalCreditPayments, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-4">
                        {[
                            { value: "6m", label: "6 meses" },
                            { value: "year", label: "Año actual" },
                            { value: "12m", label: "12 meses" },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setCreditRange(option.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                    creditRange === option.value
                                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <div className="hidden sm:flex gap-4 mb-4">
                        <div className="flex items-center gap-1.5">
                            <div className="size-2 rounded-full bg-primary" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Compras credito</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="size-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Pagos</span>
                        </div>
                    </div>

                    <div className="h-64 md:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlyCreditVsPayments} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="creditArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#135bec" stopOpacity={0.28} />
                                        <stop offset="95%" stopColor="#135bec" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                <YAxis
                                    tick={{ fontSize: 12, fill: "#64748b" }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip content={<CreditTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="credit"
                                    stroke="#135bec"
                                    strokeWidth={3}
                                    fill="url(#creditArea)"
                                    fillOpacity={1}
                                    animationDuration={1200}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="payments"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                    animationDuration={1200}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {monthlyCreditVsPayments.every((item) => item.credit === 0 && item.payments === 0) && (
                        <EmptyState
                            icon="monitoring"
                            title="Sin actividad de credito"
                            description="Registra compras a credito o pagos de tarjeta para comparar su comportamiento mensual"
                            className="py-6"
                        />
                    )}
                    {monthlyCreditVsPayments.some((item) => item.credit > 0 || item.payments > 0) && (
                        <>
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Estado por mes</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Mes saludable cuando los pagos del mes igualan o superan las compras a credito del mismo mes
                                        </p>
                                    </div>
                                    <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Meses saludables</p>
                                        <p className="text-sm md:text-base font-black text-slate-900 dark:text-white">
                                            {healthyMonthsCount}/{monthsWithCreditActivity || 0}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {monthlyCreditVsPayments.map((item) => {
                                        const hasActivity = item.credit > 0 || item.payments > 0;
                                        const isHealthy = hasActivity && item.payments >= item.credit;
                                        const badgeClass = !hasActivity
                                            ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                            : isHealthy
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
                                        const label = !hasActivity ? "Sin actividad" : isHealthy ? "Saludable" : "Desfase";

                                        return (
                                            <span
                                                key={item.label}
                                                className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold ${badgeClass}`}
                                            >
                                                {item.label}: {label}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Promedio compras</p>
                                    <p className="text-sm md:text-base font-black text-primary">${formatCurrency(averageCreditExpense, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Promedio pagos</p>
                                    <p className="text-sm md:text-base font-black text-emerald-500">${formatCurrency(averageCreditPayments, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
                </SectionCard>

                <SectionCard
                    className="col-span-12 lg:col-span-6 p-4 md:p-6"
                >
                    <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className=""
                >
                    <h3 className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 md:mb-6">Top 5 Lugares de Gasto</h3>
                    <div className="space-y-3 md:space-y-4">
                        {topStores.map(([store, total], index) => (
                            <div key={store} className="flex items-center justify-between">
                                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                    <span className="size-5 md:size-6 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-[9px] md:text-[10px] font-bold text-slate-500 flex-shrink-0">{index + 1}</span>
                                    <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{store}</span>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">${formatCurrency(total, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                                    <div className="w-16 md:w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1">
                                        <div className="bg-primary h-full rounded-full" style={{ width: `${(total / topStores[0][1]) * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {topStores.length === 0 && <EmptyState icon="bar_chart" title="Sin datos de gastos" className="py-8" />}
                    </div>
                    </motion.div>
                </SectionCard>

                <SectionCard
                    className="col-span-12 lg:col-span-6 p-4 md:p-6"
                >
                    <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className=""
                >
                    <h3 className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 md:mb-6">Distribucion por Categoria</h3>
                    <div className="space-y-3 md:space-y-4">
                        {chartData
                            .filter((category) => category.amount > 0)
                            .sort((amountA, amountB) => amountB.amount - amountA.amount)
                            .map((category) => (
                                <div key={category.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                        <div className="size-2 md:size-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                                        <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{category.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
                                        <span className="text-[9px] md:text-xs font-bold text-slate-400 whitespace-nowrap">{category.percent.toFixed(0)}%</span>
                                        <span className="text-xs md:text-sm font-bold text-slate-900 dark:text-white w-14 md:w-20 text-right truncate">${formatCurrency(category.amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                    </div>
                                </div>
                            ))}
                        {totalGastado === 0 && <EmptyState icon="donut_small" title="Sin datos de categorias" className="py-8" />}
                    </div>
                    </motion.div>
                </SectionCard>
            </div>

            <Suspense fallback={<div className="px-1 py-4 text-sm text-slate-500 dark:text-slate-400">Cargando proyecciones...</div>}>
                <FinancialProjections
                    efectivoTotal={efectivoDisponible}
                    deudaTotalTarjetas={totalDeudaTarjetas}
                    gastosMensualesPromedio={averageMonthlyExpense}
                    ingresoMensualEstimado={averageMonthlyIncome}
                />
            </Suspense>
        </div>
    );
}
