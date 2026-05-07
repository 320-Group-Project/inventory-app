import { Suspense } from "react";
import { NewItemForm } from "@/components/new-item-form";

export default function NewItemPage() {
  return (
    <div className="min-h-screen bg-base-100 text-base-content p-4 md:p-8 flex items-center justify-center">
      <Suspense fallback={<div className="text-xl">Loading form...</div>}>
        <NewItemForm className="w-full" />
      </Suspense>
    </div>
  );
}