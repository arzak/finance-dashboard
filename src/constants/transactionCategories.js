export const EXPENSE_CATEGORIES = [
    "Comida",
    "Tecnología",
    "Telefonía",
    "Transporte",
    "Vivienda",
    "Salud",
    "Medicamentos",
    "Pensiones",
    "Otros",
];

export const INCOME_CATEGORIES = [
    "Nomina",
    "Ahorro",
    "Otros",
];

export const TRANSACTION_FILTER_CATEGORIES = Array.from(new Set([
    ...EXPENSE_CATEGORIES,
    ...INCOME_CATEGORIES,
    "Transferencia",
]));
