import { collectionRepository } from "./collectionRepository";
const savings = collectionRepository("savings_accounts", "sav");
export const getSavings = savings.get;
export const saveSavings = savings.save;
export const addSavings = savings.add;
export const updateSavings = savings.update;
export const deleteSavings = savings.remove;
