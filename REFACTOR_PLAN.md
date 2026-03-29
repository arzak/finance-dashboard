# Plan De Refactorizacion

## Objetivo

Preparar la aplicacion para cambios posteriores sin tener que seguir editando un `App.jsx` gigante ni duplicar logica entre UI, Firestore y calculos financieros.

La idea no es reescribir todo de una vez. La idea es mover el proyecto a una arquitectura modular, incremental y segura, manteniendo la app funcional durante el proceso.

## Principios

- Hacer cambios por capas, no una reescritura completa.
- Separar UI, acceso a datos y logica de negocio.
- Reducir dependencias directas de Firestore dentro de componentes visuales.
- Evitar duplicacion de calculos y operaciones CRUD.
- Dejar una estructura donde futuras modificaciones toquen pocos archivos.
- Mantener compatibilidad con los datos actuales mientras se normaliza el modelo.

## Estado Actual Resumido

- `src/App.jsx` concentra demasiadas responsabilidades:
  - listeners a Firestore
  - CRUD de transacciones y tarjetas
  - calculos financieros
  - exportacion PDF
  - filtros
  - tabs
  - modales
  - render de vistas grandes
- Existe `src/contexts/FinanceContext.jsx`, pero la app no depende todavia de el como fuente unica de verdad.
- La logica financiera esta repartida entre varios bloques.
- Hay normalizacion incompleta de tarjetas, especialmente en campos como `limit` y `limite`.
- Los modales y paneles estan embebidos en `App.jsx`, lo que vuelve costoso cualquier cambio futuro.

## Resultado Esperado

Al final del proceso deberiamos tener:

- `App.jsx` o un `AppShell` dedicado a componer vistas, no a manejar datos.
- Servicios dedicados para Firestore.
- Un `FinanceContext` o hooks especializados como unica capa de estado financiero.
- Calculos financieros centralizados en utilidades puras.
- Vistas y modales separados en componentes reutilizables.
- Exportaciones y reportes fuera del arbol principal de UI.
- Estructura suficientemente modular para agregar nuevas funciones con bajo riesgo.

## Fase 0 - Preparacion

### Objetivo

Definir una ruta de trabajo segura antes de mover piezas grandes.

### Tareas

- Documentar el plan de refactorizacion.
- Validar que el proyecto compile antes y despues de cada fase.
- Evitar mezclar refactorizacion estructural con cambios de UX o negocio en el mismo paso.
- Mantener cambios pequenos y verificables.

### Entregables

- Este documento.
- Compilacion valida al cierre de cada fase importante.

## Fase 1 - Capa De Servicios

### Objetivo

Sacar el acceso directo a Firestore de los componentes.

### Estado

Iniciada.

### Tareas

- Crear servicios dedicados para transacciones.
- Crear servicios dedicados para tarjetas.
- Mover listeners, altas, updates, pagos y borrados a esos servicios.
- Centralizar transformaciones comunes de payload.
- Dejar API clara y reutilizable.

### Archivos

- `src/services/transactionsService.js`
- `src/services/creditCardsService.js`

### Contratos Esperados

#### Transactions

- `subscribeToTransactions(userId, onData, onError)`
- `addTransaction(userId, transaction)`
- `deleteTransaction(transactionId)`
- `clearTransactions(userId)`

#### Credit Cards

- `subscribeToCreditCards(userId, onData, onError)`
- `addCreditCard(userId, card)`
- `updateCreditCard(cardId, data)`
- `addCardPayment(userId, cardId, amount)`
- `resetCreditCardMonth(cardId, nextInitialDebt)`
- `normalizeCreditCardPayload(card)`

### Beneficio

Cuando cambie la fuente de datos o se quiera agregar validacion, el impacto quedara aislado en servicios y no repartido por la UI.

## Fase 2 - Fuente Unica De Estado Financiero

### Objetivo

Hacer que la aplicacion consuma una sola capa de estado para datos financieros.

### Tareas

- Convertir `FinanceContext` en la fuente unica de verdad.
- Conectar `FinanceContext` a los servicios creados en la fase 1.
- Mover ahi listeners y operaciones async.
- Exponer estado y acciones desde el contexto.
- Envolver la app con `FinanceProvider` desde `main.jsx`.

### Archivos

- `src/contexts/FinanceContext.jsx`
- `src/main.jsx`

### API Esperada Del Contexto

- `transactions`
- `creditCards`
- `loading`
- `error`
- `addTransaction`
- `deleteTransaction`
- `clearAllTransactions`
- `addCreditCard`
- `updateCreditCard`
- `addPayment`
- `resetCardMonth`
- `spentPerCard`
- `totalIngresos`
- `totalGastos`
- `totalPagosTarjetas`
- `totalDeudaTarjetas`
- `gastosSinPagosTarjetas`
- `efectivoDisponible`
- `patrimonioNeto`

### Beneficio

La UI deja de conocer detalles de Firestore y trabaja sobre una interfaz estable.

## Fase 3 - Migracion De App.jsx A Contexto

### Objetivo

Eliminar dependencias directas de Firestore dentro de `App.jsx`.

### Tareas

- Reemplazar estado local de `transactions` y `creditCards` por `useFinance()`.
- Eliminar listeners en `App.jsx`.
- Reemplazar handlers locales por llamadas al contexto:
  - `handleAddGasto`
  - `handleAddCard`
  - `handleUpdateCard`
  - `handleAddPayment`
  - `handleDeleteTransaction`
  - `handleClearAllTransactions`
  - `handleResetCardMonth`
- Mantener `App.jsx` funcional sin cambiar aun la UI visible.

### Resultado Esperado

`App.jsx` sigue siendo grande, pero deja de ser la capa de persistencia.

### Beneficio

Reducimos el acoplamiento y abrimos el camino para partir la UI en modulos.

## Fase 4 - Extraccion De Calculos Financieros

### Objetivo

Sacar logica de negocio y calculos puros fuera del componente principal.

### Tareas

- Crear utilidades de calculo financiero.
- Mover calculos de deuda, balance y patrimonio.
- Mover agrupaciones por tarjeta, mes o categoria.
- Evitar repetir reducciones y filtros en distintos bloques.

### Archivos

- `src/utils/financeCalculations.js`
- `src/utils/transactionFilters.js`
- `src/utils/formatters.js`

### Funciones Sugeridas

- `getSpentPerCard(transactions)`
- `getTransactionTotals(transactions)`
- `getTotalCardDebt(creditCards, spentPerCard)`
- `getNetWorth({ totalIngresos, totalGastos, totalDeudaTarjetas, totalPagosTarjetas })`
- `filterTransactions(transactions, filters)`
- `groupTransactionsByMonth(transactions)`
- `formatCurrency(value)`
- `formatAppDate(value)`

### Beneficio

La logica financiera queda testeable y reutilizable sin depender de JSX.

## Fase 5 - Dividir La UI Por Vistas

### Objetivo

Reducir el tamaño y la responsabilidad de `App.jsx`.

### Tareas

- Separar la vista principal en componentes grandes por dominio.
- Dejar `App.jsx` o `AppShell.jsx` como archivo de composicion.
- Mover bloques completos de UI a vistas independientes.

### Estructura Sugerida

- `src/components/layout/AppShell.jsx`
- `src/components/dashboard/DashboardView.jsx`
- `src/components/transactions/TransactionsView.jsx`
- `src/components/reports/ReportsView.jsx`
- `src/components/cards/CreditCardsPanel.jsx`

### Beneficio

Cada area funcional podra modificarse de forma mas aislada.

## Fase 6 - Extraer Modales

### Objetivo

Sacar los formularios y dialogs grandes del componente principal.

### Tareas

- Mover cada modal a su propio archivo.
- Definir props claras y minimas.
- Reusar componentes comunes para confirmaciones.

### Archivos Sugeridos

- `src/components/modals/AddTransactionModal.jsx`
- `src/components/modals/AddCreditCardModal.jsx`
- `src/components/modals/EditCreditCardModal.jsx`
- `src/components/modals/PaymentModal.jsx`
- `src/components/modals/ConfirmDialog.jsx`

### Beneficio

Cambiar un flujo de captura ya no exigira tocar cientos de lineas del archivo principal.

## Fase 7 - Componentes Reutilizables

### Objetivo

Reducir repeticion visual y dejar una biblioteca interna de piezas reutilizables.

### Tareas

- Detectar tarjetas visuales repetidas.
- Extraer componentes comunes de metrica, seccion y estados.
- Uniformar props y patrones de uso.

### Archivos Sugeridos

- `src/components/common/SectionCard.jsx`
- `src/components/common/StatCard.jsx`
- `src/components/common/EmptyState.jsx`
- `src/components/common/LoadingState.jsx`
- `src/components/common/IconButton.jsx`

### Beneficio

La app gana consistencia y nuevos modulos pueden construirse mas rapido.

## Fase 8 - Formularios Y Validacion

### Objetivo

Separar logica de formularios de los componentes visuales.

### Tareas

- Crear hooks de formularios.
- Centralizar defaults.
- Centralizar validaciones.
- Evitar `useState` repetitivos por cada modal.

### Archivos Sugeridos

- `src/hooks/useTransactionForm.js`
- `src/hooks/useCreditCardForm.js`
- `src/utils/validators.js`

### Beneficio

Los formularios seran mas faciles de mantener y extender.

## Fase 9 - Reportes Y Exportaciones

### Objetivo

Sacar logica pesada de exportacion y serializacion fuera de la UI.

### Tareas

- Mover generacion de PDF a un servicio.
- Mover exportacion CSV a un servicio.
- Centralizar tablas, encabezados y transformaciones.

### Archivos Sugeridos

- `src/services/exportPdfService.js`
- `src/services/exportCsvService.js`

### Beneficio

Agregar nuevos reportes o formatos dejara de tocar `App.jsx`.

## Fase 10 - Constantes De Dominio

### Objetivo

Eliminar strings magicos y dejar comportamiento mas predecible.

### Tareas

- Centralizar tipos de transaccion.
- Centralizar categorias.
- Centralizar colores, iconos y temas de tarjeta.

### Archivos Sugeridos

- `src/constants/transactionTypes.js`
- `src/constants/categories.js`
- `src/constants/cardThemes.js`

### Beneficio

Cambiar nombres, labels o colores no implicara rastrear strings por toda la app.

## Fase 11 - Estructura Objetivo

### Estructura Recomendada

```text
src/
  app/
    AppShell.jsx
    routes.jsx
  components/
    common/
    layout/
    dashboard/
    transactions/
    reports/
    cards/
    modals/
  contexts/
    AuthContext.jsx
    FinanceContext.jsx
  hooks/
    useTransactionForm.js
    useCreditCardForm.js
  services/
    transactionsService.js
    creditCardsService.js
    exportPdfService.js
    exportCsvService.js
  utils/
    financeCalculations.js
    transactionFilters.js
    formatters.js
    validators.js
  constants/
    transactionTypes.js
    categories.js
    cardThemes.js
  firebase/
    client.js
```

## Orden Recomendado De Implementacion

1. Terminar servicios y contexto.
2. Migrar `App.jsx` para consumir `useFinance()`.
3. Mover calculos a utilidades.
4. Extraer modales.
5. Extraer vistas grandes.
6. Crear componentes comunes.
7. Mover exportaciones.
8. Centralizar constantes.
9. Limpiar codigo muerto y duplicado.

## Riesgos Principales

- Romper sincronizacion en tiempo real durante la migracion.
- Duplicar temporalmente logica mientras conviven la capa vieja y la nueva.
- Introducir inconsistencias si se cambia el modelo de tarjeta sin normalizacion.
- Hacer demasiados cambios a la vez y perder trazabilidad.

## Estrategia De Mitigacion

- Compilar despues de cada fase.
- Mover primero infraestructura, luego consumo.
- Evitar cambiar UI y arquitectura al mismo tiempo cuando no sea necesario.
- Mantener funciones con nombres claros y contratos pequenos.

## Criterios De Cierre

Se considerara completa la refactorizacion cuando:

- `App.jsx` deje de contener acceso directo a Firestore.
- La logica financiera este centralizada y reutilizable.
- Los modales principales vivan en archivos independientes.
- Las vistas esten separadas por dominio.
- Las exportaciones esten desacopladas de la UI.
- Los cambios futuros puedan hacerse con impacto localizado.

## Siguiente Paso Inmediato

El siguiente paso recomendado es completar la migracion de `App.jsx` para que use `FinanceContext` como fuente real de datos y acciones. Ese es el punto de mayor retorno antes de seguir con modales y vistas.
