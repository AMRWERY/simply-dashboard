export type Translate = (
  key: string,
  named?: Record<string, unknown>,
) => string;

export type RGB = [number, number, number];

export interface ReportPdfInput {
  customers: Customer[];
  locale: string;
  t: Translate;
  /** App base URL, used to fetch the Arabic-capable font from /public/fonts. */
  baseURL: string;
}
