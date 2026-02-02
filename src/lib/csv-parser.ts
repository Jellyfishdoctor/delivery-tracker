import Papa from "papaparse";

// CSV column headers matching export format
export const CSV_HEADERS = [
  "Account Name",
  "Account Manager Email",
  "Stage",
  "Product",
  "Channels",
  "Customer Engineer Email",
  "SPOC",
  "Priority",
  "Use Case Summary",
  "Target Date",
  "Status",
  "Jira Ticket",
];

// Valid values for enum fields
export const VALID_STAGES = ["POC", "ONBOARDING", "PRODUCTION"];
export const VALID_PRODUCTS = ["ANALYTICS", "AI_AGENT"];
export const VALID_CHANNELS = ["PSTN", "WHATSAPP"];
export const VALID_PRIORITIES = ["HIGH", "MEDIUM", "LOW"];
export const VALID_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "BLOCKED",
];

export interface CSVRow {
  accountName: string;
  accountManagerEmail: string;
  stage: string;
  product: string;
  channels: string;
  customerEngineerEmail: string;
  spoc: string;
  priority: string;
  useCaseSummary: string;
  targetDate: string;
  status: string;
  jiraTicket: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ParsedRow {
  rowNumber: number;
  data: CSVRow;
  errors: ValidationError[];
  isValid: boolean;
  isDuplicate: boolean;
  existingProjectId?: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
}

// Parse a date string in various formats
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Try ISO format first (YYYY-MM-DD)
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;
  }

  // Try MMM d, yyyy format (e.g., "Mar 15, 2024")
  const mmmDYyyy = new Date(dateStr);
  if (!isNaN(mmmDYyyy.getTime())) return mmmDYyyy;

  // Try MM/DD/YYYY format
  const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isNaN(date.getTime())) return date;
  }

  // Try DD/MM/YYYY format
  const euMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (euMatch) {
    const [, day, month, year] = euMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

// Validate a single row
export function validateRow(row: CSVRow, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  if (!row.accountName?.trim()) {
    errors.push({ row: rowNumber, field: "Account Name", message: "Account Name is required" });
  }

  if (!row.accountManagerEmail?.trim()) {
    errors.push({ row: rowNumber, field: "Account Manager Email", message: "Account Manager Email is required" });
  } else if (!isValidEmail(row.accountManagerEmail)) {
    errors.push({ row: rowNumber, field: "Account Manager Email", message: "Invalid email format" });
  }

  if (!row.stage?.trim()) {
    errors.push({ row: rowNumber, field: "Stage", message: "Stage is required" });
  } else if (!VALID_STAGES.includes(row.stage.toUpperCase())) {
    errors.push({
      row: rowNumber,
      field: "Stage",
      message: `Invalid stage. Must be one of: ${VALID_STAGES.join(", ")}`,
    });
  }

  if (!row.product?.trim()) {
    errors.push({ row: rowNumber, field: "Product", message: "Product is required" });
  } else {
    const products = parseProductString(row.product);
    const invalidProducts = products.filter((p) => !VALID_PRODUCTS.includes(p.toUpperCase()));
    if (invalidProducts.length > 0) {
      errors.push({
        row: rowNumber,
        field: "Product",
        message: `Invalid product(s): ${invalidProducts.join(", ")}. Must be: ${VALID_PRODUCTS.join(", ")}`,
      });
    }
  }

  // Channels required if AI_AGENT is selected
  const products = parseProductString(row.product);
  if (products.some((p) => p.toUpperCase() === "AI_AGENT")) {
    if (!row.channels?.trim()) {
      errors.push({ row: rowNumber, field: "Channels", message: "Channels required when AI Agent is selected" });
    } else {
      const channels = parseChannelString(row.channels);
      const invalidChannels = channels.filter((c) => !VALID_CHANNELS.includes(c.toUpperCase()));
      if (invalidChannels.length > 0) {
        errors.push({
          row: rowNumber,
          field: "Channels",
          message: `Invalid channel(s): ${invalidChannels.join(", ")}. Must be: ${VALID_CHANNELS.join(", ")}`,
        });
      }
    }
  }

  // Customer Engineer email validation (optional)
  if (row.customerEngineerEmail?.trim() && !isValidEmail(row.customerEngineerEmail)) {
    errors.push({ row: rowNumber, field: "Customer Engineer Email", message: "Invalid email format" });
  }

  if (!row.spoc?.trim()) {
    errors.push({ row: rowNumber, field: "SPOC", message: "SPOC is required" });
  }

  if (!row.priority?.trim()) {
    errors.push({ row: rowNumber, field: "Priority", message: "Priority is required" });
  } else if (!VALID_PRIORITIES.includes(row.priority.toUpperCase())) {
    errors.push({
      row: rowNumber,
      field: "Priority",
      message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}`,
    });
  }

  if (!row.useCaseSummary?.trim()) {
    errors.push({ row: rowNumber, field: "Use Case Summary", message: "Use Case Summary is required" });
  }

  if (!row.targetDate?.trim()) {
    errors.push({ row: rowNumber, field: "Target Date", message: "Target Date is required" });
  } else if (!parseDate(row.targetDate)) {
    errors.push({ row: rowNumber, field: "Target Date", message: "Invalid date format" });
  }

  if (!row.status?.trim()) {
    errors.push({ row: rowNumber, field: "Status", message: "Status is required" });
  } else if (!VALID_STATUSES.includes(row.status.toUpperCase().replace(/ /g, "_"))) {
    errors.push({
      row: rowNumber,
      field: "Status",
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
    });
  }

  return errors;
}

// Parse CSV file content
export function parseCSV(content: string): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      complete: (results) => {
        const rows: ParsedRow[] = [];

        results.data.forEach((record: unknown, index: number) => {
          const row = record as Record<string, string>;
          const csvRow: CSVRow = {
            accountName: row["Account Name"] || "",
            accountManagerEmail: row["Account Manager Email"] || "",
            stage: row["Stage"] || "",
            product: row["Product"] || "",
            channels: row["Channels"] || "",
            customerEngineerEmail: row["Customer Engineer Email"] || "",
            spoc: row["SPOC"] || "",
            priority: row["Priority"] || "",
            useCaseSummary: row["Use Case Summary"] || "",
            targetDate: row["Target Date"] || "",
            status: row["Status"] || "",
            jiraTicket: row["Jira Ticket"] || "",
          };

          const errors = validateRow(csvRow, index + 2); // +2 for header row and 1-based indexing

          rows.push({
            rowNumber: index + 2,
            data: csvRow,
            errors,
            isValid: errors.length === 0,
            isDuplicate: false,
          });
        });

        resolve({
          rows,
          totalRows: rows.length,
          validRows: rows.filter((r) => r.isValid).length,
          invalidRows: rows.filter((r) => !r.isValid).length,
          duplicateRows: 0,
        });
      },
      error: (error: Error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function parseProductString(product: string): string[] {
  // Handle comma-separated values or JSON array
  if (product.startsWith("[")) {
    try {
      return JSON.parse(product);
    } catch {
      // Fall through to comma parsing
    }
  }
  return product.split(",").map((p) => p.trim().toUpperCase());
}

function parseChannelString(channels: string): string[] {
  if (!channels) return [];
  // Handle comma-separated values or JSON array
  if (channels.startsWith("[")) {
    try {
      return JSON.parse(channels);
    } catch {
      // Fall through to comma parsing
    }
  }
  return channels.split(",").map((c) => c.trim().toUpperCase());
}

// Normalize a row for import
export function normalizeRow(row: CSVRow): {
  accountName: string;
  accountManagerEmail: string;
  stage: string;
  product: string; // JSON array string
  channels: string | null; // JSON array string or null
  customerEngineerEmail: string | null;
  spoc: string;
  priority: string;
  useCaseSummary: string;
  targetDate: Date;
  status: string;
  jiraTicket: string | null;
} {
  const products = parseProductString(row.product);
  const channels = parseChannelString(row.channels);

  return {
    accountName: row.accountName.trim(),
    accountManagerEmail: row.accountManagerEmail.trim().toLowerCase(),
    stage: row.stage.toUpperCase(),
    product: JSON.stringify(products),
    channels: channels.length > 0 ? JSON.stringify(channels) : null,
    customerEngineerEmail: row.customerEngineerEmail?.trim().toLowerCase() || null,
    spoc: row.spoc.trim(),
    priority: row.priority.toUpperCase(),
    useCaseSummary: row.useCaseSummary.trim(),
    targetDate: parseDate(row.targetDate)!,
    status: row.status.toUpperCase().replace(/ /g, "_"),
    jiraTicket: row.jiraTicket?.trim() || null,
  };
}

// Generate duplicate detection key
export function getDuplicateKey(accountName: string, useCaseSummary: string): string {
  return `${accountName.toLowerCase().trim()}::${useCaseSummary.toLowerCase().trim()}`;
}
