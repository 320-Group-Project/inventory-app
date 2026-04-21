"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface Member {
  uid: string;
  fname: string;
  lname: string;
  email: string;
  role: string;
  user_image_url: string | null;
}

export default function TileSettingsPage() {
  const { org } = useParams<{ org: string }>();
  const router = useRouter();

  const [clubName, setClubName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load club name + members
  useEffect(() => {
    if (!org) return;

    Promise.all([
      fetch(`/api/clubs/${org}/settings`).then((r) => r.json()),
      fetch(`/api/clubs/${org}/members`).then((r) => r.json()),
    ])
      .then(([settingsData, membersData]) => {
        setClubName(settingsData.name ?? "");
        setMembers(membersData.members ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [org]);

  const handleSaveName = async () => {
    setSavingName(true);
    const res = await fetch(`/api/clubs/${org}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: clubName }),
    });
    setSavingName(false);
    if (res.ok) setEditingName(false);
    else {
      const d = await res.json();
      setError(d.error ?? "Failed to update name");
    }
  };

  const handleRemove = async (uid: string) => {
    setOpenMenu(null);
    const prev = members;
    setMembers((m) => m.filter((x) => x.uid !== uid));

    const res = await fetch(`/api/clubs/${org}/members/${uid}`, { method: "DELETE" });
    if (!res.ok) {
      setMembers(prev); // rollback
      const d = await res.json();
      setError(d.error ?? "Failed to remove member");
    }
  };

  const handleChangeRole = async (uid: string, newRole: string) => {
    setOpenMenu(null);
    const prev = members;
    setMembers((m) =>
      m.map((x) => (x.uid === uid ? { ...x, role: newRole } : x)),
    );

    const res = await fetch(`/api/clubs/${org}/members/${uid}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (!res.ok) {
      setMembers(prev);
      const d = await res.json();
      setError(d.error ?? "Failed to change role");
    }
  };

  const toggleMenu = (uid: string) =>
    setOpenMenu((prev) => (prev === uid ? null : uid));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-left justify-center gap-4 p-8">
      {/* Club Name */}
      <div className="flex items-center gap-3">
        {editingName ? (
          <>
            <input
              type="text"
              className="input input-bordered input-primary w-full max-w-xs border-2 border-primary rounded-lg"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
            />
            <button
              className="btn btn-sm btn-primary flex items-center gap-1"
              onClick={handleSaveName}
              disabled={savingName}
            >
              {savingName && <Loader2 className="h-3 w-3 animate-spin" />}
              Save
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setEditingName(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold">{clubName}</p>
            <button
              className="btn btn-sm btn-ghost underline"
              onClick={() => setEditingName(true)}
            >
              Edit
            </button>
          </>
        )}
      </div>

      <hr className="border-t-2 border-gray-300 w-full" />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Members */}
      <div className="card-body items-left text-left border-2 border-gray-300 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Members</h2>
          <Link
            href={`/clubs/${org}/settings/add-members`}
            className="btn btn-primary btn-sm border-2 border-primary rounded-lg"
          >
            + Add Member
          </Link>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          {members.length === 0 && (
            <p className="text-sm text-gray-500">No members yet.</p>
          )}
          {members.map((member) => {
            const displayName =
              [member.fname, member.lname].filter(Boolean).join(" ") ||
              member.email ||
              "Unknown";
            return (
              <div
                key={member.uid}
                className="flex items-center justify-between bg-gray-200 rounded px-4 py-3 relative"
              >
                <span className="text-sm font-medium">{displayName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{member.role}</span>
                  <button
                    className="text-gray-500 hover:text-black font-bold text-lg leading-none"
                    onClick={() => toggleMenu(member.uid)}
                  >
                    ⋮
                  </button>
                </div>

                {openMenu === member.uid && (
                  <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-gray-300 rounded shadow-md w-44">
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() =>
                        handleChangeRole(
                          member.uid,
                          member.role === "Admin" ? "Member" : "Admin",
                        )
                      }
                    >
                      Make {member.role === "Admin" ? "Member" : "Admin"}
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      onClick={() => handleRemove(member.uid)}
                    >
                      Remove Member
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        className="btn btn-ghost mt-4 self-start"
        onClick={() => router.back()}
      >
        ← Back
      </button>
    </div>
  );
}