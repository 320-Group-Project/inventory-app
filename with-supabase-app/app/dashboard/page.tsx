/** Has placeholder clubs for now */

import Link from "next/link";
export default function Page() {
  const tiles = [
    { org: "club1", role: "student" as const },
    { org: "club2", role: "admin" as const },
    { org: "club3", role: "admin" as const }
  ];
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
      <div className="flex flex-row flex-wrap gap-8">
        {tiles.map((t) => {
          const isAdmin = t.role === "admin";
          const roleBar = isAdmin ? "bg-amber-400" : "bg-sky-500";
          const roleText = isAdmin ? "text-amber-500" : "text-sky-500";
          return (
            <Link
              key={t.org}
              href={`/dashboard/${t.org.toLowerCase()}`}
              className="card w-80 h-72 overflow-hidden rounded-2xl bg-card text-card-foreground border border-border shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`h-3 w-full ${roleBar}`} />
              <div className="card-body p-6 justify-between">
                <div>
                  <h2 className="text-4xl font-extrabold tracking-tight">{t.org}</h2>
                </div>
                <p className={`text-sm font-semibold uppercase tracking-wide ${roleText}`}>
                  {t.role}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
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