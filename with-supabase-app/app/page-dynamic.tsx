import { createClient } from "@/lib/supabase/server";

export default async function Home() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("Club")
        .select("name");

    if (error) {
        console.error(error);
        return <p>Error with loading the clubs</p>;
    }

    return (
        <div>
            <h1>First Club</h1>
            {/* Display first clubs Ex. */}
            <h1>Name: {data?.[0]?.name}</h1>

            {/* Display all clubs Ex. */}
            {/* <ul className="space-y-2">
        {data?.map((club, index) => (
          <li key={index} className="border p-2 rounded">
            {club.name}
          </li>
        ))}
      </ul> */}
        </div>
    );
}