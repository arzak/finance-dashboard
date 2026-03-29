export function formatCurrency(value, options = {}) {
    const amount = parseFloat(value) || 0;
    return amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        ...options,
    });
}

export function formatCurrencyDisplay(value, options = {}) {
    return `$${formatCurrency(value, options)}`;
}

export function formatShortDate(date) {
    return date.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function formatNumericDate(date) {
    return date.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export function formatLongSpanishDate(date) {
    return date.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}
