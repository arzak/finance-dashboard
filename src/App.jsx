import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import { migrateOrphanedDocs } from "./migrate";
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, where } from "firebase/firestore";

const INITIAL_TRANSACTIONS = [
    { id: '1', store: "Apple Store", category: "Tecnología", type: "gasto", paymentMethod: "Visa Gold", amount: 14.99, date: "Hoy", icon: "shopping_bag", iconColor: "blue" },
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
            icon: category === "Comida" ? "restaurant" : category === "Tecnología" ? "shopping_bag" : category === "Nómina" ? "payments" : "credit_card",
            iconColor: category === "Comida" ? "orange" : category === "Tecnología" ? "blue" : category === "Nómina" ? "emerald" : "purple",
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
            límite: parseFloat(limit) || 0,
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

    // --- Migration: assign orphaned docs to oldtees@mail.com on first login ---
    useEffect(() => {
        if (!currentUser || !db) return;
        const OWNER_EMAIL = "oldtees@mail.com";
        if (currentUser.email?.toLowerCase() === OWNER_EMAIL) {
            migrateOrphanedDocs(currentUser.uid).catch(console.error);
        }
    }, [currentUser]);

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

    const totalIngresos = transactions.reduce((acc, tx) => tx.type === 'ingreso' ? acc + parseFloat(tx.amount) : acc, 0);
    const totalGastos = transactions.reduce((acc, tx) => tx.type === 'gasto' ? acc + parseFloat(tx.amount) : acc, 0);
    const totalAvailable = totalIngresos - totalGastos;

    // Gasto real por tarjeta (basado en transacciones)
    const spentPerCard = {};
    transactions.forEach(tx => {
        if (tx.type === 'gasto' && tx.paymentMethod) {
            spentPerCard[tx.paymentMethod] = (spentPerCard[tx.paymentMethod] || 0) + parseFloat(tx.amount);
        }
    });

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
            <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark scrollbar-hide">
                <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-8 py-6 flex justify-between items-center">
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
                            className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
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
                                    <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider text-xs">Fondos Totales Disponibles</span>
                                    {(() => {
                                        const isPositive = totalAvailable >= 0;
                                        const pctLabel = totalIngresos > 0
                                            ? ((totalAvailable / totalIngresos) * 100).toFixed(1)
                                            : '0.0';
                                        return (
                                            <span className={`flex items-center gap-1 font-semibold text-sm px-2 py-0.5 rounded ${isPositive ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                                                <span className="material-symbols-outlined text-xs">{isPositive ? 'trending_up' : 'trending_down'}</span>
                                                {isPositive ? '+' : ''}{pctLabel}% disponible
                                            </span>
                                        );
                                    })()}
                                </div>
                                <div className="text-5xl font-black tracking-tighter mb-8 text-slate-900 dark:text-white leading-none">
                                    ${totalAvailable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                <button onClick={() => setIsCardModalOpen(true)} className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-xl">add</span>
                                </button>
                            </div>
                            <div className="space-y-5">
                                <AnimatePresence>
                                    {creditCards.map((card) => {
                                        const spentByTx = spentPerCard[card.name] || 0;
                                        const cardLimit = card.limit || card.límite || 0;
                                        const percentUsed = cardLimit > 0 ? Math.min((spentByTx / cardLimit) * 100, 100) : 0;
                                        const isSelected = (selectedCardId ?? creditCards[0]?.id) === card.id;
                                        return (
                                            <motion.div
                                                key={card.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                onClick={() => setSelectedCardId(card.id)}
                                                className={`space-y-2 p-3 rounded-xl cursor-pointer transition-all border ${isSelected
                                                    ? `border-${card.themeColor}-400 bg-${card.themeColor}-50 dark:bg-${card.themeColor}-900/20`
                                                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-end">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`size-8 rounded bg-${card.themeColor}-600/10 flex items-center justify-center text-${card.themeColor}-600`}>
                                                            <span className="material-symbols-outlined text-lg">credit_score</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{card.name}</p>
                                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">**** {card.lastFour}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-rose-500">−${spentByTx.toFixed(2)}</p>
                                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">de ${cardLimit.toLocaleString()} límite</p>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${percentUsed}%` }} transition={{ duration: 1 }} className={`bg-${card.themeColor}-500 h-full rounded-full`}></motion.div>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                            </div>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-4">
                                <AnimatePresence>
                                    {transactions.map((tx) => (
                                        <motion.div
                                            key={tx.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50 pb-4"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`size-10 rounded-full bg-${tx.iconColor}-100 dark:bg-${tx.iconColor}-500/10 text-${tx.iconColor}-600 flex items-center justify-center`}>
                                                    <span className="material-symbols-outlined text-xl">{tx.icon}</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{tx.store}</p>
                                                    <p className="text-xs text-slate-500">{tx.category} • {tx.paymentMethod ? `${tx.paymentMethod} • ` : ''}{tx.date}</p>
                                                </div>
                                            </div>
                                            <p className={`font-bold text-sm ${tx.type === 'gasto' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {tx.type === 'gasto' ? '-' : '+'}${parseFloat(tx.amount).toFixed(2)}
                                            </p>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
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

                    const totalFiltrado = filtered.reduce((acc, tx) =>
                        tx.type === 'gasto' ? acc - parseFloat(tx.amount) : acc + parseFloat(tx.amount), 0);

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
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: 'Total Ingresos', value: filtered.filter(t => t.type === 'ingreso').reduce((a, t) => a + parseFloat(t.amount), 0), color: 'emerald', icon: 'trending_up' },
                                    { label: 'Total Gastos', value: filtered.filter(t => t.type === 'gasto').reduce((a, t) => a + parseFloat(t.amount), 0), color: 'rose', icon: 'trending_down' },
                                    { label: 'Balance Filtrado', value: totalFiltrado, color: totalFiltrado >= 0 ? 'blue' : 'rose', icon: totalFiltrado >= 0 ? 'account_balance_wallet' : 'warning' },
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
                                    <button
                                        onClick={exportarCSV}
                                        disabled={filtered.length === 0}
                                        className="text-primary text-xs font-semibold hover:underline flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                                    >
                                        <span className="material-symbols-outlined text-sm">download</span>
                                        Exportar CSV ({filtered.length})
                                    </button>
                                </div>

                                {filtered.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700 block mb-3">receipt_long</span>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">No se encontraron transacciones</p>
                                        <p className="text-slate-400 dark:text-slate-600 text-sm mt-1">Intenta ajustar los filtros o el buscador</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                        <AnimatePresence>
                                            {filtered.map((tx, idx) => {
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
                                                        <div className="text-right flex-shrink-0 ml-4">
                                                            <p className={`font-bold text-sm ${tx.type === 'gasto' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                                {tx.type === 'gasto' ? '-' : '+'}${parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                            </p>
                                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tx.type === 'gasto' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500'}`}>
                                                                {tx.type === 'gasto' ? 'Gasto' : 'Ingreso'}
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* ============ REPORTES ============ */}
                {activeTab === 'reportes' && (() => {
                    const totalIngresos = transactions.filter(t => t.type === 'ingreso').reduce((a, t) => a + parseFloat(t.amount), 0);
                    const totalGastos = transactions.filter(t => t.type === 'gasto').reduce((a, t) => a + parseFloat(t.amount), 0);
                    const savingsRate = totalIngresos > 0 ? ((totalIngresos - totalGastos) / totalIngresos) * 100 : 0;

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
                                                    className="text-emerald-500" cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3"
                                                    strokeDasharray={`${Math.max(0, savingsRate)}, 100`}
                                                    initial={{ strokeDasharray: "0, 100" }}
                                                    animate={{ strokeDasharray: `${Math.max(0, savingsRate)}, 100` }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-2xl font-black text-slate-900 dark:text-white">{savingsRate.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-center text-slate-500 mt-2">
                                        Has ahorrado <span className="text-emerald-500 font-bold">${(totalIngresos - totalGastos).toLocaleString()}</span> de tus ingresos totales.
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
        </div>
    );
}

export default App;
