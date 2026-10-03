export interface LocaleMeta {
  code: string;
  flag: string;
  name: string;
  /** Label shown on the button — what you'll SWITCH TO */
  label: string;
  dir: "ltr" | "rtl";
}
