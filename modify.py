import re

file_path = 'src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    '"expense"': '"gasto"',
    "'expense'": "'gasto'",
    '"income"': '"ingreso"',
    "'income'": "'ingreso'",
    '"Tech"': '"Tecnología"',
    "'Tech'": "'Tecnología'",
    '"Food"': '"Comida"',
    "'Food'": "'Comida'",
    '"Travel"': '"Transporte"',
    "'Travel'": "'Transporte'",
    '"Housing"': '"Vivienda"',
    "'Housing'": "'Vivienda'",
    '"Misc"': '"Otros"',
    "'Misc'": "'Otros'",
    'Add Transaction': 'Agregar Transacción',
    'Expense': 'Gasto',
    'Deposit (Income)': 'Depósito (Ingreso)',
    'Store / Merchant': 'Tienda / Comercio',
    'Source': 'Fuente',
    'Amount ($)': 'Monto ($)',
    'e.g. Starbucks': 'ej. Starbucks',
    'Category': 'Categoría',
    'Food & Dining': 'Comida y Restaurantes',
    'Technology': 'Tecnología',
    'Transport & Travel': 'Transporte y Viajes',
    'Housing': 'Vivienda',
    'Miscellaneous': 'Otros',
    'Payment Method': 'Método de Pago',
    'Cash': 'Efectivo',
    'Debit Card': 'Tarjeta de Débito',
    'Save Expense': 'Guardar Transacción',
    'Add Credit Card': 'Agregar Tarjeta de Crédito',
    'Card Name': 'Nombre de Tarjeta',
    'Last 4 Digits': 'Últimos 4 Dígitos',
    'Limit ($)': 'Límite ($)',
    'Card Color': 'Color de Tarjeta',
    'Add Card': 'Agregar Tarjeta',
    'Dashboard': 'Panel',
    'Transactions': 'Transacciones',
    'Budgets': 'Presupuestos',
    'Reports': 'Reportes',
    'Executive Account': 'Cuenta Ejecutiva',
    'Credit & Expense Dashboard': 'Panel de Crédito y Gastos',
    'Real-time credit monitoring and financial health.': 'Monitoreo de crédito en tiempo real y salud financiera.',
    'Quick Add': 'Agregar Rápido',
    'Total Available Funds': 'Fondos Totales Disponibles',
    'Credit Card Usage': 'Uso de Tarjeta de Crédito',
    'of $': 'de $',
    ' limit': ' límite',
    'Spending Trends': 'Tendencias de Gastos',
    'Weekly': 'Semanal',
    'Monthly': 'Mensual',
    'Expense Profile': 'Perfil de Gastos',
    'Add expenses to see breakdown': 'Agrega gastos para ver desglose',
    'Recent Transactions': 'Transacciones Recientes',
    'Download Statement': 'Descargar Estado de Cuenta',
    'Apple Store': 'Apple Store',
    'Salary Deposit': 'Depósito de Nómina',
    'The Coffee House': 'La Cafetería',
    'Today': 'Hoy',
    'Just now': 'Justo ahora',
    'Spent': 'Gastado'
}

for k, v in replacements.items():
    content = content.replace(k, v)

# Update transaction icon color logic to include Nomina
content = content.replace('category === "Comida" ? "orange" : category === "Tecnología" ? "blue" : "purple"', 'category === "Comida" ? "orange" : category === "Tecnología" ? "blue" : category === "Nómina" ? "emerald" : "purple"')
content = content.replace('category === "Comida" ? "restaurant" : category === "Tecnología" ? "shopping_bag" : "credit_card"', 'category === "Comida" ? "restaurant" : category === "Tecnología" ? "shopping_bag" : category === "Nómina" ? "payments" : "credit_card"')

# Update select to include nomina for ingresos
old_select = '''                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        <option value="Comida">Comida y Restaurantes</option>
                                        <option value="Tecnología">Tecnología</option>
                                        <option value="Transporte">Transporte y Viajes</option>
                                        <option value="Vivienda">Vivienda</option>
                                        <option value="Otros">Otros</option>
                                    </select>'''
new_select = '''                                    <select
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
                                    </select>'''
content = content.replace(old_select, new_select)

old_cat_state = 'const [category, setCategory] = useState("Comida");'
new_cat_state = '''const [category, setCategory] = useState("Comida");
    useEffect(() => {
        if (type === "ingreso") setCategory("Nómina");
        else setCategory("Comida");
    }, [type]);'''
content = content.replace(old_cat_state, new_cat_state)

old_ind = '''                            <div className="flex justify-between items-start mb-4">
                                <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider text-xs">Fondos Totales Disponibles</span>
                                <span className="flex items-center gap-1 text-emerald-500 font-semibold text-sm bg-emerald-500/10 px-2 py-0.5 rounded">
                                    <span className="material-symbols-outlined text-xs">trending_up</span>
                                    +12.5%
                                </span>
                            </div>'''
new_ind = '''                            <div className="flex justify-between items-start mb-4">
                                <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider text-xs">Fondos Totales Disponibles</span>
                                { (() => {
                                    const percentChange = ((totalAvailable - 120000) / 120000 * 100).toFixed(1);
                                    const isPositive = percentChange >= 0;
                                    return (
                                        <span className={`flex items-center gap-1 font-semibold text-sm px-2 py-0.5 rounded ${isPositive ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                                            <span className="material-symbols-outlined text-xs">{isPositive ? 'trending_up' : 'trending_down'}</span>
                                            {isPositive ? '+' : ''}{percentChange}%
                                        </span>
                                    );
                                })()}
                            </div>'''
content = content.replace(old_ind, new_ind)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Replaced successfully')
