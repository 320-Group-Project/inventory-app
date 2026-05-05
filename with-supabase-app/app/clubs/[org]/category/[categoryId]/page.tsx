"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";
import { Plus, Search, Settings, X } from "lucide-react";
import Back from "@/components/ui/back";
import Navbar from "@/components/ui/navbar";

type Item = {
  item_id: number;
  name: string | null;
  description: string | null;
  condition: string | null;
  availability: string | null;
  item_image_url: string | null;
};

const conditionColor: Record<string, string> = {
  New:     "text-emerald-500",
  Fair:    "text-amber-500",
  Damaged: "text-red-500",
};

function CategoryPage() {
  const router = useRouter();
  const params = useParams<{ org: string; categoryId: string }>();
  const org = (params?.org ?? "").toString();
  const categoryId = (params?.categoryId ?? "").toString();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Item | null>(null);

  useEffect(() => {
    if (!org || !categoryId) return;

    async function load() {
      try {
        const [itemsRes, roleRes] = await Promise.all([
          fetch(`/api/clubs/${encodeURIComponent(org)}/category/${encodeURIComponent(categoryId)}/items`),
          fetch(`/api/clubs/${encodeURIComponent(org)}/members/me`),
        ]);

        if (itemsRes.ok) {
          const data = await itemsRes.json();
          setItems(data.items ?? []);
        }

        if (roleRes.ok) {
          const data = await roleRes.json();
          setIsAdmin(['Admin', 'Owner'].includes(data.role ?? ''));
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [org, categoryId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      (item.name ?? "").toLowerCase().includes(q) ||
      (item.description ?? "").toLowerCase().includes(q)
    );
  }, [query, items]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-full rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-md sm:p-6">

          {/* Top bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="shrink-0 -ml-2">
              <Back onClick={() => router.back()} />
            </div>

            <div className="relative min-w-0 flex-1">
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Item name"
                className="w-full rounded-full border-border bg-base-100 pr-10 pl-4 text-sm"
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
                  href={`/clubs/${encodeURIComponent(org)}/category/${encodeURIComponent(categoryId)}/item/new`}
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
          {loading ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              No items match your search.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filtered.map((item) => {
                const available = item.availability === "Available";
                return (
                  <li key={item.item_id} className="group relative">
                    <button
                      type="button"
                      className="block w-full overflow-hidden rounded-xl bg-base-200 text-left transition hover:bg-base-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      onClick={() => setSelected(item)}
                    >
                      {/* Picture area */}
                      <div className="relative aspect-[3/4] w-full bg-neutral-300 dark:bg-neutral-600">
                        {item.item_image_url ? (
                          <img
                            src={item.item_image_url}
                            alt={item.name ?? `Item ${item.item_id}`}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>

                      {/* Info strip */}
                      <div className="px-2 py-2 text-xs leading-tight">
                        <p className="text-base-content font-medium truncate">{item.name ?? `Item ${item.item_id}`}</p>
                        <p className={available ? "text-emerald-500" : "text-muted-foreground"}>
                          {available ? "Available" : "Checked Out"}
                        </p>
                        <p className="text-muted-foreground">{item.condition}</p>
                      </div>
                    </button>

                    {/* Gear — shown on hover */}
                    {isAdmin && (
                      <Link
                        href={`/clubs/${encodeURIComponent(org)}/category/${encodeURIComponent(categoryId)}/item/${encodeURIComponent(String(item.item_id))}/edit`}
                        className="absolute bottom-1 right-1 rounded-full p-1 text-base-content opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                        aria-label={`Settings for ${item.name ?? `item ${item.item_id}`}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Settings className="h-5 w-5" />
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Item detail popup */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-3xl rounded-2xl bg-card text-card-foreground border border-border shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              className="absolute right-4 top-4 z-10 btn btn-circle btn-ghost btn-sm"
              aria-label="Close"
              onClick={() => setSelected(null)}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Description (left) + Image (right) */}
            <div className="flex flex-col sm:flex-row min-h-80">
              <div className="flex flex-1 flex-col justify-between p-8">
                <div>
                  <h2 className="mb-4 text-2xl font-bold">{selected.name ?? `Item #${selected.item_id}`}</h2>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {selected.description}
                  </p>
                </div>
                <div className="mt-8">
                  <span
                    className={`inline-block rounded-full border px-4 py-1.5 text-sm font-semibold ${
                      selected.availability === "Available"
                        ? "border-emerald-400 text-emerald-500"
                        : "border-muted-foreground text-muted-foreground"
                    }`}
                  >
                    {selected.availability === "Available" ? "Available" : "Checked Out"}
                  </span>
                </div>
              </div>

              <div className="w-full sm:w-64 shrink-0 aspect-[3/4] bg-neutral-300 dark:bg-neutral-600">
                {selected.item_image_url ? (
                  <img
                    src={selected.item_image_url}
                    alt={selected.name ?? `Item ${selected.item_id}`}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
            </div>

            {/* Condition at bottom */}
            <div className="border-t border-border px-8 py-4 flex items-center gap-3">
              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                Condition
              </span>
              <span className={`text-base font-semibold ${selected.condition ? (conditionColor[selected.condition] ?? "text-base-content") : "text-base-content"}`}>
                {selected.condition}
              </span>
            </div>
          </div>
        </div>
      )}
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
