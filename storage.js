const STORAGE_KEY = 'expenseTracker:data';
const CURRENT_VERSION = 1;

const DEFAULT_DATA = {
    version: CURRENT_VERSION,
    settings: {
        currencySymbol: '₹',
        monthlyBudget: null
    },
    transactions: []
};

function migrate(data) {
    if (!data.version) {
        data.version = 1;
    }
    // Future migrations go here:
    // if (data.version === 1) { ... data.version = 2; }
    return data;
}

const Storage = {
    getData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return DEFAULT_DATA;
            const parsed = JSON.parse(raw);
            return migrate(parsed);
        } catch (e) {
            console.error('Failed to load data from localStorage', e);
            return DEFAULT_DATA;
        }
    },

    saveData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save data to localStorage', e);
            return false;
        }
    },

    getTransactions() {
        return this.getData().transactions || [];
    },

    getSettings() {
        return this.getData().settings || DEFAULT_DATA.settings;
    },

    saveTransaction(transaction) {
        const data = this.getData();
        const existingIndex = data.transactions.findIndex(t => t.id === transaction.id);
        
        if (existingIndex >= 0) {
            transaction.updatedAt = new Date().toISOString();
            data.transactions[existingIndex] = transaction;
        } else {
            transaction.createdAt = transaction.createdAt || new Date().toISOString();
            transaction.updatedAt = transaction.createdAt;
            data.transactions.push(transaction);
        }
        
        return this.saveData(data);
    },

    deleteTransaction(id) {
        const data = this.getData();
        const initialLength = data.transactions.length;
        data.transactions = data.transactions.filter(t => t.id !== id);
        if (data.transactions.length !== initialLength) {
            return this.saveData(data);
        }
        return false;
    },

    saveSettings(settings) {
        const data = this.getData();
        data.settings = { ...data.settings, ...settings };
        return this.saveData(data);
    },
    
    resetData() {
        return this.saveData(DEFAULT_DATA);
    },

    importData(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
                throw new Error("Invalid schema: 'transactions' array missing.");
            }
            // Basic validation
            const valid = migrate(parsed);
            return this.saveData(valid);
        } catch (e) {
            throw new Error(`Import failed: ${e.message}`);
        }
    }
};
