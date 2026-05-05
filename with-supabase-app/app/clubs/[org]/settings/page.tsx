"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/ui/navbar";
import Back from "@/components/ui/back";

type Member = {
  UID: string;
  role: string;
  User: { fname: string | null; lname: string | null; user_image_url: string | null } | null;
};

function TileSettingsPage() {
  const router = useRouter();
  const params = useParams<{ org: string }>();
  const org = (params?.org ?? "").toString();

  const [clubName, setClubName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [myRole, setMyRole] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAdmin = ["Admin", "Owner"].includes(myRole);

  useEffect(() => {
    if (!org) return;
    async function load() {
      const [settingsRes, membersRes] = await Promise.all([
        fetch(`/api/clubs/${org}/settings`),
        fetch(`/api/clubs/${org}/members`),
      ]);
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setClubName(data.name ?? "");
        setSavedName(data.name ?? "");
        setMyRole(data.role ?? "");
      }
      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.members ?? []);
      }
      setLoading(false);
    }
    load();
  }, [org]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSaveName() {
    if (!clubName.trim() || clubName.trim() === savedName) return;
    setSavingName(true);
    const res = await fetch(`/api/clubs/${org}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: clubName.trim() }),
    });
    setSavingName(false);
    if (res.ok) setSavedName(clubName.trim());
    else alert("Failed to save club name.");
  }

  async function handleChangeRole(userId: string, newRole: string) {
    setOpenMenu(null);
    const res = await fetch(`/api/clubs/${org}/members/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setMembers((prev) => prev.map((m) => (m.UID === userId ? { ...m, role: newRole } : m)));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to change role.");
    }
  }

  async function handleRemove(userId: string) {
    setOpenMenu(null);
    const res = await fetch(`/api/clubs/${org}/members/${userId}`, { method: "DELETE" });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.UID !== userId));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to remove member.");
    }
  }

  const filtered = members.filter((m) => {
    const full = `${m.User?.fname ?? ""} ${m.User?.lname ?? ""}`.toLowerCase();
    return full.includes(search.toLowerCase());
  });

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-left justify-center gap-4 p-8">
        <button className="btn btn-ghost btn-circle hover:bg-base-200 self-start" onClick={() => router.back()}>
          <Back />
        </button>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <>
            {isAdmin && (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Club name"
                  className="input input-bordered input-primary w-full max-w-xs border-2 border-primary rounded-lg"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                />
                <button
                  className="btn btn-primary rounded-lg px-5 disabled:opacity-40"
                  disabled={clubName.trim() === savedName || clubName.trim() === "" || savingName}
                  onClick={handleSaveName}
                >
                  {savingName ? "Saving..." : "Save Name"}
                </button>
              </div>
            )}

            <hr className="border-t-2 border-gray-300 w-full" />

            <div className="card-body items-left text-left border-2 border-gray-300 rounded-lg p-4">
              <input
                type="text"
                placeholder="Search..."
                className="input input-bordered w-full border-2 border-gray-300 rounded-lg"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {isAdmin && (
                <a href="settings/add-members" className="inline-block mt-2">
                  <div className="btn btn-primary border-2 border-primary rounded-lg flex items-center gap-2 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" />
                    Add Member
                  </div>
                </a>
              )}

              <div className="flex flex-col gap-2 mt-4" ref={menuRef}>
                {filtered.map((member) => {
                  const name = [member.User?.fname, member.User?.lname].filter(Boolean).join(" ") || "Unknown";
                  const isOwner = member.role === "Owner";
                  const canModify = !isOwner;

                  return (
                    <div
                      key={member.UID}
                      className="flex items-center justify-between bg-gray-200 rounded px-4 py-3 relative"
                    >
                      <span className="text-sm font-medium">{name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{member.role}</span>
                        {canModify && (
                          <button
                            className="text-gray-500 hover:text-black font-bold text-lg leading-none"
                            onClick={() => setOpenMenu((prev) => (prev === member.UID ? null : member.UID))}
                          >
                            ⋮
                          </button>
                        )}
                      </div>

                      {openMenu === member.UID && (
                        <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-gray-300 rounded shadow-md w-40">
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setOpenMenu(null)}>
                            Contact
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={() => handleChangeRole(member.UID, member.role === "Member" ? "Admin" : "Member")}
                          >
                            {member.role === "Member" ? "Make Admin" : "Make Member"}
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            onClick={() => handleRemove(member.UID)}
                          >
                            Remove Member
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filtered.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">No members found.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <TileSettingsPage />
    </Suspense>
  );
}
