"use client";

import Navbar from "@/components/ui/navbar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";

type Tile = {
  club_id: number;
  name: string;
  role: string;
};

export default function Page() {
  const router = useRouter();
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaveTarget, setLeaveTarget] = useState<Tile | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    fetch("/api/tiles")
      .then((r) => r.json())
      .then((data) => setTiles(data.tiles ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function confirmLeave() {
    if (!leaveTarget) return;
    setLeaving(true);
    const res = await fetch(`/api/clubs/${leaveTarget.club_id}/members/me`, { method: "DELETE" });
    setLeaving(false);
    if (res.ok) {
      setTiles((prev) => prev.filter((t) => t.club_id !== leaveTarget.club_id));
    }
    setLeaveTarget(null);
  }

  return (
    <><Navbar />
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
        <p className="text-muted-foreground">Loading...</p>
      ) : tiles.length === 0 ? (
        <p className="text-muted-foreground">You're not in any clubs yet. Create one below!</p>
      ) : (
        <div className="flex flex-row flex-wrap gap-8">
          {tiles.map((t) => {
            const isAdmin = ["Admin", "Owner"].includes(t.role);
            const roleBar = t.role === "Owner" ? "bg-[#881c1c]" : isAdmin ? "bg-amber-400" : "bg-sky-500";
            const roleText = t.role === "Owner" ? "text-[#881c1c]" : isAdmin ? "text-amber-500" : "text-sky-500";
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
                    } else {
                      setLeaveTarget(t);
                    }
                  }}
                >
                  {isAdmin ? <Settings className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
                </button>
                <div className={`h-3 w-full ${roleBar}`} />
                <div className="card-body p-6 justify-between">
                  <div>
                    <h2 className="text-4xl font-extrabold tracking-tight">{t.name}</h2>
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

      {leaveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl p-8 w-80 flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Leave club?</h2>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to leave <span className="font-semibold">{leaveTarget.name}</span>? You will lose access to this club.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="btn btn-sm bg-base-200 text-base-content border border-base-300 hover:bg-base-300"
                onClick={() => setLeaveTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={leaving}
                className="btn btn-sm bg-red-500 text-white hover:bg-[#881c1c] border-none disabled:opacity-60"
                onClick={confirmLeave}
              >
                {leaving ? "Leaving..." : "Leave"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
