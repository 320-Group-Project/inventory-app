"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/ui/navbar";
import PageTitle from "@/components/ui/pageTitle";

function AddMembersPage() {
  const params = useParams<{ org: string }>();
  const org = (params?.org ?? "").toString();
  const router = useRouter();

  const [emails, setEmails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!emails.trim()) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/clubs/${org}/members/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails: emails.trim() }),
    });

    setSubmitting(false);

    if (res.ok) {
      router.push(`/clubs/${org}/settings`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to send invites.");
    }
  }

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-left justify-center gap-4 p-8">
        <PageTitle title="Add Members" href={`/clubs/${org}/settings`} />
        <hr className="border-t" />
        <div className="card-body items-left text-left">
          <h2 className="card-title">Member Emails:</h2>
          <textarea
            className="textarea w-full"
            placeholder='UMass emails separated by "," (e.g. student@umass.edu)'
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            rows={4}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            className="btn bg-black text-white disabled:opacity-60 self-start px-6"
            onClick={handleSave}
            disabled={submitting || !emails.trim()}
          >
            {submitting ? "Sending..." : "Send Invites"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <AddMembersPage />
    </Suspense>
  );
}
