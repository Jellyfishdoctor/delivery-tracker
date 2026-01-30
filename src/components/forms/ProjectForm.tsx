"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  accountManagerId: z.string().min(1, "Account manager is required"),
  accountNameId: z.string().optional(),
  accountNameNew: z.string().optional(),
  stage: z.enum(["POC", "ONBOARDING", "PRODUCTION"]),
  product: z.enum(["ANALYTICS", "AI_AGENT"]),
  spoc: z.string().min(1, "SPOC is required"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  useCaseSummary: z.string().min(1, "Use case summary is required"),
  targetDate: z.date({ required_error: "Target date is required" }),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "BLOCKED"]),
  jiraTicket: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface AccountName {
  id: string;
  name: string;
}

interface ProjectFormProps {
  initialData?: FormData & { id?: string };
  onSuccess?: () => void;
  mode?: "create" | "edit";
}

export function ProjectForm({ initialData, onSuccess, mode = "create" }: ProjectFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [accountNames, setAccountNames] = useState<AccountName[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [accountManagerOpen, setAccountManagerOpen] = useState(false);
  const [accountNameOpen, setAccountNameOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      accountManagerId: "",
      accountNameId: "",
      stage: "POC",
      product: "ANALYTICS",
      spoc: "",
      priority: "MEDIUM",
      useCaseSummary: "",
      status: "NOT_STARTED",
      jiraTicket: "",
    },
  });

  useEffect(() => {
    fetchUsers();
    fetchAccountNames();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchAccountNames = async () => {
    try {
      const response = await fetch("/api/account-names");
      if (response.ok) {
        const data = await response.json();
        setAccountNames(data);
      }
    } catch (error) {
      console.error("Error fetching account names:", error);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const url = mode === "edit" && initialData?.id
        ? `/api/projects/${initialData.id}`
        : "/api/projects";

      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          targetDate: data.targetDate.toISOString(),
          accountNameNew: newAccountName || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save project");
      }

      toast({
        title: "Success",
        description: mode === "edit" ? "Project updated successfully" : "Project created successfully",
      });

      if (mode === "create") {
        form.reset();
        setNewAccountName("");
      }

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedUser = users.find((u) => u.id === form.watch("accountManagerId"));
  const selectedAccountName = accountNames.find((a) => a.id === form.watch("accountNameId"));

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Manager */}
        <div className="space-y-2">
          <Label>Account Manager *</Label>
          <Popover open={accountManagerOpen} onOpenChange={setAccountManagerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={accountManagerOpen}
                className="w-full justify-between"
              >
                {selectedUser ? (
                  <span>{selectedUser.name || selectedUser.email}</span>
                ) : (
                  <span className="text-muted-foreground">Select account manager...</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search users..." />
                <CommandList>
                  <CommandEmpty>No user found.</CommandEmpty>
                  <CommandGroup>
                    {users.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.name || user.email}
                        onSelect={() => {
                          form.setValue("accountManagerId", user.id);
                          setAccountManagerOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            form.watch("accountManagerId") === user.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div>
                          <div>{user.name || "No name"}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {form.formState.errors.accountManagerId && (
            <p className="text-sm text-red-500">{form.formState.errors.accountManagerId.message}</p>
          )}
        </div>

        {/* Account Name */}
        <div className="space-y-2">
          <Label>Account Name *</Label>
          <Popover open={accountNameOpen} onOpenChange={setAccountNameOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={accountNameOpen}
                className="w-full justify-between"
              >
                {newAccountName || selectedAccountName?.name || (
                  <span className="text-muted-foreground">Select or type account name...</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search or create account..."
                  value={newAccountName}
                  onValueChange={setNewAccountName}
                />
                <CommandList>
                  <CommandEmpty>
                    {newAccountName && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          form.setValue("accountNameId", "");
                          setAccountNameOpen(false);
                        }}
                      >
                        Create &quot;{newAccountName}&quot;
                      </Button>
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {accountNames.map((account) => (
                      <CommandItem
                        key={account.id}
                        value={account.name}
                        onSelect={() => {
                          form.setValue("accountNameId", account.id);
                          setNewAccountName("");
                          setAccountNameOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            form.watch("accountNameId") === account.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {account.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Stage */}
        <div className="space-y-2">
          <Label>Stage *</Label>
          <RadioGroup
            value={form.watch("stage")}
            onValueChange={(value) => form.setValue("stage", value as FormData["stage"])}
            className="flex gap-4"
          >
            {["POC", "ONBOARDING", "PRODUCTION"].map((stage) => (
              <div key={stage} className="flex items-center space-x-2">
                <RadioGroupItem value={stage} id={`stage-${stage}`} />
                <Label htmlFor={`stage-${stage}`} className="font-normal cursor-pointer">
                  {stage === "POC" ? "POC" : stage.charAt(0) + stage.slice(1).toLowerCase()}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Product */}
        <div className="space-y-2">
          <Label>Product *</Label>
          <RadioGroup
            value={form.watch("product")}
            onValueChange={(value) => form.setValue("product", value as FormData["product"])}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ANALYTICS" id="product-analytics" />
              <Label htmlFor="product-analytics" className="font-normal cursor-pointer">Analytics</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="AI_AGENT" id="product-ai" />
              <Label htmlFor="product-ai" className="font-normal cursor-pointer">AI Agent</Label>
            </div>
          </RadioGroup>
        </div>

        {/* SPOC */}
        <div className="space-y-2">
          <Label htmlFor="spoc">SPOC (Client Contact) *</Label>
          <Input
            id="spoc"
            {...form.register("spoc")}
            placeholder="Enter client's point of contact"
          />
          {form.formState.errors.spoc && (
            <p className="text-sm text-red-500">{form.formState.errors.spoc.message}</p>
          )}
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label>Priority *</Label>
          <Select
            value={form.watch("priority")}
            onValueChange={(value) => form.setValue("priority", value as FormData["priority"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HIGH">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  High
                </div>
              </SelectItem>
              <SelectItem value="MEDIUM">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  Medium
                </div>
              </SelectItem>
              <SelectItem value="LOW">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Low
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Target Date */}
        <div className="space-y-2">
          <Label>Target Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !form.watch("targetDate") && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch("targetDate") ? (
                  format(form.watch("targetDate"), "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.watch("targetDate")}
                onSelect={(date) => date && form.setValue("targetDate", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {form.formState.errors.targetDate && (
            <p className="text-sm text-red-500">{form.formState.errors.targetDate.message}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Status *</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(value) => form.setValue("status", value as FormData["status"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NOT_STARTED">Not Started</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Jira Ticket */}
        <div className="space-y-2">
          <Label htmlFor="jiraTicket">Jira Ticket (Optional)</Label>
          <Input
            id="jiraTicket"
            {...form.register("jiraTicket")}
            placeholder="Enter ticket ID or URL"
          />
        </div>
      </div>

      {/* Use Case Summary */}
      <div className="space-y-2">
        <Label htmlFor="useCaseSummary">Use Case Summary *</Label>
        <Textarea
          id="useCaseSummary"
          {...form.register("useCaseSummary")}
          placeholder="Describe the project use case..."
          rows={4}
        />
        {form.formState.errors.useCaseSummary && (
          <p className="text-sm text-red-500">{form.formState.errors.useCaseSummary.message}</p>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : mode === "edit" ? "Update Project" : "Create Project"}
        </Button>
        {mode === "create" && (
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Clear Form
          </Button>
        )}
      </div>
    </form>
  );
}
