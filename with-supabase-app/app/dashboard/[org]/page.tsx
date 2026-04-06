"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Search, Settings } from "lucide-react";

type PlaceholderRow = {
  id: string;
  name: string;
  available: number;
  total: number;
  categoryId: string;
};

const PLACEHOLDER_ROWS: PlaceholderRow[] = [
  { id: "1", name: "Event banners", available: 6, total: 10, categoryId: "demo-cat-1" },
  { id: "2", name: "Snacks inventory", available: 4, total: 12, categoryId: "demo-cat-2" },
  { id: "3", name: "Name tags", available: 18, total: 20, categoryId: "demo-cat-3" },
  { id: "4", name: "A/V cables", available: 2, total: 8, categoryId: "demo-cat-4" },
  { id: "5", name: "Tablecloths", available: 0, total: 6, categoryId: "demo-cat-5" },
  { id: "6", name: "Club merch", available: 11, total: 15, categoryId: "demo-cat-6" },
];

/** Example: treat viewer as admin so settings / + show swap for real auth later. */
const isAdmin = true;

export default function ClubDashboardPage() {
  const router = useRouter();
  const params = useParams<{ org: string }>();
  const org = (params?.org ?? "").toString();
  const orgLower = org.toLowerCase();

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PLACEHOLDER_ROWS;
    return PLACEHOLDER_ROWS.filter((row) => row.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-full rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-md sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="btn btn-circle btn-ghost btn-sm shrink-0 text-base-content"
            aria-label="Back"
            onClick={() => router.push("/dashboard")}
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
              <span className="hidden max-w-[4.5rem] text-[10px] leading-tight text-muted-foreground sm:block">
                Admin
              </span>
              <Link
                href={`/clubs/${encodeURIComponent(orgLower)}/settings`}
                className="btn btn-circle btn-ghost btn-sm text-base-content"
                aria-label="Club settings"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <Link
                href="/clubs/category/new"
                className="btn btn-circle btn-ghost btn-sm text-base-content"
                aria-label="New category"
              >
                <Plus className="h-5 w-5" />
              </Link>
            </div>
          ) : null}
        </div>

        <hr className="my-4 border-border" />

        <div className="flex items-stretch gap-2">
          <div className="flex min-w-0 flex-1 overflow-hidden rounded-lg bg-neutral-300 text-neutral-900 dark:bg-neutral-600 dark:text-neutral-100">
            <div className="flex min-w-0 flex-1 items-center px-3 py-3 text-sm font-semibold sm:px-4">
              Item name
            </div>
            <div className="flex shrink-0 items-center px-3 py-3 text-sm font-medium sm:px-4">
              X/Y Available
            </div>
          </div>
          <button
            type="button"
            className="btn btn-square btn-ghost shrink-0 self-center border-0 text-base-content"
            aria-label="List settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <ul className="mt-3 flex flex-col gap-2">
          {filtered.map((row) => (
            <li key={row.id}>
              <Link
                href={`/clubs/category/${encodeURIComponent(row.categoryId)}`}
                className="flex items-center justify-between rounded-lg bg-base-200 px-3 py-3 transition hover:bg-base-300 sm:px-4"
              >
                <span className="min-w-0 truncate text-sm font-medium">{row.name}</span>
                <span className="shrink-0 pl-3 text-sm text-muted-foreground">
                  {row.available}/{row.total} Available
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {filtered.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">No items match your search.</p>
        ) : null}
      </div>
    </div>
  );
}
