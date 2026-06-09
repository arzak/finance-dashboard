import { formatNumericDate } from "../utils/formatters";
import { getTransactionDate } from "../utils/transactionDates";

export function exportTransactionsToCsv(rowsToExport) {
    const escapeXml = (value) => String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const headers = ["Fecha", "Tipo", "Descripcion", "Categoria", "Metodo de Pago", "Monto"];
    const rows = rowsToExport.map((transaction) => {
        const transactionDate = getTransactionDate(transaction);
        const dateLabel = transactionDate
            ? formatNumericDate(transactionDate)
            : transaction.date || "";
        const normalizedAmount = Math.abs(parseFloat(transaction.amount) || 0);
        const amount = transaction.type === "ingreso"
            ? `+${normalizedAmount.toFixed(2)}`
            : `-${normalizedAmount.toFixed(2)}`;
        const typeLabel = transaction.type === "gasto"
            ? "Gasto"
            : transaction.type === "pago_tarjeta"
                ? "Pago Tarjeta"
                : "Ingreso";

        return [
            dateLabel,
            typeLabel,
            transaction.store || "",
            transaction.category || "",
            transaction.paymentMethod || "",
            amount,
        ];
    });

    const buildRow = (columns) => (
        `<Row>${columns.map((value) => `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`).join("")}</Row>`
    );

    const workbookContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Transacciones">
  <Table>
   ${buildRow(headers)}
   ${rows.map((row) => buildRow(row)).join("")}
  </Table>
 </Worksheet>
</Workbook>`;

    const today = new Date().toISOString().slice(0, 10);
    const blob = new Blob([workbookContent], {
        type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", downloadUrl);
    link.setAttribute("download", `transacciones_${today}.xls`);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
}
