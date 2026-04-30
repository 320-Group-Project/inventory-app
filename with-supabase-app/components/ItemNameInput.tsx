"use client";

import { useState } from "react";

export function ItemNameInput(){
    const [itemName, setItemName] = useState("");

    return (
    <div className="flex flex-col gap-2">
        <label className="text-xl">Item Name</label>
        <input
            type="text"
            placeholder="Item Name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="w-full border-[2px] border-secondary rounded-none p-2 text-lg focus:outline-none focus:ring-1 focus:ring-secondary bg-transparent placeholder:text-base-content/40"
        />
    </div>)
}