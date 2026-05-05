
let currentTransactions = [];
let currentSettings = {};
let filterState = {
    search: '',
    type: 'all',
    month: 'all'
};

let deletedTransactionCache = null;

const UI = {
    init() {
        this.bindElements();
        this.bindEvents();
        this.loadData();
        this.render();
    },

    bindElements() {
        this.elements = {
            summaryIncome: document.getElementById('summary-income'),
            summaryExpense: document.getElementById('summary-expense'),
            summaryNet: document.getElementById('summary-net'),
            budgetSection: document.getElementById('budget-section'),
            budgetText: document.getElementById('budget-text'),
            budgetProgress: document.getElementById('budget-progress'),
            
            chartSection: document.getElementById('chart-section'),
            expenseChart: document.getElementById('expense-chart'),
            
            filterSearch: document.getElementById('filter-search'),
            filterType: document.getElementById('filter-type'),
            filterMonth: document.getElementById('filter-month'),
            
            transactionList: document.getElementById('transaction-list-container'),
            
            btnAdd: document.getElementById('btn-add'),
            btnSettings: document.getElementById('btn-settings'),
            
            modalTransaction: document.getElementById('modal-transaction'),
            formTransaction: document.getElementById('transaction-form'),
            txId: document.getElementById('tx-id'),
            txType: document.getElementById('tx-type'),
            txAmount: document.getElementById('tx-amount'),
            txCategory: document.getElementById('tx-category'),
            txDate: document.getElementById('tx-date'),
            txNote: document.getElementById('tx-note'),
            
            modalSettings: document.getElementById('modal-settings'),
            formSettings: document.getElementById('settings-form'),
            setCurrency: document.getElementById('set-currency'),
            setBudget: document.getElementById('set-budget'),
            
            btnExportJson: document.getElementById('btn-export-json'),
            btnExportCsv: document.getElementById('btn-export-csv'),
            inputImport: document.getElementById('input-import'),
            btnResetData: document.getElementById('btn-reset-data'),
            
            toastContainer: document.getElementById('toast-container')
        };
        
        // Modal close buttons
        document.getElementById('btn-close-modal').addEventListener('click', () => this.closeModal(this.elements.modalTransaction));
        document.getElementById('btn-cancel-modal').addEventListener('click', () => this.closeModal(this.elements.modalTransaction));
        
        document.getElementById('btn-close-settings').addEventListener('click', () => this.closeModal(this.elements.modalSettings));
        document.getElementById('btn-cancel-settings').addEventListener('click', () => this.closeModal(this.elements.modalSettings));
    },

    bindEvents() {
        this.elements.btnAdd.addEventListener('click', () => this.openTransactionModal());
        this.elements.btnSettings.addEventListener('click', () => this.openSettingsModal());
        
        this.elements.formTransaction.addEventListener('submit', (e) => this.handleTransactionSubmit(e));
        this.elements.formSettings.addEventListener('submit', (e) => this.handleSettingsSubmit(e));
        
        this.elements.filterSearch.addEventListener('input', (e) => this.updateFilter('search', e.target.value));
        this.elements.filterType.addEventListener('change', (e) => this.updateFilter('type', e.target.value));
        this.elements.filterMonth.addEventListener('change', (e) => this.updateFilter('month', e.target.value));
        
        this.elements.btnExportJson.addEventListener('click', () => this.exportJson());
        this.elements.btnExportCsv.addEventListener('click', () => this.exportCsv());
        this.elements.inputImport.addEventListener('change', (e) => this.importJson(e));
        this.elements.btnResetData.addEventListener('click', () => this.resetData());
        
        // Accessibility: Escape key and Focus Trap for modals
        document.addEventListener('keydown', (e) => {
            const activeModal = document.querySelector('.modal-overlay.active .modal');
            
            if (e.key === 'Escape' && activeModal) {
                this.closeModal(activeModal.parentElement);
            }
            
            if (e.key === 'Tab' && activeModal) {
                const focusableElements = activeModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });

        // Redraw chart on resize
        window.addEventListener('resize', () => {
            if (!this.elements.chartSection.classList.contains('hidden')) {
                this.renderChart(this.getFilteredTransactions());
            }
        });
    },

    loadData() {
        currentTransactions = Storage.getTransactions();
        currentSettings = Storage.getSettings();
        
        this.populateMonthFilter();
        
        const currentMonthKey = new Date().toISOString().substring(0, 7);
        const hasCurrentMonth = currentTransactions.some(t => t.date && t.date.startsWith(currentMonthKey));
        
        if (hasCurrentMonth && filterState.month === 'all') {
            filterState.month = currentMonthKey;
            this.elements.filterMonth.value = currentMonthKey;
        }
    },

    render() {
        const filtered = this.getFilteredTransactions();
        this.renderDashboard(filtered);
        this.renderTransactionList(filtered);
    },

    populateMonthFilter() {
        const months = new Set();
        currentTransactions.forEach(t => {
            if (t.date) months.add(t.date.substring(0, 7));
        });
        
        const sortedMonths = Array.from(months).sort().reverse();
        
        let html = '<option value="all">All Time</option>';
        sortedMonths.forEach(m => {
            const [year, month] = m.split('-');
            const date = new Date(year, month - 1, 1);
            const label = new Intl.DateTimeFormat(navigator.language || 'en-US', { month: 'long', year: 'numeric' }).format(date);
            html += `<option value="${m}">${label}</option>`;
        });
        
        this.elements.filterMonth.innerHTML = html;
        this.elements.filterMonth.value = filterState.month;
    },

    updateFilter(key, value) {
        filterState[key] = value;
        this.render();
    },

    getFilteredTransactions() {
        return currentTransactions
            .filter(t => {
                if (filterState.type !== 'all' && t.type !== filterState.type) return false;
                if (filterState.month !== 'all' && t.date && !t.date.startsWith(filterState.month)) return false;
                if (filterState.search) {
                    const term = filterState.search.toLowerCase();
                    return (t.note || '').toLowerCase().includes(term) || (t.category || '').toLowerCase().includes(term);
                }
                return true;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt.localeCompare(a.createdAt));
    },

    renderDashboard(transactions) {
        let income = 0;
        let expense = 0;
        
        transactions.forEach(t => {
            if (t.type === 'income') income += t.amount;
            else if (t.type === 'expense') expense += t.amount;
        });
        
        const net = income - expense;
        const sym = currentSettings.currencySymbol;
        
        this.elements.summaryIncome.textContent = Utils.formatCurrency(income, sym);
        this.elements.summaryExpense.textContent = Utils.formatCurrency(expense, sym);
        this.elements.summaryNet.textContent = Utils.formatCurrency(net, sym);
        
        if (net < 0) {
            this.elements.summaryNet.classList.remove('text-success');
            this.elements.summaryNet.classList.add('text-error');
        } else {
            this.elements.summaryNet.classList.remove('text-error');
            // optionally add text-success for positive net
        }
        
        this.renderBudget(expense);
        this.renderChart(transactions);
    },

    renderBudget(currentExpense) {
        const budget = currentSettings.monthlyBudget;
        // Only show budget warnings if we are looking at a specific month or all time (but usually budget is monthly)
        // We'll show the budget progress against the currently filtered expenses.
        if (!budget) {
            this.elements.budgetSection.classList.add('hidden');
            return;
        }
        
        this.elements.budgetSection.classList.remove('hidden');
        
        const sym = currentSettings.currencySymbol;
        this.elements.budgetText.textContent = `${Utils.formatCurrency(currentExpense, sym)} / ${Utils.formatCurrency(budget, sym)}`;
        
        let pct = (currentExpense / budget) * 100;
        if (pct > 100) pct = 100;
        
        this.elements.budgetProgress.style.width = `${pct}%`;
        
        this.elements.budgetProgress.className = 'progress-bar';
        if (pct >= 100) {
            this.elements.budgetProgress.classList.add('danger');
        } else if (pct >= 80) {
            this.elements.budgetProgress.classList.add('warning');
        }
    },

    renderChart(transactions) {
        if (filterState.month === 'all') {
            this.elements.chartSection.classList.add('hidden');
            return;
        }

        const expenses = transactions.filter(t => t.type === 'expense');
        if (expenses.length === 0) {
            this.elements.chartSection.classList.add('hidden');
            return;
        }

        this.elements.chartSection.classList.remove('hidden');

        const canvas = this.elements.expenseChart;
        const ctx = canvas.getContext('2d');
        
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const width = rect.width;
        const height = rect.height;
        const padding = 10;
        
        const dailyTotals = {};
        const [year, month] = filterState.month.split('-');
        const daysInMonth = new Date(year, month, 0).getDate();
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dayStr = `${filterState.month}-${String(i).padStart(2, '0')}`;
            dailyTotals[dayStr] = 0;
        }

        expenses.forEach(t => {
            if (dailyTotals[t.date] !== undefined) {
                dailyTotals[t.date] += t.amount;
            }
        });

        const dataPoints = Object.values(dailyTotals);
        const maxExpense = Math.max(...dataPoints, 1);
        
        ctx.clearRect(0, 0, width, height);

        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = '#8B5CF6'; // Accent Primary
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        
        const stepX = (width - padding * 2) / Math.max(1, daysInMonth - 1);
        
        dataPoints.forEach((amount, index) => {
            const x = padding + (index * stepX);
            const normalizedY = (amount / maxExpense) * (height - padding * 2);
            const y = height - padding - normalizedY;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        ctx.lineTo(padding + ((daysInMonth - 1) * stepX), height - padding);
        ctx.lineTo(padding, height - padding);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.2)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
    },

    renderTransactionList(transactions) {
        if (transactions.length === 0) {
            this.elements.transactionList.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <p>No transactions found.</p>
                </div>
            `;
            return;
        }

        const grouped = {};
        transactions.forEach(t => {
            const d = t.date || 'Unknown';
            if (!grouped[d]) grouped[d] = [];
            grouped[d].push(t);
        });

        let html = '';
        const sym = currentSettings.currencySymbol;

        Object.keys(grouped).sort((a,b) => new Date(b) - new Date(a)).forEach(date => {
            const displayDate = date === 'Unknown' ? date : Utils.formatDate(date);
            
            let dayTotal = 0;
            grouped[date].forEach(t => {
                dayTotal += t.type === 'expense' ? -t.amount : t.amount;
            });
            const dayTotalFormatted = Utils.formatCurrency(Math.abs(dayTotal), sym);
            const daySign = dayTotal < 0 ? '-' : '';

            html += `<div class="transaction-group-header" style="display: flex; justify-content: space-between;">
                <span>${displayDate}</span>
                <span>${daySign}${dayTotalFormatted}</span>
            </div>`;
            
            grouped[date].forEach(t => {
                const amountFormatted = Utils.formatCurrency(t.amount, sym);
                const amountClass = t.type === 'income' ? 'text-success' : '';
                const sign = t.type === 'expense' ? '-' : '+';
                
                html += `
                <div class="transaction-item">
                    <div class="transaction-details">
                        <div class="transaction-title">${Utils.escapeHTML(t.category)}</div>
                        <div class="transaction-meta">
                            ${t.note ? `<span class="chip">${Utils.escapeHTML(t.note)}</span>` : ''}
                        </div>
                    </div>
                    <div class="transaction-right">
                        <div class="transaction-actions">
                            <button class="btn-icon" aria-label="Edit" data-id="${t.id}" data-action="edit">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="btn-icon" aria-label="Delete" data-id="${t.id}" data-action="delete">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                        <div class="transaction-amount ${amountClass}">${sign}${amountFormatted}</div>
                    </div>
                </div>`;
            });
        });

        this.elements.transactionList.innerHTML = html;
        
        this.elements.transactionList.querySelectorAll('button[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.openTransactionModal(id);
            });
        });
        this.elements.transactionList.querySelectorAll('button[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.deleteTransaction(id);
            });
        });
    },

    openTransactionModal(id = null) {
        if (id) {
            const t = currentTransactions.find(x => x.id === id);
            if (!t) return;
            this.elements.txId.value = t.id;
            this.elements.txType.value = t.type;
            this.elements.txAmount.value = t.amount;
            this.elements.txCategory.value = t.category;
            this.elements.txDate.value = t.date;
            this.elements.txNote.value = t.note || '';
            document.getElementById('modal-title').textContent = 'Edit Transaction';
        } else {
            this.elements.formTransaction.reset();
            this.elements.txId.value = '';
            this.elements.txDate.value = Utils.formatDateISO(new Date());
            this.elements.txType.value = 'expense';
            document.getElementById('modal-title').textContent = 'Add Transaction';
        }
        
        this.elements.modalTransaction.classList.add('active');
        // focus logic for accessibility
        setTimeout(() => this.elements.txAmount.focus(), 50);
    },

    closeModal(modal) {
        modal.classList.remove('active');
    },

    handleTransactionSubmit(e) {
        e.preventDefault();
        
        const tx = {
            id: this.elements.txId.value || Utils.generateId(),
            type: this.elements.txType.value,
            amount: parseFloat(this.elements.txAmount.value),
            category: this.elements.txCategory.value.trim(),
            date: this.elements.txDate.value,
            note: this.elements.txNote.value.trim(),
        };
        
        if (tx.amount <= 0 || !tx.category || !tx.date) {
            this.showToast('Invalid transaction data.');
            return;
        }

        const existing = currentTransactions.find(x => x.id === tx.id);
        if (existing) {
            tx.createdAt = existing.createdAt;
        }

        Storage.saveTransaction(tx);
        this.closeModal(this.elements.modalTransaction);
        this.loadData();
        
        // If the new transaction is not in the current month filter, consider changing the filter to "all" or the newly added month
        const txMonth = tx.date.substring(0, 7);
        if (filterState.month !== 'all' && filterState.month !== txMonth) {
            filterState.month = txMonth;
            this.populateMonthFilter();
        }
        
        this.render();
        this.showToast('Transaction saved.');
    },

    deleteTransaction(id) {
        const tx = currentTransactions.find(x => x.id === id);
        if (!tx) return;
        
        deletedTransactionCache = tx;
        Storage.deleteTransaction(id);
        
        this.loadData();
        this.render();
        
        this.showToast('Transaction deleted.', 'Undo', () => {
            if (deletedTransactionCache) {
                Storage.saveTransaction(deletedTransactionCache);
                deletedTransactionCache = null;
                this.loadData();
                this.render();
                this.showToast('Transaction restored.');
            }
        }, 5000);
    },

    openSettingsModal() {
        this.elements.setCurrency.value = currentSettings.currencySymbol || '₹';
        this.elements.setBudget.value = currentSettings.monthlyBudget || '';
        this.elements.modalSettings.classList.add('active');
    },

    handleSettingsSubmit(e) {
        e.preventDefault();
        const sym = this.elements.setCurrency.value.trim() || '₹';
        const budgetVal = this.elements.setBudget.value;
        const budget = budgetVal ? parseFloat(budgetVal) : null;
        
        Storage.saveSettings({ currencySymbol: sym, monthlyBudget: budget });
        this.closeModal(this.elements.modalSettings);
        this.loadData();
        this.render();
        this.showToast('Settings saved.');
    },

    showToast(message, actionText = null, actionCallback = null, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role', 'alert');
        
        const msgSpan = document.createElement('span');
        msgSpan.textContent = message;
        toast.appendChild(msgSpan);
        
        if (actionText && actionCallback) {
            const actionBtn = document.createElement('button');
            actionBtn.className = 'toast-action';
            actionBtn.textContent = actionText;
            actionBtn.addEventListener('click', () => {
                actionCallback();
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            });
            toast.appendChild(actionBtn);
        }
        
        this.elements.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    },

    exportJson() {
        const data = localStorage.getItem('expenseTracker:data');
        if (!data) return;
        const blob = new Blob([data], { type: 'application/json' });
        this.downloadBlob(blob, `shadow_backup_${Utils.formatDateISO(new Date())}.json`);
    },

    exportCsv() {
        if (!currentTransactions.length) {
            this.showToast('No data to export.');
            return;
        }
        
        const headers = ['Date', 'Type', 'Category', 'Amount', 'Note'];
        const rows = currentTransactions.map(t => [
            t.date,
            t.type,
            `"${(t.category || '').replace(/"/g, '""')}"`,
            t.amount,
            `"${(t.note || '').replace(/"/g, '""')}"`
        ]);
        
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, `shadow_transactions_${Utils.formatDateISO(new Date())}.csv`);
    },

    downloadBlob(blob, filename) {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    importJson(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                Storage.importData(event.target.result);
                this.loadData();
                this.render();
                this.showToast('Data imported successfully.');
                this.closeModal(this.elements.modalSettings);
            } catch (err) {
                this.showToast(err.message || 'Failed to import data.');
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    },

    resetData() {
        if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
            Storage.resetData();
            this.loadData();
            this.render();
            this.closeModal(this.elements.modalSettings);
            this.showToast('All data has been reset.');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});
