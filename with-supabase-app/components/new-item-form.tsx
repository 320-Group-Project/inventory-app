"use client";

import Back from "@/components/ui/back";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";

const CONDITIONS = ["New", "Fair", "Damaged"] as const;
type Condition = (typeof CONDITIONS)[number];

export function NewItemForm() {
  const router = useRouter();
  const params = useParams<{ org: string; categoryId: string }>();
  const org = (params?.org ?? "").toString();
  const categoryId = (params?.categoryId ?? "").toString();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<Condition>("New");
  const [available, setAvailable] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSave() {
    if (!name.trim()) {
      setSaveError("Name is required");
      return;
    }
    setSubmitting(true);
    setSaveError(null);

    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("description", description);
    fd.append("condition", condition);
    fd.append("availability", available ? "Available" : "Checked Out");
    if (imageFile) fd.append("image", imageFile);

    try {
      const res = await fetch(
        `/api/clubs/${encodeURIComponent(org)}/category/${encodeURIComponent(categoryId)}/items`,
        { method: "POST", body: fd },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error ?? "Failed to create item");
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
      router.refresh();
      router.replace(`/clubs/${encodeURIComponent(org)}/category/${encodeURIComponent(categoryId)}`);
    } catch {
      setSaveError("Network error");
      setSubmitting(false);
    }
  }

  function handleCancel() {
    router.replace(`/clubs/${encodeURIComponent(org)}/category/${encodeURIComponent(categoryId)}`);
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content p-8 md:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-2">
          <Back onClick={() => router.back()} />
        </div>
        <h1 className="text-4xl font-normal mb-2 mt-2">New Item</h1>
        <hr className="border-base-300 border-t mb-10 w-full" />

        <div className="flex flex-col md:flex-row gap-10 items-start w-full">
          {/* Left: fields + buttons */}
          <div className="flex flex-col gap-8 flex-1 w-full">

            {/* Name */}
            <div className="flex flex-col gap-2">
              <span className="text-base font-medium">Item Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-[2px] border-secondary rounded-none p-2 text-lg focus:outline-none focus:ring-1 focus:ring-secondary bg-transparent placeholder:text-base-content/40"
              />
            </div>

            {/* Condition */}
            <div className="flex flex-col gap-3">
              <span className="text-base font-medium">Condition</span>
              <div className="flex gap-6">
                {CONDITIONS.map((c) => (
                  <label key={c} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={c}
                      checked={condition === c}
                      onChange={(e) => setCondition(e.target.value as Condition)}
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
                    value="Available"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.value === "Available")}
                    className="radio radio-sm"
                  />
                  <span className="text-sm">Available</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="Checked Out"
                    checked={!available}
                    onChange={(e) => setAvailable(e.target.value === "Available")}
                    className="radio radio-sm"
                  />
                  <span className="text-sm">Checked Out</span>
                </label>
              </div>
            </div>

            {saveError && <p className="text-sm text-red-500">{saveError}</p>}

            {/* Buttons */}
            <div className="flex gap-4 mt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={submitting}
                className="btn btn-secondary text-base-100 text-xl px-8 rounded-xl font-normal h-14 disabled:opacity-60"
                style={{ backgroundColor: "#222222" }}
              >
                {submitting ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="btn btn-secondary text-base-100 text-xl px-8 rounded-xl font-normal h-14 disabled:opacity-60"
                style={{ backgroundColor: "#222222" }}
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Image */}
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
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <svg width="66" height="66" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.75 57.75H52.25C55.2876 57.75 57.75 55.2876 57.75 52.25V13.75C57.75 10.7124 55.2876 8.25 52.25 8.25H13.75C10.7124 8.25 8.25 10.7124 8.25 13.75V52.25C8.25 55.2876 10.7124 57.75 13.75 57.75ZM13.75 57.75L44 27.5L57.75 41.25M27.5 23.375C27.5 25.6532 25.6532 27.5 23.375 27.5C21.0968 27.5 19.25 25.6532 19.25 23.375C19.25 21.0968 21.0968 19.25 23.375 19.25C25.6532 19.25 27.5 21.0968 27.5 23.375Z" stroke="#1E1E1E" strokeWidth="5.775" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ backgroundColor: "#C5C5C5", height: 68, width: 230, display: "flex", justifyContent: "center", alignItems: "center" }}
              className="hover:opacity-90 transition-opacity"
            >
              <p className="text-xl">{imageFile ? imageFile.name : "Upload Image"}</p>
            </button>
          </div>

          {/* Description */}
          <div className="flex-shrink-0 w-full md:w-64 h-74 mt-4 md:mt-0">
            <textarea
              placeholder="Item Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-full min-h-72 border-[2px] border-secondary rounded-none p-3 text-base focus:outline-none focus:ring-1 focus:ring-secondary bg-transparent placeholder:text-base-content/50 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
