import { NewItemForm } from "@/components/new-item-form";

export default function NewItemPage() {
  return (
    <div className="min-h-screen bg-base-100 text-base-content p-4 md:p-8 flex items-center justify-center">
      <NewItemForm className="w-full" />
    </div>
  );
}