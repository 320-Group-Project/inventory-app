"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input"; 
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/navbar";
import Back from "@/components/ui/back";

interface Member {
  id: number;
  name: string;
  role: string;
}
export default function TileSettingsPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([
    { id: 1, name: "Jane Doe", role: "Owner" },
    { id: 2, name: "Mickey Mouse", role: "Admin" },
    { id: 3, name: "", role: "Member" },
    { id: 4, name: "", role: "Member" },
    { id: 5, name: "", role: "Member" },
  ]);

  const [clubName, setClubName] = useState("HackUMass");
  const [savedName, setSavedName] = useState("HackUMass");

  const handleSaveName = () => {
    setSavedName(clubName);
  };

  const handleRemove = (id: number) => {
    setMembers(members.filter((m) => m.id !== id));
  };
  return (
    <>
    <Navbar />
    <div className="flex flex-col items-left justify-center gap-4 p-8">
      <button className="btn btn-ghost btn-circle hover:bg-base-200 self-start" onClick={() => router.back()}>
        <Back />
      </button>
      <div className="flex items-center gap-3">
        <Input
          type="text"
          placeholder="Club name"
          className="input input-bordered input-primary w-full max-w-xs border-2 border-primary rounded-lg"
          value={clubName}
          onChange={(e) => setClubName(e.target.value)}
        />
        <Button
          className="btn btn-primary rounded-lg px-5 disabled:opacity-40"
          disabled={clubName.trim() === savedName || clubName.trim() === ""}
          onClick={handleSaveName}
        >
          Save Name
        </Button>
      </div>
      <hr className="border-t-2 border-gray-300 w-full" />
      <div className="card-body items-left text-left border-2 border-gray-300 rounded-lg p-4">
        <Input
          type="text"
          placeholder="Search..."
          className="input input-bordered w-full border-2 border-gray-300 rounded-lg"
        />
        <Button className="btn btn-primary border-2 border-primary rounded-lg mt-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
          </svg>
          Add Member
        </Button>
        <div className="flex flex-col gap-2 mt-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between bg-gray-200 rounded px-4 py-3 relative"
            >
              <span className="text-sm font-medium">{member.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{member.role}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-gray-500 hover:text-black font-bold text-lg leading-none cursor-pointer focus:outline-none">
                      ⋮
                    </button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="end" className="w-40 bg-white border border-gray-300 rounded shadow-md mt-1">
                    <DropdownMenuItem className="cursor-pointer hover:bg-gray-100">
                      Contact
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer hover:bg-gray-100">
                      Change role
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer text-red-600 focus:text-red-600 hover:bg-gray-100 focus:bg-gray-100"
                      onClick={() => handleRemove(member.id)}
                    >
                      Remove Member
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}