import re

file_path = 'src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace texts via Regex or simple strings
content = content.replace('Total Available Funds', 'Fondos Totales Disponibles')
content = content.replace('Credit Card Usage', 'Uso de Tarjeta de Crédito')
content = content.replace('Spending Trends', 'Tendencias de Gastos')
content = content.replace('Weekly', 'Semanal')
content = content.replace('Monthly', 'Mensual')
content = content.replace('Expense Profile', 'Perfil de Gastos')
content = content.replace('Recent Transactions', 'Transacciones Recientes')
content = content.replace('Download Statement', 'Descargar Estado de Cuenta')
content = content.replace('Add Transaction', 'Agregar Transacción')
content = content.replace('Expense', 'Gasto')
content = content.replace('expense', 'gasto')
content = content.replace('income', 'ingreso')
content = content.replace('Deposit (Income)', 'Depósito (Ingreso)')
content = content.replace('Store / Merchant', 'Tienda / Comercio')
content = content.replace('Amount ($)', 'Monto ($)')
content = content.replace('Category', 'Categoría')
content = content.replace('Payment Method', 'Método de Pago')
content = content.replace('Cash', 'Efectivo')
content = content.replace('Debit Card', 'Tarjeta de Débito')
content = content.replace('Save Expense', 'Guardar Transacción')
content = content.replace('Food', 'Comida')
content = content.replace('Tech', 'Tecnología')
content = content.replace('Travel', 'Transporte')
content = content.replace('Housing', 'Vivienda')
content = content.replace('Misc', 'Otros')

# To fix the Total indicator logic:
content = re.sub(
    r'<span className="flex items-center gap-1 text-emerald-500 font-semibold text-sm bg-emerald-500/10 px-2 py-0\.5 rounded">[\s\S]*?<span className="material-symbols-outlined text-xs">trending_up</span>[\s\S]*?\+12\.5%[\s\S]*?</span>',
    '''{ (() => {
                                    const percentChange = ((totalAvailable - 120000) / 120000 * 100).toFixed(1);
                                    const isPositive = percentChange >= 0;
                                    return (
                                        <span className={`flex items-center gap-1 font-semibold text-sm px-2 py-0.5 rounded ${isPositive ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                                            <span className="material-symbols-outlined text-xs">{isPositive ? 'trending_up' : 'trending_down'}</span>
                                            {isPositive ? '+' : ''}{percentChange}%
                                        </span>
                                    );
                                })()}''',
    content
)

# And add Nomina
content = re.sub(
    r'<option value="Comida">Comida & Dining</option>\s*<option value="Tecnología">Technology</option>\s*<option value="Transporte">Transport & Transporte</option>\s*<option value="Vivienda">Vivienda</option>\s*<option value="Otros">Miscellaneous</option>',
    '''{type === 'gasto' ? (
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
                                    )}''',
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("SUCCESS")
