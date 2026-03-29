import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { formatLongSpanishDate, formatNumericDate } from "../utils/formatters";

export async function exportFinancialReportPdf({
    currentUserEmail,
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
}) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(19, 90, 236);
    doc.rect(0, 0, pageWidth, 25, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("ESTADO DE CUENTA", pageWidth / 2, 12, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const today = formatLongSpanishDate(new Date());
    doc.text(`Fecha de emision: ${today}`, pageWidth / 2, 19, { align: "center" });

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(`Usuario: ${currentUserEmail || "N/A"}`, 14, 32);

    let yPos = 40;

    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPos - 5, pageWidth - 28, 8, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMEN FINANCIERO", 18, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const summaryData = [
        ["Total Ingresos", `$${totalIngresos.toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
        ["Total Gastos", `$${totalGastos.toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
        ["Pagos a Tarjetas", `$${totalPagosTarjetas.toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
        ["Efectivo Disponible", `$${efectivoDisponible.toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
        ["Deuda Total Tarjetas", `-$${totalDeudaTarjetas.toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
        ["Patrimonio Neto", `$${patrimonioNeto.toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
    ];

    autoTable(doc, {
        startY: yPos,
        head: [["Concepto", "Monto"]],
        body: summaryData,
        theme: "striped",
        headStyles: { fillColor: [19, 90, 236], textColor: 255, font: "helvetica", fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
        columnStyles: {
            0: { cellWidth: "auto", font: "helvetica", fontStyle: "normal" },
            1: { cellWidth: 50, halign: "right", font: "helvetica", fontStyle: "bold" },
        },
    });

    yPos = doc.lastAutoTable.finalY + 15;

    if (creditCards.length > 0) {
        if (yPos > 200) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFillColor(240, 240, 240);
        doc.rect(14, yPos - 5, pageWidth - 28, 8, "F");
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("TARJETAS DE CREDITO", 18, yPos);

        yPos += 10;

        const cardsData = creditCards.map((card) => {
            const {
                initialDebt,
                payments,
                totalGastosMes,
                totalDebt,
            } = calculateCardFinancialDetails(card, spentPerCard);
            const cardLimit = card.limit || card["límite"] || 0;
            const percentUsed = cardLimit > 0 ? Math.min((totalDebt / cardLimit) * 100, 100) : 0;

            return [
                `${card.name} (****${card.lastFour})`,
                `$${initialDebt.toFixed(2)}`,
                `$${totalGastosMes.toFixed(2)}`,
                `$${payments.toFixed(2)}`,
                `-$${totalDebt.toFixed(2)}`,
                `$${cardLimit.toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
                `${percentUsed.toFixed(0)}%`,
            ];
        });

        autoTable(doc, {
            startY: yPos,
            head: [["Tarjeta", "Deuda Inicial", "Gastos Mes", "Pagos", "Deuda Total", "Limite", "Uso"]],
            body: cardsData,
            theme: "striped",
            headStyles: { fillColor: [19, 90, 236], textColor: 255, font: "helvetica", fontStyle: "bold", fontSize: 8 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: 14, right: 14 },
            tableWidth: pageWidth - 28,
            columnStyles: {
                0: { cellWidth: 50, font: "helvetica" },
                1: { cellWidth: 25, halign: "right", font: "helvetica" },
                2: { cellWidth: 25, halign: "right", font: "helvetica" },
                3: { cellWidth: 20, halign: "right", font: "helvetica" },
                4: { cellWidth: 25, halign: "right", font: "helvetica", fontStyle: "bold" },
                5: { cellWidth: 25, halign: "right", font: "helvetica" },
                6: { cellWidth: 20, halign: "right", font: "helvetica" },
            },
            fontSize: 8,
        });

        yPos = doc.lastAutoTable.finalY + 15;
    }

    if (yPos > 180) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPos - 5, pageWidth - 28, 8, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TRANSACCIONES", 18, yPos);

    yPos += 10;

    const transactionsData = transactions.map((transaction) => {
        const transactionDate = transaction.createdAt && typeof transaction.createdAt.toDate === "function"
            ? formatNumericDate(transaction.createdAt.toDate())
            : transaction.date || "";

        const amount = transaction.type === "ingreso"
            ? `+$${parseFloat(transaction.amount).toFixed(2)}`
            : `-$${parseFloat(transaction.amount).toFixed(2)}`;
        const typeLabel = transaction.type === "gasto"
            ? "Gasto"
            : transaction.type === "pago_tarjeta"
                ? "Pago"
                : "Ingreso";

        return [
            transactionDate,
            transaction.store,
            transaction.category,
            transaction.paymentMethod || "-",
            typeLabel,
            amount,
        ];
    });

    autoTable(doc, {
        startY: yPos,
        head: [["Fecha", "Descripcion", "Categoria", "Metodo", "Tipo", "Monto"]],
        body: transactionsData,
        theme: "striped",
        headStyles: { fillColor: [19, 90, 236], textColor: 255, font: "helvetica", fontStyle: "bold", fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
        tableWidth: pageWidth - 28,
        columnStyles: {
            0: { cellWidth: 20, fontSize: 7, font: "helvetica" },
            1: { cellWidth: "auto", fontSize: 8, font: "helvetica" },
            2: { cellWidth: 25, fontSize: 7, font: "helvetica" },
            3: { cellWidth: 30, fontSize: 7, font: "helvetica" },
            4: { cellWidth: 18, halign: "center", fontSize: 7, font: "helvetica" },
            5: { cellWidth: 25, halign: "right", fontSize: 8, font: "helvetica" },
        },
        styles: { overflow: "linebreak" },
        didParseCell: (data) => {
            if (data.section === "body" && data.column.index === 5) {
                if (data.cell.raw.startsWith("-")) {
                    data.cell.styles.textColor = [244, 63, 94];
                    data.cell.styles.fontStyle = "bold";
                } else {
                    data.cell.styles.textColor = [16, 185, 129];
                }
            }
        },
    });

    yPos = doc.lastAutoTable.finalY + 15;

    if (yPos > 200) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPos - 5, pageWidth - 28, 8, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("GASTOS POR CATEGORIA", 18, yPos);

    yPos += 10;

    const categoryTotals = {};
    let totalGastado = 0;
    transactions.forEach((transaction) => {
        if (transaction.type === "gasto") {
            const amount = parseFloat(transaction.amount);
            categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + amount;
            totalGastado += amount;
        }
    });

    const categoryData = Object.entries(categoryTotals)
        .sort(([, amountA], [, amountB]) => amountB - amountA)
        .map(([category, total]) => {
            const percent = totalGastado > 0 ? (total / totalGastado) * 100 : 0;
            return [category, `$${total.toFixed(2)}`, `${percent.toFixed(1)}%`];
        });

    autoTable(doc, {
        startY: yPos,
        head: [["Categoria", "Total", "Porcentaje"]],
        body: categoryData,
        theme: "striped",
        headStyles: { fillColor: [19, 90, 236], textColor: 255, font: "helvetica", fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
        columnStyles: {
            0: { cellWidth: "auto", font: "helvetica" },
            1: { cellWidth: 50, halign: "right", font: "helvetica" },
            2: { cellWidth: 30, halign: "right", font: "helvetica" },
        },
    });

    yPos = doc.lastAutoTable.finalY + 15;

    if (yPos > 200) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPos - 5, pageWidth - 28, 8, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOP 5 LUGARES DE GASTO", 18, yPos);

    yPos += 10;

    const storeTotals = {};
    transactions
        .filter((transaction) => transaction.type === "gasto")
        .forEach((transaction) => {
            storeTotals[transaction.store] = (storeTotals[transaction.store] || 0) + parseFloat(transaction.amount);
        });

    const topStores = Object.entries(storeTotals)
        .sort(([, amountA], [, amountB]) => amountB - amountA)
        .slice(0, 5);

    const storesData = topStores.map(([store, total], index) => [
        `#${index + 1}`,
        store,
        `$${total.toFixed(2)}`,
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [["#", "Lugar", "Total Gastado"]],
        body: storesData,
        theme: "striped",
        headStyles: { fillColor: [19, 90, 236], textColor: 255, font: "helvetica", fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
        columnStyles: {
            0: { cellWidth: 15, halign: "center", font: "helvetica" },
            1: { cellWidth: "auto", font: "helvetica" },
            2: { cellWidth: 50, halign: "right", font: "helvetica" },
        },
    });

    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "italic");
    doc.text("Este es un documento generado automaticamente.", pageWidth / 2, finalY, { align: "center" });
    doc.text("Finance Pro - Sistema de Control Financiero", pageWidth / 2, finalY + 4, { align: "center" });

    const fileName = `estado_cuenta_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
}
