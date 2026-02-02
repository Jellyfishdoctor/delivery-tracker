"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ParsedRow } from "@/lib/csv-parser";

interface CSVPreviewTableProps {
  rows: ParsedRow[];
  maxRows?: number;
}

export function CSVPreviewTable({ rows, maxRows = 50 }: CSVPreviewTableProps) {
  const displayRows = rows.slice(0, maxRows);
  const hasMore = rows.length > maxRows;

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-800/50">
              <TableHead className="w-12">Row</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead>Use Case</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Target Date</TableHead>
              <TableHead>Issues</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.map((row) => (
              <TableRow
                key={row.rowNumber}
                className={cn(
                  row.isValid && !row.isDuplicate && "bg-green-950/20",
                  row.isValid && row.isDuplicate && "bg-yellow-950/20",
                  !row.isValid && "bg-red-950/20"
                )}
              >
                <TableCell className="font-mono text-sm">{row.rowNumber}</TableCell>
                <TableCell>
                  {row.isValid && !row.isDuplicate && (
                    <Badge
                      variant="outline"
                      className="bg-green-900/30 text-green-400 border-green-800"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      New
                    </Badge>
                  )}
                  {row.isValid && row.isDuplicate && (
                    <Badge
                      variant="outline"
                      className="bg-yellow-900/30 text-yellow-400 border-yellow-800"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Update
                    </Badge>
                  )}
                  {!row.isValid && (
                    <Badge
                      variant="outline"
                      className="bg-red-900/30 text-red-400 border-red-800"
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Error
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-[150px] truncate">
                  {row.data.accountName}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {row.data.useCaseSummary}
                </TableCell>
                <TableCell>{row.data.stage}</TableCell>
                <TableCell>{row.data.product}</TableCell>
                <TableCell>{row.data.priority}</TableCell>
                <TableCell>{row.data.targetDate}</TableCell>
                <TableCell>
                  {row.errors.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-red-400 cursor-help">
                            {row.errors.length} error(s)
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="left"
                          className="max-w-[300px] bg-slate-800 border-slate-700"
                        >
                          <ul className="text-sm space-y-1">
                            {row.errors.map((error, i) => (
                              <li key={i}>
                                <span className="font-medium">{error.field}:</span>{" "}
                                {error.message}
                              </li>
                            ))}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {hasMore && (
        <div className="p-3 text-center text-sm text-slate-500 bg-slate-800/50 border-t border-slate-700">
          Showing first {maxRows} of {rows.length} rows
        </div>
      )}
    </div>
  );
}
