import type { AppData, Category, Transaction } from "@/types";
import { uid } from "./id";
import { format, subDays, subMonths } from "date-fns";

export const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  // income
  { name: "Salary", type: "income", color: "#10b981", builtin: true },
  { name: "Business Income", type: "income", color: "#22c55e", builtin: true },
  { name: "Freelance", type: "income", color: "#84cc16", builtin: true },
  { name: "Interest", type: "income", color: "#14b8a6", builtin: true },
  { name: "Rental Income", type: "income", color: "#06b6d4", builtin: true },
  { name: "Other Income", type: "income", color: "#64748b", builtin: true },
  // expense
  { name: "Food", type: "expense", color: "#f97316", builtin: true },
  { name: "Rent", type: "expense", color: "#ef4444", builtin: true },
  { name: "Utilities", type: "expense", color: "#eab308", builtin: true },
  { name: "Fuel", type: "expense", color: "#a855f7", builtin: true },
  { name: "Shopping", type: "expense", color: "#ec4899", builtin: true },
  { name: "Medical", type: "expense", color: "#f43f5e", builtin: true },
  { name: "Education", type: "expense", color: "#3b82f6", builtin: true },
  { name: "Entertainment", type: "expense", color: "#8b5cf6", builtin: true },
  { name: "Travel", type: "expense", color: "#0ea5e9", builtin: true },
  { name: "Loan", type: "expense", color: "#d946ef", builtin: true },
  { name: "Savings/Investment", type: "expense", color: "#059669", builtin: true },
  { name: "Other Expense", type: "expense", color: "#64748b", builtin: true },
  // adjustment
  { name: "Correction", type: "adjustment", color: "#94a3b8", builtin: true },
];

export function emptyData(): AppData {
  const categories: Category[] = DEFAULT_CATEGORIES.map((c) => ({ ...c, id: uid("cat") }));
  return {
    people: [],
    accounts: [],
    categories,
    transactions: [],
    recurring: [],
    budgets: [],
    goals: [],
    settings: {
      currency: "NPR",
      theme: "dark",
      monthlySavingsTarget: 20,
      fiscalStartMonth: 0,
    },
  };
}

/** Rich demo dataset: 3 family members, several accounts, ~6 months of activity. */
export function demoData(): AppData {
  const base = emptyData();
  const cat = (name: string) => base.categories.find((c) => c.name === name)!.id;

  const me = { id: uid("p"), name: "Me", color: "#10b981", createdAt: now() };
  const dad = { id: uid("p"), name: "Father", color: "#3b82f6", createdAt: now() };
  const mom = { id: uid("p"), name: "Mother", color: "#ec4899", createdAt: now() };
  base.people = [me, dad, mom];

  const acc = (
    name: string,
    ownerId: string,
    type: AppData["accounts"][number]["type"],
    openingBalance: number
  ) => ({ id: uid("a"), name, ownerId, type, openingBalance, active: true, createdAt: now() });

  const myNabil = acc("Nabil Bank", me.id, "bank", 120000);
  const myCash = acc("Cash Wallet", me.id, "cash", 8000);
  const mySavings = acc("Savings", me.id, "savings", 250000);
  const myInvest = acc("NEPSE Portfolio", me.id, "investment", 180000);
  const dadNic = acc("NIC Asia A/C 1", dad.id, "bank", 90000);
  const dadSid = acc("Siddhartha A/C 2", dad.id, "bank", 65000);
  const momBank = acc("Global IME", mom.id, "bank", 70000);
  const momCash = acc("Cash Wallet", mom.id, "cash", 12000);
  base.accounts = [myNabil, myCash, mySavings, myInvest, dadNic, dadSid, momBank, momCash];

  const tx: Transaction[] = [];
  const add = (
    daysAgo: number,
    type: Transaction["type"],
    amount: number,
    personId: string,
    accountId: string,
    categoryName: string | null,
    description: string,
    toAccountId?: string,
    tags: string[] = []
  ) => {
    tx.push({
      id: uid("t"),
      type,
      date: format(subDays(new Date(), daysAgo), "yyyy-MM-dd"),
      amount,
      personId,
      accountId,
      toAccountId,
      categoryId: categoryName ? cat(categoryName) : undefined,
      description,
      tags,
      createdAt: now(),
    });
  };

  // 6 months of recurring-ish salary + expenses
  for (let m = 5; m >= 0; m--) {
    const d = m * 30;
    add(d + 2, "income", 95000 + m * 1500, me.id, myNabil.id, "Salary", "Monthly salary");
    add(d + 1, "income", 60000, dad.id, dadNic.id, "Business Income", "Shop revenue");
    add(d + 3, "income", 18000, mom.id, momBank.id, "Rental Income", "Room rent");

    add(d + 5, "expense", 22000, me.id, myNabil.id, "Rent", "Apartment rent");
    add(d + 6, "expense", 9000 + (m % 3) * 1200, me.id, myCash.id, "Food", "Groceries & dining");
    add(d + 8, "expense", 4200, me.id, myNabil.id, "Utilities", "Electricity + internet");
    add(d + 10, "expense", 3800 + (m % 2) * 1500, me.id, myNabil.id, "Fuel", "Petrol");
    add(d + 12, "expense", 6500, dad.id, dadNic.id, "Food", "Household groceries");
    add(d + 14, "expense", 3000, mom.id, momCash.id, "Medical", "Pharmacy");
    add(d + 9, "expense", m % 2 === 0 ? 12000 : 4500, me.id, myNabil.id, "Shopping", "Clothes & home");
    if (m % 3 === 0)
      add(d + 16, "expense", 15000, me.id, myNabil.id, "Travel", "Weekend trip");
    // transfer to savings
    add(d + 4, "transfer", 15000, me.id, myNabil.id, null, "Move to savings", mySavings.id, ["savings"]);
  }

  // recent week activity
  add(1, "expense", 2400, me.id, myCash.id, "Food", "Lunch with friends");
  add(2, "expense", 1800, me.id, myNabil.id, "Entertainment", "Movie night");
  add(3, "expense", 5200, me.id, myNabil.id, "Fuel", "Petrol top-up");
  add(0, "income", 12000, me.id, myNabil.id, "Freelance", "Side project payment");

  base.transactions = tx;

  // budgets
  base.budgets = [
    { id: uid("b"), categoryId: cat("Food"), amount: 18000, createdAt: now() },
    { id: uid("b"), categoryId: cat("Fuel"), amount: 8000, createdAt: now() },
    { id: uid("b"), categoryId: cat("Shopping"), amount: 10000, createdAt: now() },
    { id: uid("b"), categoryId: cat("Entertainment"), amount: 5000, createdAt: now() },
  ];

  // goals
  base.goals = [
    { id: uid("g"), name: "Emergency Fund", targetAmount: 500000, savedAmount: 320000, color: "#10b981", createdAt: now() },
    { id: uid("g"), name: "Vacation Fund", targetAmount: 200000, savedAmount: 85000, color: "#0ea5e9", createdAt: now() },
    { id: uid("g"), name: "House Down Payment", targetAmount: 3000000, savedAmount: 640000, color: "#8b5cf6", createdAt: now() },
  ];

  // recurring rules
  base.recurring = [
    {
      id: uid("r"), name: "Monthly Salary", type: "income", amount: 95000, personId: me.id,
      accountId: myNabil.id, categoryId: cat("Salary"), tags: [], recurrence: "monthly",
      dayOfMonth: 1, startDate: format(subMonths(new Date(), 6), "yyyy-MM-dd"), active: true, createdAt: now(),
    },
    {
      id: uid("r"), name: "Apartment Rent", type: "expense", amount: 22000, personId: me.id,
      accountId: myNabil.id, categoryId: cat("Rent"), tags: [], recurrence: "monthly",
      dayOfMonth: 5, startDate: format(subMonths(new Date(), 6), "yyyy-MM-dd"), active: true, createdAt: now(),
    },
  ];

  return base;
}

function now() {
  return new Date().toISOString();
}
