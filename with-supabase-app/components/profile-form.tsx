"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { POST } from "@/app/api/tiles/route";

export function ProfileForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle saving profile
  const handleSave = async (e: React.InputEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fname: firstName, lname: lastName, photo: photo }),
    } as RequestInit);
    if (!response.ok) {
      setIsLoading(false);
      alert("Failed to save profile: " + (await response.json()).error);
      return;
    }
    else {
      setIsLoading(false);
      alert("Profile saved successfully!");
    }
  };

  // Function to handle logging out
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login"); // Redirect back to login
  };

  return (
    <div className={cn("card-xl bg-base-100 w-full shadow-lg", className)} {...props}>
      <div className="card-body items-start text-left p-0">
        <div className="flex flex-col md:flex-row gap-8 w-full">
          <div className="flex flex-col items-center shrink-0">
            <div className="w-48 h-48 rounded-full bg-base-200 border-8 border-secondary flex items-center justify-center overflow-hidden">
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
            </div>
            <Button
              variant="link"
              type="button"
              className="mt-4 text-lg text-base-content underline hover:text-secondary h-auto p-0"
            >
              Add picture
            </Button>
          </div>

          <form onSubmit={handleSave} className="flex-1 w-full flex flex-col gap-5">
            <div className="grid gap-2">
              <Label className="text-xl font-normal">First Name:</Label>
              <Input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
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
                onChange={(e) => setLastName(e.target.value)}
                className="border-2 border-secondary/50 focus-visible:ring-0 focus-visible:border-secondary rounded-sm h-auto py-3 text-lg bg-transparent"
                placeholder="Last Name"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-xl font-normal">Email:</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-2 border-secondary/50 focus-visible:ring-0 focus-visible:border-secondary rounded-sm h-auto py-3 text-lg bg-transparent"
                placeholder="Email"
              />
            </div>

            <div className="flex gap-4 mt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-secondary text-base-100 hover:bg-secondary/90 px-8 h-14 text-lg rounded-xl"
              >
                {isLoading ? "Saving..." : "Save"}
              </Button>

              <Button
                type="button"
                onClick={handleLogout}
                className="bg-secondary text-base-100 hover:bg-secondary/90 px-8 h-14 text-lg rounded-xl"
              >
                Logout
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}