//Used the prompt "make this page in a TSX file with react and daisyui" with a picture of the figma mockup. Edited generated code for specific design. 
"use client";

import React from "react";
import PageTitle from "@/components/ui/pageTitle";

type Item = {
  id: number;
  name: string;
  available: number;
  total: number;
};

const mockItems: Item[] = [
  { id: 1, name: "Item A", available: 3, total: 10 },
  { id: 2, name: "Item B", available: 5, total: 8 },
  { id: 3, name: "Item C", available: 1, total: 4 },
  { id: 4, name: "Item D", available: 0, total: 6 },
];

const InventoryPage: React.FC = () => {
  const [search, setSearch] = React.useState("");

  const filteredItems = mockItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col items-start gap-4 p-8 bg-base-100 min-h-screen text-base-content">
      <PageTitle title="Club" />

      <div className="flex items-center justify-between w-full mb-4">
        <input
          type="text"
          placeholder="Item name"
          className="input input-bordered w-full max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex items-center gap-2 ml-2">
          <button className="btn btn-circle btn-ghost">
            <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
        </button>
          <button className="btn btn-primary btn-circle">＋</button>
        </div>
      </div>

      <div className="divider my-2 w-full"></div>

      <div className="flex justify-between items-center bg-base-200 px-4 py-2 rounded-md text-sm font-medium w-full">
        <span>Item name</span>
        <span>Availability</span>
      </div>
      <div className="mt-2 space-y-2 w-full">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => console.log("Clicked:", item)}
            className="btn btn-ghost bg-base-200 hover:bg-base-300 w-full justify-between normal-case"
          >
            <span>{item.name}</span>

            <div className="flex items-center gap-3">
              <span className="text-sm opacity-70">
                {item.available}/{item.total}
                <button className="btn btn-circle btn-ghost">
                    <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                </button>

              </span>
            </div>
          </button>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center opacity-50 py-4">
            No items found
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;