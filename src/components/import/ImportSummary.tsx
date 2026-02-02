"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ImportSummaryProps {
  results: {
    created: number;
    updated: number;
    failed: number;
    errors: { rowNumber: number; error: string }[];
  };
  onReset: () => void;
}

export function ImportSummary({ results, onReset }: ImportSummaryProps) {
  const total = results.created + results.updated + results.failed;
  const successful = results.created + results.updated;

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {results.failed === 0 ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-slate-100">Import Completed Successfully</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-orange-500" />
                <span className="text-slate-100">Import Completed with Errors</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-950/30 border border-green-800/30">
              <div className="text-2xl font-bold text-green-400">
                {results.created}
              </div>
              <div className="text-sm text-slate-400">Created</div>
            </div>
            <div className="p-4 rounded-lg bg-yellow-950/30 border border-yellow-800/30">
              <div className="text-2xl font-bold text-yellow-400">
                {results.updated}
              </div>
              <div className="text-sm text-slate-400">Updated</div>
            </div>
            <div className="p-4 rounded-lg bg-red-950/30 border border-red-800/30">
              <div className="text-2xl font-bold text-red-400">
                {results.failed}
              </div>
              <div className="text-sm text-slate-400">Failed</div>
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-400">
            {successful} of {total} rows imported successfully
          </div>
        </CardContent>
      </Card>

      {results.errors.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-red-400 text-lg">Failed Rows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {results.errors.map((error, index) => (
                <div
                  key={index}
                  className="p-3 rounded bg-red-950/20 border border-red-800/30 text-sm"
                >
                  <span className="font-medium text-slate-300">
                    Row {error.rowNumber}:
                  </span>{" "}
                  <span className="text-red-400">{error.error}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onReset}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Import Another File
        </Button>
        <Link href="/entries">
          <Button>
            View Entries
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
