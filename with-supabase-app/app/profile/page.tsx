import { ProfileForm } from "@/components/profile-form";

export default function Page() {
  return (
    <div className="flex flex-col items-start justify-center gap-4 p-8 bg-base-100 min-h-screen text-base-content">
      <h1 className="text-3xl font-bold">Your Profile</h1>
      <line className="border-t border-secondary w-full" />
      
      <div className="w-full">
        <ProfileForm />
      </div>
    </div>
  );
}