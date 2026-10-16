import { collectionRepository } from "./collectionRepository";
const expenses = collectionRepository("expenses", "exp");
export const getExpenses = expenses.get;
export const saveExpenses = expenses.save;
export const addExpense = expenses.add;
export const updateExpense = expenses.update;
export const deleteExpense = expenses.remove;
export const toggleExpenseActive = (id: string) => expenses.update(id, item => ({ isActive: !item.isActive }));
