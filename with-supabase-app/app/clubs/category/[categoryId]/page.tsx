"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState, Suspense } from "react";
import { ArrowLeft, Plus, Search, Settings } from "lucide-react";
import Navbar from "@/components/ui/navbar";

type ItemCopy = {
  id: string;
  picture: string | null;
  available: boolean;
  condition: string;
};

const PLACEHOLDER_ITEMS: ItemCopy[] = [
  { id: "1", picture: null, available: true, condition: "Good" },
  { id: "2", picture: null, available: true, condition: "Fair" },
  { id: "3", picture: null, available: false, condition: "Poor" },
  { id: "4", picture: null, available: true, condition: "Good" },
  { id: "5", picture: null, available: true, condition: "Good" },
  { id: "6", picture: null, available: false, condition: "Fair" },
  { id: "7", picture: null, available: true, condition: "Good" },
  { id: "8", picture: null, available: true, condition: "Good" },
  { id: "9", picture: null, available: false, condition: "Poor" },
  { id: "10", picture: null, available: true, condition: "Fair" },
];

const isAdmin = true;

function CategoryPage() {
  const router = useRouter();
  const params = useParams<{ categoryId: string }>();
  const categoryId = (params?.categoryId ?? "").toString();

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PLACEHOLDER_ITEMS;
    return PLACEHOLDER_ITEMS.filter((item) =>
      item.condition.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-full rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-md sm:p-6">

          {/* Top bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="btn btn-circle btn-ghost btn-sm shrink-0 text-base-content"
              aria-label="Back"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="relative min-w-0 flex-1">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Item name"
                className="input input-bordered w-full rounded-full border-border bg-base-100 pr-10 pl-4 text-sm"
                aria-label="Search items"
              />
              <Search
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
            </div>

            {isAdmin ? (
              <div
                className="flex shrink-0 items-center gap-1"
                title="Only admins can see these actions"
              >
                <span className="hidden max-w-[5.5rem] text-[10px] leading-tight text-muted-foreground sm:block">
                  only staff can see
                </span>
                <Link
                  href={`/clubs/category/${encodeURIComponent(categoryId)}/item/new`}
                  className="btn btn-circle btn-ghost btn-sm text-base-content"
                  aria-label="New item"
                >
                  <Plus className="h-5 w-5" />
                </Link>
              </div>
            ) : null}
          </div>

          <hr className="my-4 border-border" />

          {/* Item grid */}
          {filtered.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              No items match your search.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filtered.map((item) => (
                <li key={item.id} className="group relative">
                  <Link
                    href={`/clubs/category/${encodeURIComponent(categoryId)}/item/${encodeURIComponent(item.id)}`}
                    className="block overflow-hidden rounded-xl bg-base-200 transition hover:bg-base-300"
                  >
                    {/* Picture area */}
                    <div className="relative aspect-[3/4] w-full bg-neutral-300 dark:bg-neutral-600">
                      {item.picture ? (
                        <img
                          src={item.picture}
                          alt={`Item ${item.id}`}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>

                    {/* Info strip */}
                    <div className="px-2 py-2 text-xs leading-tight">
                      <p className={item.available ? "text-base-content font-medium" : "text-muted-foreground font-medium"}>
                        {item.available ? "Available" : "Unavailable"}
                      </p>
                      <p className="text-muted-foreground">{item.condition}</p>
                    </div>
                  </Link>

                  {/* Gear — shown on hover (always visible on touch devices) */}
                  <Link
                    href={`/clubs/category/${encodeURIComponent(categoryId)}/item/${encodeURIComponent(item.id)}/edit`}
                    className="absolute bottom-1 right-1 rounded-full p-1 text-base-content opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Settings for item ${item.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Settings className="h-5 w-5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <CategoryPage />
    </Suspense>
  );
}
