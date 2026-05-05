"use client";

import Navbar from "@/components/ui/navbar";
import PageTitle from "@/components/ui/pageTitle";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [members, setMembers] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) {
      setError("Tile name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/tiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), members: members.trim() }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create tile.");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <><Navbar />
    <div className="flex flex-col items-left justify-center gap-4 p-8">
      <PageTitle title="New Tile" href="/dashboard" />
      <hr className="border-t" />
      <div className="card-xl bg-base-100 w-full shadow-lg">
        <div className="card-body items-left text-left">
          <h2 className="card-title">Tile Name</h2>
          <textarea
            className="textarea w-full"
            placeholder="Type here"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <h2 className="card-title">Add Members</h2>
          <textarea
            className="textarea w-full"
            placeholder='Member emails separated by "," (must be @umass.edu)'
            value={members}
            onChange={(e) => setMembers(e.target.value)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            className="btn w-24 bg-black text-white disabled:opacity-60"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div></>
  );
}
