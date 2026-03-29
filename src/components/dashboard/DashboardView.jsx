import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import CreditCardsPanel from "../cards/CreditCardsPanel";
import EmptyState from "../common/EmptyState";
import SectionCard from "../common/SectionCard";

export default function DashboardView({
    efectivoDisponible,
    totalIngresos,
    patrimonioNeto,
    saludFinancieraColor,
    saludFinancieraLabel,
    saludFinancieraIcon,
    deudaPorcentaje,
    totalDeudaTarjetas,
    monthlyTotals,
    maxMonthlyGasto,
    creditCards,
    spentPerCard,
    selectedCardId,
    setSelectedCardId,
    onAddCard,
    onEditCard,
    activeCard,
    dayTotals,
    maxDayTotal,
    chartData,
    totalGastado,
    transactions,
    recentPage,
    setRecentPage,
    recentPerPage,
    onDownloadPdf,
    onViewAllTransactions,
}) {
    return (
        <div className="px-4 md:px-8 pb-12 grid grid-cols-12 gap-4 md:gap-6 auto-rows-min mt-4">
            <SectionCard className="col-span-12 lg:col-span-7 p-4 md:p-6">
                <div className="grid grid-cols-12 gap-3 md:gap-4">
                    <div className="col-span-12 md:col-span-6 rounded-[24px] p-4 md:p-5 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70 border border-emerald-100">
                        <div className="flex justify-between items-start gap-3 mb-3">
                            <div className="min-w-0 flex-1">
                                <span className="text-slate-500 font-medium uppercase tracking-wider text-[10px] md:text-xs block">Efectivo Disponible</span>
                                <span className="text-[10px] md:text-xs text-slate-400">Lo que tienes disponible en efectivo o banco</span>
                            </div>
                            {(() => {
                                const isPositive = efectivoDisponible >= 0;
                                const rawPct = totalIngresos > 0 ? (efectivoDisponible / totalIngresos) * 100 : 0;
                                const pctLabel = Math.max(-100, Math.min(100, rawPct)).toFixed(1);
                                return (
                                    <span className={`flex items-center gap-1.5 font-semibold text-[11px] md:text-sm px-2.5 py-1 rounded-xl whitespace-nowrap ${isPositive ? "text-emerald-600 bg-white/80" : "text-rose-500 bg-white/80"}`}>
                                        <span className="material-symbols-outlined text-sm">{isPositive ? "trending_up" : "trending_down"}</span>
                                        {isPositive ? "+" : ""}{pctLabel}%
                                    </span>
                                );
                            })()}
                        </div>
                        <div className="text-4xl md:text-5xl font-black tracking-tighter text-emerald-600 leading-none truncate">
                            ${efectivoDisponible.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between gap-3 text-[11px] md:text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-emerald-500" />
                                Liquidez actual
                            </span>
                            <span className="font-semibold text-slate-700">
                                ${totalIngresos.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ingresos
                            </span>
                        </div>
                    </div>

                    <div className="col-span-12 md:col-span-6 rounded-[24px] p-4 md:p-5 bg-gradient-to-br from-slate-50 via-white to-slate-100 border border-slate-200/80">
                        <div className="flex justify-between items-start gap-3 mb-3">
                            <div className="min-w-0 flex-1">
                                <span className="text-slate-500 font-medium uppercase tracking-wider text-[10px] md:text-xs block">Patrimonio Neto</span>
                                <span className="text-[10px] md:text-xs text-slate-400">Tu situacion real despues de restar la deuda</span>
                            </div>
                            <span className={`flex items-center gap-1.5 font-semibold text-[11px] md:text-sm px-2.5 py-1 rounded-xl whitespace-nowrap ${saludFinancieraColor === "emerald"
                                ? "text-emerald-700 bg-emerald-100"
                                : saludFinancieraColor === "amber"
                                    ? "text-amber-700 bg-amber-100"
                                    : "text-rose-700 bg-rose-100"
                                }`}>
                                <span className={`material-symbols-outlined text-sm ${saludFinancieraColor === "emerald"
                                    ? "text-emerald-600"
                                    : saludFinancieraColor === "amber"
                                        ? "text-amber-600"
                                        : "text-rose-600"
                                    }`}>{saludFinancieraIcon}</span>
                                <span>{saludFinancieraLabel}</span>
                            </span>
                        </div>
                        <div className={`text-3xl md:text-4xl font-black tracking-tighter leading-none truncate ${patrimonioNeto >= 0 ? "text-slate-900" : "text-rose-500"}`}>
                            ${patrimonioNeto.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="mt-4">
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[11px] md:text-xs font-semibold text-slate-500">Nivel de deuda</span>
                                <span className="text-[11px] md:text-xs font-semibold text-slate-600">{deudaPorcentaje.toFixed(0)}%</span>
                            </div>
                            <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${deudaPorcentaje <= 30 ? "bg-emerald-500" : deudaPorcentaje <= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                                    style={{ width: `${Math.min(deudaPorcentaje, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="col-span-12">
                        <div className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="size-9 rounded-xl bg-white/80 text-rose-500 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-lg">credit_card</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-rose-500">Deuda tarjetas</p>
                                        <p className="text-xs text-slate-500 truncate">Compromiso actual</p>
                                    </div>
                                </div>
                                <strong className="text-sm md:text-base font-black text-rose-500 whitespace-nowrap">
                                    -${totalDeudaTarjetas.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </strong>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-12 rounded-[24px] border border-slate-200/80 bg-slate-50/75 px-4 py-4">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div>
                                <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500">Ritmo de gasto reciente</p>
                                <p className="text-[10px] md:text-xs text-slate-400">Ultimos 6 meses</p>
                            </div>
                            <span className="text-[10px] md:text-xs font-semibold text-slate-500">
                                Mes actual destacado
                            </span>
                        </div>
                        <div className="h-20 md:h-24 w-full relative">
                            <div className="flex items-end justify-between h-14 md:h-16 gap-1.5 md:gap-2 px-1">
                                {monthlyTotals.map((month, index) => {
                                    const height = (month.gastos / maxMonthlyGasto) * 100;
                                    const isCurrent = index === monthlyTotals.length - 1;
                                    return (
                                        <div key={index} className="flex-1 flex flex-col items-center gap-1 group relative">
                                            <div className="w-full h-full flex items-end">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${Math.max(height, month.gastos > 0 ? 8 : 0)}%` }}
                                                    transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.06 }}
                                                    className={`w-full rounded-t-xl ${isCurrent ? "bg-primary shadow-lg shadow-primary/20" : "bg-primary/25"}`}
                                                    style={{ minHeight: month.gastos > 0 ? 8 : 0 }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between mt-2 px-1">
                                {monthlyTotals.map((month, index) => (
                                    <span key={index} className={`flex-1 text-center text-[8px] md:text-[10px] font-bold uppercase ${index === monthlyTotals.length - 1 ? "text-primary" : "text-slate-400"}`}>
                                        {month.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </SectionCard>

            <CreditCardsPanel
                creditCards={creditCards}
                spentPerCard={spentPerCard}
                selectedCardId={selectedCardId}
                setSelectedCardId={setSelectedCardId}
                onAddCard={onAddCard}
                onEditCard={onEditCard}
                activeCard={activeCard}
            />

            <SectionCard className="col-span-12 lg:col-span-8 p-4 md:p-8">
                <div className="flex justify-between items-center mb-4 md:mb-8">
                    <h3 className="font-bold text-base md:text-lg text-slate-900 dark:text-white">Tendencias de Gastos</h3>
                    <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button className="px-3 py-1 text-xs font-semibold rounded bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white">Semanal</button>
                        <button className="px-3 py-1 text-xs font-semibold rounded text-slate-500">Mensual</button>
                    </div>
                </div>
                <div className="flex items-end justify-between h-36 md:h-48 gap-1 md:gap-4 pb-4 md:pb-6 overflow-x-auto">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                        const heightPercent = (dayTotals[day] / maxDayTotal) * 100;
                        const isMax = dayTotals[day] === maxDayTotal && maxDayTotal > 100;
                        return (
                            <div key={day} className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-t-lg relative h-full min-w-[30px] md:min-w-[40px]">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${heightPercent}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`absolute bottom-0 w-full ${isMax ? "bg-primary" : "bg-primary/20"} rounded-t-lg`}
                                />
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] uppercase font-bold text-slate-400 whitespace-nowrap">{day}</div>
                            </div>
                        );
                    })}
                </div>
            </SectionCard>

            <SectionCard className="col-span-12 lg:col-span-4 p-4 md:p-8">
                <h3 className="font-bold text-base md:text-lg mb-4 md:mb-8 text-slate-900 dark:text-white text-center">Gasto Profile</h3>
                <div className="flex flex-col items-center">
                    <div className="relative size-32 md:size-40">
                        <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
                            <circle className="text-slate-100 dark:text-slate-800" cx="18" cy="18" fill="none" r="16" stroke="currentColor" strokeWidth="3"></circle>
                            {chartData.map((data, index) => (
                                data.percent > 0 && (
                                    <motion.circle
                                        key={index}
                                        cx="18"
                                        cy="18"
                                        fill="none"
                                        r="16"
                                        stroke={data.color}
                                        strokeWidth="3"
                                        strokeDasharray={`${data.percent}, 100`}
                                        strokeDashoffset={`-${data.offset}`}
                                        strokeLinecap="round"
                                        initial={{ strokeDasharray: "0, 100" }}
                                        animate={{ strokeDasharray: `${data.percent}, 100` }}
                                        transition={{ duration: 1, delay: index * 0.1 }}
                                    />
                                )
                            ))}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                                ${totalGastado >= 1000 ? `${(totalGastado / 1000).toFixed(1)}k` : totalGastado.toFixed(0)}
                            </span>
                            <span className="hidden md:block text-[8px] uppercase text-slate-500 font-bold tracking-widest">Gastado</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:gap-4 w-full mt-4 md:mt-8">
                        {chartData.filter((data) => data.amount > 0).map((data, index) => (
                            <div key={index} className="flex items-center gap-1 md:gap-2">
                                <div className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: data.color }}></div>
                                <span className="text-[9px] md:text-xs text-slate-500 dark:text-slate-400 truncate">{data.name}</span>
                            </div>
                        ))}
                        {totalGastado === 0 && <EmptyState icon="donut_small" title="Agrega gastos para ver desglose" className="col-span-2 py-4" />}
                    </div>
                </div>
            </SectionCard>

            <SectionCard className="col-span-12 p-4 md:p-8">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                    <h3 className="font-bold text-base md:text-lg text-slate-900 dark:text-white">Recent Transacciones</h3>
                    <button onClick={onDownloadPdf} className="hidden md:block text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">download</span>
                        Descargar Estado de Cuenta
                    </button>
                </div>

                <div className="space-y-2 md:space-y-3">
                    <AnimatePresence>
                        {transactions
                            .slice(recentPage * recentPerPage, (recentPage + 1) * recentPerPage)
                            .map((transaction) => (
                                <motion.div
                                    key={transaction.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex items-center justify-between p-2 md:p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-slate-100 dark:border-slate-800/50"
                                >
                                    <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                                        <div className={`size-8 md:size-10 rounded-full bg-${transaction.iconColor}-100 dark:bg-${transaction.iconColor}-500/10 text-${transaction.iconColor}-600 flex items-center justify-center flex-shrink-0`}>
                                            <span className="material-symbols-outlined text-base md:text-xl">{transaction.icon}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-xs md:text-sm text-slate-900 dark:text-slate-100 truncate">{transaction.store}</p>
                                            <p className="hidden md:block text-xs text-slate-500 truncate">{transaction.category} • {transaction.paymentMethod ? `${transaction.paymentMethod} • ` : ""}{transaction.date}</p>
                                            <p className="md:hidden text-[9px] text-slate-500 truncate">{transaction.category} • {transaction.date}</p>
                                        </div>
                                    </div>
                                    <p className={`font-bold text-xs md:text-sm flex-shrink-0 ${transaction.type === "gasto" ? "text-rose-500" : "text-emerald-500"} ml-2`}>
                                        {transaction.type === "gasto" ? "-" : "+"}${parseFloat(transaction.amount).toFixed(2)}
                                    </p>
                                </motion.div>
                            ))}
                    </AnimatePresence>

                    {transactions.length === 0 && <EmptyState icon="receipt_long" title="No hay transacciones recientes" />}
                </div>

                {transactions.length > recentPerPage && (
                    <div className="px-4 md:px-6 py-3 md:py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-4 md:mt-6 gap-2">
                        <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400">
                            Pagina {recentPage + 1} de {Math.ceil(transactions.length / recentPerPage)}
                        </p>
                        <div className="flex items-center gap-1 md:gap-2">
                            <button
                                onClick={() => setRecentPage((page) => Math.max(0, page - 1))}
                                disabled={recentPage === 0}
                                className="px-2 md:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs md:text-sm font-medium"
                            >
                                Anterior
                            </button>
                            <div className="hidden sm:flex items-center gap-1">
                                {Array.from({ length: Math.ceil(transactions.length / recentPerPage) }, (_, index) => index).map((index) => (
                                    <button
                                        key={index}
                                        onClick={() => setRecentPage(index)}
                                        className={`w-7 h-7 md:w-8 md:h-8 rounded-lg transition-all text-xs md:text-sm font-medium ${index === recentPage
                                            ? "bg-primary text-white shadow-md shadow-primary/30"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                            }`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setRecentPage((page) => Math.min(Math.ceil(transactions.length / recentPerPage) - 1, page + 1))}
                                disabled={recentPage >= Math.ceil(transactions.length / recentPerPage) - 1}
                                className="px-2 md:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs md:text-sm font-medium"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}

                <div className="text-center mt-3 md:mt-4">
                    <button
                        onClick={onViewAllTransactions}
                        className="text-primary text-xs md:text-sm font-semibold hover:underline flex items-center justify-center gap-1 mx-auto"
                    >
                        Ver todas las transacciones
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                </div>
            </SectionCard>
        </div>
    );
}
