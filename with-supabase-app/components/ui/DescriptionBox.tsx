import { useState } from "react";

export function DescriptionBox(){

    const [description, setDescription] = useState("");

    return (
        <div className="flex-shrink-0 w-full md:w-64 h-74 mt-4 md:mt-0">
        <textarea
            placeholder="Item Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-full border-[2px] border-secondary rounded-none p-3 text-base focus:outline-none focus:ring-1 focus:ring-secondary bg-transparent placeholder:text-base-content/50 resize-none"
        ></textarea>
        </div>
    )
}