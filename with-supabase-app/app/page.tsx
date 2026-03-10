import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

export default function Home() {
  return (
    <div>
      <h1>First Club</h1>

      <Suspense fallback={<p>Loading clubs...</p>}>
        <ClubContent />
      </Suspense>
    </div>
  );
}

async function ClubContent() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("Club")
    .select("name");

  if (error) {
    console.error(error);
    return <p>Error with loading the clubs</p>;
  }

  return <h1>Name: {data?.[0]?.name}</h1>;
}