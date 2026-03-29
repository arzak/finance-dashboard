import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "../common/EmptyState";
import SectionCard from "../common/SectionCard";
import { formatCurrency } from "../../utils/formatters";
import { getTransactionDate, getTransactionMonthKey } from "../../utils/transactionDates";

const MONTHS_LABEL = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function TransactionsView({
    transactions,
    txSearch,
    setTxSearch,
    txFilterType,
    setTxFilterType,
    txFilterCategory,
    setTxFilterCategory,
    txFilterMonth,
    setTxFilterMonth,
    txPage,
    setTxPage,
    txPerPage,
    onDownloadPdf,
    onExportCsv,
    onOpenClearAll,
    onDeleteTransaction,
}) {
    const allCategories = ["todas", ...Array.from(new Set(transactions.map((transaction) => transaction.category).filter(Boolean)))];
    const allMonths = [
        "todos",
        ...Array.from(new Set(transactions.map((transaction) => {
            return getTransactionMonthKey(transaction);
        }).filter(Boolean))).sort((a, b) => b.localeCompare(a)),
    ];

    const filtered = transactions.filter((transaction) => {
        const query = txSearch.toLowerCase();
        const matchSearch = !query ||
            (transaction.store || "").toLowerCase().includes(query) ||
            (transaction.category || "").toLowerCase().includes(query) ||
            (transaction.paymentMethod || "").toLowerCase().includes(query);
        const matchType = txFilterType === "todos" || transaction.type === txFilterType || (txFilterType === "ahorro" && transaction.category === "Ahorro");
        const matchCategory = txFilterCategory === "todas" || transaction.category === txFilterCategory;

        let matchMonth = true;
        if (txFilterMonth !== "todos") {
            const monthKey = getTransactionMonthKey(transaction);
            matchMonth = monthKey === txFilterMonth;
        }

        return matchSearch && matchType && matchCategory && matchMonth;
    });

    const totalPages = Math.ceil(filtered.length / txPerPage);
    const currentPage = txPage >= totalPages ? 0 : txPage;
    const paginatedFiltered = filtered.slice(currentPage * txPerPage, (currentPage + 1) * txPerPage);

    const totalFiltrado = filtered.reduce((accumulator, transaction) => {
        if (transaction.type === "ingreso") {
            return accumulator + parseFloat(transaction.amount);
        }

        return accumulator - parseFloat(transaction.amount);
    }, 0);

    const totalIngresosFiltrados = filtered.filter((transaction) => transaction.type === "ingreso").reduce((accumulator, transaction) => accumulator + parseFloat(transaction.amount), 0);
    const totalGastosFiltrados = filtered.filter((transaction) => transaction.type === "gasto").reduce((accumulator, transaction) => accumulator + parseFloat(transaction.amount), 0);
    const totalPagosFiltrados = filtered.filter((transaction) => transaction.type === "pago_tarjeta").reduce((accumulator, transaction) => accumulator + parseFloat(transaction.amount), 0);

    const resetFilters = () => {
        setTxSearch("");
        setTxFilterType("todos");
        setTxFilterCategory("todas");
        setTxFilterMonth("todos");
    };

    return (
        <div className="px-4 md:px-8 pb-12 mt-4 space-y-4 md:space-y-6">
            <SectionCard className="p-4 md:p-5">
                <div className="relative mb-4">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                    <input
                        type="text"
                        placeholder="Buscar transaccion..."
                        value={txSearch}
                        onChange={(event) => setTxSearch(event.target.value)}
                        className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {txSearch && (
                        <button onClick={() => setTxSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 md:gap-3">
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 overflow-x-auto">
                        {[["todos", "Todos"], ["gasto", "Gastos"], ["ingreso", "Ingresos"], ["pago_tarjeta", "Pagos"], ["ahorro", "Ahorro"]].map(([value, label]) => (
                            <button
                                key={value}
                                onClick={() => setTxFilterType(value)}
                                className={`px-2 md:px-3 py-1 text-[10px] md:text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${txFilterType === value ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <select
                        value={txFilterCategory}
                        onChange={(event) => setTxFilterCategory(event.target.value)}
                        className="px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-semibold bg-slate-100 dark:bg-slate-800 border-0 rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="todas">Todas</option>
                        {allCategories.filter((category) => category !== "todas").map((category) => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>

                    <select
                        value={txFilterMonth}
                        onChange={(event) => setTxFilterMonth(event.target.value)}
                        className="px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-semibold bg-slate-100 dark:bg-slate-800 border-0 rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="todos">Todos</option>
                        {allMonths.filter((month) => month !== "todos").map((month) => {
                            const [year, monthIndex] = month.split("-");
                            return <option key={month} value={month}>{MONTHS_LABEL[parseInt(monthIndex) - 1]} {year}</option>;
                        })}
                    </select>

                    {(txSearch || txFilterType !== "todos" || txFilterCategory !== "todas" || txFilterMonth !== "todos") && (
                        <button
                            onClick={resetFilters}
                            className="px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-lg hover:bg-rose-100 transition-colors whitespace-nowrap"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            </SectionCard>

            <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 md:gap-4">
                {[
                    { label: "Ingresos", value: totalIngresosFiltrados, color: "emerald", icon: "trending_up" },
                    { label: "Gastos", value: totalGastosFiltrados, color: "rose", icon: "trending_down" },
                    { label: "Pagos", value: totalPagosFiltrados, color: "blue", icon: "credit_card" },
                    { label: "Balance Total (Flujo de Caja)", value: totalFiltrado, color: totalFiltrado >= 0 ? "emerald" : "rose", icon: totalFiltrado >= 0 ? "account_balance_wallet" : "warning" },
                ].map(({ label, value, color, icon }) => (
                    <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl p-3 md:p-5 border border-slate-100 dark:border-slate-800/50 shadow-sm flex-shrink-0 w-32 md:w-auto">
                        <div className="flex items-center gap-1 md:gap-2 mb-1">
                            <span className={`material-symbols-outlined text-${color}-500 text-base md:text-lg`}>{icon}</span>
                            <span className="text-[10px] md:text-xs text-slate-500 font-medium whitespace-nowrap">{label}</span>
                        </div>
                        <p className={`text-base md:text-xl font-black text-${color}-500 truncate`}>${formatCurrency(Math.abs(value))}</p>
                    </div>
                ))}
            </div>

            <SectionCard className="overflow-hidden">
                <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {filtered.length} transacción{filtered.length !== 1 ? "es" : ""}
                    </span>
                    <div className="flex items-center gap-2 md:gap-3">
                        <button
                            onClick={onOpenClearAll}
                            disabled={filtered.length === 0}
                            className="hidden md:flex text-rose-500 text-xs font-semibold hover:underline flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                        >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            Eliminar todo
                        </button>
                        <button
                            onClick={onDownloadPdf}
                            disabled={filtered.length === 0}
                            className="text-primary text-xs font-semibold hover:underline flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                        >
                            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button
                            onClick={() => onExportCsv(filtered)}
                            disabled={filtered.length === 0}
                            className="text-primary text-xs font-semibold hover:underline flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                        >
                            <span className="material-symbols-outlined text-sm">download</span>
                            <span className="hidden sm:inline">CSV</span> ({filtered.length})
                        </button>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <EmptyState
                        icon="receipt_long"
                        title="No se encontraron transacciones"
                        description="Intenta ajustar los filtros"
                        className="py-16 md:py-20"
                    />
                ) : (
                    <>
                        <div className="divide-y divide-slate-50 dark:divide-slate-800">
                            <AnimatePresence>
                                {paginatedFiltered.map((transaction, idx) => {
                                    const date = getTransactionDate(transaction);
                                    const dateLabel = date
                                        ? date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
                                        : transaction.date;

                                    return (
                                        <motion.div
                                            key={transaction.id}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2, delay: idx * 0.02 }}
                                            className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                                                <div className={`size-9 md:size-11 rounded-full bg-${transaction.iconColor || "slate"}-100 dark:bg-${transaction.iconColor || "slate"}-500/10 text-${transaction.iconColor || "slate"}-600 flex items-center justify-center flex-shrink-0`}>
                                                    <span className="material-symbols-outlined text-base md:text-xl">{transaction.icon || "receipt"}</span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-xs md:text-sm text-slate-900 dark:text-slate-100 truncate">{transaction.store}</p>
                                                    <div className="flex items-center gap-1 md:gap-2 mt-0.5 flex-wrap">
                                                        <span className="text-[9px] md:text-[11px] text-slate-400">{transaction.category}</span>
                                                        {transaction.paymentMethod && <>
                                                            <span className="text-slate-300 dark:text-slate-700">•</span>
                                                            <span className="text-[9px] md:text-[11px] text-slate-400 truncate max-w-[80px] md:max-w-none">{transaction.paymentMethod}</span>
                                                        </>}
                                                        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                                                        <span className="text-[9px] md:text-[11px] text-slate-400">{dateLabel}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                                                <div className="text-right">
                                                    <p className={`font-bold text-xs md:text-sm ${transaction.type === "ingreso" ? "text-emerald-500" : transaction.type === "pago_tarjeta" ? "text-blue-500" : "text-rose-500"} truncate max-w-[80px] md:max-w-none`}>
                                                        {transaction.type === "ingreso" ? "+" : "-"}${formatCurrency(transaction.amount)}
                                                    </p>
                                                    <span className={`hidden sm:inline text-[9px] md:text-[10px] font-semibold px-2 py-0.5 rounded-full ${transaction.type === "gasto" ? "bg-rose-50 dark:bg-rose-900/20 text-rose-500" : transaction.type === "pago_tarjeta" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-500" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500"}`}>
                                                        {transaction.type === "gasto" ? "Gasto" : transaction.type === "pago_tarjeta" ? "Pago" : "Ingreso"}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => onDeleteTransaction(transaction)}
                                                    className="size-7 md:size-8 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 hover:bg-rose-200 dark:hover:bg-rose-900/30 transition-all flex-shrink-0"
                                                    title="Eliminar transacción"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {totalPages > 1 && (
                            <div className="px-4 md:px-6 py-3 md:py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400">
                                    Página {currentPage + 1} de {totalPages}
                                </p>
                                <div className="flex items-center gap-1 md:gap-2">
                                    <button
                                        onClick={() => setTxPage((page) => Math.max(0, page - 1))}
                                        disabled={currentPage === 0}
                                        className="px-2 md:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs md:text-sm font-medium"
                                    >
                                        Anterior
                                    </button>
                                    <div className="hidden sm:flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, page) => page).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => setTxPage(page)}
                                                className={`w-7 h-7 md:w-8 md:h-8 rounded-lg transition-all text-xs md:text-sm font-medium ${page === currentPage
                                                    ? "bg-primary text-white shadow-md shadow-primary/30"
                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                    }`}
                                            >
                                                {page + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setTxPage((page) => Math.min(totalPages - 1, page + 1))}
                                        disabled={currentPage >= totalPages - 1}
                                        className="px-2 md:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs md:text-sm font-medium"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </SectionCard>
        </div>
    );
}
