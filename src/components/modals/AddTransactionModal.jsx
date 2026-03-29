import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AddTransactionModal({ isOpen, onClose, onAdd, creditCards }) {
    const [store, setStore] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState("gasto");
    const [paymentMethod, setPaymentMethod] = useState("Efectivo");
    const [category, setCategory] = useState("Comida");
    const [selectedCreditCardId, setSelectedCreditCardId] = useState("");
    const [selectedPaymentCardId, setSelectedPaymentCardId] = useState("");

    const selectedCreditCard = useMemo(
        () => creditCards?.find((card) => card.id === selectedCreditCardId) || null,
        [creditCards, selectedCreditCardId],
    );

    const selectedPaymentCard = useMemo(
        () => creditCards?.find((card) => card.id === selectedPaymentCardId) || null,
        [creditCards, selectedPaymentCardId],
    );

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
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!amount) return;

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
                date: "Justo ahora",
                cardId: isCreditExpense ? selectedCreditCard.id : null,
                icon: category === "Comida" ? "restaurant" : category === "Tecnologia" ? "shopping_bag" : "credit_card",
                iconColor: category === "Comida" ? "orange" : category === "Tecnologia" ? "blue" : "purple",
            });
        } else if (type === "ingreso") {
            onAdd({
                store,
                category,
                paymentMethod: null,
                amount: parseFloat(amount),
                type,
                date: "Justo ahora",
                icon: category === "Nomina" ? "payments" : category === "Ahorro" ? "savings" : "account_balance_wallet",
                iconColor: category === "Nomina" ? "emerald" : category === "Ahorro" ? "indigo" : "blue",
            });
        } else if (type === "pago_tarjeta") {
            if (!selectedPaymentCard) return;

            onAdd({
                store: store || `Pago a ${selectedPaymentCard.name}`,
                category: "Transferencia",
                paymentMethod,
                amount: parseFloat(amount),
                type: "pago_tarjeta",
                date: "Justo ahora",
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

                            {type !== "pago_tarjeta" && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                                    <select
                                        value={category}
                                        onChange={(event) => setCategory(event.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        {type === "gasto" ? (
                                            <>
                                                <option value="Comida">Comida y Restaurantes</option>
                                                <option value="Tecnologia">Tecnologia</option>
                                                <option value="Transporte">Transporte y Viajes</option>
                                                <option value="Vivienda">Vivienda</option>
                                                <option value="Otros">Otros</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="Nomina">Nomina</option>
                                                <option value="Ahorro">Ahorro</option>
                                                <option value="Otros">Otros Ingresos</option>
                                            </>
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
