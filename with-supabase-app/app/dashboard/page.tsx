"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Settings, Loader2 } from "lucide-react";

interface Tile {
  club_id: string | number;
  name: string;
  role: string;
}

export default function Page() {
  const router = useRouter();
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.tiles) setTiles(data.tiles);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLeave = async (tile: Tile) => {
    // Optimistic removal
    setTiles((prev) => prev.filter((t) => t.club_id !== tile.club_id));

    const res = await fetch(`/api/tiles/${tile.club_id}`, { method: "DELETE" });
    if (!res.ok) {
      // Roll back on failure
      setTiles((prev) => [...prev, tile]);
      console.error("Failed to leave club");
    }
  };

  return (
    <div className="min-h-screen bg-background px-10 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
          My Tiles
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="btn btn-circle bg-card text-card-foreground border border-border shadow-sm hover:bg-accent"
            aria-label="Profile"
            title="Profile"
          >
            👤
          </Link>
        </div>
      </div>
      <hr className="mb-8 border-border" />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : tiles.length === 0 ? (
        <p className="text-muted-foreground text-lg">
          You haven&apos;t joined any clubs yet. Create one below!
        </p>
      ) : (
        <div className="flex flex-row flex-wrap gap-8">
          {tiles.map((t) => {
            const isAdmin = t.role?.toLowerCase() === "admin";
            const roleBar = isAdmin ? "bg-amber-400" : "bg-sky-500";
            const roleText = isAdmin ? "text-amber-500" : "text-sky-500";
            return (
              <Link
                key={t.club_id}
                href={`/dashboard/${t.club_id}`}
                className="card relative w-80 h-72 overflow-hidden rounded-2xl bg-card text-card-foreground border border-border shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <button
                  type="button"
                  className="btn btn-circle btn-sm absolute right-3 top-5 z-10 bg-base-100/90 text-base-content border border-base-300 shadow-sm hover:bg-base-100"
                  aria-label={isAdmin ? "Club settings" : "Leave club"}
                  title={isAdmin ? "Settings" : "Leave club"}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (isAdmin) {
                      router.push(`/clubs/${t.club_id}/settings`);
                      return;
                    }

                    handleLeave(t);
                  }}
                >
                  {isAdmin ? (
                    <Settings className="h-4 w-4" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                </button>
                <div className={`h-3 w-full ${roleBar}`} />
                <div className="card-body p-6 justify-between">
                  <div>
                    <h2 className="text-4xl font-extrabold tracking-tight">
                      {t.name}
                    </h2>
                  </div>
                  <p className={`text-sm font-semibold uppercase tracking-wide ${roleText}`}>
                    {t.role}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Link
        href="/dashboard/new-tile"
        className="btn fixed bottom-10 right-10 rounded-xl px-7 py-4 text-lg font-bold bg-primary text-primary-foreground shadow-2xl gap-2"
      >
        <span className="text-2xl leading-none">+</span>
        <span>New Tile</span>
      </Link>
    </div>
  );
}