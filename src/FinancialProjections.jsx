import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  PiggyBank,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  CreditCard
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

/**
 * FinancialProjections Component
 * 
 * Calcula y visualiza proyecciones financieras basadas en hábitos de gasto y ahorro.
 * 
 * @param {number} efectivoTotal - Efectivo disponible actual
 * @param {number} deudaTotalTarjetas - Deuda total de tarjetas de crédito
 * @param {number} gastosMensualesPromedio - Gastos mensuales promedio
 * @param {number} ingresoMensualEstimado - Ingreso mensual estimado (editable)
 */
function FinancialProjections({
  efectivoTotal = 0,
  deudaTotalTarjetas = 0,
  gastosMensualesPromedio = 0,
  ingresoMensualEstimado: initialIngresoEstimado = 0
}) {
  const [ingresoMensualEstimado, setIngresoMensualEstimado] = useState(
    initialIngresoEstimado || 0
  );

  // ============================================
  // CÁLCULOS DE MÉTRICAS FINANCIERAS
  // ============================================

  // Runway (Meses de Libertad) = Efectivo Disponible / Gastos Mensuales
  const runway = useMemo(() => {
    if (gastosMensualesPromedio <= 0) return 0;
    return efectivoTotal / gastosMensualesPromedio;
  }, [efectivoTotal, gastosMensualesPromedio]);

  // Ahorro Mensual = Ingresos - Gastos
  const ahorroMensual = useMemo(() => {
    return ingresoMensualEstimado - gastosMensualesPromedio;
  }, [ingresoMensualEstimado, gastosMensualesPromedio]);

  // Patrimonio Neto Actual = Efectivo - Deuda
  const patrimonioNetoActual = useMemo(() => {
    return efectivoTotal - deudaTotalTarjetas;
  }, [efectivoTotal, deudaTotalTarjetas]);

  // Proyección de Patrimonio Neto a 6 y 12 meses
  // P_futuro = P_actual + ((Ingresos - Gastos) × meses)
  const proyecciones = useMemo(() => {
    const meses = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    return meses.map((mes) => ({
      mes,
      label: mes === 0 ? "Actual" : `+${mes}m`,
      patrimonio: patrimonioNetoActual + (ahorroMensual * mes),
      ahorroAcumulado: ahorroMensual * mes
    }));
  }, [patrimonioNetoActual, ahorroMensual]);

  const patrimonio6Meses = proyecciones[6].patrimonio;
  const patrimonio12Meses = proyecciones[12].patrimonio;

  // Tasa de Liquidación = (Deuda / Efectivo) × 100
  // Porcentaje del efectivo comprometido por la deuda
  const tasaLiquidacion = useMemo(() => {
    if (efectivoTotal <= 0) return 0;
    return (deudaTotalTarjetas / efectivoTotal) * 100;
  }, [deudaTotalTarjetas, efectivoTotal]);

  // ============================================
  // EVALUACIÓN DE SALUD FINANCIERA
  // ============================================

  const saludFinanciera = useMemo(() => {
    // Determinar estado de salud financiera
    let estado = "saludable"; // verde
    let mensaje = "";
    let recomendacion = "";

    const ahorroNegativo = ahorroMensual < 0;
    const runwayBajo = runway < 3;
    const deudaAlta = tasaLiquidacion > 50;

    if (ahorroNegativo || (runwayBajo && deudaAlta)) {
      estado = "critico";
      mensaje = "Situación Crítica";
      recomendacion = ahorroNegativo
        ? "Tus gastos superan tus ingresos. Revisa tu presupuesto inmediatamente y reduce gastos innecesarios."
        : "Tu deuda es muy alta en relación a tu efectivo. Considera consolidar deudas o aumentar ingresos.";
    } else if (runwayBajo || deudaAlta || ahorroMensual < gastosMensualesPromedio * 0.2) {
      estado = "precaucion";
      mensaje = "Zona de Precaución";
      recomendacion = runwayBajo
        ? `Tu runway de ${runway.toFixed(1)} meses es bajo. Intenta aumentar tu fondo de emergencia a al menos 3-6 meses de gastos.`
        : "Tu tasa de liquidación es alta. Prioriza el pago de deudas antes de hacer nuevas inversiones.";
    } else {
      estado = "saludable";
      mensaje = "Finanzas Saludables";
      recomendacion = "¡Excelente trabajo! Mantén tu disciplina financiera. Considera invertir tu excedente para maximizar rendimientos.";
    }

    return { estado, mensaje, recomendacion };
  }, [ahorroMensual, runway, tasaLiquidacion, gastosMensualesPromedio]);

  // ============================================
  // DATOS PARA GRÁFICOS
  // ============================================

  // Datos para el gráfico de proyección de patrimonio
  const chartData = proyecciones;

  // Datos para el gráfico de distribución de deuda
  const deudaData = useMemo(() => [
    { name: "Efectivo", value: Math.max(0, efectivoTotal - deudaTotalTarjetas), color: "#22c55e" },
    { name: "Deuda", value: deudaTotalTarjetas, color: "#ef4444" }
  ], [efectivoTotal, deudaTotalTarjetas]);

  // ============================================
  // UTILIDADES DE FORMATO
  // ============================================

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("es-MX", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  };

  // ============================================
  // CUSTOM TOOLTIP PARA GRÁFICOS
  // ============================================

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            {label === "Actual" ? "Momento Actual" : `Mes ${label}`}
          </p>
          <p className="text-sm font-bold text-primary">
            {formatCurrency(data.patrimonio)}
          </p>
          {data.ahorroAcumulado !== 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ahorro acumulado: {formatCurrency(data.ahorroAcumulado)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header con input de ingreso mensual */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 border border-slate-100 dark:border-slate-800/50 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              Proyecciones Financieras
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Basado en tus hábitos actuales de gasto y ahorro
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
              <DollarSign className="size-3 inline-block -mt-0.5" />
              Ingreso Mensual Estimado:
            </label>
            <input
              type="number"
              value={ingresoMensualEstimado || ""}
              onChange={(e) => setIngresoMensualEstimado(parseFloat(e.target.value) || 0)}
              className="w-32 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Runway (Meses de Libertad) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-12 md:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 border border-slate-100 dark:border-slate-800/50 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Calendar className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Runway
                </h4>
                <p className="text-[10px] text-slate-400">Meses de libertad</p>
              </div>
            </div>
            <span className={`text-2xl md:text-3xl font-black ${runway >= 6 ? "text-emerald-500" : runway >= 3 ? "text-amber-500" : "text-rose-500"}`}>
              {formatNumber(runway)}
            </span>
          </div>

          {/* Barra de progreso del Runway */}
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-500">Objetivo: 6 meses</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {Math.min((runway / 6) * 100, 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((runway / 6) * 100, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${runway >= 6 ? "bg-emerald-500" : runway >= 3 ? "bg-amber-500" : "bg-rose-500"}`}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {formatCurrency(efectivoTotal)} / {formatCurrency(gastosMensualesPromedio)} gastos mensuales
            </p>
          </div>
        </motion.div>

        {/* Patrimonio Neto Futuro (6 meses) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-12 md:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 border border-slate-100 dark:border-slate-800/50 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <PiggyBank className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Patrimonio +6m
                </h4>
                <p className="text-[10px] text-slate-400">Proyección a 6 meses</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xl md:text-2xl font-black ${patrimonio6Meses >= patrimonioNetoActual ? "text-emerald-500" : "text-rose-500"}`}>
                {formatCurrency(patrimonio6Meses)}
              </span>
              <div className="flex items-center justify-end gap-1 mt-1">
                {patrimonio6Meses >= patrimonioNetoActual ? (
                  <TrendingUp className="size-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="size-3 text-rose-500" />
                )}
                <span className={`text-xs font-semibold ${patrimonio6Meses >= patrimonioNetoActual ? "text-emerald-500" : "text-rose-500"}`}>
                  {formatCurrency(patrimonio6Meses - patrimonioNetoActual)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Actual:</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {formatCurrency(patrimonioNetoActual)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-slate-500">Ahorro mensual:</span>
              <span className={`text-sm font-bold ${ahorroMensual >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {ahorroMensual >= 0 ? "+" : ""}{formatCurrency(ahorroMensual)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Tasa de Liquidación */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-12 md:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 border border-slate-100 dark:border-slate-800/50 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-xl bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center">
                <CreditCard className="size-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tasa de Liquidación
                </h4>
                <p className="text-[10px] text-slate-400">Efectivo comprometido</p>
              </div>
            </div>
            <span className={`text-2xl md:text-3xl font-black ${tasaLiquidacion <= 30 ? "text-emerald-500" : tasaLiquidacion <= 50 ? "text-amber-500" : "text-rose-500"}`}>
              {formatNumber(tasaLiquidacion)}%
            </span>
          </div>

          {/* Gauge Chart simplificado */}
          <div className="mt-4">
            <div className="relative h-4 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full overflow-hidden">
              <motion.div
                initial={{ left: "0%" }}
                animate={{ left: `${Math.min(tasaLiquidacion, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute top-0 size-3 bg-white border-2 border-slate-900 rounded-full -translate-x-1/2 shadow-lg"
                style={{ top: "50%", transform: "translate(-50%, -50%)" }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2 text-slate-500">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
              {formatCurrency(deudaTotalTarjetas)} de {formatCurrency(efectivoTotal)} comprometidos
            </p>
          </div>
        </motion.div>
      </div>

      {/* Gráfico de Proyección de Patrimonio Neto */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 border border-slate-100 dark:border-slate-800/50 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              Proyección de Crecimiento del Patrimonio
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Patrimonio actual: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(patrimonioNetoActual)}</span>
            </p>
          </div>
          <div className="hidden md:flex gap-4">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-primary" />
              <span className="text-xs font-medium text-slate-500">Patrimonio</span>
            </div>
          </div>
        </div>

        <div className="h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#135bec" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#135bec" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="patrimonio"
                stroke="#135bec"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPatrimonio)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Resumen de proyecciones */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Actual</p>
            <p className={`text-sm md:text-base font-bold ${patrimonioNetoActual >= 0 ? "text-slate-900 dark:text-white" : "text-rose-500"}`}>
              {formatCurrency(patrimonioNetoActual)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">+6 Meses</p>
            <p className={`text-sm md:text-base font-bold ${patrimonio6Meses >= patrimonioNetoActual ? "text-emerald-500" : "text-rose-500"}`}>
              {formatCurrency(patrimonio6Meses)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">+12 Meses</p>
            <p className={`text-sm md:text-base font-bold ${patrimonio12Meses >= patrimonioNetoActual ? "text-emerald-500" : "text-rose-500"}`}>
              {formatCurrency(patrimonio12Meses)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Recomendación Inteligente */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`rounded-2xl p-4 md:p-6 border shadow-sm ${
          saludFinanciera.estado === "saludable"
            ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
            : saludFinanciera.estado === "precaucion"
            ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
            : "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800"
        }`}
      >
        <div className="flex items-start gap-4">
          <div className={`size-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            saludFinanciera.estado === "saludable"
              ? "bg-emerald-100 dark:bg-emerald-900/30"
              : saludFinanciera.estado === "precaucion"
              ? "bg-amber-100 dark:bg-amber-900/30"
              : "bg-rose-100 dark:bg-rose-900/30"
          }`}>
            {saludFinanciera.estado === "saludable" ? (
              <CheckCircle className="size-6 text-emerald-600 dark:text-emerald-400" />
            ) : saludFinanciera.estado === "precaucion" ? (
              <AlertTriangle className="size-6 text-amber-600 dark:text-amber-400" />
            ) : (
              <AlertCircle className="size-6 text-rose-600 dark:text-rose-400" />
            )}
          </div>
          <div className="flex-1">
            <h4 className={`text-sm md:text-base font-bold mb-2 ${
              saludFinanciera.estado === "saludable"
                ? "text-emerald-800 dark:text-emerald-300"
                : saludFinanciera.estado === "precaucion"
                ? "text-amber-800 dark:text-amber-300"
                : "text-rose-800 dark:text-rose-300"
            }`}>
              {saludFinanciera.mensaje}
            </h4>
            <p className={`text-xs md:text-sm ${
              saludFinanciera.estado === "saludable"
                ? "text-emerald-700 dark:text-emerald-400"
                : saludFinanciera.estado === "precaucion"
                ? "text-amber-700 dark:text-amber-400"
                : "text-rose-700 dark:text-rose-400"
            }`}>
              {saludFinanciera.recomendacion}
            </p>

            {/* Métricas clave */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className={`p-3 rounded-xl ${
                saludFinanciera.estado === "saludable"
                  ? "bg-emerald-100 dark:bg-emerald-900/20"
                  : saludFinanciera.estado === "precaucion"
                  ? "bg-amber-100 dark:bg-amber-900/20"
                  : "bg-rose-100 dark:bg-rose-900/20"
              }`}>
                <p className="text-[10px] uppercase font-semibold opacity-70">Ahorro Mensual</p>
                <p className={`text-sm font-bold ${ahorroMensual >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {ahorroMensual >= 0 ? "+" : ""}{formatCurrency(ahorroMensual)}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${
                saludFinanciera.estado === "saludable"
                  ? "bg-emerald-100 dark:bg-emerald-900/20"
                  : saludFinanciera.estado === "precaucion"
                  ? "bg-amber-100 dark:bg-amber-900/20"
                  : "bg-rose-100 dark:bg-rose-900/20"
              }`}>
                <p className="text-[10px] uppercase font-semibold opacity-70">Runway</p>
                <p className={`text-sm font-bold ${runway >= 6 ? "text-emerald-600 dark:text-emerald-400" : runway >= 3 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {formatNumber(runway)} meses
                </p>
              </div>
              <div className={`p-3 rounded-xl ${
                saludFinanciera.estado === "saludable"
                  ? "bg-emerald-100 dark:bg-emerald-900/20"
                  : saludFinanciera.estado === "precaucion"
                  ? "bg-amber-100 dark:bg-amber-900/20"
                  : "bg-rose-100 dark:bg-rose-900/20"
              }`}>
                <p className="text-[10px] uppercase font-semibold opacity-70">Tasa Liquidación</p>
                <p className={`text-sm font-bold ${tasaLiquidacion <= 30 ? "text-emerald-600 dark:text-emerald-400" : tasaLiquidacion <= 50 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {formatNumber(tasaLiquidacion)}%
                </p>
              </div>
              <div className={`p-3 rounded-xl ${
                saludFinanciera.estado === "saludable"
                  ? "bg-emerald-100 dark:bg-emerald-900/20"
                  : saludFinanciera.estado === "precaucion"
                  ? "bg-amber-100 dark:bg-amber-900/20"
                  : "bg-rose-100 dark:bg-rose-900/20"
              }`}>
                <p className="text-[10px] uppercase font-semibold opacity-70">Patrimonio +12m</p>
                <p className={`text-sm font-bold ${patrimonio12Meses >= patrimonioNetoActual ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {formatCurrency(patrimonio12Meses)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default FinancialProjections;
