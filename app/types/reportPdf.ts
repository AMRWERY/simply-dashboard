import type { Customer, Payment } from "~/types/home";

export type Translate = (
  key: string,
  named?: Record<string, unknown>,
) => string;

export type RGB = [number, number, number];

export interface ReportPdfInput {
  customers: Customer[];
  /** Payment history, for the month-by-month earnings table. */
  payments: Payment[];
  locale: string;
  t: Translate;
  /** App base URL, used to fetch the Arabic-capable font from /public/fonts. */
  baseURL: string;
}
