// ---------------------------------------------------------------------------
// Domain model for the Family Finance Dashboard
// ---------------------------------------------------------------------------

export type ID = string;

export type AccountType = "bank" | "cash" | "savings" | "investment";

export interface Person {
  id: ID;
  name: string;
  color: string; // hex used across charts/avatars
  createdAt: string;
}

export interface Account {
  id: ID;
  name: string;
  ownerId: ID; // -> Person.id
  type: AccountType;
  openingBalance: number;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export type TransactionType = "income" | "expense" | "transfer" | "adjustment";

export interface Category {
  id: ID;
  name: string;
  type: Exclude<TransactionType, "transfer">; // income | expense | adjustment
  icon?: string;
  color: string;
  builtin?: boolean;
}

export interface Transaction {
  id: ID;
  type: TransactionType;
  date: string; // ISO yyyy-mm-dd
  amount: number; // always positive; sign derived from type
  personId: ID;
  accountId: ID; // source account
  toAccountId?: ID; // destination for transfers
  categoryId?: ID;
  description?: string;
  tags: string[];
  createdAt: string;
}

export type Recurrence = "weekly" | "monthly" | "yearly";

export interface RecurringRule {
  id: ID;
  name: string;
  type: TransactionType;
  amount: number;
  personId: ID;
  accountId: ID;
  toAccountId?: ID;
  categoryId?: ID;
  tags: string[];
  recurrence: Recurrence;
  dayOfMonth?: number; // for monthly/yearly
  startDate: string;
  lastRun?: string; // ISO date of last generated occurrence
  active: boolean;
  createdAt: string;
}

export interface Budget {
  id: ID;
  categoryId: ID;
  personId?: ID; // optional: scope to a person, else whole family
  amount: number; // monthly limit
  createdAt: string;
}

export interface Goal {
  id: ID;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate?: string;
  personId?: ID;
  color: string;
  createdAt: string;
}

export type CurrencyCode = "NPR" | "USD" | "INR" | "EUR" | "GBP";

export interface Settings {
  currency: CurrencyCode;
  theme: "light" | "dark";
  monthlySavingsTarget: number; // % savings-rate target used for insights
  fiscalStartMonth: number; // 0-11
}

export interface AppData {
  people: Person[];
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  recurring: RecurringRule[];
  budgets: Budget[];
  goals: Goal[];
  settings: Settings;
}

// ---- Filters --------------------------------------------------------------

export interface Filters {
  from?: string;
  to?: string;
  personId?: ID | "all";
  accountId?: ID | "all";
  categoryId?: ID | "all";
  type?: TransactionType | "all";
  search?: string;
  sortOrder?: "asc" | "desc";
}
