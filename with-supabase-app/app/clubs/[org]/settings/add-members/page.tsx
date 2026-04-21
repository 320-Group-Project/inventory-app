"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageTitle from "@/components/ui/pageTitle";
import { Loader2 } from "lucide-react";

export default function Page() {
  const { org } = useParams<{ org: string }>();
  const router = useRouter();

  const [members, setMembers] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = async () => {
    if (!members.trim()) {
      setError("Please enter at least one email address");
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/clubs/${org}/settings/add-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setSuccess(`Invites sent to ${data.invited} member(s)!`);
      setMembers("");
      setTimeout(() => router.push(`/clubs/${org}/settings`), 1500);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-left justify-center gap-4 p-8">
        <PageTitle title="Add Members" />
        <hr className="border-t" />
        <div className="card-body items-left text-left">
          <h2 className="card-title">Member Emails:</h2>
          <textarea
            className="textarea w-full"
            placeholder='Member emails separated by ","'
            value={members}
            onChange={(e) => setMembers(e.target.value)}
            rows={5}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <div className="flex gap-3 mt-2">
            <button
              className="btn bg-black text-white flex items-center gap-2"
              onClick={handleSave}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Sending…" : "Send Invites"}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => router.back()}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}