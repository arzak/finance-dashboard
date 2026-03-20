# Prompt: Implementación de Módulo de Proyecciones Financieras

## Contexto del Proyecto
Estoy desarrollando una aplicación de finanzas personales (Dashboard) utilizando **React, Vite y Tailwind CSS**. Actualmente, el dashboard muestra el "Efectivo Disponible", "Patrimonio Neto" y el desglose de "Deuda de Tarjetas" (BBVA, Mercado Pago, Nu).

## Objetivo
Crear un nuevo componente de React llamado `FinancialProjections` que calcule y visualice proyecciones financieras basadas en los hábitos actuales de gasto y ahorro del usuario.

## Requerimientos Técnicos

### 1. Variables de Entrada (Input Data)
El componente debe recibir o calcular las siguientes variables base del estado actual:
- **Efectivo Total:** $39,830.45
- **Deuda Total Tarjetas:** $11,630.60
- **Gastos Mensuales Promedio:** (Sumatoria de los campos "Gastos Mes" de todas las tarjetas).
- **Ingreso Mensual Estimado:** (Campo editable por el usuario para calcular el ahorro).

### 2. Lógica de Cálculo (Business Logic)
Implementar las siguientes métricas de proyección:
- **Runway (Meses de Libertad):** `Efectivo Disponible / Gastos Mensuales`.
- **Patrimonio Neto Futuro:** Proyección a 6 y 12 meses usando la fórmula: 
  $$P_{futuro} = P_{actual} + ((\text{Ingresos} - \text{Gastos}) \times \text{meses})$$
- **Tasa de Liquidación:** Porcentaje del efectivo comprometido por la deuda actual.

### 3. Interfaz de Usuario (UI/UX)
- **Estética:** Mantener el estilo limpio y profesional del dashboard actual (uso de bordes redondeados, fuentes sans-serif, iconos de Lucide React).
- **Gráfico de Proyección:** Utilizar **Recharts** para mostrar una línea de crecimiento del Patrimonio Neto a lo largo del tiempo.
- **Tarjetas de Insights:** - Una tarjeta con un "Gauge Chart" o barra de progreso para el **Runway**.
    - Una sección de "Recomendación Inteligente" que cambie de color según la salud financiera (Verde: Saludable, Amarillo: Precaución, Rojo: Crítico).

## Entregables Esperados
1. Código completo del componente `FinancialProjections.jsx`.
2. Estructura de datos `mockData` para probar las proyecciones.
3. Configuración del gráfico en Recharts (ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart).
4. Estilos en Tailwind CSS que coincidan con los colores de la imagen (Verde: #22c55e, Rojo: #ef4444).

---
**Nota:** Asegúrate de que los cálculos manejen casos de borde, como cuando los gastos son mayores a los ingresos (ahorro negativo).