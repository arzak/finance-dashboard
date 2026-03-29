import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateCardFinancialDetails } from "../../utils/financeCalculations";
import SectionCard from "../common/SectionCard";
import EmptyState from "../common/EmptyState";

const cardColors = {
    blue: {
        bg: "rgba(59, 130, 246, 0.1)",
        text: "#3b82f6",
        bar: "#3b82f6",
        border: "#60a5fa",
        surface: "linear-gradient(135deg, rgba(239,246,255,0.98) 0%, rgba(219,234,254,0.9) 55%, rgba(255,255,255,0.96) 100%)",
        glow: "radial-gradient(circle at top right, rgba(59,130,246,0.18), transparent 55%)",
        shadow: "rgba(59, 130, 246, 0.18)",
    },
    rose: {
        bg: "rgba(244, 63, 94, 0.1)",
        text: "#f43f5e",
        bar: "#f43f5e",
        border: "#fb7185",
        surface: "linear-gradient(135deg, rgba(255,241,242,0.98) 0%, rgba(255,228,230,0.9) 55%, rgba(255,255,255,0.96) 100%)",
        glow: "radial-gradient(circle at top right, rgba(244,63,94,0.16), transparent 55%)",
        shadow: "rgba(244, 63, 94, 0.16)",
    },
    emerald: {
        bg: "rgba(16, 185, 129, 0.1)",
        text: "#10b981",
        bar: "#10b981",
        border: "#34d399",
        surface: "linear-gradient(135deg, rgba(236,253,245,0.98) 0%, rgba(209,250,229,0.9) 55%, rgba(255,255,255,0.96) 100%)",
        glow: "radial-gradient(circle at top right, rgba(16,185,129,0.18), transparent 55%)",
        shadow: "rgba(16, 185, 129, 0.2)",
    },
    purple: {
        bg: "rgba(168, 85, 247, 0.1)",
        text: "#a855f7",
        bar: "#a855f7",
        border: "#c084fc",
        surface: "linear-gradient(135deg, rgba(250,245,255,0.98) 0%, rgba(243,232,255,0.9) 55%, rgba(255,255,255,0.96) 100%)",
        glow: "radial-gradient(circle at top right, rgba(168,85,247,0.16), transparent 55%)",
        shadow: "rgba(168, 85, 247, 0.16)",
    },
    orange: {
        bg: "rgba(251, 146, 60, 0.1)",
        text: "#fb923c",
        bar: "#fb923c",
        border: "#fdba74",
        surface: "linear-gradient(135deg, rgba(255,247,237,0.98) 0%, rgba(254,215,170,0.9) 55%, rgba(255,255,255,0.96) 100%)",
        glow: "radial-gradient(circle at top right, rgba(251,146,60,0.16), transparent 55%)",
        shadow: "rgba(251, 146, 60, 0.18)",
    },
    black: {
        bg: "rgba(15, 23, 42, 0.18)",
        text: "#0f172a",
        bar: "#0f172a",
        border: "#334155",
        surface: "linear-gradient(135deg, rgba(241,245,249,0.98) 0%, rgba(226,232,240,0.92) 45%, rgba(203,213,225,0.96) 100%)",
        glow: "radial-gradient(circle at top right, rgba(15,23,42,0.18), transparent 55%)",
        shadow: "rgba(15, 23, 42, 0.22)",
    },
};

export default function CreditCardsPanel({
    creditCards,
    spentPerCard,
    selectedCardId,
    setSelectedCardId,
    onAddCard,
    onEditCard,
    activeCard,
}) {
    return (
        <SectionCard className="col-span-12 lg:col-span-5 p-4 md:p-6">
            <div className="flex justify-between items-center mb-4 md:mb-6">
                <h3 className="font-bold text-base md:text-lg text-slate-900 dark:text-white">Uso de Tarjetas</h3>
                <div className="flex gap-2">
                    <button onClick={onAddCard} className="size-7 md:size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" title="Agregar tarjeta">
                        <span className="material-symbols-outlined text-lg md:text-xl">add</span>
                    </button>
                </div>
            </div>
            <div className="space-y-3 md:space-y-5">
                <AnimatePresence>
                    {creditCards.map((card) => {
                        const {
                            initialDebt,
                            payments,
                            manualAdjustment,
                            spentByTx,
                            totalGastosMes,
                            totalDebt,
                        } = calculateCardFinancialDetails(card, spentPerCard);
                        const cardLimit = card.limit || card["límite"] || 0;
                        const percentUsed = cardLimit > 0 ? Math.min((totalDebt / cardLimit) * 100, 100) : 0;
                        const colors = cardColors[card.themeColor] || cardColors.blue;
                        const isSelected = (selectedCardId ?? creditCards[0]?.id) === card.id;

                        return (
                            <motion.div
                                key={card.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                whileHover={{ y: -2 }}
                                className="relative overflow-hidden space-y-2 md:space-y-3 p-3 md:p-4 rounded-[28px] transition-all border backdrop-blur-sm"
                                style={{
                                    borderColor: isSelected ? colors.border : `${colors.border}66`,
                                    backgroundImage: `${colors.glow}, ${colors.surface}`,
                                    boxShadow: isSelected
                                        ? `0 20px 45px -28px ${colors.shadow}, inset 0 1px 0 rgba(255,255,255,0.8)`
                                        : `0 18px 35px -30px ${colors.shadow}, inset 0 1px 0 rgba(255,255,255,0.72)`,
                                }}
                            >
                                <div
                                    className="absolute inset-x-5 top-0 h-px pointer-events-none"
                                    style={{ background: `linear-gradient(90deg, transparent, ${colors.border}, transparent)` }}
                                />
                                <div
                                    className="absolute -right-8 -top-8 size-24 rounded-full blur-2xl opacity-50 pointer-events-none"
                                    style={{ backgroundColor: colors.bg }}
                                />
                                <div className="relative z-10 flex justify-between items-start gap-2">
                                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedCardId(card.id)}>
                                        <div
                                            className="size-9 md:size-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                                            style={{
                                                background: `linear-gradient(135deg, ${colors.bg}, rgba(255,255,255,0.92))`,
                                                color: colors.text,
                                                border: `1px solid ${colors.border}55`,
                                            }}
                                        >
                                            <span className="material-symbols-outlined text-base md:text-lg">credit_score</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-xs md:text-sm text-slate-900 truncate">{card.name}</p>
                                            <p className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold tracking-[0.22em]">**** {card.lastFour}</p>
                                        </div>
                                    </div>
                                    <div className="relative z-20 flex gap-1 flex-shrink-0">
                                        <button
                                            onClick={(event) => { event.stopPropagation(); onEditCard(card); }}
                                            className="size-9 md:size-10 rounded-full flex items-center justify-center text-slate-500 transition-all flex-shrink-0 hover:scale-105"
                                            style={{
                                                backgroundColor: "rgba(255,255,255,0.72)",
                                                border: `1px solid ${colors.border}2f`,
                                                boxShadow: "0 10px 30px -24px rgba(15, 23, 42, 0.45)",
                                            }}
                                            title="Editar tarjeta"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-1 md:gap-2">
                                    <div className="rounded-2xl p-1.5 md:p-2.5 text-center border border-white/50 bg-white/65 backdrop-blur-sm">
                                        <p className="hidden md:block text-[9px] text-slate-500 uppercase font-bold">Deuda inicial</p>
                                        <p className="md:hidden text-[8px] text-slate-500 uppercase font-bold">Inicial</p>
                                        <p className="text-[10px] md:text-xs font-semibold text-slate-600">${initialDebt.toFixed(2)}</p>
                                    </div>
                                    <div className="rounded-2xl p-1.5 md:p-2.5 text-center border border-white/50 bg-rose-50/75 backdrop-blur-sm">
                                        <p className="hidden md:block text-[9px] text-rose-500 uppercase font-bold">Gastos mes</p>
                                        <p className="md:hidden text-[8px] text-rose-500 uppercase font-bold">Gastos</p>
                                        <p className="text-[10px] md:text-xs font-semibold text-rose-500 truncate">${totalGastosMes.toFixed(2)}</p>
                                        {manualAdjustment !== 0 && (
                                            <p className={`hidden md:block text-[7px] font-medium ${manualAdjustment > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                                {manualAdjustment > 0 ? "+" : ""}{manualAdjustment.toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="rounded-2xl p-1.5 md:p-2.5 text-center border border-white/50 bg-emerald-50/75 backdrop-blur-sm">
                                        <p className="hidden md:block text-[9px] text-emerald-500 uppercase font-bold">Pagos</p>
                                        <p className="md:hidden text-[8px] text-emerald-500 uppercase font-bold">Pagos</p>
                                        <p className="text-[10px] md:text-xs font-semibold text-emerald-500">${payments.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="rounded-[24px] p-3 md:p-4 border border-white/60 bg-white/58 backdrop-blur-md">
                                    <div className="flex justify-between items-center mb-1 md:mb-2">
                                        <span className="text-[10px] md:text-xs font-bold text-slate-600">Deuda Total</span>
                                        <span className="text-base md:text-lg font-black text-rose-500 truncate ml-2">-${totalDebt.toFixed(2)}</span>
                                    </div>
                                    <p className="text-[8px] md:text-[10px] text-slate-500 mb-2 leading-relaxed">
                                        Inicial ${initialDebt.toFixed(2)} + compras ${spentByTx.toFixed(2)}
                                        {manualAdjustment !== 0 ? ` + ajuste ${manualAdjustment.toFixed(2)}` : ""}
                                        {" "}- pagos ${payments.toFixed(2)}
                                    </p>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 md:h-2 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{ width: `${percentUsed}%`, backgroundColor: colors.bar }}
                                        />
                                    </div>
                                    <p className="text-[8px] md:text-[9px] text-slate-500 text-right mt-0.5 md:mt-1 truncate">{percentUsed.toFixed(0)}% de ${cardLimit.toLocaleString()}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
            {creditCards.length === 0 && (
                <EmptyState
                    icon="credit_card"
                    title="No hay tarjetas registradas"
                    description="Agrega una tarjeta para comenzar"
                    className="py-6 md:py-8"
                />
            )}
            {activeCard && (
                <p className="hidden md:block text-[10px] text-slate-400 mt-3 text-center">
                    Toca una tarjeta para ver su historial en la grafica
                </p>
            )}
        </SectionCard>
    );
}
