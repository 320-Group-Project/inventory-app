"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";
import { Plus, Search, Settings } from "lucide-react";
import Back from "@/components/ui/back";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/ui/navbar";

type Category = {
  item_cat_id: number;
  name: string;
  description: string | null;
  quantity: string;
  item_cat_image_url: string | null;
  available_count: number;
  total_count: number;
};

function ClubDashboardPage() {
  const router = useRouter();
  const params = useParams<{ org: string }>();
  const org = (params?.org ?? "").toString();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!org) return;

    async function load() {
      try {
        const [catRes, roleRes] = await Promise.all([
          fetch(`/api/clubs/${org}/category`),
          fetch(`/api/clubs/${org}/members/me`),
        ]);

        if (catRes.ok) {
          const data = await catRes.json();
          setCategories(data.categories ?? []);
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
  }, [org]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [query, categories]);

  return (
    <><Navbar />
    <div className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-full rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-md sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="shrink-0 -ml-2">
            <Back onClick={() => router.push("/dashboard")} />
          </div>

          <div className="relative min-w-0 flex-1">
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Category name"
              className="w-full rounded-full border-border bg-base-100 pr-10 pl-4 text-sm"
              aria-label="Search categories"
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
              <span className="hidden max-w-[4.5rem] text-[10px] leading-tight text-muted-foreground sm:block">
                Admin
              </span>
              <Link
                href={`/clubs/${encodeURIComponent(org)}/settings`}
                className="btn btn-circle btn-ghost btn-sm text-base-content"
                aria-label="Club settings"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <Link
                href={`/clubs/category/new?from=/dashboard/${encodeURIComponent(org)}`}
                className="btn btn-circle btn-ghost btn-sm text-base-content"
                aria-label="New category">
                <Plus className="h-5 w-5" />
              </Link>
            </div>
          ) : null}
        </div>

        <hr className="my-4 border-border" />

        {loading ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">Loading...</p>
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {filtered.map((cat) => (
                <li key={cat.item_cat_id} className="flex items-center gap-2">
                  <Link
                    href={`/clubs/category/${cat.item_cat_id}`}
                    className="flex min-w-0 flex-1 items-center justify-between rounded-lg bg-base-200 px-3 py-3 transition hover:bg-base-300 sm:px-4"
                  >
                    <span className="min-w-0 truncate text-sm font-medium">{cat.name}</span>
                    <span className="shrink-0 pl-3 text-sm text-muted-foreground">
                      {cat.available_count}/{cat.total_count} Available
                    </span>
                  </Link>
                  {isAdmin && (
                    <Link
                      href={`/clubs/category/${cat.item_cat_id}/edit`}
                      className="btn btn-square btn-ghost btn-sm shrink-0 text-base-content"
                      aria-label={`Settings for ${cat.name}`}
                    >
                      <Settings className="h-4 w-4" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            {filtered.length === 0 && (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {categories.length === 0 ? "No categories yet." : "No categories match your search."}
              </p>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <ClubDashboardPage />
    </Suspense>
  );
}
