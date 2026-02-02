"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileDown, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  CSVUploader,
  CSVPreviewTable,
  ImportProgressBar,
  ImportSummary,
} from "@/components/import";
import { useToast } from "@/components/ui/use-toast";
import { ParseResult, ParsedRow } from "@/lib/csv-parser";

type ImportState = "upload" | "preview" | "importing" | "complete";

interface ImportResults {
  created: number;
  updated: number;
  failed: number;
  errors: { rowNumber: number; error: string }[];
}

export default function ImportPage() {
  const [state, setState] = useState<ImportState>("upload");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/projects/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse CSV");
      }

      setParseResult(data.preview);
      setUserMap(data.userMap);
      setState("preview");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to parse CSV",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!parseResult) return;

    const validRows = parseResult.rows.filter((row) => row.isValid);
    if (validRows.length === 0) {
      toast({
        title: "No valid rows",
        description: "There are no valid rows to import",
        variant: "destructive",
      });
      return;
    }

    setState("importing");
    setImportProgress({ current: 0, total: validRows.length });

    try {
      const response = await fetch("/api/projects/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: validRows,
          userMap,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import");
      }

      setImportResults(data.results);
      setState("complete");
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import CSV",
        variant: "destructive",
      });
      setState("preview");
    }
  };

  const handleReset = () => {
    setState("upload");
    setParseResult(null);
    setUserMap({});
    setImportProgress({ current: 0, total: 0 });
    setImportResults(null);
  };

  const handleDownloadTemplate = () => {
    const template = [
      "Account Name,Account Manager Email,Stage,Product,Channels,Customer Engineer Email,SPOC,Priority,Use Case Summary,Target Date,Status,Jira Ticket",
      "Example Corp,manager@example.com,POC,AI_AGENT,PSTN,engineer@example.com,John Doe,HIGH,Example use case,2024-03-15,IN_PROGRESS,JIRA-123",
    ].join("\n");

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-black">Import Projects</h1>
          <p className="text-slate-500">Bulk import or update projects from a CSV file</p>
        </div>
      </div>

      {/* Upload State */}
      {state === "upload" && (
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">Upload CSV File</CardTitle>
              <CardDescription>
                Upload a CSV file to import projects. Existing projects (matched by Account Name + Use Case) will be updated.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CSVUploader onFileSelect={handleFileSelect} isLoading={isLoading} />

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="text-sm text-slate-500">
                  Need a template?
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">CSV Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-slate-200 mb-2">Required Columns:</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li><span className="font-medium text-slate-300">Account Name</span> - Name of the customer account</li>
                    <li><span className="font-medium text-slate-300">Account Manager Email</span> - Email of the account manager (must exist in system)</li>
                    <li><span className="font-medium text-slate-300">Stage</span> - POC, ONBOARDING, or PRODUCTION</li>
                    <li><span className="font-medium text-slate-300">Product</span> - ANALYTICS, AI_AGENT, or both (comma-separated)</li>
                    <li><span className="font-medium text-slate-300">SPOC</span> - Single point of contact name</li>
                    <li><span className="font-medium text-slate-300">Priority</span> - HIGH, MEDIUM, or LOW</li>
                    <li><span className="font-medium text-slate-300">Use Case Summary</span> - Brief description of the use case</li>
                    <li><span className="font-medium text-slate-300">Target Date</span> - Date in YYYY-MM-DD format</li>
                    <li><span className="font-medium text-slate-300">Status</span> - NOT_STARTED, IN_PROGRESS, ON_HOLD, COMPLETED, or BLOCKED</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-slate-200 mb-2">Optional Columns:</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li><span className="font-medium text-slate-300">Channels</span> - PSTN, WHATSAPP (required if AI_AGENT selected)</li>
                    <li><span className="font-medium text-slate-300">Customer Engineer Email</span> - Email of the CE (must exist in system)</li>
                    <li><span className="font-medium text-slate-300">Jira Ticket</span> - Jira ticket reference</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview State */}
      {state === "preview" && parseResult && (
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">Import Preview</CardTitle>
              <CardDescription>
                Review the data before importing. Green rows will be created, yellow rows will update existing records, red rows have errors and will be skipped.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="text-2xl font-bold text-slate-100">{parseResult.totalRows}</div>
                  <div className="text-sm text-slate-500">Total Rows</div>
                </div>
                <div className="p-3 rounded-lg bg-green-950/30 border border-green-800/30">
                  <div className="text-2xl font-bold text-green-400">
                    {parseResult.validRows - parseResult.duplicateRows}
                  </div>
                  <div className="text-sm text-slate-500">New</div>
                </div>
                <div className="p-3 rounded-lg bg-yellow-950/30 border border-yellow-800/30">
                  <div className="text-2xl font-bold text-yellow-400">
                    {parseResult.duplicateRows}
                  </div>
                  <div className="text-sm text-slate-500">Updates</div>
                </div>
                <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/30">
                  <div className="text-2xl font-bold text-red-400">{parseResult.invalidRows}</div>
                  <div className="text-sm text-slate-500">Errors</div>
                </div>
              </div>

              <CSVPreviewTable rows={parseResult.rows} />

              <div className="flex justify-between mt-6 pt-6 border-t border-slate-800">
                <Button variant="outline" onClick={handleReset}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={parseResult.validRows === 0}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Import {parseResult.validRows} Row{parseResult.validRows !== 1 ? "s" : ""}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Importing State */}
      {state === "importing" && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Importing...</CardTitle>
          </CardHeader>
          <CardContent>
            <ImportProgressBar
              current={importProgress.current}
              total={importProgress.total}
              label="Processing rows..."
            />
          </CardContent>
        </Card>
      )}

      {/* Complete State */}
      {state === "complete" && importResults && (
        <ImportSummary results={importResults} onReset={handleReset} />
      )}
    </div>
  );
}
