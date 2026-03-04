import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("item_category")
    .select("Image_URL")
    .eq("name", "Box")
    .single();

  if (!data) {
    return <p>Item not found</p>;
  }
  const { data: publicUrlData } = supabase
    .storage
    .from("Item Category Pictures")
    .getPublicUrl(data.Image_URL);
  
  const imageUrl = publicUrlData.publicUrl;
  if (error) {
    console.error(error);
    return <p>Error with loading the clubs</p>;
  }

  return (
    <div>
      <h1>First Club</h1>
      {/* Display first clubs Ex. */}
      <h1>ImageURL: {publicUrlData.publicUrl}</h1>
      <img src={publicUrlData.publicUrl}/>
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