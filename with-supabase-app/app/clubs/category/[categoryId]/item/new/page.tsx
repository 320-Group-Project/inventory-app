import { Suspense } from "react";
import { NewItemForm } from "@/components/new-item-form";

export default function NewItemPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xl">Loading form...</div>}>
      <NewItemForm />
    </Suspense>
  );
}