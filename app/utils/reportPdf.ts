import type { Customer } from "~/types/home";

type Translate = (key: string, named?: Record<string, unknown>) => string;
type RGB = [number, number, number];

interface ReportPdfInput {
  customers: Customer[];
  locale: string;
  t: Translate;
  /** App base URL, used to fetch the Arabic-capable font from /public/fonts. */
  baseURL: string;
}

const PAGE_W = 210; // A4 portrait, mm
const PAGE_H = 297;
const M = 14;
const CW = PAGE_W - M * 2;
const FOOTER = 14;

const INK: RGB = [31, 41, 55];
const MUTED: RGB = [107, 114, 128];
const INDIGO: RGB = [79, 70, 229];
const INDIGO_SOFT: RGB = [199, 210, 254];
const BAND: RGB = [21, 23, 51];
const GRID: RGB = [229, 231, 235];
const STATUS_COLORS: Record<string, RGB> = {
  active: [16, 185, 129],
  new: [245, 158, 11],
  "follow-up": [249, 115, 22],
};

const fontCache = new Map<string, string>();

async function loadFont(url: string): Promise<string> {
  const cached = fontCache.get(url);
  if (cached) return cached;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`font-load-failed: ${url}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  // Chunked so large fonts don't overflow the argument limit.
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  const b64 = btoa(binary);
  fontCache.set(url, b64);
  return b64;
}

/** Intl adds invisible bidi marks and no-break spaces the PDF font can't draw. */
const clean = (s: string) =>
  s.replace(/[‎‏؜‪-‮]/g, "").replace(/[  ]/g, " ");

/**
 * Builds the customer report as a real (text + vector) PDF. Arabic works
 * because an Arabic-capable font is embedded and jsPDF shapes and reorders
 * the text itself, so strings are passed in normal logical order.
 */
export async function buildReportPdf({
  customers,
  locale,
  t,
  baseURL,
}: ReportPdfInput) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const [regular, bold] = await Promise.all([
    loadFont(`${baseURL}fonts/Amiri-Regular.ttf`),
    loadFont(`${baseURL}fonts/Amiri-Bold.ttf`),
  ]);

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.addFileToVFS("Amiri-Regular.ttf", regular);
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  doc.addFileToVFS("Amiri-Bold.ttf", bold);
  doc.addFont("Amiri-Bold.ttf", "Amiri", "bold");

  const isRtl = locale === "ar";
  const align = isRtl ? "right" : "left";
  /** Where text starts reading from. */
  const edge = isRtl ? PAGE_W - M : M;
  /** Left coordinate of a box that sits `offset` from the reading-start edge. */
  const boxX = (offset: number, width: number) =>
    isRtl ? PAGE_W - M - offset - width : M + offset;

  const intl = locale === "ar" ? "ar-EG-u-nu-latn" : "en-US";
  // Arabic: number + the word "جنيه". The dotted symbol "ج.م." confuses the
  // bidi step and ends up on the wrong side of the number.
  const money = (n: number) =>
    isRtl
      ? `${new Intl.NumberFormat(intl, { maximumFractionDigits: 2 }).format(n)} ${t("currency_egp")}`
      : clean(formatMoney(n, locale));
  let y = 0;

  const setFont = (style: "normal" | "bold", size: number, color: RGB) => {
    doc.setFont("Amiri", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  // In Arabic the base direction is right-to-left, so "2,880 جنيه" puts the
  // unit on the left of the number, as an Arabic reader expects.
  // Only for strings that contain Arabic: Latin text ("Customer 11") must keep
  // its own left-to-right order.
  const dirFor = (s: string) =>
    isRtl && /[؀-ۿ]/.test(s) ? { isOutputRtl: true } : {};
  const text = (s: string, x: number, yy: number, opts: object = {}) =>
    doc.text(clean(s), x, yy, { align, ...dirFor(s), ...opts });
  const ensure = (height: number) => {
    if (y + height > PAGE_H - FOOTER) {
      doc.addPage();
      y = M;
    }
  };

  /** Rough height of an autotable with this many body rows (plus its head). */
  const tableHeight = (bodyRows: number) => (bodyRows + 1) * 8.8;

  /** `reserve` keeps the heading and what follows it on the same page. */
  const section = (title: string, description?: string, reserve = 0) => {
    ensure(Math.max(24, 12 + reserve));
    setFont("bold", 13, INK);
    text(title, edge, y);
    y += 5.5;
    if (description) {
      setFont("normal", 9, MUTED);
      text(description, edge, y);
      y += 5;
    }
    y += 2;
  };

  const table = (head: string[], rows: string[][], numeric: number[] = []) => {
    // autotable lays columns out left to right, so Arabic reverses them.
    const order = <T,>(row: T[]) => (isRtl ? [...row].reverse() : row);
    const col = (i: number) => (isRtl ? head.length - 1 - i : i);
    // autotable's own text drawing mangles Arabic (letters come out flipped),
    // including Arabic names inside an English report, while doc.text is
    // correct. So autotable does the layout, borders and pagination, and the
    // cell text is drawn with doc.text instead.
    const pending = new WeakMap<object, string[]>();
    autoTable(doc, {
      willDrawCell: (d) => {
        pending.set(d.cell, d.cell.text);
        d.cell.text = [];
      },
      didDrawCell: (d) => {
        const lines = pending.get(d.cell);
        if (!lines?.length) return;
        const st = d.cell.styles;
        doc.setFont("Amiri", st.fontStyle === "bold" ? "bold" : "normal");
        doc.setFontSize(st.fontSize);
        const c = st.textColor;
        if (Array.isArray(c)) doc.setTextColor(c[0], c[1], c[2]);
        else doc.setTextColor(c as number);
        const right = st.halign === "right";
        doc.text(
          lines.join(" "),
          right
            ? d.cell.x + d.cell.width - d.cell.padding("right")
            : d.cell.x + d.cell.padding("left"),
          d.cell.y + d.cell.height / 2,
          {
            align: right ? "right" : "left",
            baseline: "middle",
            ...dirFor(lines.join(" ")),
          },
        );
      },
      startY: y,
      margin: { left: M, right: M, bottom: FOOTER },
      head: [order(head.map(clean))],
      body: rows.map((r) => order(r.map(clean))),
      theme: "grid",
      styles: {
        font: "Amiri",
        fontSize: 10,
        cellPadding: 2.2,
        textColor: INK,
        lineColor: GRID,
        lineWidth: 0.2,
        halign: align,
      },
      headStyles: { fillColor: INDIGO, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 248, 252] },
      columnStyles: Object.fromEntries(
        head.map((_, i) => [
          col(i),
          { halign: isRtl ? "right" : numeric.includes(i) ? "right" : "left" },
        ]),
      ),
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 8;
  };

  // ── Header band ──────────────────────────────────────────────────────────
  const generatedOn = new Intl.DateTimeFormat(intl, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  doc.setFillColor(...BAND);
  doc.rect(0, 0, PAGE_W, 38, "F");
  setFont("bold", 21, [255, 255, 255]);
  text(t("reports_analytics"), edge, 16);
  setFont("normal", 10.5, INDIGO_SOFT);
  text(t("reports_analytics_description"), edge, 23.5);
  setFont("normal", 9, INDIGO_SOFT);
  text(t("generated_on", { date: generatedOn }), edge, 30.5);
  y = 48;

  // ── 1. Summary ───────────────────────────────────────────────────────────
  const totals = summarizeEarnings(customers);
  const avg = customers.length ? totals.billed / customers.length : 0;
  section(t("summary"), undefined, tableHeight(5));
  table(
    [t("metric"), t("value")],
    [
      [t("total_billed"), money(totals.billed)],
      [t("total_earnings"), money(totals.earned)],
      [t("outstanding"), money(totals.outstanding)],
      [t("collection_rate"), `${collectionRate(totals.billed, totals.earned)}%`],
      [t("average_per_customer"), money(avg)],
    ],
    [1],
  );

  // ── 2. Top debtors ───────────────────────────────────────────────────────
  const debtors = topDebtors(customers, 10);
  section(
    t("top_debtors"),
    t("top_debtors_description"),
    debtors.length ? tableHeight(debtors.length) : 8,
  );
  if (!debtors.length) {
    setFont("normal", 10, MUTED);
    text(t("no_debts"), edge, y);
    y += 10;
  } else {
    table(
      ["#", t("customer_name"), t("city"), t("amount_due"), t("paid"), t("remaining")],
      debtors.map(({ customer: c, remaining }, i) => [
        String(i + 1),
        c.name,
        c.city || "—",
        money(c.amountDue),
        money(c.amountPaid),
        money(remaining),
      ]),
      [3, 4, 5],
    );
  }

  // ── 3. Status ────────────────────────────────────────────────────────────
  section(t("customers_by_status"), undefined, 10 + tableHeight(4));
  const counts = statusBreakdown(customers);
  const total = customers.length;
  const statuses = [
    { key: "active", label: t("active") },
    { key: "new", label: t("new") },
    { key: "follow-up", label: t("follow_up") },
  ] as const;

  // Stacked share bar
  ensure(14);
  doc.setFillColor(...GRID);
  doc.rect(M, y, CW, 5, "F");
  let used = 0;
  for (const s of statuses) {
    const w = total ? (counts[s.key] / total) * CW : 0;
    if (!w) continue;
    doc.setFillColor(...STATUS_COLORS[s.key]!);
    doc.rect(isRtl ? PAGE_W - M - used - w : M + used, y, w, 5, "F");
    used += w;
  }
  y += 10;
  table(
    [t("status"), t("customers"), "%"],
    [
      ...statuses.map((s) => [
        s.label,
        String(counts[s.key]),
        `${total ? Math.round((counts[s.key] / total) * 100) : 0}%`,
      ]),
      [t("total"), String(total), total ? "100%" : "0%"],
    ],
    [1, 2],
  );

  // ── 4. Growth ────────────────────────────────────────────────────────────
  section(t("customer_growth"), t("customer_growth_description"), 52);
  const months = monthlyGrowth(customers, locale, 6);
  const maxCount = Math.max(1, ...months.map((m) => m.count));
  const slot = CW / months.length;
  const barW = slot * 0.5;
  const chartTop = y + 6;
  const chartH = 34;
  doc.setDrawColor(...GRID);
  doc.setLineWidth(0.3);
  doc.line(M, chartTop + chartH, M + CW, chartTop + chartH);
  months.forEach((m, i) => {
    const h = m.count ? Math.max(2, (m.count / maxCount) * chartH) : 0.8;
    const x = M + slot * i + (slot - barW) / 2;
    doc.setFillColor(...(i === months.length - 1 ? INDIGO : INDIGO_SOFT));
    doc.roundedRect(x, chartTop + chartH - h, barW, h, 1, 1, "F");
    setFont("bold", 9, INK);
    text(String(m.count), x + barW / 2, chartTop + chartH - h - 1.5, {
      align: "center",
    });
    setFont("normal", 9, MUTED);
    text(m.label, x + barW / 2, chartTop + chartH + 5, { align: "center" });
  });
  y = chartTop + chartH + 14;

  // ── 5. Cities ────────────────────────────────────────────────────────────
  const cities = cityBreakdown(customers, 5);
  section(
    t("customers_by_city"),
    t("customers_by_city_description"),
    Math.max(8, cities.length * 9),
  );
  if (!cities.length) {
    setFont("normal", 10, MUTED);
    text(t("no_city_data"), edge, y);
    y += 8;
  } else {
    const maxCity = Math.max(1, ...cities.map((c) => c.count));
    const labelW = 48;
    const countW = 10;
    const trackW = CW - labelW - countW - 4;
    for (const c of cities) {
      ensure(10);
      setFont("bold", 10, INK);
      text(c.city, edge, y + 4);

      const trackX = boxX(labelW, trackW);
      doc.setFillColor(...GRID);
      doc.roundedRect(trackX, y + 1, trackW, 4, 2, 2, "F");
      const w = Math.max(2, (c.count / maxCity) * trackW);
      doc.setFillColor(...INDIGO);
      doc.roundedRect(isRtl ? trackX + trackW - w : trackX, y + 1, w, 4, 2, 2, "F");

      setFont("bold", 10, INK);
      const countX = boxX(labelW + trackW + 4, countW);
      text(String(c.count), isRtl ? countX : countX + countW, y + 4, {
        align: isRtl ? "left" : "right",
      });
      y += 9;
    }
  }

  // ── Footer: page numbers ────────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    setFont("normal", 8.5, MUTED);
    text(`${i} / ${pages}`, PAGE_W / 2, PAGE_H - 8, { align: "center" });
  }

  return doc;
}
