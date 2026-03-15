import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import { migrateOrphanedDocs } from "./migrate";
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, where } from "firebase/firestore";

const INITIAL_TRANSACTIONS = [
    { id: '1', store: "Applee Store", category: "Tecnología", type: "gasto", paymentMethod: "Visa Gold", amount: 14.99, date: "Hoy", icon: "shopping_bag", iconColor: "blue" },
    { id: '2', store: "Depósito de Nómina", category: "Nómina", type: "ingreso", paymentMethod: "Bank Transfer", amount: 8400.00, date: "22 Oct", icon: "payments", iconColor: "emerald" },
    { id: '3', store: "La Cafetería", category: "Comida", type: "gasto", paymentMethod: "Efectivo", amount: 6.50, date: "21 Oct", icon: "restaurant", iconColor: "orange" },
];

function AddTransactionModal({ isOpen, onClose, onAdd, creditCards }) {
    const [store, setStore] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState("gasto");
    const [paymentMethod, setPaymentMethod] = useState("Efectivo");
    const [category, setCategory] = useState("Comida");
    useEffect(() => {
        if (type === "ingreso") setCategory("Nómina");
        else setCategory("Comida");
    }, [type]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!store || !amount) return;

        onAdd({
            store,
            category,
            paymentMethod: type === "gasto" ? paymentMethod : null,
            amount: parseFloat(amount),
            type,
            date: "Justo ahora",
            icon: category === "Comida" ? "restaurant" : category === "Tecnología" ? "shopping_bag" : category === "Nómina" ? "payments" : category === "Ahorro" ? "savings" : "credit_card",
            iconColor: category === "Comida" ? "orange" : category === "Tecnología" ? "blue" : category === "Nómina" ? "emerald" : category === "Ahorro" ? "indigo" : "purple",
        });

        setStore("");
        setAmount("");
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
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
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Agregar Transacción</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-6">
                            <button
                                onClick={() => setType('gasto')}
                                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${type === 'gasto' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}
                            >
                                Gasto
                            </button>
                            <button
                                onClick={() => setType('ingreso')}
                                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${type === 'ingreso' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}
                            >
                                Depósito (Ingreso)
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {type === 'gasto' ? 'Tienda / Comercio' : 'Fuente'}
                                </label>
                                <input
                                    type="text"
                                    value={store}
                                    onChange={(e) => setStore(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="ej. Starbucks"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monto ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    {type === 'gasto' ? (
                                        <>
                                            <option value="Comida">Comida y Restaurantes</option>
                                            <option value="Tecnología">Tecnología</option>
                                            <option value="Transporte">Transporte y Viajes</option>
                                            <option value="Vivienda">Vivienda</option>
                                            <option value="Otros">Otros</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Nómina">Nómina</option>
                                            <option value="Ahorro">Ahorro</option>
                                            <option value="Otros">Otros Ingresos</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            {type === 'gasto' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Método de Pago</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        <option value="Efectivo">Efectivo</option>
                                        <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                                        {creditCards && creditCards.map(card => (
                                            <option key={card.id} value={card.name}>{card.name} (**** {card.lastFour})</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary/30 mt-6"
                            >
                                Guardar Transacción
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function AddCreditCardModal({ isOpen, onClose, onAddCard }) {
    const [name, setName] = useState("");
    const [lastFour, setLastFour] = useState("");
    const [limit, setLimit] = useState("");
    const [themeColor, setThemeColor] = useState("blue");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !lastFour) return;

        onAddCard({
            name,
            lastFour,
            limit: parseFloat(limit) || 0,
            límite: parseFloat(limit) || 0,
            initialDebt: 0,
            payments: 0,
            balance: 0,
            themeColor
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
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl z-50 border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Agregar Tarjeta de Crédito</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre de Tarjeta</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. Visa Gold" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Últimos 4 Dígitos</label>
                                    <input type="text" maxLength="4" value={lastFour} onChange={(e) => setLastFour(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="1234" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Límite ($)</label>
                                    <input type="number" step="100" value={limit} onChange={(e) => setLimit(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="10000" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Color de Tarjeta</label>
                                <select value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                                    <option value="blue">Blue</option>
                                    <option value="rose">Rose</option>
                                    <option value="emerald">Emerald</option>
                                    <option value="purple">Purple</option>
                                    <option value="orange">Orange</option>
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

function PaymentModal({ isOpen, onClose, card, onPayment, spentPerCard }) {
    const [amount, setAmount] = useState("");

    useEffect(() => {
        if (card) {
            setAmount("");
        }
    }, [card]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) return;
        onPayment(card.id, parseFloat(amount));
        onClose();
    };

    const initialDebt = card?.initialDebt || 0;
    const payments = card?.payments || 0;
    const spentByTx = card ? (spentPerCard[card.name] || 0) : 0;
    const manualAdjustment = card?.manualAdjustment || 0;
    const totalGastosMes = spentByTx + manualAdjustment;
    const totalDebt = initialDebt + totalGastosMes - payments;

    return (
        <AnimatePresence>
            {isOpen && card && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-40" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl z-50 border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Registrar Pago</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">{card.name}</p>
                            <p className="text-xs text-slate-500">**** {card.lastFour}</p>
                            <div className="mt-3 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Deuda inicial:</span>
                                    <span className="font-semibold">${initialDebt.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Gastos del mes:</span>
                                    <span className="font-semibold text-rose-500">−${totalGastosMes.toFixed(2)}</span>
                                </div>
                                {manualAdjustment !== 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Ajuste manual:</span>
                                        <span className={`font-semibold ${manualAdjustment > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {manualAdjustment > 0 ? '+' : ''}${manualAdjustment.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Pagos realizados:</span>
                                    <span className="font-semibold text-emerald-500">+${payments.toFixed(2)}</span>
                                </div>
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Deuda actual:</span>
                                    <span className="text-lg font-black text-rose-500">−${totalDebt.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monto a pagar ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/30"
                            >
                                Registrar Pago
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function EditCreditCardModal({ isOpen, onClose, card, onSave }) {
    const [name, setName] = useState("");
    const [lastFour, setLastFour] = useState("");
    const [limit, setLimit] = useState("");
    const [initialDebt, setInitialDebt] = useState("");
    const [payments, setPayments] = useState("");
    const [manualAdjustment, setManualAdjustment] = useState("");
    const [themeColor, setThemeColor] = useState("blue");

    useEffect(() => {
        if (card) {
            setName(card.name || "");
            setLastFour(card.lastFour || "");
            setLimit(card.limit || card.límite || "");
            setInitialDebt(card.initialDebt !== undefined && card.initialDebt !== null ? String(card.initialDebt) : "0");
            setPayments(card.payments !== undefined && card.payments !== null ? String(card.payments) : "0");
            setManualAdjustment(card.manualAdjustment !== undefined && card.manualAdjustment !== null ? String(card.manualAdjustment) : "0");
            setThemeColor(card.themeColor || "blue");
            console.log('EditCardModal - Card cargada:', card);
        }
    }, [card]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !lastFour) return;

        const dataToSend = {
            name,
            lastFour,
            limit: parseFloat(limit) || 0,
            initialDebt: parseFloat(initialDebt) || 0,
            payments: parseFloat(payments) || 0,
            manualAdjustment: parseFloat(manualAdjustment) || 0,
            themeColor
        };
        console.log('EditCardModal - Enviando datos:', dataToSend);

        onSave(dataToSend);

        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-40" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl z-50 border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Editar Tarjeta</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre de Tarjeta</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. Visa Gold" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Últimos 4 Dígitos</label>
                                    <input type="text" maxLength="4" value={lastFour} onChange={(e) => setLastFour(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="1234" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Límite ($)</label>
                                    <input type="number" step="100" value={limit} onChange={(e) => setLimit(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="10000" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Deuda Inicial ($)
                                    <span className="block text-xs text-slate-500 font-normal mt-0.5">Deuda acumulada de meses anteriores</span>
                                </label>
                                <input type="number" step="0.01" value={initialDebt} onChange={(e) => setInitialDebt(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Pagos Realizados ($)
                                    <span className="block text-xs text-slate-500 font-normal mt-0.5">Total de pagos realizados en el mes</span>
                                </label>
                                <input type="number" step="0.01" value={payments} onChange={(e) => setPayments(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Ajuste Manual de Gastos ($)
                                    <span className="block text-xs text-slate-500 font-normal mt-0.5">Valor positivo para agregar, negativo para restar (ej: -50.00)</span>
                                </label>
                                <input type="number" step="0.01" value={manualAdjustment} onChange={(e) => setManualAdjustment(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Color de Tarjeta</label>
                                <select value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                                    <option value="blue">Blue</option>
                                    <option value="rose">Rose</option>
                                    <option value="emerald">Emerald</option>
                                    <option value="purple">Purple</option>
                                    <option value="orange">Orange</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary/30 mt-6">
                                Guardar Cambios
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function App() {
    const { currentUser, logout } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [transactions, setTransacciones] = useState([]);
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [activeTab, setActiveTab] = useState('panel');
    const [txSearch, setTxSearch] = useState('');
    const [txFilterType, setTxFilterType] = useState('todos');
    const [txFilterCategory, setTxFilterCategory] = useState('todas');
    const [txFilterMonth, setTxFilterMonth] = useState('todos');
    const [creditCards, setCreditCards] = useState([]);
    // Pagination for Recent Transactions
    const [recentPage, setRecentPage] = useState(0);
    const RECENT_PER_PAGE = 5;
    // Pagination for Transacciones tab
    const [txPage, setTxPage] = useState(0);
    const TX_PER_PAGE = 10;
    // Edit card modal
    const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);
    const [cardToEdit, setCardToEdit] = useState(null);
    // Payment modal
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [cardToPay, setCardToPay] = useState(null);
    // Clear transactions modal
    const [isClearTxModalOpen, setIsClearTxModalOpen] = useState(false);
    // Delete single transaction modal
    const [txToDelete, setTxToDelete] = useState(null);

    // --- Migration: assign orphaned docs to oldtees@mail.com on first login ---
    useEffect(() => {
        if (!currentUser || !db) return;
        const OWNER_EMAIL = "oldtees@mail.com";
        if (currentUser.email?.toLowerCase() === OWNER_EMAIL) {
            migrateOrphanedDocs(currentUser.uid).catch(console.error);
        }
    }, [currentUser]);

    // Migrate cards with missing fields
    useEffect(() => {
        if (!db || !currentUser || creditCards.length === 0) return;

        const migrateCards = async () => {
            const { doc, updateDoc } = await import("firebase/firestore");
            for (const card of creditCards) {
                if (card.initialDebt === undefined || card.payments === undefined || card.manualAdjustment === undefined) {
                    try {
                        const cardRef = doc(db, "creditCards", card.id);
                        await updateDoc(cardRef, {
                            initialDebt: card.initialDebt || 0,
                            payments: card.payments || 0,
                            manualAdjustment: card.manualAdjustment || 0,
                            limit: card.limit || card.límite || 0,
                            límite: card.limit || card.límite || 0
                        });
                    } catch (e) {
                        console.error("Error migrating card:", e);
                    }
                }
            }
        };
        migrateCards();
    }, [creditCards, currentUser, db]);

    useEffect(() => {
        if (!db || !currentUser) return;

        const uid = currentUser.uid;

        const qTxs = query(
            collection(db, "transactions"),
            where("userId", "==", uid)
        );
        const unsubscribeTxs = onSnapshot(qTxs, (snapshot) => {
            const items = [];
            snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });
            // Sort client-side by createdAt desc (no composite index needed)
            items.sort((a, b) => {
                const ta = a.createdAt?.toDate?.() ?? new Date(0);
                const tb = b.createdAt?.toDate?.() ?? new Date(0);
                return tb - ta;
            });
            setTransacciones(items);
        }, (err) => console.error("Transactions listener error:", err));

        const qCards = query(
            collection(db, "creditCards"),
            where("userId", "==", uid)
        );
        const unsubscribeCards = onSnapshot(qCards, (snapshot) => {
            const items = [];
            snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });
            items.sort((a, b) => {
                const ta = a.createdAt?.toDate?.() ?? new Date(0);
                const tb = b.createdAt?.toDate?.() ?? new Date(0);
                return tb - ta;
            });
            setCreditCards(items);
        }, (err) => console.error("CreditCards listener error:", err));

        return () => { unsubscribeTxs(); unsubscribeCards(); };
    }, [currentUser]);

    // Reset txPage when filters change
    const prevFiltersRef = useRef({ txSearch, txFilterType, txFilterCategory, txFilterMonth });
    useEffect(() => {
        const prev = prevFiltersRef.current;
        if (
            prev.txSearch !== txSearch ||
            prev.txFilterType !== txFilterType ||
            prev.txFilterCategory !== txFilterCategory ||
            prev.txFilterMonth !== txFilterMonth
        ) {
            setTxPage(0);
            prevFiltersRef.current = { txSearch, txFilterType, txFilterCategory, txFilterMonth };
        }
    }, [txSearch, txFilterType, txFilterCategory, txFilterMonth]);

    // Reset recentPage when transactions change
    const prevTxCountRef = useRef(transactions.length);
    useEffect(() => {
        if (prevTxCountRef.current !== transactions.length) {
            setRecentPage(0);
            prevTxCountRef.current = transactions.length;
        }
    }, [transactions.length]);

    const handleAddGasto = async (gasto) => {
        if (!db || !currentUser) return;
        try {
            await addDoc(collection(db, "transactions"), {
                ...gasto,
                userId: currentUser.uid,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error adding transaction:", error);
        }
    };

    const handleAddCard = async (card) => {
        if (!db || !currentUser) return;
        try {
            await addDoc(collection(db, "creditCards"), {
                ...card,
                userId: currentUser.uid,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error adding card:", error);
        }
    };

    const handleResetCardMonth = async (card) => {
        if (!db || !currentUser) return;
        const spentByTx = spentPerCard[card.name] || 0;
        const manualAdj = card.manualAdjustment || 0;
        const currentDebt = (card.initialDebt || 0) + spentByTx + manualAdj - (card.payments || 0);
        const newInitialDebt = Math.max(0, currentDebt);

        try {
            const { doc, updateDoc } = await import("firebase/firestore");
            const cardRef = doc(db, "creditCards", card.id);
            await updateDoc(cardRef, {
                initialDebt: newInitialDebt,
                payments: 0,
                manualAdjustment: 0
            });
        } catch (error) {
            console.error("Error resetting card month:", error);
        }
    };

    const handleUpdateCard = async (updatedData) => {
        if (!db || !currentUser || !cardToEdit) return;
        try {
            const { doc, updateDoc } = await import("firebase/firestore");
            const cardRef = doc(db, "creditCards", cardToEdit.id);
            const dataToSave = {
                name: updatedData.name,
                lastFour: updatedData.lastFour,
                limit: parseFloat(updatedData.limit) || 0,
                límite: parseFloat(updatedData.limit) || 0,
                initialDebt: parseFloat(updatedData.initialDebt) || 0,
                payments: parseFloat(updatedData.payments) || 0,
                manualAdjustment: parseFloat(updatedData.manualAdjustment) || 0,
                themeColor: updatedData.themeColor
            };
            console.log('Actualizando tarjeta:', cardToEdit.id, dataToSave);
            await updateDoc(cardRef, dataToSave);
            console.log('✅ Tarjeta actualizada correctamente');
        } catch (error) {
            console.error("Error updating card:", error);
        }
    };

    const handleAddPayment = async (cardId, amount) => {
        if (!db || !currentUser) return;
        try {
            const { doc, updateDoc, increment } = await import("firebase/firestore");
            const cardRef = doc(db, "creditCards", cardId);
            // Add payment to card's payments field
            await updateDoc(cardRef, {
                payments: increment(amount)
            });
            // Also create a transaction record for the payment
            await addDoc(collection(db, "transactions"), {
                store: `Pago a tarjeta`,
                category: "Transferencia",
                paymentMethod: "Pago de Tarjeta",
                amount: parseFloat(amount),
                type: "pago_tarjeta",
                cardId: cardId,
                userId: currentUser.uid,
                createdAt: serverTimestamp(),
                date: "Justo ahora",
                icon: "payments",
                iconColor: "emerald"
            });
        } catch (error) {
            console.error("Error adding payment:", error);
        }
    };

    const handleClearAllTransactions = async () => {
        if (!db || !currentUser) return;
        try {
            const { getDocs, query, where, deleteDoc } = await import("firebase/firestore");
            const q = query(
                collection(db, "transactions"),
                where("userId", "==", currentUser.uid)
            );
            const snapshot = await getDocs(q);

            const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            console.log(`✅ Se eliminaron ${snapshot.size} transacciones`);
            setIsClearTxModalOpen(false);
        } catch (error) {
            console.error("❌ Error eliminando transacciones:", error);
        }
    };

    const handleDeleteTransaction = async (txId) => {
        if (!db || !currentUser) return;
        try {
            const { deleteDoc, doc } = await import("firebase/firestore");
            await deleteDoc(doc(db, "transactions", txId));
            console.log(`✅ Transacción eliminada`);
            setTxToDelete(null);
        } catch (error) {
            console.error("❌ Error eliminando transacción:", error);
        }
    };

    // Gasto real por tarjeta (basado en transacciones)
    const spentPerCard = {};
    transactions.forEach(tx => {
        if (tx.type === 'gasto' && tx.paymentMethod) {
            spentPerCard[tx.paymentMethod] = (spentPerCard[tx.paymentMethod] || 0) + parseFloat(tx.amount);
        }
    });

    const totalIngresos = transactions.reduce((acc, tx) => tx.type === 'ingreso' ? acc + parseFloat(tx.amount) : acc, 0);
    const totalGastos = transactions.reduce((acc, tx) => tx.type === 'gasto' ? acc + parseFloat(tx.amount) : acc, 0);
    const totalPagosTarjetas = transactions.reduce((acc, tx) => tx.type === 'pago_tarjeta' ? acc + parseFloat(tx.amount) : acc, 0);

    // Calcular deuda total de todas las tarjetas
    const totalDeudaTarjetas = creditCards.reduce((acc, card) => {
        const initialDebt = card.initialDebt || 0;
        const payments = card.payments || 0;
        const spentByTx = spentPerCard[card.name] || 0;
        const manualAdjustment = card.manualAdjustment || 0;
        return acc + Math.max(0, initialDebt + spentByTx + manualAdjustment - payments);
    }, 0);

    // Balance 1: Efectivo disponible (lo que tienes AHORA en efectivo/banco)
    // = Ingresos - Gastos reales (excluyendo pagos a tarjetas porque ese dinero ya salió)
    const gastosSinPagosTarjetas = totalGastos - totalPagosTarjetas;
    const efectivoDisponible = totalIngresos - gastosSinPagosTarjetas;

    // Balance 2: Patrimonio neto real (tu situación financiera completa)
    // = Efectivo disponible - Deuda de tarjetas (lo que realmente te queda si pagaras todo)
    const patrimonioNeto = efectivoDisponible - totalDeudaTarjetas;

    // Semáforo de salud financiera
    // Verde: Patrimonio positivo y deuda < 30% de ingresos
    // Amarillo: Patrimonio positivo pero deuda 30-50%, o patrimonio ligeramente negativo
    // Rojo: Patrimonio negativo y deuda > 50% de ingresos
    const deudaPorcentaje = totalIngresos > 0 ? (totalDeudaTarjetas / totalIngresos) * 100 : 0;
    const patrimonioPositivo = patrimonioNeto >= 0;

    let saludFinancieraColor = 'emerald'; // Verde por defecto
    let saludFinancieraLabel = 'Saludable';
    let saludFinancieraIcon = 'account_balance';

    if (!patrimonioPositivo && deudaPorcentaje > 50) {
        saludFinancieraColor = 'rose'; // Rojo - Peligro
        saludFinancieraLabel = 'Peligro';
        saludFinancieraIcon = 'warning';
    } else if (!patrimonioPositivo || deudaPorcentaje > 30) {
        saludFinancieraColor = 'amber'; // Amarillo - Precaución
        saludFinancieraLabel = 'Precaución';
        saludFinancieraIcon = 'report_problem';
    }

    // Colores para las tarjetas (para evitar clases dinámicas de Tailwind)
    const cardColors = {
        blue: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', bar: '#3b82f6', border: '#60a5fa' },
        rose: { bg: 'rgba(244, 63, 94, 0.1)', text: '#f43f5e', bar: '#f43f5e', border: '#fb7185' },
        emerald: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', bar: '#10b981', border: '#34d399' },
        purple: { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7', bar: '#a855f7', border: '#c084fc' },
        orange: { bg: 'rgba(251, 146, 60, 0.1)', text: '#fb923c', bar: '#fb923c', border: '#fdba74' },
    };

    // Datos mensuales por tarjeta - últimos 6 meses
    const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const nowDate = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - 5 + i, 1);
        return { label: MONTHS_ES[d.getMonth()], year: d.getFullYear(), month: d.getMonth() };
    });
    const activeCard = creditCards.find(c => c.id === selectedCardId) || creditCards[0];
    const monthlyCardData = activeCard ? last6Months.map(({ label, year, month }) => {
        const total = transactions
            .filter(tx => {
                if (tx.type !== 'gasto' || tx.paymentMethod !== activeCard.name) return false;
                const txDate = tx.createdAt && typeof tx.createdAt.toDate === 'function'
                    ? tx.createdAt.toDate()
                    : (tx.date === 'Hoy' || tx.date === 'Justo ahora' ? new Date() : null);
                if (!txDate) return false;
                return txDate.getFullYear() === year && txDate.getMonth() === month;
            })
            .reduce((s, tx) => s + parseFloat(tx.amount), 0);
        return { label, total };
    }) : [];

    // Gastos TOTALES por mes (todos los gastos, todas las tarjetas)
    const monthlyTotals = last6Months.map(({ label, year, month }) => {
        const gastos = transactions
            .filter(tx => {
                if (tx.type !== 'gasto') return false;
                const txDate = tx.createdAt && typeof tx.createdAt.toDate === 'function'
                    ? tx.createdAt.toDate()
                    : (tx.date === 'Hoy' || tx.date === 'Justo ahora' ? new Date() : null);
                if (!txDate) return false;
                return txDate.getFullYear() === year && txDate.getMonth() === month;
            })
            .reduce((s, tx) => s + parseFloat(tx.amount), 0);
        return { label, gastos };
    });
    const maxMonthlyGasto = Math.max(...monthlyTotals.map(d => d.gastos), 1);

    // Calculate daily totals for Tendencias de Gastos
    const dayTotals = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
    transactions.forEach(tx => {
        if (tx.type === 'gasto') {
            // Check if it's a Firestore Timestamp, otherwise use current date for mock
            const txDate = tx.createdAt && typeof tx.createdAt.toDate === 'function' ? tx.createdAt.toDate() : new Date();
            const dayName = txDate.toLocaleDateString('en-US', { weekday: 'short' });
            if (dayTotals[dayName] !== undefined) {
                dayTotals[dayName] += parseFloat(tx.amount);
            }
        }
    });
    const maxDayTotal = Math.max(...Object.values(dayTotals), 100); // Avoid division by 0 and ensure min height

    // Calculate category totals for Gasto Profile
    const categoryTotals = { 'Vivienda': 0, 'Comida': 0, 'Transporte': 0, 'Tecnología': 0, 'Otros': 0 };
    let totalGastado = 0;
    transactions.forEach(tx => {
        if (tx.type === 'gasto') {
            const amount = parseFloat(tx.amount);
            if (categoryTotals[tx.category] !== undefined) {
                categoryTotals[tx.category] += amount;
            } else {
                categoryTotals['Otros'] += amount; // Fallback
            }
            totalGastado += amount;
        }
    });

    const categoryColors = {
        'Tecnología': '#135bec', // Primary
        'Comida': '#fb923c', // Orange
        'Transporte': '#a855f7', // Purple
        'Vivienda': '#10b981', // Emerald
        'Otros': '#94a3b8'  // Slate
    };

    // Calculate offsets for SVG stroke
    let currentOffset = 0;
    const chartData = Object.keys(categoryTotals).map(key => {
        const percent = totalGastado > 0 ? (categoryTotals[key] / totalGastado) * 100 : 0;
        const offset = currentOffset;
        currentOffset += percent;
        return { name: key, percent, offset, color: categoryColors[key], amount: categoryTotals[key] };
    });

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display min-h-screen flex overflow-hidden">

            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen bg-background-light dark:bg-background-dark z-20 hidden md:flex">
                <div className="p-6 flex items-center gap-3">
                    <div className="size-8 bg-primary rounded flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-xl">credit_card</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight">Finance Pro</span>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-1">
                    <a onClick={() => setActiveTab('panel')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium cursor-pointer transition-colors ${activeTab === 'panel' ? 'bg-primary/10 text-primary' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        <span className="material-symbols-outlined">dashboard</span>
                        Panel
                    </a>
                    <a onClick={() => setActiveTab('transacciones')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium cursor-pointer transition-colors ${activeTab === 'transacciones' ? 'bg-primary/10 text-primary' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        <span className="material-symbols-outlined">receipt_long</span>
                        Transacciones
                    </a>
                    <a onClick={() => setActiveTab('reportes')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium cursor-pointer transition-colors ${activeTab === 'reportes' ? 'bg-primary/10 text-primary' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        <span className="material-symbols-outlined">bar_chart</span>
                        Reportes
                    </a>
                </nav>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 group relative">
                        <div className="size-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                                {currentUser?.displayName || 'Usuario'}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {currentUser?.email}
                            </span>
                        </div>
                        <button
                            onClick={logout}
                            title="Cerrar sesión"
                            className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex-shrink-0"
                        >
                            <span className="material-symbols-outlined text-lg">logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark scrollbar-hide pb-20 md:pb-0 relative">
                <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-4 md:px-8 py-4 md:py-6 flex justify-between items-center border-b border-transparent md:border-b-0">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {activeTab === 'panel' ? 'Panel de Control' : activeTab === 'transacciones' ? 'Transacciones' : 'Reportes Financieros'}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {activeTab === 'panel' ? 'Monitoreo de crédito en tiempo real y salud financiera.' : activeTab === 'transacciones' ? 'Historial completo de movimientos.' : 'Análisis detallado de tus hábitos de consumo.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsModalOpen(true)}
                            className="hidden md:flex bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg font-semibold text-sm items-center gap-2 transition-colors shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Agregar Rápido
                        </motion.button>
                    </div>
                </header>

                {/* ============ PANEL ============ */}
                {activeTab === 'panel' && (
                    <div className="px-8 pb-12 grid grid-cols-12 gap-6 auto-rows-min mt-4">

                        {/* Main Stat Card */}
                        <div className="col-span-12 lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800/50 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider text-xs block">Efectivo Disponible</span>
                                        <span className="text-[10px] text-slate-400">Lo que tienes AHORA en efectivo/banco</span>
                                    </div>
                                    {(() => {
                                        const isPositive = efectivoDisponible >= 0;
                                        // Limitar porcentaje entre -100% y 100% para visualización
                                        const rawPct = totalIngresos > 0 ? ((efectivoDisponible / totalIngresos) * 100) : 0;
                                        const pctLabel = Math.max(-100, Math.min(100, rawPct)).toFixed(1);
                                        return (
                                            <span className={`flex items-center gap-1 font-semibold text-sm px-2 py-0.5 rounded ${isPositive ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                                                <span className="material-symbols-outlined text-xs">{isPositive ? 'trending_up' : 'trending_down'}</span>
                                                {isPositive ? '+' : ''}{pctLabel}% de ingresos
                                            </span>
                                        );
                                    })()}
                                </div>
                                <div className="text-5xl font-black tracking-tighter mb-4 text-emerald-600 dark:text-emerald-400 leading-none">
                                    ${efectivoDisponible.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>

                                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider text-xs block">Patrimonio Neto</span>
                                            <span className="text-[10px] text-slate-400">Tu situación real (restando deuda de tarjetas)</span>
                                        </div>
                                        <span className={`flex items-center gap-1 font-semibold text-sm px-2 py-0.5 rounded ${saludFinancieraColor === 'emerald' ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30' :
                                            saludFinancieraColor === 'amber' ? 'text-amber-700 bg-amber-100 dark:bg-amber-900/30' :
                                                'text-rose-700 bg-rose-100 dark:bg-rose-900/30'
                                            }`}>
                                            <span className={`material-symbols-outlined text-xs ${saludFinancieraColor === 'emerald' ? 'text-emerald-600' :
                                                saludFinancieraColor === 'amber' ? 'text-amber-600' :
                                                    'text-rose-600'
                                                }`}>{saludFinancieraIcon}</span>
                                            {saludFinancieraLabel}
                                        </span>
                                    </div>
                                    <div className={`text-3xl font-black tracking-tighter leading-none ${patrimonioNeto >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'
                                        }`}>
                                        ${patrimonioNeto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    {/* Indicador de porcentaje de deuda */}
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${deudaPorcentaje <= 30 ? 'bg-emerald-500' :
                                                    deudaPorcentaje <= 50 ? 'bg-amber-500' :
                                                        'bg-rose-500'
                                                    }`}
                                                style={{ width: `${Math.min(deudaPorcentaje, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                                            {deudaPorcentaje.toFixed(1)}% deuda/ingresos
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4">
                                    {totalDeudaTarjetas > 0 && (
                                        <div className="flex items-center justify-between text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-base">credit_card</span>
                                                <span>Deuda de tarjetas</span>
                                            </div>
                                            <strong>−${totalDeudaTarjetas.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-lg">
                                        <span className="material-symbols-outlined text-base">info</span>
                                        <span>
                                            Neto = Efectivo (${efectivoDisponible.toLocaleString()}) − Deuda tarjetas (${totalDeudaTarjetas.toLocaleString()})
                                        </span>
                                    </div>
                                    {/* Leyenda del semáforo */}
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800/30 px-3 py-2 rounded-lg mt-2">
                                        <span className="material-symbols-outlined text-xs">traffic</span>
                                        <span className="flex items-center gap-1">
                                            <span className="size-2 rounded-full bg-emerald-500"></span>
                                            &lt;30% deuda
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="size-2 rounded-full bg-amber-500"></span>
                                            30-50%
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="size-2 rounded-full bg-rose-500"></span>
                                            &gt;50% peligro
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {/* Gráfica de gastos totales por mes */}
                            <div className="h-32 w-full mt-4 relative">
                                <div className="flex items-end justify-between h-24 gap-2 px-1">
                                    {monthlyTotals.map((d, i) => {
                                        const h = (d.gastos / maxMonthlyGasto) * 100;
                                        const isCurrent = i === monthlyTotals.length - 1;
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-0 group relative">
                                                {/* Tooltip */}
                                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                    ${d.gastos.toFixed(0)}
                                                </div>
                                                <div className="w-full h-full flex items-end">
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${Math.max(h, d.gastos > 0 ? 4 : 0)}%` }}
                                                        transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.06 }}
                                                        className={`w-full rounded-t-md ${isCurrent
                                                            ? 'bg-primary'
                                                            : 'bg-primary/30'
                                                            }`}
                                                        style={{ minHeight: d.gastos > 0 ? 4 : 0 }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Labels de meses */}
                                <div className="flex justify-between mt-2 px-1">
                                    {monthlyTotals.map((d, i) => (
                                        <span key={i} className={`flex-1 text-center text-[10px] font-bold uppercase ${i === monthlyTotals.length - 1 ? 'text-primary' : 'text-slate-400'
                                            }`}>{d.label}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Cards usage */}
                        <div className="col-span-12 lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Uso de Tarjetas</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsCardModalOpen(true)} className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" title="Agregar tarjeta">
                                        <span className="material-symbols-outlined text-xl">add</span>
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-5">
                                <AnimatePresence>
                                    {creditCards.map((card) => {
                                        const spentByTx = spentPerCard[card.name] || 0;
                                        const initialDebt = card.initialDebt || 0;
                                        const payments = card.payments || 0;
                                        const manualAdjustment = card.manualAdjustment || 0;
                                        const totalGastosMes = spentByTx + manualAdjustment;
                                        const totalDebt = initialDebt + totalGastosMes - payments;
                                        const cardLimit = card.limit || card.límite || 0;
                                        const percentUsed = cardLimit > 0 ? Math.min((totalDebt / cardLimit) * 100, 100) : 0;
                                        const colors = cardColors[card.themeColor] || cardColors.blue;
                                        const isSelected = (selectedCardId ?? creditCards[0]?.id) === card.id;
                                        return (
                                            <motion.div
                                                key={card.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="space-y-3 p-3 rounded-xl transition-all border"
                                                style={{
                                                    borderColor: isSelected ? colors.border : 'transparent',
                                                    backgroundColor: isSelected ? colors.bg : 'transparent',
                                                }}
                                            >
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="flex items-center gap-3 flex-1" onClick={() => setSelectedCardId(card.id)}>
                                                        <div className="size-8 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.bg, color: colors.text }}>
                                                            <span className="material-symbols-outlined text-lg">credit_score</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{card.name}</p>
                                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">**** {card.lastFour}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setCardToPay(card); setIsPaymentModalOpen(true); }}
                                                            className="size-8 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/30 transition-all flex-shrink-0"
                                                            title="Registrar pago"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">money</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleResetCardMonth(card); }}
                                                            className="size-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-all flex-shrink-0"
                                                            title="Reiniciar mes - Pasar deuda actual a inicial y poner pagos en 0"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">autorenew</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setCardToEdit(card); setIsEditCardModalOpen(true); }}
                                                            className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex-shrink-0"
                                                            title="Editar tarjeta"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">edit</span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
                                                        <p className="text-[9px] text-slate-500 uppercase font-bold">Deuda inicial</p>
                                                        <p className="text-xs font-semibold text-slate-600">${initialDebt.toFixed(2)}</p>
                                                    </div>
                                                    <div className="bg-rose-50 dark:bg-rose-900/10 rounded-lg p-2 text-center">
                                                        <p className="text-[9px] text-rose-500 uppercase font-bold">Gastos mes</p>
                                                        <p className="text-xs font-semibold text-rose-500">${totalGastosMes.toFixed(2)}</p>
                                                        {manualAdjustment !== 0 && (
                                                            <p className={`text-[8px] font-medium ${manualAdjustment > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                                {manualAdjustment > 0 ? '+' : ''}{manualAdjustment.toFixed(2)} ajuste
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-2 text-center">
                                                        <p className="text-[9px] text-emerald-500 uppercase font-bold">Pagos</p>
                                                        <p className="text-xs font-semibold text-emerald-500">${payments.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-bold text-slate-600">Deuda Total</span>
                                                        <span className="text-lg font-black text-rose-500">−${totalDebt.toFixed(2)}</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all"
                                                            style={{ width: `${percentUsed}%`, backgroundColor: colors.bar }}
                                                        ></div>
                                                    </div>
                                                    <p className="text-[9px] text-slate-500 text-right mt-1">{percentUsed.toFixed(0)}% del límite (${cardLimit.toLocaleString()})</p>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                            </div>
                            {creditCards.length === 0 && (
                                <div className="py-8 text-center">
                                    <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 block mb-2">credit_card</span>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">No hay tarjetas registradas</p>
                                    <p className="text-slate-400 dark:text-slate-600 text-xs mt-1">Agrega una tarjeta para comenzar</p>
                                </div>
                            )}
                            {activeCard && (
                                <p className="text-[10px] text-slate-400 mt-3 text-center">
                                    Toca una tarjeta para ver su historial en la gráfica ↑
                                </p>
                            )}
                        </div>

                        {/* Tendencias de Gastos */}
                        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800/50 shadow-sm">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Tendencias de Gastos</h3>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                    <button className="px-3 py-1 text-xs font-semibold rounded bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white">Semanal</button>
                                    <button className="px-3 py-1 text-xs font-semibold rounded text-slate-500">Mensual</button>
                                </div>
                            </div>
                            <div className="flex items-end justify-between h-48 gap-4 pb-6">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                                    const heightPercent = (dayTotals[day] / maxDayTotal) * 100;
                                    const isMax = dayTotals[day] === maxDayTotal && maxDayTotal > 100; // Highlight highest if there's real data
                                    return (
                                        <div key={day} className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-t-lg relative h-full">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${heightPercent}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className={`absolute bottom-0 w-full ${isMax ? 'bg-primary' : 'bg-primary/20'} rounded-t-lg`}
                                            />
                                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase font-bold text-slate-400">{day}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Gasto Profile */}
                        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800/50 shadow-sm">
                            <h3 className="font-bold text-lg mb-8 text-slate-900 dark:text-white">Gasto Profile</h3>
                            <div className="flex flex-col items-center">
                                <div className="relative size-40">
                                    <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
                                        <circle className="text-slate-100 dark:text-slate-800" cx="18" cy="18" fill="none" r="16" stroke="currentColor" strokeWidth="3"></circle>
                                        {chartData.map((data, index) => (
                                            data.percent > 0 && (
                                                <motion.circle
                                                    key={index}
                                                    cx="18" cy="18" fill="none" r="16"
                                                    stroke={data.color}
                                                    strokeWidth="3"
                                                    strokeDasharray={`${data.percent}, 100`}
                                                    strokeDashoffset={`-${data.offset}`}
                                                    strokeLinecap="round"
                                                    initial={{ strokeDasharray: `0, 100` }}
                                                    animate={{ strokeDasharray: `${data.percent}, 100` }}
                                                    transition={{ duration: 1, delay: index * 0.1 }}
                                                />
                                            )
                                        ))}
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-xl font-bold text-slate-900 dark:text-white">
                                            ${totalGastado >= 1000 ? (totalGastado / 1000).toFixed(1) + 'k' : totalGastado.toFixed(0)}
                                        </span>
                                        <span className="text-[8px] uppercase text-slate-500 font-bold tracking-widest">Gastado</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 w-full mt-8">
                                    {chartData.filter(d => d.amount > 0).map((data, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <div className="size-2 rounded-full" style={{ backgroundColor: data.color }}></div>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{data.name}</span>
                                        </div>
                                    ))}
                                    {totalGastado === 0 && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 col-span-2 text-center">Agrega gastos para ver desglose</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Transacciones List */}
                        <div className="col-span-12 bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800/50 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Recent Transacciones</h3>
                                <button className="text-primary text-sm font-semibold hover:underline">Descargar Estado de Cuenta</button>
                            </div>

                            {/* List Container */}
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {transactions
                                        .slice(recentPage * RECENT_PER_PAGE, (recentPage + 1) * RECENT_PER_PAGE)
                                        .map((tx) => (
                                            <motion.div
                                                key={tx.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-slate-100 dark:border-slate-800/50"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`size-10 rounded-full bg-${tx.iconColor}-100 dark:bg-${tx.iconColor}-500/10 text-${tx.iconColor}-600 flex items-center justify-center flex-shrink-0`}>
                                                        <span className="material-symbols-outlined text-xl">{tx.icon}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{tx.store}</p>
                                                        <p className="text-xs text-slate-500 truncate">{tx.category} • {tx.paymentMethod ? `${tx.paymentMethod} • ` : ''}{tx.date}</p>
                                                    </div>
                                                </div>
                                                <p className={`font-bold text-sm flex-shrink-0 ${tx.type === 'gasto' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    {tx.type === 'gasto' ? '-' : '+'}${parseFloat(tx.amount).toFixed(2)}
                                                </p>
                                            </motion.div>
                                        ))}
                                </AnimatePresence>

                                {transactions.length === 0 && (
                                    <div className="py-12 text-center">
                                        <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 block mb-2">receipt_long</span>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">No hay transacciones recientes</p>
                                    </div>
                                )}
                            </div>

                            {/* Paginación */}
                            {transactions.length > RECENT_PER_PAGE && (
                                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-6">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Página {recentPage + 1} de {Math.ceil(transactions.length / RECENT_PER_PAGE)} • Mostrando {Math.min(transactions.length - recentPage * RECENT_PER_PAGE, RECENT_PER_PAGE)} de {transactions.length} transacciones
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setRecentPage(p => Math.max(0, p - 1))}
                                            disabled={recentPage === 0}
                                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                        >
                                            Anterior
                                        </button>
                                        <div className="hidden sm:flex items-center gap-1">
                                            {Array.from({ length: Math.ceil(transactions.length / RECENT_PER_PAGE) }, (_, i) => i).map((i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setRecentPage(i)}
                                                    className={`w-8 h-8 rounded-lg transition-all text-sm font-medium ${i === recentPage
                                                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                        }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setRecentPage(p => Math.min(Math.ceil(transactions.length / RECENT_PER_PAGE) - 1, p + 1))}
                                            disabled={recentPage >= Math.ceil(transactions.length / RECENT_PER_PAGE) - 1}
                                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* View All Link */}
                            <div className="text-center mt-4">
                                <button
                                    onClick={() => setActiveTab('transacciones')}
                                    className="text-primary text-sm font-semibold hover:underline flex items-center justify-center gap-1 mx-auto"
                                >
                                    Ver todas las transacciones
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                            </div>
                        </div>

                    </div>
                )}

                {/* ============ TRANSACCIONES ============ */}
                {activeTab === 'transacciones' && (() => {
                    const allCategories = ['todas', ...Array.from(new Set(transactions.map(t => t.category).filter(Boolean)))];
                    const allMonths = ['todos', ...Array.from(new Set(transactions.map(tx => {
                        const d = tx.createdAt && typeof tx.createdAt.toDate === 'function' ? tx.createdAt.toDate()
                            : (tx.date === 'Hoy' || tx.date === 'Justo ahora' ? new Date() : null);
                        if (!d) return null;
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    }).filter(Boolean))).sort((a, b) => b.localeCompare(a))];

                    const MONTHS_LABEL = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

                    const filtered = transactions.filter(tx => {
                        const q = txSearch.toLowerCase();
                        const matchSearch = !q ||
                            (tx.store || '').toLowerCase().includes(q) ||
                            (tx.category || '').toLowerCase().includes(q) ||
                            (tx.paymentMethod || '').toLowerCase().includes(q);
                        const matchType = txFilterType === 'todos' || tx.type === txFilterType;
                        const matchCat = txFilterCategory === 'todas' || tx.category === txFilterCategory;
                        let matchMonth = true;
                        if (txFilterMonth !== 'todos') {
                            const d = tx.createdAt && typeof tx.createdAt.toDate === 'function' ? tx.createdAt.toDate()
                                : (tx.date === 'Hoy' || tx.date === 'Justo ahora' ? new Date() : null);
                            if (d) {
                                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                                matchMonth = key === txFilterMonth;
                            } else { matchMonth = false; }
                        }
                        return matchSearch && matchType && matchCat && matchMonth;
                    });

                    const totalPages = Math.ceil(filtered.length / TX_PER_PAGE);
                    const currentPage = txPage >= totalPages ? 0 : txPage;
                    const paginatedFiltered = filtered.slice(currentPage * TX_PER_PAGE, (currentPage + 1) * TX_PER_PAGE);

                    // Calcular totales filtrados correctamente
                    // Los pagos a tarjetas no deben contar como gasto negativo en el balance
                    const totalFiltrado = filtered.reduce((acc, tx) => {
                        if (tx.type === 'pago_tarjeta') return acc; // Los pagos a tarjeta no afectan el balance filtrado
                        return tx.type === 'gasto' ? acc - parseFloat(tx.amount) : acc + parseFloat(tx.amount);
                    }, 0);

                    const totalIngresosFiltrados = filtered.filter(t => t.type === 'ingreso').reduce((a, t) => a + parseFloat(t.amount), 0);
                    const totalGastosFiltrados = filtered.filter(t => t.type === 'gasto').reduce((a, t) => a + parseFloat(t.amount), 0);
                    const totalPagosFiltrados = filtered.filter(t => t.type === 'pago_tarjeta').reduce((a, t) => a + parseFloat(t.amount), 0);

                    const exportarCSV = () => {
                        const escapar = (val) => {
                            if (val === null || val === undefined) return '';
                            const str = String(val);
                            return str.includes(',') || str.includes('"') || str.includes('\n')
                                ? `"${str.replace(/"/g, '""')}"`
                                : str;
                        };
                        const headers = ['Fecha', 'Tipo', 'Descripcion', 'Categoria', 'Metodo de Pago', 'Monto'];
                        const rows = filtered.map(tx => {
                            const txDate = tx.createdAt && typeof tx.createdAt.toDate === 'function'
                                ? tx.createdAt.toDate()
                                : (tx.date === 'Hoy' || tx.date === 'Justo ahora' ? new Date() : null);
                            const fecha = txDate
                                ? txDate.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                : tx.date || '';
                            const monto = tx.type === 'gasto'
                                ? `-${parseFloat(tx.amount).toFixed(2)}`
                                : `+${parseFloat(tx.amount).toFixed(2)}`;
                            return [
                                escapar(fecha),
                                escapar(tx.type === 'gasto' ? 'Gasto' : 'Ingreso'),
                                escapar(tx.store),
                                escapar(tx.category),
                                escapar(tx.paymentMethod || ''),
                                escapar(monto),
                            ].join(',');
                        });
                        const csvContent = [headers.join(','), ...rows].join('\n');
                        const hoy = new Date().toISOString().slice(0, 10);
                        const dataUri = 'data:text/csv;charset=utf-8,%EF%BB%BF' + encodeURIComponent(csvContent);
                        const link = document.createElement('a');
                        link.setAttribute('href', dataUri);
                        link.setAttribute('download', `transacciones_${hoy}.csv`);
                        link.style.display = 'none';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    };

                    return (
                        <div className="px-8 pb-12 mt-4 space-y-6">

                            {/* Buscador + Filtros */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/50 shadow-sm">
                                <div className="relative mb-4">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                                    <input
                                        type="text"
                                        placeholder="Buscar por tienda, categoría o método de pago..."
                                        value={txSearch}
                                        onChange={e => setTxSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                    {txSearch && (
                                        <button onClick={() => setTxSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                        {[['todos', 'Todos'], ['gasto', 'Gastos'], ['ingreso', 'Ingresos']].map(([val, label]) => (
                                            <button key={val} onClick={() => setTxFilterType(val)}
                                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${txFilterType === val ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    <select value={txFilterCategory} onChange={e => setTxFilterCategory(e.target.value)}
                                        className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 border-0 rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50">
                                        <option value="todas">Todas las categorías</option>
                                        {allCategories.filter(c => c !== 'todas').map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>

                                    <select value={txFilterMonth} onChange={e => setTxFilterMonth(e.target.value)}
                                        className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 border-0 rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50">
                                        <option value="todos">Todos los meses</option>
                                        {allMonths.filter(m => m !== 'todos').map(m => {
                                            const [yr, mo] = m.split('-');
                                            return <option key={m} value={m}>{MONTHS_LABEL[parseInt(mo) - 1]} {yr}</option>;
                                        })}
                                    </select>

                                    {(txSearch || txFilterType !== 'todos' || txFilterCategory !== 'todas' || txFilterMonth !== 'todos') && (
                                        <button onClick={() => { setTxSearch(''); setTxFilterType('todos'); setTxFilterCategory('todas'); setTxFilterMonth('todos'); }}
                                            className="px-3 py-1.5 text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-lg hover:bg-rose-100 transition-colors">
                                            Limpiar filtros
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Resumen rápido */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total Ingresos', value: totalIngresosFiltrados, color: 'emerald', icon: 'trending_up' },
                                    { label: 'Total Gastos', value: totalGastosFiltrados, color: 'rose', icon: 'trending_down' },
                                    { label: 'Pagos Tarjetas', value: totalPagosFiltrados, color: 'blue', icon: 'credit_card' },
                                    { label: 'Balance', value: totalFiltrado, color: totalFiltrado >= 0 ? 'emerald' : 'rose', icon: totalFiltrado >= 0 ? 'account_balance_wallet' : 'warning' },
                                ].map(({ label, value, color, icon }) => (
                                    <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/50 shadow-sm">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`material-symbols-outlined text-${color}-500 text-lg`}>{icon}</span>
                                            <span className="text-xs text-slate-500 font-medium">{label}</span>
                                        </div>
                                        <p className={`text-xl font-black text-${color}-500`}>${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Lista */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        {filtered.length} transacción{filtered.length !== 1 ? 'es' : ''}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setIsClearTxModalOpen(true)}
                                            disabled={filtered.length === 0}
                                            className="text-rose-500 text-xs font-semibold hover:underline flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                            Eliminar todo
                                        </button>
                                        <button
                                            onClick={exportarCSV}
                                            disabled={filtered.length === 0}
                                            className="text-primary text-xs font-semibold hover:underline flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                                        >
                                            <span className="material-symbols-outlined text-sm">download</span>
                                            Exportar CSV ({filtered.length})
                                        </button>
                                    </div>
                                </div>

                                {filtered.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700 block mb-3">receipt_long</span>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">No se encontraron transacciones</p>
                                        <p className="text-slate-400 dark:text-slate-600 text-sm mt-1">Intenta ajustar los filtros o el buscador</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                            <AnimatePresence>
                                                {paginatedFiltered.map((tx, idx) => {
                                                    const txDate = tx.createdAt && typeof tx.createdAt.toDate === 'function'
                                                        ? tx.createdAt.toDate()
                                                        : (tx.date === 'Hoy' || tx.date === 'Justo ahora' ? new Date() : null);
                                                    const dateLabel = txDate
                                                        ? txDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                                                        : tx.date;
                                                    return (
                                                        <motion.div
                                                            key={tx.id}
                                                            initial={{ opacity: 0, y: 6 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0 }}
                                                            transition={{ duration: 0.2, delay: idx * 0.02 }}
                                                            className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`size-11 rounded-full bg-${tx.iconColor || 'slate'}-100 dark:bg-${tx.iconColor || 'slate'}-500/10 text-${tx.iconColor || 'slate'}-600 flex items-center justify-center flex-shrink-0`}>
                                                                    <span className="material-symbols-outlined text-xl">{tx.icon || 'receipt'}</span>
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{tx.store}</p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <span className="text-[11px] text-slate-400">{tx.category}</span>
                                                                        {tx.paymentMethod && <>
                                                                            <span className="text-slate-300 dark:text-slate-700">•</span>
                                                                            <span className="text-[11px] text-slate-400">{tx.paymentMethod}</span>
                                                                        </>}
                                                                        <span className="text-slate-300 dark:text-slate-700">•</span>
                                                                        <span className="text-[11px] text-slate-400">{dateLabel}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <div className="text-right flex-shrink-0">
                                                                    <p className={`font-bold text-sm ${tx.type === 'gasto' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                                        {tx.type === 'gasto' ? '-' : '+'}${parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                    </p>
                                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tx.type === 'gasto' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500'}`}>
                                                                        {tx.type === 'gasto' ? 'Gasto' : 'Ingreso'}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    onClick={() => setTxToDelete(tx)}
                                                                    className="size-8 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 hover:bg-rose-200 dark:hover:bg-rose-900/30 transition-all"
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

                                        {/* Paginación */}
                                        {totalPages > 1 && (
                                            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Página {currentPage + 1} de {totalPages} • Mostrando {paginatedFiltered.length} de {filtered.length} transacciones
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setTxPage(p => Math.max(0, p - 1))}
                                                        disabled={currentPage === 0}
                                                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                                    >
                                                        Anterior
                                                    </button>
                                                    <div className="hidden sm:flex items-center gap-1">
                                                        {Array.from({ length: totalPages }, (_, i) => i).map((i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => setTxPage(i)}
                                                                className={`w-8 h-8 rounded-lg transition-all text-sm font-medium ${i === currentPage
                                                                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                                    }`}
                                                            >
                                                                {i + 1}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={() => setTxPage(p => Math.min(totalPages - 1, p + 1))}
                                                        disabled={currentPage >= totalPages - 1}
                                                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                                    >
                                                        Siguiente
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* ============ REPORTES ============ */}
                {activeTab === 'reportes' && (() => {
                    // Calcular ingresos y gastos reales (excluyendo pagos a tarjetas porque ya están en la deuda)
                    const totalIngresos = transactions.filter(t => t.type === 'ingreso').reduce((a, t) => a + parseFloat(t.amount), 0);
                    const totalGastosReales = transactions.filter(t => t.type === 'gasto').reduce((a, t) => a + parseFloat(t.amount), 0);
                    const totalPagosTarjetas = transactions.filter(t => t.type === 'pago_tarjeta').reduce((a, t) => a + parseFloat(t.amount), 0);

                    // Tasa de ahorro = (Ingresos - Gastos Reales) / Ingresos * 100
                    // Los pagos a tarjetas no son ahorro, son reducción de deuda
                    const ahorroReal = totalIngresos - totalGastosReales;

                    // Limitar la tasa entre -100% y 100% para que tenga sentido financiero
                    let savingsRate = totalIngresos > 0 ? (ahorroReal / totalIngresos) * 100 : 0;
                    savingsRate = Math.max(-100, Math.min(100, savingsRate)); // Clamp entre -100 y 100

                    // Determinar color según si hay ahorro positivo o negativo
                    const savingsColor = savingsRate >= 50 ? 'emerald' : savingsRate >= 20 ? 'blue' : savingsRate >= 0 ? 'amber' : 'rose';

                    // Group by store for Top 5
                    const storeTotals = {};
                    transactions.filter(t => t.type === 'gasto').forEach(tx => {
                        storeTotals[tx.store] = (storeTotals[tx.store] || 0) + parseFloat(tx.amount);
                    });
                    const topStores = Object.entries(storeTotals)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5);

                    // Monthly data for comparison chart
                    const monthlyComp = last6Months.map(({ label, year, month }) => {
                        const income = transactions
                            .filter(tx => {
                                if (tx.type !== 'ingreso') return false;
                                const d = tx.createdAt && typeof tx.createdAt.toDate === 'function' ? tx.createdAt.toDate() : (tx.date === 'Hoy' || tx.date === 'Justo ahora' ? new Date() : null);
                                return d && d.getFullYear() === year && d.getMonth() === month;
                            })
                            .reduce((s, tx) => s + parseFloat(tx.amount), 0);
                        const expense = transactions
                            .filter(tx => {
                                if (tx.type !== 'gasto') return false;
                                const d = tx.createdAt && typeof tx.createdAt.toDate === 'function' ? tx.createdAt.toDate() : (tx.date === 'Hoy' || tx.date === 'Justo ahora' ? new Date() : null);
                                return d && d.getFullYear() === year && d.getMonth() === month;
                            })
                            .reduce((s, tx) => s + parseFloat(tx.amount), 0);
                        return { label, income, expense };
                    });

                    const maxVal = Math.max(...monthlyComp.map(d => Math.max(d.income, d.expense)), 1);

                    return (
                        <div className="px-8 pb-12 mt-4 space-y-6">
                            <div className="grid grid-cols-12 gap-6">
                                {/* Saving Rate Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50 shadow-sm"
                                >
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Tasa de Ahorro</h3>
                                    <div className="flex items-center justify-center py-4">
                                        <div className="relative size-32">
                                            <svg className="size-full rotate-[-90deg]" viewBox="0 0 36 36">
                                                <circle className="text-slate-100 dark:text-slate-800" cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" />
                                                <motion.circle
                                                    className={`${savingsColor === 'emerald' ? 'text-emerald-500' : savingsColor === 'blue' ? 'text-blue-500' : savingsColor === 'amber' ? 'text-amber-500' : 'text-rose-500'}`}
                                                    cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3"
                                                    strokeDasharray={`${Math.max(0, savingsRate)}, 100`}
                                                    initial={{ strokeDasharray: "0, 100" }}
                                                    animate={{ strokeDasharray: `${Math.max(0, savingsRate)}, 100` }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className={`text-2xl font-black ${savingsRate >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'}`}>
                                                    {savingsRate >= 0 ? savingsRate.toFixed(1) : savingsRate.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center mt-2">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${savingsColor === 'emerald' ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30' :
                                            savingsColor === 'blue' ? 'text-blue-700 bg-blue-100 dark:bg-blue-900/30' :
                                                savingsColor === 'amber' ? 'text-amber-700 bg-amber-100 dark:bg-amber-900/30' :
                                                    'text-rose-700 bg-rose-100 dark:bg-rose-900/30'
                                            }`}>
                                            {savingsRate >= 50 ? '¡Excelente!' : savingsRate >= 20 ? 'Buen trabajo' : savingsRate >= 0 ? 'Puede mejorar' : 'Atención necesaria'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-center text-slate-500 mt-3">
                                        Tu ahorro es de <span className="text-emerald-500 font-bold">${ahorroReal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> sobre ingresos de <span className="text-slate-600 dark:text-slate-400 font-bold">${totalIngresos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>.
                                        {totalPagosTarjetas > 0 && (
                                            <span className="block mt-1">Incluye ${totalPagosTarjetas.toLocaleString('en-US', { minimumFractionDigits: 2 })} en pagos a tarjetas.</span>
                                        )}
                                    </p>
                                </motion.div>

                                {/* Monthly Comparison Chart */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50 shadow-sm"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Ingresos vs Gastos</h3>
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className="size-2 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Ingresos</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="size-2 rounded-full bg-rose-500" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Gastos</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-44 flex items-end justify-between gap-4">
                                        {monthlyComp.map((d, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                                                <div className="flex items-end gap-1 w-full h-32">
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${(d.income / maxVal) * 100}%` }}
                                                        className="flex-1 bg-emerald-500/80 rounded-t-sm"
                                                    />
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${(d.expense / maxVal) * 100}%` }}
                                                        className="flex-1 bg-rose-500/80 rounded-t-sm"
                                                    />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{d.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Top 5 Stores */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50 shadow-sm"
                                >
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Top 5 Lugares de Gasto</h3>
                                    <div className="space-y-4">
                                        {topStores.map(([store, total], idx) => (
                                            <div key={store} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="size-6 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">{idx + 1}</span>
                                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{store}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">${total.toLocaleString()}</p>
                                                    <div className="w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1">
                                                        <div className="bg-primary h-full rounded-full" style={{ width: `${(total / topStores[0][1]) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {topStores.length === 0 && <p className="text-center text-slate-400 text-sm py-8">Sin datos de gastos</p>}
                                    </div>
                                </motion.div>

                                {/* Category Breakdown Table */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50 shadow-sm"
                                >
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Distribución por Categoría</h3>
                                    <div className="space-y-4">
                                        {chartData.filter(d => d.amount > 0).sort((a, b) => b.amount - a.amount).map((cat) => (
                                            <div key={cat.name} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{cat.name}</span>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <span className="text-xs font-bold text-slate-400">{cat.percent.toFixed(1)}%</span>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white w-20 text-right">${cat.amount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {totalGastado === 0 && <p className="text-center text-slate-400 text-sm py-8">Sin datos de categorías</p>}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    );
                })()}

                {/* Mobile Bottom Navigation (Thumb Zone) */}
                <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around items-center px-4 py-3 z-50 pb-safe">
                    <button onClick={() => setActiveTab('panel')} className={`flex flex-col items-center gap-1 min-w-[64px] ${activeTab === 'panel' ? 'text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                        <span className={`material-symbols-outlined ${activeTab === 'panel' ? 'text-2xl' : 'text-xl'}`}>dashboard</span>
                        <span className="text-[10px] font-semibold">Panel</span>
                    </button>
                    <button onClick={() => setActiveTab('transacciones')} className={`flex flex-col items-center gap-1 min-w-[64px] ${activeTab === 'transacciones' ? 'text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                        <span className={`material-symbols-outlined ${activeTab === 'transacciones' ? 'text-2xl' : 'text-xl'}`}>receipt_long</span>
                        <span className="text-[10px] font-semibold">Movimientos</span>
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="flex flex-col items-center justify-center -mt-6">
                        <div className="size-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-background-light dark:border-background-dark">
                            <span className="material-symbols-outlined text-2xl">add</span>
                        </div>
                    </button>
                    <button onClick={() => setActiveTab('reportes')} className={`flex flex-col items-center gap-1 min-w-[64px] ${activeTab === 'reportes' ? 'text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                        <span className={`material-symbols-outlined ${activeTab === 'reportes' ? 'text-2xl' : 'text-xl'}`}>bar_chart</span>
                        <span className="text-[10px] font-semibold">Resumen</span>
                    </button>
                    <button onClick={logout} className={`flex flex-col items-center gap-1 min-w-[64px] text-slate-400 hover:text-rose-500`}>
                        <span className="material-symbols-outlined text-xl">logout</span>
                        <span className="text-[10px] font-semibold">Salir</span>
                    </button>
                </nav>

            </main>

            <AddTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddGasto}
                creditCards={creditCards}
            />
            <AddCreditCardModal
                isOpen={isCardModalOpen}
                onClose={() => setIsCardModalOpen(false)}
                onAddCard={handleAddCard}
            />
            <EditCreditCardModal
                isOpen={isEditCardModalOpen}
                onClose={() => { setIsEditCardModalOpen(false); setCardToEdit(null); }}
                card={cardToEdit}
                onSave={handleUpdateCard}
            />
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => { setIsPaymentModalOpen(false); setCardToPay(null); }}
                card={cardToPay}
                spentPerCard={spentPerCard}
                onPayment={handleAddPayment}
            />
            {/* Clear Transactions Confirmation Modal */}
            <AnimatePresence>
                {isClearTxModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsClearTxModalOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl z-50 border border-slate-200 dark:border-slate-800"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Eliminar Transacciones</h2>
                                <button onClick={() => setIsClearTxModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="size-12 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center text-rose-600">
                                        <span className="material-symbols-outlined text-2xl">warning</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">¿Estás seguro?</p>
                                        <p className="text-sm text-slate-500">Esta acción no se puede deshacer</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Se eliminarán <strong className="text-slate-900 dark:text-white">{transactions.length}</strong> transacciones permanentemente.
                                    Las tarjetas y sus ajustes manuales se mantendrán.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsClearTxModalOpen(false)}
                                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleClearAllTransactions}
                                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-rose-500/30"
                                >
                                    Sí, eliminar todo
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Single Transaction Modal */}
            <AnimatePresence>
                {txToDelete && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setTxToDelete(null)}
                            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl z-50 border border-slate-200 dark:border-slate-800"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Eliminar Transacción</h2>
                                <button onClick={() => setTxToDelete(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="size-12 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center text-rose-600">
                                        <span className="material-symbols-outlined text-2xl">delete</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">¿Eliminar esta transacción?</p>
                                        <p className="text-sm text-slate-500">Esta acción no se puede deshacer</p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                                    <p className="font-bold text-slate-900 dark:text-white mb-1">{txToDelete.store}</p>
                                    <p className="text-sm text-slate-500 mb-2">{txToDelete.category} • {txToDelete.date}</p>
                                    <p className={`text-lg font-black ${txToDelete.type === 'gasto' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {txToDelete.type === 'gasto' ? '-' : '+'}${parseFloat(txToDelete.amount).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setTxToDelete(null)}
                                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDeleteTransaction(txToDelete.id)}
                                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-rose-500/30"
                                >
                                    Sí, eliminar
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;
