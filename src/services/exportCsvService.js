import { formatNumericDate } from "../utils/formatters";
import { getTransactionDate } from "../utils/transactionDates";

export function exportTransactionsToCsv(rowsToExport) {
    const escapeValue = (value) => {
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        return stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
    };

    const headers = ["Fecha", "Tipo", "Descripcion", "Categoria", "Metodo de Pago", "Monto"];
    const rows = rowsToExport.map((transaction) => {
        const transactionDate = getTransactionDate(transaction);
        const dateLabel = transactionDate
            ? formatNumericDate(transactionDate)
            : transaction.date || "";
        const amount = transaction.type === "ingreso"
            ? `+${parseFloat(transaction.amount).toFixed(2)}`
            : `-${parseFloat(transaction.amount).toFixed(2)}`;
        const typeLabel = transaction.type === "gasto"
            ? "Gasto"
            : transaction.type === "pago_tarjeta"
                ? "Pago Tarjeta"
                : "Ingreso";

        return [
            escapeValue(dateLabel),
            escapeValue(typeLabel),
            escapeValue(transaction.store),
            escapeValue(transaction.category),
            escapeValue(transaction.paymentMethod || ""),
            escapeValue(amount),
        ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const today = new Date().toISOString().slice(0, 10);
    const dataUri = `data:text/csv;charset=utf-8,%EF%BB%BF${encodeURIComponent(csvContent)}`;
    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", `transacciones_${today}.csv`);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
