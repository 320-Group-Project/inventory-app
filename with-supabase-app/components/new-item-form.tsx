"use client";

import { cn } from "@/lib/utils";
import PageTitle from "@/components/ui/pageTitle";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";

const CONDITIONS = ["New", "Fair", "Damaged"] as const;
type Condition = (typeof CONDITIONS)[number];

const AVAILABILITIES = ["Available", "Checked Out"] as const;
type Availability = (typeof AVAILABILITIES)[number];

export function NewItemForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const params = useParams<{ org: string; categoryId: string }>();
  const org = (params?.org ?? "").toString();
  const categoryId = (params?.categoryId ?? "").toString();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<Condition>("New");
  const [availability, setAvailability] = useState<Availability>("Available");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSubmitting(true);
    setError(null);

    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("description", description);
    fd.append("condition", condition);
    fd.append("availability", availability);
    if (imageFile) fd.append("image", imageFile);

    try {
      const res = await fetch(
        `/api/clubs/${encodeURIComponent(org)}/category/${encodeURIComponent(categoryId)}/items`,
        { method: "POST", body: fd },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create item");
        setSubmitting(false);
        return;
      }
      router.push(`/clubs/${encodeURIComponent(org)}/category/${encodeURIComponent(categoryId)}`);
    } catch {
      setError("Network error");
      setSubmitting(false);
    }
  }

  return (
    <div className={cn("max-w-5xl mx-auto bg-base-100 rounded-[2.5rem] border border-base-200 shadow-sm p-8 md:p-12", className)} {...props}>

      {/* --- Top Nav Section --- */}
      <div className="w-full mb-8">
        <PageTitle title="New Item" />
        <hr className="border-secondary border-t-[3px] mt-4 w-full" />
      </div>

      {/* --- Main Content Flex Row --- */}
      <div className="flex flex-col md:flex-row gap-10 items-start w-full mt-10">

        {/* --- Form Inputs --- */}
        <div className="flex flex-col gap-10 flex-1 w-full pl-4">

          {/* Name */}
          <div className="flex flex-col gap-2">
            <Label className="text-2xl font-normal">Item Name</Label>
            <input
              type="text"
              placeholder="Item Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-[2px] border-secondary rounded-none p-2 text-lg focus:outline-none focus:ring-1 focus:ring-secondary bg-transparent placeholder:text-base-content/40"
            />
          </div>

          {/* Condition Section */}
          <div className="flex flex-col gap-4">
            <Label className="text-2xl font-normal">Condition</Label>
            <div className="flex flex-wrap gap-x-10 gap-y-3 mt-1">
              {CONDITIONS.map((c) => (
                <div key={c} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="condition"
                    id={`cond-${c}`}
                    checked={condition === c}
                    onChange={() => setCondition(c)}
                    className="radio radio-secondary border-2 border-secondary checked:bg-secondary w-6 h-6"
                  />
                  <Label htmlFor={`cond-${c}`} className="text-xl font-normal cursor-pointer">
                    {c}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Availability Section */}
          <div className="flex flex-col gap-4">
            <Label className="text-2xl font-normal">Availability</Label>
            <div className="flex flex-wrap gap-x-10 gap-y-3 mt-1">
              {AVAILABILITIES.map((a) => (
                <div key={a} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="availability"
                    id={`avail-${a}`}
                    checked={availability === a}
                    onChange={() => setAvailability(a)}
                    className="radio radio-secondary border-2 border-secondary checked:bg-secondary w-6 h-6"
                  />
                  <Label htmlFor={`avail-${a}`} className="text-xl font-normal cursor-pointer">
                    {a}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <Button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="bg-secondary text-base-100 hover:bg-secondary/90 px-8 h-14 text-xl rounded-2xl font-normal disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              onClick={() => router.back()}
              className="bg-secondary text-base-100 hover:bg-secondary/90 px-8 h-14 text-xl rounded-2xl font-normal"
            >
              Cancel
            </Button>
          </div>

        </div>

        {/* --- Image Upload --- */}
        <div className="flex-shrink-0 mt-4 md:mt-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={pickImage}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#d9d9d9] hover:bg-[#d0d0d0] transition-colors flex items-center justify-center"
            style={{ height: 230, width: 230 }}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <svg width="66" height="66" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.75 57.75H52.25C55.2876 57.75 57.75 55.2876 57.75 52.25V13.75C57.75 10.7124 55.2876 8.25 52.25 8.25H13.75C10.7124 8.25 8.25 10.7124 8.25 13.75V52.25C8.25 55.2876 10.7124 57.75 13.75 57.75ZM13.75 57.75L44 27.5L57.75 41.25M27.5 23.375C27.5 25.6532 25.6532 27.5 23.375 27.5C21.0968 27.5 19.25 25.6532 19.25 23.375C19.25 21.0968 21.0968 19.25 23.375 19.25C25.6532 19.25 27.5 21.0968 27.5 23.375Z" stroke="#1E1E1E" strokeWidth="5.775" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <div style={{ backgroundColor: "#C5C5C5", height: 68, width: 230, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <p className="text-xl">{imageFile ? imageFile.name : "Upload Image"}</p>
          </div>
        </div>

        {/* --- Item Description --- */}
        <div className="flex-shrink-0 w-full md:w-64 h-52 mt-4 md:mt-0">
          <textarea
            placeholder="Item Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-full border-[2px] border-secondary rounded-none p-3 text-base focus:outline-none focus:ring-1 focus:ring-secondary bg-transparent placeholder:text-base-content/50 resize-none"
          ></textarea>
        </div>

      </div>
    </div>
  );
}
