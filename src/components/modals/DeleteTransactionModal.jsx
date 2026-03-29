import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function DeleteTransactionModal({
    transaction,
    onClose,
    onConfirm,
}) {
    return (
        <AnimatePresence>
            {transaction && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-40"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl z-50 border border-slate-200 dark:border-slate-800"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Eliminar Transaccion</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-12 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center text-rose-600">
                                    <span className="material-symbols-outlined text-2xl">delete</span>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">Eliminar esta transaccion?</p>
                                    <p className="text-sm text-slate-500">Esta accion no se puede deshacer</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                                <p className="font-bold text-slate-900 dark:text-white mb-1">{transaction.store}</p>
                                <p className="text-sm text-slate-500 mb-2">{transaction.category} • {transaction.date}</p>
                                <p className={`text-lg font-black ${transaction.type === "gasto" ? "text-rose-500" : "text-emerald-500"}`}>
                                    {transaction.type === "gasto" ? "-" : "+"}${parseFloat(transaction.amount).toFixed(2)}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => onConfirm(transaction)}
                                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-rose-500/30"
                            >
                                Si, eliminar
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
