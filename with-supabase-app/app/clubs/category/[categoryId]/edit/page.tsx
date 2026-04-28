"use client";

import { useRouter } from "next/navigation";
import Back from "@/components/ui/back";
import { ItemNameInput } from "@/components/ItemNameInput";
import { Counter } from "@/components/Counter";
import AnnotatedImage from "@/components/ui/annotatedImage";
import { BigButton } from "@/components/ui/BigButton";
import { DescriptionBox } from "@/components/ui/DescriptionBox";

export default function EditCategoryPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-base-100 text-base-content p-8 md:p-12">
      <div className="max-w-5xl mx-auto">
        <button className="btn btn-ghost btn-circle hover:bg-base-200 mb-2">
          <button onClick={() => router.back()}>
            <Back />
          </button>
        </button>
        <h1 className="text-4xl font-normal mb-2 mt-2">Edit Category</h1>
        <hr className="border-secondary border-t-2 mb-10 w-full" />

        <div className="flex flex-col md:flex-row gap-10 items-start w-full">
          <div className="flex flex-col gap-10 flex-1 w-full">
            <ItemNameInput />

            <div className="flex items-end gap-12 h-16">
              <Counter Title="Available" />
              <Counter Title="Max Quantity" />
            </div>

            <div className="flex gap-4 mt-4">
              <BigButton Title="Save" />
              <BigButton Title="Cancel" />
              <BigButton Title="Delete" Color="#dc2626" />
            </div>
          </div>

          <div className="flex-shrink-0 mt-4 md:mt-0">
            <AnnotatedImage text="Change Image" />
          </div>

          <DescriptionBox />
        </div>
      </div>
    </div>
  );
}
