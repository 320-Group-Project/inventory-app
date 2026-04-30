import { ProfileForm } from "@/components/profile-form";
import PageTitle from "@/components/ui/pageTitle"

export default function Page() {
  return (
    <div className="flex flex-col items-start justify-center gap-4 p-8 bg-base-100 min-h-screen text-base-content">
      <PageTitle title="Your Profile" href="/dashboard"/>
      <line className="border-t border-secondary w-full" />
      
      <div className="w-full">
        <ProfileForm />
      </div>
    </div>
  );
}