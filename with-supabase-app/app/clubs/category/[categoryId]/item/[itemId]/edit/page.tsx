"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Back from "@/components/ui/back";
import AnnotatedImage from "@/components/ui/annotatedImage";
import { BigButton } from "@/components/ui/BigButton";
import { DescriptionBox } from "@/components/ui/DescriptionBox";

const CONDITIONS = ["New", "Fair", "Damaged"] as const;
type Condition = (typeof CONDITIONS)[number];

export default function EditItemCopyPage() {
  const router = useRouter();

  const [condition, setCondition] = useState<Condition>("New");
  const [available, setAvailable] = useState(true);

  return (
    <div className="min-h-screen bg-base-100 text-base-content p-8 md:p-12">
      <div className="max-w-5xl mx-auto">
        <button className="btn btn-ghost btn-circle hover:bg-base-200 mb-2" onClick={() => router.back()}>
          <Back />
        </button>
        <h1 className="text-4xl font-normal mb-2 mt-2">Edit Item</h1>
        <hr className="border-base-300 border-t mb-10 w-full" />

        <div className="flex flex-col md:flex-row gap-10 items-start w-full">
          {/* Left: fields + buttons */}
          <div className="flex flex-col gap-8 flex-1 w-full">

            {/* Condition */}
            <div className="flex flex-col gap-3">
              <span className="text-base font-medium">Condition</span>
              <div className="flex gap-6">
                {CONDITIONS.map((c) => (
                  <label key={c} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="condition"
                      value={c}
                      checked={condition === c}
                      onChange={() => setCondition(c)}
                      className="radio radio-sm"
                    />
                    <span className="text-sm">{c}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="flex flex-col gap-3">
              <span className="text-base font-medium">Availability</span>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    checked={available}
                    onChange={() => setAvailable(true)}
                    className="radio radio-sm"
                  />
                  <span className="text-sm">Available</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    checked={!available}
                    onChange={() => setAvailable(false)}
                    className="radio radio-sm"
                  />
                  <span className="text-sm">Checked Out</span>
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mt-2">
              <BigButton Title="Save" />
              <BigButton Title="Cancel" />
              <BigButton Title="Delete" Color="#dc2626" />
            </div>
          </div>

          {/* Image */}
          <div className="flex-shrink-0 mt-4 md:mt-0">
            <AnnotatedImage text="Change Image" />
          </div>

          {/* Description */}
          <DescriptionBox />
        </div>
      </div>
    </div>
  );
}
