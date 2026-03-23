/** Has placeholder clubs for now and has not been tested yet */

import Link from "next/link";
export default function Page() {
  const tiles = [
    { org: "club1", role: "student" as const },
    { org: "club2", role: "admin" as const },
  ];
  return (
    <div className="flex flex-col items-left justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">My Tiles</h1>
      <hr className="border-t" />
      <div className="flex flex-col gap-3">
        {tiles.map((t) => (
          <Link
            key={t.org}
            href={`/dashboard/${t.org}`}
            className={`card w-full shadow-lg ${
              t.role === "admin" ? "bg-amber-400 text-black" : "bg-sky-500 text-white"
            }`}
          >
            <div className="card-body">
              <h2 className="card-title">{t.org}</h2>
              <p className="capitalize">{t.role}</p>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/dashboard/new-tile" className="btn w-fit bg-black text-white">
        + New Tile
      </Link>
    </div>
  );
}