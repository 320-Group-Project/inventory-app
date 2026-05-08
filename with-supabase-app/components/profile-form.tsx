"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [error, setError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/profile");

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        const profile = data.profile;

        setFirstName(profile.fname ?? "");
        setLastName(profile.lname ?? "");
        if (profile.user_image_url) setPreviewUrl(profile.user_image_url);
      } catch {
        setError("Could not load profile.");
      } finally {
        setIsFetchingProfile(false);
      }
    }

    fetchProfile();
  }, []);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setPictureFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setSaveSuccess(false);
    setError("");

    const formData = new FormData();
    formData.append("fname", firstName);
    formData.append("lname", lastName);
    if (pictureFile) formData.append("picture", pictureFile);

    const response = await fetch('/api/profile', {
      method: 'PATCH',
      body: formData,
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: "Unknown error" }));
      setError("Failed to save profile: " + payload.error);
      return;
    }

    setSaveSuccess(true);
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Function to handle logging out
  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  return (
    <div className={cn("card-xl bg-base-100 w-full shadow-lg py-8", className)} {...props}>
      <div className="card-body items-start text-left p-0">
        <div className="flex flex-col md:flex-row gap-8 w-full">
          <div className="flex flex-col items-center shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-48 h-48 rounded-full bg-base-200 border-8 border-secondary flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity"
              aria-label="Upload profile picture"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
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
            </button>
            <Button
              variant="link"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 text-lg text-base-content underline hover:text-secondary h-auto p-0"
            >
              {previewUrl ? "Change picture" : "Add picture"}
            </Button>
          </div>

          <form onSubmit={handleSave} className="flex-1 w-full flex flex-col gap-5">
            {isFetchingProfile && <p>Loading profile...</p>}
            {error && <p className="text-red-500">{error}</p>}

            <div className="grid gap-2">
              <Label className="text-xl font-normal">First Name:</Label>
              <Input
                type="text"
                required
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setSaveSuccess(false); }}
                className="border-2 border-secondary/50 focus-visible:ring-0 focus-visible:border-secondary rounded-sm h-auto py-3 text-lg bg-transparent"
                placeholder="First Name"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-xl font-normal">Last Name:</Label>
              <Input
                type="text"
                required
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); setSaveSuccess(false); }}
                className="border-2 border-secondary/50 focus-visible:ring-0 focus-visible:border-secondary rounded-sm h-auto py-3 text-lg bg-transparent"
                placeholder="Last Name"
              />
            </div>

            <div className="flex items-center gap-4 mt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-secondary text-base-100 hover:bg-secondary/90 px-8 h-14 text-lg rounded-xl"
              >
                {isLoading ? "Saving..." : "Save"}
              </Button>

              <Button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="bg-secondary text-base-100 hover:bg-secondary/90 px-8 h-14 text-lg rounded-xl"
              >
                Logout
              </Button>

              {saveSuccess && (
                <span className="text-green-600 text-base font-medium">Saved successfully</span>
              )}
            </div>
          </form>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl p-8 w-96 flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Sign out?</h2>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to sign out of your account?
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="bg-base-200 text-base-content hover:bg-base-300/40 border border-base-300 h-11 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="bg-secondary text-base-100 hover:bg-secondary/90 h-11 rounded-xl"
              >
                {loggingOut ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
