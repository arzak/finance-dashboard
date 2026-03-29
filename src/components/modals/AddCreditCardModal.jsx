import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AddCreditCardModal({ isOpen, onClose, onAddCard }) {
    const [name, setName] = useState("");
    const [lastFour, setLastFour] = useState("");
    const [limit, setLimit] = useState("");
    const [themeColor, setThemeColor] = useState("blue");

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!name || !lastFour) return;

        onAddCard({
            name,
            lastFour,
            limit: parseFloat(limit) || 0,
            ["límite"]: parseFloat(limit) || 0,
            initialDebt: 0,
            payments: 0,
            balance: 0,
            themeColor,
        });

        setName("");
        setLastFour("");
        setLimit("");
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-40" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-1.5rem)] max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl z-50 border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Agregar Tarjeta de Credito</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre de Tarjeta</label>
                                <input type="text" value={name} onChange={(event) => setName(event.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. Visa Gold" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ultimos 4 Digitos</label>
                                    <input type="text" maxLength="4" value={lastFour} onChange={(event) => setLastFour(event.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="1234" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Limite ($)</label>
                                    <input type="number" step="100" value={limit} onChange={(event) => setLimit(event.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="10000" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Color de Tarjeta</label>
                                <select value={themeColor} onChange={(event) => setThemeColor(event.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                                    <option value="blue">Blue</option>
                                    <option value="rose">Rose</option>
                                    <option value="emerald">Emerald</option>
                                    <option value="purple">Purple</option>
                                    <option value="orange">Orange</option>
                                    <option value="black">Black</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary/30 mt-6">
                                Agregar Tarjeta
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
