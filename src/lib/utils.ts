import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function isOverdue(targetDate: Date | string, status: string): boolean {
  if (status === "COMPLETED") return false;
  return new Date(targetDate) < new Date();
}

export function generateCSV(data: Record<string, unknown>[], headers: string[]): string {
  const headerRow = headers.join(",");
  const rows = data.map((item) =>
    headers
      .map((header) => {
        const value = item[header];
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma or newline
        if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(",")
  );
  return [headerRow, ...rows].join("\n");
}

export function getJiraUrl(jiraTicket: string): string {
  if (!jiraTicket) return "";
  if (jiraTicket.startsWith("http")) return jiraTicket;
  // Assume it's a ticket ID - you can customize the base URL
  return `https://jira.atlassian.net/browse/${jiraTicket}`;
}
