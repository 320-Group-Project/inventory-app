"use client";

import { useState } from "react";

interface Member {
  id: number;
  name: string;
  role: string;
}

export default function TileSettingsPage() {
  const [members, setMembers] = useState<Member[]>([
    { id: 1, name: "Jane Doe", role: "Owner" },
    { id: 2, name: "Mickey Mouse", role: "Admin" },
    { id: 3, name: "", role: "Member" },
    { id: 4, name: "", role: "Member" },
    { id: 5, name: "", role: "Member" },
  ]);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const handleRemove = (id: number) => {
    setMembers(members.filter((m) => m.id !== id));
    setOpenMenu(null);
  };

  const toggleMenu = (id: number) => {
    setOpenMenu((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col items-left justify-center gap-4 p-8">
      <input
        type="text"
        placeholder="p"
        className="input input-bordered input-primary w-full max-w-xs border-2 border-primary rounded-lg"
        value="HackUMass"
        onChange={() => {}}
      />
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
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
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