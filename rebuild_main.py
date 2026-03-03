import re

file_path = 'src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line with </aside> and the line with </div> at the end
# We'll keep everything before line 455 (</aside>\n\n) and rewrite the main section

# Find the start of main (line 455 = index 454)
main_start = None
for i, l in enumerate(lines):
    if '{/* Main Content */}' in l:
        main_start = i
        break

if main_start is None:
    print("Could not find main start")
    exit(1)

print(f"Main starts at line {main_start + 1}")

# Find the last </div> followed by ); } export default App;
# We keep part before main_start, then write new main, then closing
before_main = lines[:main_start]

# Build the new main section
new_main = '''            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark scrollbar-hide">
                <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-8 py-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {activeTab === 'panel' ? 'Panel de Control' : 'Transacciones'}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {activeTab === 'panel' ? 'Monitoreo de crédito en tiempo real y salud financiera.' : 'Historial completo de movimientos.'}
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

'''

# Now find the original panel content: from the grid div start to just before the modals
# We'll search for the original "px-8 pb-12 grid" line in the old code
# and for "</div> </main>" to get the panel body

# Strategy: find the recent panel content lines (after header, before transacciones section)
# Find original content between line ~480 (grid div) and line ~706 (where panel ends)
panel_content = []
in_panel = False
panel_end = None

# Find the grid line
for i, l in enumerate(lines[main_start:], start=main_start):
    if 'px-8 pb-12 grid grid-cols-12' in l and not in_panel:
        in_panel = True
        panel_content.append(l)
    elif in_panel:
        # Stop at the broken closing or at transacciones marker
        if '{/* ============ TRANSACCIONES' in l:
            panel_end = i
            break
        panel_content.append(l)

if not panel_content:
    print("Could not find panel content")
    exit(1)

print(f"Panel content: {len(panel_content)} lines, ends at line {panel_end + 1}")

# Clean panel_content: remove the broken closing tags at the end
# The panel should end with </div> (the grid div)
# Remove trailing broken lines
while panel_content and panel_content[-1].strip() in ['</div>', '', ')']:
    panel_content.pop()

# Add proper closing for the grid div
clean_panel = ''.join(panel_content).rstrip()
# Remove any trailing ) or }
clean_panel = clean_panel.rstrip('\r\n )}\t ')

new_main += '                {/* ============ PANEL ============ */}\n'
new_main += '                {activeTab === \'panel\' && (\n'
new_main += '                <div className="px-8 pb-12 grid grid-cols-12 gap-6 auto-rows-min mt-4">\n'

# We need the original panel widgets (stat card, cards, charts, transactions)
# Extract just the widget content (skip the outer grid div line)
widget_lines = []
found_grid = False
for l in panel_content:
    if 'px-8 pb-12 grid grid-cols-12' in l:
        found_grid = True
        continue
    if found_grid:
        widget_lines.append(l)

new_main += ''.join(widget_lines).rstrip()
new_main += '\n\n                </div>)}\n\n'

# New transacciones section
tx_section = '''                {/* ============ TRANSACCIONES ============ */}
                {activeTab === 'transacciones' && (() => {
                    const allCategories = ['todas', ...Array.from(new Set(transactions.map(t => t.category).filter(Boolean)))];
                    const allMonths = ['todos', ...Array.from(new Set(transactions.map(tx => {
                        const d = tx.createdAt && typeof tx.createdAt.toDate === 'function' ? tx.createdAt.toDate()
                            : (tx.date === 'Hoy' || tx.date === 'Justo ahora' ? new Date() : null);
                        if (!d) return null;
                        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
                    }).filter(Boolean))).sort((a,b) => b.localeCompare(a))];

                    const MONTHS_LABEL = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

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
                                const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
                                matchMonth = key === txFilterMonth;
                            } else { matchMonth = false; }
                        }
                        return matchSearch && matchType && matchCat && matchMonth;
                    });

                    const totalFiltrado = filtered.reduce((acc, tx) =>
                        tx.type === 'gasto' ? acc - parseFloat(tx.amount) : acc + parseFloat(tx.amount), 0);

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
                                        {[['todos','Todos'],['gasto','Gastos'],['ingreso','Ingresos']].map(([val, label]) => (
                                            <button key={val} onClick={() => setTxFilterType(val)}
                                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${ txFilterType === val ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700' }`}>
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
                                            return <option key={m} value={m}>{MONTHS_LABEL[parseInt(mo)-1]} {yr}</option>;
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
                                    { label: 'Total Ingresos', value: filtered.filter(t=>t.type==='ingreso').reduce((a,t)=>a+parseFloat(t.amount),0), color: 'emerald', icon: 'trending_up' },
                                    { label: 'Total Gastos', value: filtered.filter(t=>t.type==='gasto').reduce((a,t)=>a+parseFloat(t.amount),0), color: 'rose', icon: 'trending_down' },
                                    { label: 'Balance Filtrado', value: totalFiltrado, color: totalFiltrado >= 0 ? 'blue' : 'rose', icon: totalFiltrado >= 0 ? 'account_balance_wallet' : 'warning' },
                                ].map(({ label, value, color, icon }) => (
                                    <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/50 shadow-sm">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`material-symbols-outlined text-${color}-500 text-lg`}>{icon}</span>
                                            <span className="text-xs text-slate-500 font-medium">{label}</span>
                                        </div>
                                        <p className={`text-xl font-black text-${color}-500`}>${Math.abs(value).toLocaleString('en-US',{minimumFractionDigits:2})}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Lista */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        {filtered.length} transacción{filtered.length !== 1 ? 'es' : ''}
                                    </span>
                                    <button className="text-primary text-xs font-semibold hover:underline flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">download</span>
                                        Exportar
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
                                                            <p className={`font-bold text-sm ${ tx.type === 'gasto' ? 'text-rose-500' : 'text-emerald-500' }`}>
                                                                {tx.type === 'gasto' ? '-' : '+'}${parseFloat(tx.amount).toLocaleString('en-US',{minimumFractionDigits:2})}
                                                            </p>
                                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ tx.type === 'gasto' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' }`}>
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

            </main>
'''

# Find the closing section (AddTransactionModal and beyond)
closing = []
in_closing = False
for i, l in enumerate(lines):
    if '<AddTransactionModal' in l:
        in_closing = True
    if in_closing:
        closing.append(l)

if not closing:
    print("Could not find closing section")
    exit(1)

print(f"Closing section: {len(closing)} lines")

# Reconstruct file
new_content = ''.join(before_main) + new_main + tx_section + '\n            ' + ''.join(closing)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("SUCCESS - File rebuilt!")
