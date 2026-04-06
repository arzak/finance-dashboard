import React, { useMemo, useState } from "react";
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
    const [trendView, setTrendView] = useState("weekly");
    const avgMonthlyGasto = monthlyTotals.length
        ? monthlyTotals.reduce((sum, month) => sum + month.gastos, 0) / monthlyTotals.length
        : 0;
    const weeklyData = useMemo(() => ([
        { key: "Mon", label: "Mon", value: dayTotals.Mon || 0 },
        { key: "Tue", label: "Tue", value: dayTotals.Tue || 0 },
        { key: "Wed", label: "Wed", value: dayTotals.Wed || 0 },
        { key: "Thu", label: "Thu", value: dayTotals.Thu || 0 },
        { key: "Fri", label: "Fri", value: dayTotals.Fri || 0 },
        { key: "Sat", label: "Sat", value: dayTotals.Sat || 0 },
        { key: "Sun", label: "Sun", value: dayTotals.Sun || 0 },
    ]), [dayTotals]);
    const monthlyData = useMemo(() => (
        monthlyTotals.map((month) => ({ key: month.label, label: month.label, value: month.gastos }))
    ), [monthlyTotals]);
    const activeTrendData = trendView === "weekly" ? weeklyData : monthlyData;
    const maxTrendValue = Math.max(...activeTrendData.map((item) => item.value), 1);
    const avgTrendValue = activeTrendData.length
        ? activeTrendData.reduce((sum, item) => sum + item.value, 0) / activeTrendData.length
        : 0;
    const totalTrendValue = activeTrendData.reduce((sum, item) => sum + item.value, 0);
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
                        <div className="h-24 md:h-28 w-full relative">
                            <div
                                className="absolute inset-x-1"
                                style={{ bottom: `${(avgMonthlyGasto / maxMonthlyGasto) * 100}%` }}
                            >
                                <div className="border-t border-dashed border-slate-300/80 relative">
                                    <span className="absolute -top-3 right-0 text-[8px] md:text-[9px] text-slate-400 uppercase font-semibold bg-slate-50 px-1">
                                        Promedio
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-end justify-between h-16 md:h-20 gap-1.5 md:gap-2 px-1">
                                {monthlyTotals.map((month, index) => {
                                    const rawHeight = maxMonthlyGasto > 0 ? (month.gastos / maxMonthlyGasto) * 100 : 0;
                                    const height = month.gastos > 0 ? Math.max(rawHeight, 2) : 0;
                                    const isCurrent = index === monthlyTotals.length - 1;
                                    const prev = index > 0 ? monthlyTotals[index - 1].gastos : null;
                                    const delta = prev !== null ? month.gastos - prev : null;
                                    const deltaPct = prev && prev > 0 ? (delta / prev) * 100 : null;
                                    const isUp = delta !== null ? delta > 0 : false;
                                    const showBadge = isCurrent || month.gastos === maxMonthlyGasto;
                                    return (
                                        <div
                                            key={index}
                                            className="flex-1 h-full flex flex-col items-center justify-end gap-1 group relative"
                                            tabIndex={0}
                                        >
                                            <div className="w-full h-full flex items-end relative">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${height}%` }}
                                                    transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.06 }}
                                                    className={`w-full rounded-t-xl ${isCurrent ? "bg-gradient-to-t from-primary to-primary/60 shadow-lg shadow-primary/20" : "bg-primary/25"}`}
                                                />
                                                <div
                                                    className={`absolute -top-1 left-1/2 -translate-x-1/2 size-2 rounded-full ${isCurrent ? "bg-primary" : "bg-primary/50"}`}
                                                />
                                                {showBadge && (
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-semibold bg-white text-slate-600 border border-slate-200 shadow-sm">
                                                        ${month.gastos.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                                                    </div>
                                                )}
                                                <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-10">
                                                    <div className="bg-slate-900 text-white text-[9px] md:text-[10px] px-2 py-1 rounded-lg shadow-lg whitespace-nowrap">
                                                        <span className="font-semibold">{month.label}</span>{" "}
                                                        ${month.gastos.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                                                        {delta !== null && (
                                                            <span className={`ml-1 ${isUp ? "text-emerald-300" : "text-rose-300"}`}>
                                                                {isUp ? "▲" : "▼"} {Math.abs(delta).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                                                                {deltaPct !== null ? ` (${Math.abs(deltaPct).toFixed(0)}%)` : ""}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
                    <div>
                        <h3 className="font-bold text-base md:text-lg text-slate-900 dark:text-white">Tendencias de Gastos</h3>
                        <p className="text-[10px] md:text-xs text-slate-500">
                            {trendView === "weekly" ? "Actividad por dia de la semana" : "Comparativo de los ultimos meses"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setTrendView("weekly")}
                                className={`px-3 py-1 text-xs font-semibold rounded transition-all ${trendView === "weekly" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-500"}`}
                            >
                                Semanal
                            </button>
                            <button
                                type="button"
                                onClick={() => setTrendView("monthly")}
                                className={`px-3 py-1 text-xs font-semibold rounded transition-all ${trendView === "monthly" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-500"}`}
                            >
                                Mensual
                            </button>
                        </div>
                        <div className="flex sm:hidden bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setTrendView(trendView === "weekly" ? "monthly" : "weekly")}
                                className="px-3 py-1 text-xs font-semibold rounded bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                            >
                                {trendView === "weekly" ? "Semanal" : "Mensual"}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] md:text-xs font-semibold text-slate-600">
                        Total ${totalTrendValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] md:text-xs font-semibold text-slate-600">
                        Promedio ${avgTrendValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </div>
                    <div className="hidden md:flex items-center gap-1 text-[10px] text-slate-400">
                        <span className="size-2 rounded-full bg-primary/40" />
                        {trendView === "weekly" ? "Dia destacado" : "Mes destacado"}
                    </div>
                </div>
                <div className="relative">
                    <div
                        className="absolute inset-x-0"
                        style={{ bottom: `${(avgTrendValue / maxTrendValue) * 100}%` }}
                    >
                        <div className="border-t border-dashed border-slate-200 dark:border-slate-700 relative">
                            <span className="absolute -top-3 right-0 text-[8px] md:text-[9px] text-slate-400 uppercase font-semibold bg-white/80 dark:bg-slate-900/80 px-1">
                                Promedio
                            </span>
                        </div>
                    </div>
                    <div className="flex items-end justify-between h-36 md:h-48 gap-1 md:gap-4 pb-4 md:pb-6 overflow-x-auto">
                        {activeTrendData.map((item, index) => {
                            const heightPercent = (item.value / maxTrendValue) * 100;
                            const isMax = item.value === maxTrendValue && maxTrendValue > 0;
                            return (
                                <div key={item.key} className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-t-lg relative h-full min-w-[30px] md:min-w-[40px] group">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${heightPercent}%` }}
                                        transition={{ duration: 0.9, ease: "easeOut", delay: index * 0.04 }}
                                        className={`absolute bottom-0 w-full ${isMax ? "bg-primary" : "bg-primary/20"} rounded-t-lg`}
                                    />
                                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] uppercase font-bold text-slate-400 whitespace-nowrap">
                                        {item.label}
                                    </div>
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10">
                                        <div className="bg-slate-900 text-white text-[9px] md:text-[10px] px-2 py-1 rounded-lg shadow-lg whitespace-nowrap">
                                            ${item.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
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
