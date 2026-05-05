const Utils = {
    generateId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    },

    formatCurrency(amount, symbol = '₹') {
        const formatted = new Intl.NumberFormat(navigator.language || 'en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
        // Put space after symbol if it's a code like "USD", else direct concat like "₹10"
        return symbol.length > 1 ? `${symbol} ${formatted}` : `${symbol}${formatted}`;
    },

    escapeHTML(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(navigator.language || 'en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        }).format(date);
    },
    
    formatDateISO(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    },

    getStartOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    },

    getEndOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }
};
