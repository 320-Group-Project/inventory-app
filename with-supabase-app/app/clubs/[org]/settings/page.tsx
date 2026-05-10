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
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [transferTarget, setTransferTarget] = useState<Member | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const isAdmin = ["Admin", "Owner"].includes(myRole);
  const isOwner = myRole === "Owner";

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
    setNameSaved(false);
    setNameError(null);
    const res = await fetch(`/api/clubs/${org}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: clubName.trim() }),
    });
    setSavingName(false);
    if (res.ok) {
      setSavedName(clubName.trim());
      setNameSaved(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setNameError(data.error ?? "Failed to save club name.");
    }
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

  function openDeleteModal() {
    setDeleteConfirm("");
    setDeleteError(null);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setShowDeleteModal(false);
    setDeleteConfirm("");
    setDeleteError(null);
  }

  function openTransferModal(member: Member) {
    setOpenMenu(null);
    setTransferError(null);
    setTransferTarget(member);
  }

  function closeTransferModal() {
    if (transferring) return;
    setTransferTarget(null);
    setTransferError(null);
  }

  async function handleTransferOwnership() {
    if (!transferTarget) return;
    setTransferring(true);
    setTransferError(null);

    const res = await fetch(`/api/clubs/${org}/transfer-ownership`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: transferTarget.UID }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setTransferError(data.error ?? "Failed to transfer ownership.");
      setTransferring(false);
      return;
    }

    const newOwnerId = transferTarget.UID;
    setMembers((prev) =>
      prev.map((m) => {
        if (m.UID === newOwnerId) return { ...m, role: "Owner" };
        if (m.role === "Owner") return { ...m, role: "Admin" };
        return m;
      })
    );
    setMyRole("Admin");
    setTransferring(false);
    setTransferTarget(null);
  }

  async function handleDeleteClub() {
    if (deleteConfirm !== savedName) return;
    setDeleting(true);
    setDeleteError(null);

    const res = await fetch(`/api/clubs/${org}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation: deleteConfirm }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error ?? "Failed to delete club.");
      setDeleting(false);
      return;
    }

    setDeleting(false);
    setShowDeleteModal(false);
    router.replace("/dashboard");
  }

  const filtered = members.filter((m) => {
    const full = `${m.User?.fname ?? ""} ${m.User?.lname ?? ""}`.toLowerCase();
    return full.includes(search.toLowerCase());
  });

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-left justify-center gap-4 p-8">
        <div className="flex items-center justify-between w-full">
          <Back onClick={() => router.replace("/dashboard")} />
          {isOwner && !loading && (
            <button
              className="btn bg-red-600 text-white hover:bg-red-700 border-none rounded-lg"
              onClick={openDeleteModal}
            >
              Delete Club
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <>
            {isAdmin && (
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="text"
                  placeholder="Club name"
                  className="input input-bordered input-primary w-full max-w-xs border-2 border-primary rounded-lg"
                  value={clubName}
                  onChange={(e) => { setClubName(e.target.value); setNameSaved(false); setNameError(null); }}
                />
                <button
                  className="btn btn-primary rounded-lg px-5 disabled:opacity-40"
                  disabled={clubName.trim() === savedName || clubName.trim() === "" || savingName}
                  onClick={handleSaveName}
                >
                  {savingName ? "Saving..." : "Save Name"}
                </button>
                {nameSaved && (
                  <span className="text-green-600 text-sm font-medium">Saved successfully</span>
                )}
                {nameError && (
                  <span className="text-red-500 text-sm font-medium">{nameError}</span>
                )}
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
                  const memberIsOwner = member.role === "Owner";
                  const canModify = !memberIsOwner;
                  const canMakeOwner = isOwner && member.role === "Admin";

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
                          {canMakeOwner && (
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              onClick={() => openTransferModal(member)}
                            >
                              Make Owner
                            </button>
                          )}
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

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl p-8 w-96 flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold mb-1 text-red-600">Delete club?</h2>
              <p className="text-sm text-muted-foreground">
                This will permanently delete <span className="font-semibold">{savedName}</span>, all its members, categories, and items. This cannot be undone.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm">
                Type <span className="font-mono font-semibold">{savedName}</span> to confirm:
              </label>
              <input
                type="text"
                className="input input-bordered w-full border-2 border-gray-300 rounded-lg"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                disabled={deleting}
                autoFocus
              />
            </div>
            {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="btn btn-sm bg-base-200 text-base-content border border-base-300 hover:bg-base-300"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm bg-red-600 text-white hover:bg-red-700 border-none disabled:opacity-40"
                disabled={deleting || deleteConfirm !== savedName}
                onClick={handleDeleteClub}
              >
                {deleting ? "Deleting..." : "Delete Club"}
              </button>
            </div>
          </div>
        </div>
      )}

      {transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl p-8 w-96 flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Transfer ownership?</h2>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">
                  {[transferTarget.User?.fname, transferTarget.User?.lname].filter(Boolean).join(" ") || "This member"}
                </span>{" "}
                will become the new Owner of <span className="font-semibold">{savedName}</span>.
                You will be demoted to Admin and remain in the club.
              </p>
            </div>
            {transferError && <p className="text-sm text-red-500">{transferError}</p>}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="btn btn-sm bg-base-200 text-base-content border border-base-300 hover:bg-base-300"
                onClick={closeTransferModal}
                disabled={transferring}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm bg-primary text-primary-foreground hover:opacity-90 border-none disabled:opacity-40"
                disabled={transferring}
                onClick={handleTransferOwnership}
              >
                {transferring ? "Transferring..." : "Transfer Ownership"}
              </button>
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
      <TileSettingsPage />
    </Suspense>
  );
}
