"use client"

import { NewCategoryContent } from "@/components/new-category";
import PageTitle from "@/components/ui/pageTitle";
import Navbar from "@/components/ui/navbar";
import { useRouter } from "next/navigation";

export default function NewCategoryPage() {
  const router = useRouter();
  
  return (
    <><Navbar />
    <div className="min-h-screen bg-base-100 text-base-content p-8 md:p-12">
      <div className="max-w-5xl mx-auto">        
        <div className="mb-2 -ml-4">
          <PageTitle title="New Category" onClick={() => router.back()} />
        </div>        
        <hr className="border-secondary border-t-[3px] mt-4 mb-10 w-full" />        
        <NewCategoryContent />
      </div>
    </div></>
  );
}