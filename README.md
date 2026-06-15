<!--
Nexus Expense Tracker - Implementation Plan
[x] 1) Scaffold the project structure and HTML layout.
[x] 2) Implement storage layer + migrations + settings.
[x] 3) Implement transactions CRUD + validation + undo delete.
[x] 4) Implement dashboard summaries.
[x] 5) Implement filters/search/sort.
[x] 6) Implement budget.
[x] 7) Implement export/import/reset.
[x] 8) Accessibility pass.
[x] 9) Final polish.
-->
# Expense Tracker

A web application that helps users manage and track their daily income and expenses.

## Features

* Add Income
* Add Expenses
* View Balance
* Transaction History

## Technologies Used

* HTML
* CSS
* JavaScript

## Author

Chappidi Mounika


# Nexus Expense Tracker

A fast, offline-capable, matte-black expense tracker that runs completely in your browser without any backend or node runtime required. 

## Features
- **Dashboard**: Quick summaries for the current month, budget progress, and category breakdowns.
- **Transactions CRUD**: Add, edit, and delete transactions with a 5-second undo feature.
- **Filtering & Search**: Quickly find past expenses by category, date range, or note.
- **Budgeting**: Set a monthly budget and receive visual warnings as you cross 80% and 100%.
- **Data Tools**: Import and export your data as JSON, and export to CSV.
- **Accessibility & Performance**: Keyboard accessible, semantic HTML, and performant vanilla JavaScript.

## How to Run
Simply open the `index.html` file in any modern web browser. No local server, build tools, or dependencies are required. 
*Note: Some browsers block `localStorage` access for local `file://` URLs in strict privacy modes. If you experience issues saving data, you can run a basic static server, e.g. `python -m http.server`.*

## Data Schema
Data is stored securely in your browser's `localStorage` under the key `expenseTracker:data`.

### Versioning
- **Current Version:** `1`
- The `storage.js` module handles schema migrations if the format changes in the future.

### Structure
```typescript
{
  version: number, // Starts at 1
  settings: {
    currencySymbol: string, // Default '₹'
    monthlyBudget: number | null
  },
  transactions: Array<{
    id: string,
    type: "expense" | "income",
    amount: number,
    category: string,
    date: string, // "YYYY-MM-DD"
    note: string,
    paymentMethod: string,
    createdAt: string, // ISO Date
    updatedAt: string  // ISO Date
  }>
}
```

## Manual Test Checklist
1. **Adding a Transaction**: Click the floating "+" button, fill out the form, and save. Verify it appears on the dashboard and transaction list.
2. **Dashboard Math**: Check if the net total reflects Income - Expenses accurately.
3. **Deleting with Undo**: Delete a transaction. A toast should appear for 5 seconds. If you click undo, the transaction should return.
4. **Budget Alerts**: Set a budget in settings. Add expenses to reach >80% and >100% of the budget. Verify that the budget progress bar turns yellow/red.
5. **Persistence**: Refresh the page. Ensure data remains intact.
6. **Export/Import**: Export your data to JSON. Reset the app. Import the JSON back. Verify all records return.

## Future Improvements
- Multi-currency support and real-time exchange rates.
- Repeating / recurring transactions.
- Interactive charts using a lightweight visualization library.
- Synchronization via a cloud provider (e.g. Google Drive / Dropbox API).
