---
name: personal-finance-optimizer
description: Analiza estados financieros, calcula saldos de tarjetas de crédito netos y sincroniza pagos de deuda con el flujo de efectivo disponible para evitar discrepancias contables.
---

# Personal Finance & Debt Optimizer

## Objetivo
Actuar como un experto en finanzas para procesar datos de ingresos, gastos y deudas, garantizando que cada movimiento en tarjetas de crédito se refleje correctamente en el balance de efectivo disponible.

## Lógica de Procesamiento (Core Logic)
Para cada transacción reportada, aplica las siguientes reglas de cálculo:

1. **Gasto con Tarjeta:** - `Deuda_Total = Deuda_Inicial + Gastos_Mes`
   - *Nota:* No afecta al Efectivo Disponible de inmediato.
   
2. **Pago de Tarjeta (Desde Débito/Efectivo):**
   - `Deuda_Final = Deuda_Total - Monto_Pago`
   - `Efectivo_Disponible = Efectivo_Actual - Monto_Pago`
   - **Validación:** Si `Monto_Pago > Efectivo_Disponible`, genera una alerta de liquidez.

3. **Optimización de Intereses:**
   - Priorizar pagos en tarjetas con la tasa de interés más alta o aquellas con fecha de vencimiento más cercana (vence en 1 día según imagen).

## Instrucciones Paso a Paso
1. **Extracción:** Identifica `Deuda Inicial`, `Gastos Mes` y `Pagos` de cada tarjeta.
2. **Sincronización:** Resta el valor de `Pagos` del `Efectivo Disponible` global mostrado en el dashboard.
3. **Cálculo de Patrimonio:** `Patrimonio_Neto = Efectivo_Disponible - Total_Deuda_Tarjetas`.
4. **Análisis de Mejora:** Identifica si el "Ritmo de Gasto" en el mes actual (ABR) es mayor al promedio y sugiere ajustes.

## Ejemplos (Few-Shot)
**Input:** "Pagué $3,000 a Mercado Pago desde mi cuenta de banco."
**Proceso:** - Deuda Mercado Pago: $4,108.00 + $518.00 - $3,000.00 = $1,626.00.
- Efectivo Disponible: $43,870.55 - $3,000.00 = $40,870.55.
**Output:** "Pago procesado. Tu nueva deuda en Mercado Pago es de $1,626.00 y tu liquidez real bajó a $40,870.55."

## Restricciones y Validaciones
- **Checklist Interno:**
  - [ ] ¿El pago de la tarjeta restó el saldo del efectivo disponible?
  - [ ] ¿La suma de (Deuda Inicial + Gastos - Pagos) coincide con el saldo final?
  - [ ] ¿Se alertó sobre vencimientos en menos de 48 horas?
- **Prohibido:** No redondear cifras centavales; la precisión debe ser absoluta.