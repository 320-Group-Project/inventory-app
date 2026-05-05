"use client";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export function NewCategoryContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const params = useParams<{ org: string }>();
  const org = (params?.org ?? "").toString();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDistinct, setIsDistinct] = useState(true);
  const [quantity, setQuantity] = useState(1);
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
    fd.append("quantity", isDistinct ? "1" : String(quantity));
    if (imageFile) fd.append("image", imageFile);

    try {
      const res = await fetch(`/api/clubs/${encodeURIComponent(org)}/category`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create category");
        setSubmitting(false);
        return;
      }
      router.push(`/dashboard/${encodeURIComponent(org)}`);
    } catch {
      setError("Network error");
      setSubmitting(false);
    }
  }

  return (
    <div className={cn("flex flex-col md:flex-row gap-10 items-start w-full", className)} {...props}>

      <div className="flex flex-col gap-10 flex-1 w-full">

        <div className="flex flex-col gap-2">
          <label className="text-xl">Category Name</label>
          <input
            type="text"
            placeholder="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border-[2px] border-secondary rounded-none p-2 text-lg focus:outline-none focus:ring-1 focus:ring-secondary bg-transparent placeholder:text-base-content/40"
          />
        </div>

        <div className="flex items-end gap-12 h-16">
          <div className="flex items-center gap-3 mb-1">
            <Checkbox
              id="distinct"
              checked={isDistinct}
              onCheckedChange={(checked) => setIsDistinct(!!checked)}
              className="w-6 h-6 border-2 border-secondary rounded-sm data-[state=checked]:bg-secondary data-[state=checked]:text-base-100"
            />
            <label htmlFor="distinct" className="text-xl cursor-pointer">
              Distinct Items
            </label>
          </div>

          {!isDistinct && (
            <div className="flex flex-col items-center gap-1">
              <label className="text-lg">Quantity</label>
              <div className="flex items-center h-8">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="bg-base-200 hover:bg-base-300 h-full px-3 text-xl flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 h-full border-[2px] border-secondary rounded-none text-center text-lg focus:outline-none bg-transparent m-0 appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="bg-base-200 hover:bg-base-300 h-full px-3 text-xl flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-4 mt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting}
            className="btn btn-secondary text-base-100 text-xl px-8 rounded-xl font-normal h-14 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary text-base-100 text-xl px-8 rounded-xl font-normal h-14"
          >
            Cancel
          </button>
        </div>
      </div>

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

      <div className="flex-shrink-0 w-full md:w-64 h-74 mt-4 md:mt-0">
        <textarea
          placeholder="Category Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full h-full min-h-52 border-[2px] border-secondary rounded-none p-3 text-base focus:outline-none focus:ring-1 focus:ring-secondary bg-transparent placeholder:text-base-content/50 resize-none"
        ></textarea>
      </div>

    </div>
  );
}
