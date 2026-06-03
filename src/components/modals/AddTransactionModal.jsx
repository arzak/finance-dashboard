import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../../constants/transactionCategories";

const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

export default function AddTransactionModal({
    isOpen,
    onClose,
    onAdd,
    creditCards,
    efectivoDisponible = 0,
}) {
    const [store, setStore] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState("gasto");
    const [paymentMethod, setPaymentMethod] = useState("Efectivo");
    const [category, setCategory] = useState("Comida");
    const [selectedCreditCardId, setSelectedCreditCardId] = useState("");
    const [selectedPaymentCardId, setSelectedPaymentCardId] = useState("");
    const [date, setDate] = useState(getTodayString());

    const expenseCategoryLabels = {
        Comida: "Comida y Restaurantes",
        Tecnología: "Tecnología",
        Telefonía: "Telefonía",
        Transporte: "Transporte y Viajes",
        Vivienda: "Vivienda",
        Salud: "Salud",
        Medicamentos: "Medicamentos",
        Pensiones: "Pensiones",
        Otros: "Otros",
    };

    const incomeCategoryLabels = {
        Nomina: "Nomina",
        Ahorro: "Ahorro",
        Otros: "Otros Ingresos",
    };

    const selectedCreditCard = useMemo(
        () => creditCards?.find((card) => card.id === selectedCreditCardId) || null,
        [creditCards, selectedCreditCardId],
    );

    const selectedPaymentCard = useMemo(
        () => creditCards?.find((card) => card.id === selectedPaymentCardId) || null,
        [creditCards, selectedPaymentCardId],
    );
    const paymentAmount = parseFloat(amount) || 0;
    const hasLiquidityWarning = type === "pago_tarjeta" && paymentAmount > efectivoDisponible;
    const liquidityShortfall = Math.max(paymentAmount - efectivoDisponible, 0);

    useEffect(() => {
        if (type === "ingreso") {
            setCategory("Nomina");
            return;
        }

        if (type === "pago_tarjeta") {
            setCategory("Transferencia");
            setPaymentMethod("Efectivo");
            setSelectedPaymentCardId((current) => current || creditCards?.[0]?.id || "");
            return;
        }

        setCategory("Comida");
    }, [type, creditCards]);

    useEffect(() => {
        if (type !== "gasto") {
            return;
        }

        if (paymentMethod === "Tarjeta de Credito") {
            setSelectedCreditCardId((current) => current || creditCards?.[0]?.id || "");
        }
    }, [paymentMethod, type, creditCards]);

    const resetForm = () => {
        setStore("");
        setAmount("");
        setType("gasto");
        setPaymentMethod("Efectivo");
        setCategory("Comida");
        setSelectedCreditCardId("");
        setSelectedPaymentCardId("");
        setDate(getTodayString());
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!amount) return;

        const getCategoryIconAndColor = (cat, txType) => {
            if (txType === "ingreso") {
                switch (cat) {
                    case "Nomina": return { icon: "payments", color: "emerald" };
                    case "Ahorro": return { icon: "savings", color: "indigo" };
                    default: return { icon: "account_balance_wallet", color: "blue" };
                }
            }
            switch (cat) {
                case "Comida": return { icon: "restaurant", color: "orange" };
                case "Tecnología": return { icon: "devices", color: "blue" };
                case "Telefonía": return { icon: "phone_iphone", color: "indigo" };
                case "Transporte": return { icon: "directions_car", color: "purple" };
                case "Vivienda": return { icon: "home", color: "emerald" };
                case "Salud": return { icon: "medical_services", color: "rose" };
                case "Medicamentos": return { icon: "pill", color: "teal" };
                case "Pensiones": return { icon: "account_balance", color: "amber" };
                default: return { icon: "shopping_bag", color: "slate" };
            }
        };

        const { icon, color: iconColor } = getCategoryIconAndColor(category, type);

        if (type === "gasto") {
            const isCreditExpense = paymentMethod === "Tarjeta de Credito";
            if (isCreditExpense && !selectedCreditCard) return;

            const finalPaymentMethod = isCreditExpense ? selectedCreditCard.name : paymentMethod;

            onAdd({
                store,
                category,
                paymentMethod: finalPaymentMethod,
                amount: parseFloat(amount),
                type,
                date: date,
                customDate: date,
                cardId: isCreditExpense ? selectedCreditCard.id : null,
                icon,
                iconColor,
            });
        } else if (type === "ingreso") {
            onAdd({
                store,
                category,
                paymentMethod: null,
                amount: parseFloat(amount),
                type,
                date: date,
                customDate: date,
                icon,
                iconColor,
            });
        } else if (type === "pago_tarjeta") {
            if (!selectedPaymentCard) return;
            if (hasLiquidityWarning) {
                const confirmed = window.confirm(
                    `Este pago excede tu efectivo disponible por $${liquidityShortfall.toFixed(2)} y dejara tu liquidez en negativo. ¿Deseas registrarlo de todos modos?`,
                );

                if (!confirmed) {
                    return;
                }
            }

            onAdd({
                store: store || `Pago a ${selectedPaymentCard.name}`,
                category: "Transferencia",
                paymentMethod,
                amount: parseFloat(amount),
                type: "pago_tarjeta",
                date: date,
                customDate: date,
                cardId: selectedPaymentCard.id,
                icon: "payments",
                iconColor: "emerald",
            });
        }

        resetForm();
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
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Agregar Transaccion</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-6">
                            <button
                                onClick={() => setType("gasto")}
                                className={`py-1.5 text-sm font-semibold rounded-md transition-colors ${type === "gasto" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-500"}`}
                            >
                                Gasto
                            </button>
                            <button
                                onClick={() => setType("ingreso")}
                                className={`py-1.5 text-sm font-semibold rounded-md transition-colors ${type === "ingreso" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-500"}`}
                            >
                                Ingreso
                            </button>
                            <button
                                onClick={() => setType("pago_tarjeta")}
                                className={`py-1.5 text-sm font-semibold rounded-md transition-colors ${type === "pago_tarjeta" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-500"}`}
                            >
                                Pago Tarjeta
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {type === "gasto" ? "Tienda / Comercio" : type === "ingreso" ? "Fuente" : "Descripcion"}
                                </label>
                                <input
                                    type="text"
                                    value={store}
                                    onChange={(event) => setStore(event.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder={type === "pago_tarjeta" ? "ej. Pago BBVA" : "ej. Starbucks"}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monto ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(event) => setAmount(event.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(event) => setDate(event.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    required
                                />
                            </div>

                            {type !== "pago_tarjeta" && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                                    <select
                                        value={category}
                                        onChange={(event) => setCategory(event.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        {type === "gasto" ? (
                                            EXPENSE_CATEGORIES.map((option) => (
                                                <option key={option} value={option}>{expenseCategoryLabels[option] || option}</option>
                                            ))
                                        ) : (
                                            INCOME_CATEGORIES.map((option) => (
                                                <option key={option} value={option}>{incomeCategoryLabels[option] || option}</option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            )}

                            {type === "gasto" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Metodo de Pago</label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(event) => setPaymentMethod(event.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        >
                                            <option value="Efectivo">Efectivo</option>
                                            <option value="Tarjeta de Debito">Tarjeta de Debito</option>
                                            <option value="Tarjeta de Credito">Tarjeta de Credito</option>
                                        </select>
                                    </div>
                                    {paymentMethod === "Tarjeta de Credito" && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tarjeta de Credito</label>
                                            <select
                                                value={selectedCreditCardId}
                                                onChange={(event) => setSelectedCreditCardId(event.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                required
                                            >
                                                {creditCards?.map((card) => (
                                                    <option key={card.id} value={card.id}>
                                                        {card.name} (**** {card.lastFour})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}

                            {type === "pago_tarjeta" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tarjeta a Pagar</label>
                                        <select
                                            value={selectedPaymentCardId}
                                            onChange={(event) => setSelectedPaymentCardId(event.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            required
                                        >
                                            {creditCards?.map((card) => (
                                                <option key={card.id} value={card.id}>
                                                    {card.name} (**** {card.lastFour})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Metodo de Pago</label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(event) => setPaymentMethod(event.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        >
                                            <option value="Efectivo">Efectivo</option>
                                            <option value="Tarjeta de Debito">Tarjeta de Debito</option>
                                        </select>
                                    </div>
                                    {hasLiquidityWarning && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                            Este pago supera tu efectivo disponible por ${liquidityShortfall.toFixed(2)}.
                                            Tu liquidez estimada quedaria en ${(efectivoDisponible - paymentAmount).toFixed(2)}.
                                        </div>
                                    )}
                                </>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary/30 mt-6"
                            >
                                Guardar Transaccion
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
