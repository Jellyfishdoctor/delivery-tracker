"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "@/components/forms/ProjectForm";

export default function NewEntryPage() {
  const router = useRouter();

  const handleSuccess = () => {
    // Redirect to dashboard after successful creation
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">New Entry</h1>
          <p className="text-slate-500">Create a new project delivery entry</p>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Fill in the details for the new project delivery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
