import { Suspense } from "react";
import { NewItemForm } from "@/components/new-item-form";
import Navbar from "@/components/ui/navbar";

export default function NewItemPage() {
  return (
    <><Navbar />
    <Suspense fallback={<div className="p-8 text-xl">Loading form...</div>}>
      <NewItemForm />
    </Suspense></>
  );
}
