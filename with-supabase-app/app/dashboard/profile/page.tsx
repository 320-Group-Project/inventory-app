"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PageTitle from "@/components/ui/pageTitle";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load profile on mount
  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setFname(data.fname ?? "");
        setLname(data.lname ?? "");
        setEmail(data.email ?? "");
        setImageUrl(data.user_image_url ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("fname", fname);
    formData.append("lname", lname);
    if (pendingFile) formData.append("picture", pendingFile);

    try {
      const res = await fetch("/api/profile/save", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      if (data.user_image_url) setImageUrl(data.user_image_url);
      setPendingFile(null);
      setSuccessMsg("Profile saved!");
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const displayImage = previewUrl ?? imageUrl;

  return (
    <div className="flex flex-col items-left justify-center gap-4 p-8 bg-base-100 min-h-screen text-base-content">
      <PageTitle title="Your Profile" />

      <hr className="border-t border-secondary" />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="card-xl bg-base-100 w-full shadow-lg">
          <div className="card-body items-left text-left">
            <div className="flex flex-col md:flex-row gap-8 w-full">
              {/* Avatar */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-48 h-48 rounded-full bg-base-200 border-8 border-secondary flex items-center justify-center overflow-hidden">
                  {displayImage ? (
                    <Image
                      src={displayImage}
                      alt="Profile picture"
                      width={192}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-full h-full text-secondary translate-y-3 scale-125"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  className="underline mt-2 hover:text-secondary bg-transparent border-none cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {displayImage ? "Change picture" : "Add picture"}
                </button>
              </div>

              {/* Inputs */}
              <div className="flex-1 w-full">
                <h2 className="card-title font-normal">First Name:</h2>
                <input
                  className="input input-bordered border-secondary/50 focus:border-secondary w-full"
                  placeholder="First Name"
                  value={fname}
                  onChange={(e) => setFname(e.target.value)}
                />

                <h2 className="card-title font-normal mt-4">Last Name:</h2>
                <input
                  className="input input-bordered border-secondary/50 focus:border-secondary w-full"
                  placeholder="Last Name"
                  value={lname}
                  onChange={(e) => setLname(e.target.value)}
                />

                <h2 className="card-title font-normal mt-4">Email:</h2>
                <input
                  type="email"
                  className="input input-bordered border-secondary/50 focus:border-secondary w-full opacity-60 cursor-not-allowed"
                  value={email}
                  readOnly
                  title="Email cannot be changed here"
                />

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                {successMsg && <p className="text-green-600 text-sm mt-2">{successMsg}</p>}

                {/* Save and Logout */}
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    className="btn btn-secondary text-base-100 px-8 flex items-center gap-2"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary text-base-100 px-8"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}