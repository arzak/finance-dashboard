import React, { lazy, Suspense, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import { useFinance } from "./contexts/FinanceContext";
import { migrateOrphanedDocs } from "./migrate";
import { calculateCardFinancialDetails } from "./utils/financeCalculations";
import { exportTransactionsToCsv } from "./services/exportCsvService";

const AddTransactionModal = lazy(() => import("./components/modals/AddTransactionModal"));
const AddCreditCardModal = lazy(() => import("./components/modals/AddCreditCardModal"));
const EditCreditCardModal = lazy(() => import("./components/modals/EditCreditCardModal"));
const ClearTransactionsModal = lazy(() => import("./components/modals/ClearTransactionsModal"));
const DeleteTransactionModal = lazy(() => import("./components/modals/DeleteTransactionModal"));
const TransactionsView = lazy(() => import("./components/transactions/TransactionsView"));
const ReportsView = lazy(() => import("./components/reports/ReportsView"));
const DashboardView = lazy(() => import("./components/dashboard/DashboardView"));

function ViewFallback({ label = "Cargando..." }) {
    return (
        <div className="px-4 md:px-8 py-10 text-sm text-slate-500 dark:text-slate-400">
            {label}
        </div>
    );
}

function App() {
    const { currentUser, logout } = useAuth();
    const {
        transactions,
        creditCards,
        spentPerCard,
        totalIngresos,
        totalGastos,
        totalPagosTarjetas,
        totalDeudaTarjetas,
        efectivoDisponible,
        patrimonioNeto,
        deudaPorcentaje,
        patrimonioPositivo,
        addTransaction,
        addCreditCard,
        updateCreditCard,
        clearAllTransactions,
        deleteTransaction,
    } = useFinance();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [activeTab, setActiveTab] = useState('panel');
    const [txSearch, setTxSearch] = useState('');
    const [txFilterType, setTxFilterType] = useState('todos');
    const [txFilterCategory, setTxFilterCategory] = useState('todas');
    const [txFilterMonth, setTxFilterMonth] = useState('todos');
    // Pagination for Recent Transactions
    const [recentPage, setRecentPage] = useState(0);
    const RECENT_PER_PAGE = 5;
    // Pagination for Transacciones tab
    const [txPage, setTxPage] = useState(0);
    const TX_PER_PAGE = 10;
    // Edit card modal
    const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);
    const [cardToEdit, setCardToEdit] = useState(null);
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
        try {
            await addTransaction(gasto);
        } catch (error) {
            console.error("Error adding transaction:", error);
        }
    };

    const handleAddCard = async (card) => {
        try {
            await addCreditCard(card);
        } catch (error) {
            console.error("Error adding card:", error);
        }
    };

    const handleUpdateCard = async (updatedData) => {
        if (!cardToEdit) return;
        try {
            await updateCreditCard(cardToEdit.id, {
                name: updatedData.name,
                lastFour: updatedData.lastFour,
                limit: parseFloat(updatedData.limit) || 0,
                initialDebt: parseFloat(updatedData.initialDebt) || 0,
                payments: parseFloat(updatedData.payments) || 0,
                manualAdjustment: parseFloat(updatedData.manualAdjustment) || 0,
                themeColor: updatedData.themeColor
            });
            console.log('Tarjeta actualizada correctamente');
        } catch (error) {
            console.error("Error updating card:", error);
        }
    };

    const handleClearAllTransactions = async () => {
        try {
            const deletedCount = await clearAllTransactions();
            console.log(`${deletedCount} transacciones eliminadas`);
            setIsClearTxModalOpen(false);
        } catch (error) {
            console.error("Error eliminando transacciones:", error);
        }
    };

    const handleDeleteTransaction = async (txId) => {
        try {
            await deleteTransaction(txId);
            console.log('Transaccion eliminada');
            setTxToDelete(null);
        } catch (error) {
            console.error("Error eliminando transaccion:", error);
        }
    };

    const downloadPDF = async () => {
        try {
            const { exportFinancialReportPdf } = await import("./services/exportPdfService");
            await exportFinancialReportPdf({
                currentUserEmail: currentUser?.email,
                totalIngresos,
                totalGastos,
                totalPagosTarjetas,
                totalDeudaTarjetas,
                efectivoDisponible,
                patrimonioNeto,
                creditCards,
                spentPerCard,
                transactions,
                calculateCardFinancialDetails,
            });
            console.log("PDF generado exitosamente");
        } catch (error) {
            console.error("Error generando PDF:", error);
        }
    };

    const exportTransactionsCSV = (rowsToExport) => {
        exportTransactionsToCsv(rowsToExport);
    };

    let saludFinancieraColor = 'emerald'; // Verde por defecto
    let saludFinancieraLabel = 'Saludable';
    let saludFinancieraIcon = 'account_balance';

    if (!patrimonioPositivo && deudaPorcentaje > 50) {
        saludFinancieraColor = 'rose'; // Rojo - Peligro
        saludFinancieraLabel = 'Peligro';
        saludFinancieraIcon = 'warning';
    } else if (!patrimonioPositivo || deudaPorcentaje > 30) {
        saludFinancieraColor = 'amber'; // Amarillo - Precaucion
        saludFinancieraLabel = 'Precaucion';
        saludFinancieraIcon = 'report_problem';
    }

    // Datos mensuales por tarjeta - ultimos 6 meses
    const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const nowDate = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - 5 + i, 1);
        return { label: MONTHS_ES[d.getMonth()], year: d.getFullYear(), month: d.getMonth() };
    });
    const activeCard = creditCards.find(c => c.id === selectedCardId) || creditCards[0];
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
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                            {activeTab === 'panel' ? 'Panel de Control' : activeTab === 'transacciones' ? 'Transacciones' : 'Reportes Financieros'}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm truncate">
                            {activeTab === 'panel' ? 'Monitoreo de crédito en tiempo real.' : activeTab === 'transacciones' ? 'Historial completo de movimientos.' : 'Análisis detallado de tus hábitos de consumo.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
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
                    <Suspense fallback={<ViewFallback label="Cargando panel..." />}>
                        <DashboardView
                            efectivoDisponible={efectivoDisponible}
                            totalIngresos={totalIngresos}
                            patrimonioNeto={patrimonioNeto}
                            saludFinancieraColor={saludFinancieraColor}
                            saludFinancieraLabel={saludFinancieraLabel}
                            saludFinancieraIcon={saludFinancieraIcon}
                            deudaPorcentaje={deudaPorcentaje}
                            totalDeudaTarjetas={totalDeudaTarjetas}
                            monthlyTotals={monthlyTotals}
                            maxMonthlyGasto={maxMonthlyGasto}
                            creditCards={creditCards}
                            spentPerCard={spentPerCard}
                            selectedCardId={selectedCardId}
                            setSelectedCardId={setSelectedCardId}
                            onAddCard={() => setIsCardModalOpen(true)}
                            onEditCard={(card) => { setCardToEdit(card); setIsEditCardModalOpen(true); }}
                            activeCard={activeCard}
                            dayTotals={dayTotals}
                            maxDayTotal={maxDayTotal}
                            chartData={chartData}
                            totalGastado={totalGastado}
                            transactions={transactions}
                            recentPage={recentPage}
                            setRecentPage={setRecentPage}
                            recentPerPage={RECENT_PER_PAGE}
                            onDownloadPdf={downloadPDF}
                            onViewAllTransactions={() => setActiveTab('transacciones')}
                        />
                    </Suspense>
                )}

                {/* ============ TRANSACCIONES ============ */}
                {activeTab === 'transacciones' && (
                    <Suspense fallback={<ViewFallback label="Cargando transacciones..." />}>
                        <TransactionsView
                            transactions={transactions}
                            txSearch={txSearch}
                            setTxSearch={setTxSearch}
                            txFilterType={txFilterType}
                            setTxFilterType={setTxFilterType}
                            txFilterCategory={txFilterCategory}
                            setTxFilterCategory={setTxFilterCategory}
                            txFilterMonth={txFilterMonth}
                            setTxFilterMonth={setTxFilterMonth}
                            txPage={txPage}
                            setTxPage={setTxPage}
                            txPerPage={TX_PER_PAGE}
                            onDownloadPdf={downloadPDF}
                            onExportCsv={exportTransactionsCSV}
                            onOpenClearAll={() => setIsClearTxModalOpen(true)}
                            onDeleteTransaction={setTxToDelete}
                        />
                    </Suspense>
                )}

                {/* ============ REPORTES ============ */}
                {activeTab === 'reportes' && (
                    <Suspense fallback={<ViewFallback label="Cargando reportes..." />}>
                        <ReportsView
                            transactions={transactions}
                            last6Months={last6Months}
                            chartData={chartData}
                            totalGastado={totalGastado}
                            efectivoDisponible={efectivoDisponible}
                            totalDeudaTarjetas={totalDeudaTarjetas}
                            creditCards={creditCards}
                        />
                    </Suspense>
                )}

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

            <Suspense fallback={null}>
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
                    spentPerCard={spentPerCard}
                    onSave={handleUpdateCard}
                />
                <ClearTransactionsModal
                    isOpen={isClearTxModalOpen}
                    transactionCount={transactions.length}
                    onClose={() => setIsClearTxModalOpen(false)}
                    onConfirm={handleClearAllTransactions}
                />
                <DeleteTransactionModal
                    transaction={txToDelete}
                    onClose={() => setTxToDelete(null)}
                    onConfirm={handleDeleteTransaction}
                />
            </Suspense>
        </div>
    );
}

export default App;
