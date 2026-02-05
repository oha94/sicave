export const formatCurrency = (amount: number | string | undefined | null) => {
    if (amount === undefined || amount === null) return '0 Cfa fr';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num).replace('XOF', 'Cfa fr').trim();
};
