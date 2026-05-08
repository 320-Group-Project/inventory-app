"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/ui/navbar";

function EditCategoryContent() {
  const router = useRouter();
  const params = useParams<{ org: string; categoryId: string }>();
  const org = (params?.org ?? "").toString();
  const categoryId = (params?.categoryId ?? "").toString();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!org || !categoryId) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `/api/clubs/${encodeURIComponent(org)}/category/${encodeURIComponent(categoryId)}`,
        );
        if (cancelled) return;
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (!cancelled) setLoadError(data.error ?? "Failed to load category");
          return;
        }
        const { category } = await res.json();
        if (cancelled) return;
        setName(category.name ?? "");
        setDescription(category.description ?? "");
        setQuantity(category.quantity ?? "1");
        if (category.item_cat_image_url) setImagePreview(category.item_cat_image_url);
      } catch {
        if (!cancelled) setLoadError("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [org, categoryId]);

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
    fd.append("quantity", quantity);
    if (imageFile) fd.append("image", imageFile);

    try {
      const res = await fetch(
        `/api/clubs/${encodeURIComponent(org)}/category/${encodeURIComponent(categoryId)}`,
        { method: "PATCH", body: fd },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error ?? "Failed to save");
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
      router.refresh();
      router.replace(`/dashboard/${encodeURIComponent(org)}`);
    } catch {
      setSaveError("Network error");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this category and all its items? This cannot be undone.")) return;
    setSubmitting(true);
    setSaveError(null);

    try {
      const res = await fetch(
        `/api/clubs/${encodeURIComponent(org)}/category/${encodeURIComponent(categoryId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error ?? "Failed to delete");
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
      router.refresh();
      router.replace(`/dashboard/${encodeURIComponent(org)}`);
    } catch {
      setSaveError("Network error");
      setSubmitting(false);
    }
  }

  return (
    <><Navbar />
    <div className="min-h-screen bg-base-100 text-base-content p-8 md:p-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-normal mb-2">Edit Category</h1>
        <hr className="border-secondary border-t-[3px] mt-4 mb-10 w-full" />

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : loadError ? (
          <p className="text-sm text-red-500">{loadError}</p>
        ) : (
          <div className="flex flex-col md:flex-row gap-10 items-start w-full">

            {/* Left: fields + buttons */}
            <div className="flex flex-col gap-10 flex-1 w-full">

              {/* Name */}
              <div className="flex flex-col gap-2">
                <label className="text-2xl font-normal">Category Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-[2px] border-secondary rounded-none p-2 text-lg focus:outline-none focus:ring-1 focus:ring-secondary bg-transparent placeholder:text-base-content/40"
                />
              </div>

              {/* Quantity */}
              <div className="flex flex-col gap-2">
                <label className="text-2xl font-normal">Quantity</label>
                <div className="flex items-center h-10 w-fit">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => String(Math.max(1, (parseInt(q) || 1) - 1)))}
                    disabled={quantity === "1"}
                    className="bg-base-200 hover:bg-base-300 h-full px-4 text-xl flex items-center justify-center transition-colors disabled:opacity-40"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(String(Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-16 h-full border-[2px] border-secondary rounded-none text-center text-lg focus:outline-none bg-transparent appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => String((parseInt(q) || 1) + 1))}
                    className="bg-base-200 hover:bg-base-300 h-full px-4 text-xl flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {saveError && <p className="text-sm text-red-500">{saveError}</p>}

              {/* Buttons */}
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
                  disabled={submitting}
                  className="btn btn-secondary text-base-100 text-xl px-8 rounded-xl font-normal h-14 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="btn text-base-100 text-xl px-8 rounded-xl font-normal h-14 disabled:opacity-60"
                  style={{ backgroundColor: "#dc2626" }}
                >
                  Delete
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
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <svg width="66" height="66" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.75 57.75H52.25C55.2876 57.75 57.75 55.2876 57.75 52.25V13.75C57.75 10.7124 55.2876 8.25 52.25 8.25H13.75C10.7124 8.25 8.25 10.7124 8.25 13.75V52.25C8.25 55.2876 10.7124 57.75 13.75 57.75ZM13.75 57.75L44 27.5L57.75 41.25M27.5 23.375C27.5 25.6532 25.6532 27.5 23.375 27.5C21.0968 27.5 19.25 25.6532 19.25 23.375C19.25 21.0968 21.0968 19.25 23.375 19.25C25.6532 19.25 27.5 21.0968 27.5 23.375Z" stroke="#1E1E1E" strokeWidth="5.775" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <div style={{ backgroundColor: "#C5C5C5", height: 68, width: 230, display: "flex", justifyContent: "center", alignItems: "center" }}>
                <p className="text-xl">{imageFile ? imageFile.name : "Change Image"}</p>
              </div>
            </div>

            {/* Description */}
            <div className="flex-shrink-0 w-full md:w-64 mt-4 md:mt-0">
              <label className="text-2xl font-normal block mb-2">Description</label>
              <textarea
                placeholder="Category Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-52 border-[2px] border-secondary rounded-none p-3 text-base focus:outline-none focus:ring-1 focus:ring-secondary bg-transparent placeholder:text-base-content/50 resize-none"
              />
            </div>

          </div>
        )}
      </div>
    </div></>
  );
}

export default function EditCategoryPage() {
  return (
    <Suspense>
      <EditCategoryContent />
    </Suspense>
  );
}
