"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/navbar";
import PageTitle from "@/components/ui/pageTitle";
import { Loader2 } from "lucide-react";

export default function Page() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [members, setMembers] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Tile name is required");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/tiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), members }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      // Navigate back to dashboard on success
      router.push("/dashboard");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-left justify-center gap-4 p-8">
        <PageTitle title="New Tile" />
        <hr className="border-t" />
        <div className="card-xl bg-base-100 w-full shadow-lg">
          <div className="card-body items-left text-left">
            <h2 className="card-title">Tile Name</h2>
            <input
              className="input input-bordered w-full"
              placeholder="e.g. HackUMass"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <h2 className="card-title mt-4">Add Members</h2>
            <textarea
              className="textarea w-full"
              placeholder='Member emails separated by ","'
              value={members}
              onChange={(e) => setMembers(e.target.value)}
            />

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              className="btn bg-black text-white mt-4 flex items-center gap-2"
              onClick={handleSave}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}