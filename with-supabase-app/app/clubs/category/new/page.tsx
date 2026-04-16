import { NewCategoryContent } from "@/components/new-category";
import Back from "@/components/ui/back";

export default function NewCategoryPage() {
  return (
    <div className="min-h-screen bg-base-100 text-base-content p-8 md:p-12">
      <div className="max-w-5xl mx-auto">
        <button className="btn btn-ghost btn-circle hover:bg-base-200 mb-2">
          <Back />
        </button> 
        <h1 className="text-4xl font-normal mb-2 mt-2">New Category</h1>
        <hr className="border-secondary border-t-2 mb-10 w-full" />
        <NewCategoryContent />
      </div>
    </div>
  );
}