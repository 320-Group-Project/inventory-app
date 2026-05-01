"use client";

import {useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
interface Member {
  id: string;
  name: string;
  role: string;
}

export default function TileSettingsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [clubID, setClubID] = useState<number>(15);
  useEffect(()=>{
    const fetchData = async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
    .from("Role") 
    .select(`
      role,
      User (
        UID,
        fname,
        lname,
        user_image_url
      )
    `)
    .eq("club_id", clubID);
      if(data){
        const formatted = data.map(
          (item) => {
            const userData = Array.isArray(item.User) ? item.User[0] : item.User;
            //const roleData = Array.isArray(item.Role) ? item.Role[0] : item.Role;
            return{
              id: userData?.UID || "unknown",
              name: userData 
              ? `${userData.fname} ${userData.lname}`.trim() 
              : "Unknown User",
              role: item.role || "Member",
            }
          });
        setMembers(formatted)
      }
    }
    fetchData()
  },[])
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [clubName, setClubName] = useState("HackUMass");
  const [savedName, setSavedName] = useState("HackUMass");

  const handleSaveName = () => {
    setSavedName(clubName);
  };

  const handleRemove = async (id: string) => {
    const supabase = await createClient();
    const {error} = await supabase.from("Role").delete().eq("UID", id).select();
    if(error) throw error
    setMembers(members.filter((m) => m.id !== id));
    setOpenMenu(null);
  };

  const toggleMenu = (id: string) => {
    setOpenMenu((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col items-left justify-center gap-4 p-8">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Club name"
          className="input input-bordered input-primary w-full max-w-xs border-2 border-primary rounded-lg"
          value={clubName}
          onChange={(e) => setClubName(e.target.value)}
        />
        <button
          className="btn btn-primary rounded-lg px-5 disabled:opacity-40"
          disabled={clubName.trim() === savedName || clubName.trim() === ""}
          onClick={handleSaveName}
        >
          Save Name
        </button>
      </div>
      <hr className="border-t-2 border-gray-300 w-full" />
      <div className="card-body items-left text-left border-2 border-gray-300 rounded-lg p-4">
        <input
          type="text"
          placeholder="Search..."
          className="input input-bordered w-full border-2 border-gray-300 rounded-lg"
        />
        <button className="btn btn-primary border-2 border-primary rounded-lg mt-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
          </svg>
          Add Member
        </button>
        <div className="flex flex-col gap-2 mt-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between bg-gray-200 rounded px-4 py-3 relative"
            >
              <span className="text-sm font-medium">{member.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{member.role}</span>
                <button
                  className="text-gray-500 hover:text-black font-bold text-lg leading-none"
                  onClick={() => toggleMenu(member.id)}
                >
                  ⋮
                </button>
              </div>

              {openMenu === member.id && (
                <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-gray-300 rounded shadow-md w-40">
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setOpenMenu(null)}
                  >
                    Contact
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setOpenMenu(null)}
                  >
                    Change role
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={() => handleRemove(member.id)}
                  >
                    Remove Member
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}