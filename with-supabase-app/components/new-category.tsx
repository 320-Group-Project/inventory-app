"use client";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Image as ImageIcon } from "lucide-react";
import { useState } from "react";

export function NewCategoryContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [isDistinct, setIsDistinct] = useState(true); 
  const [quantity, setQuantity] = useState(1);

  // Handlers for the Quantity buttons
  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <div className={cn("flex flex-col md:flex-row gap-10 items-start w-full", className)} {...props}>
      
      <div className="flex flex-col gap-10 flex-1 w-full">
        
        {/* Item Name Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xl">Item Name</label>
          <input
            type="text"
            placeholder="Item Name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="w-full border-[2px] border-secondary rounded-none p-2 text-lg focus:outline-none focus:ring-1 focus:ring-secondary bg-transparent placeholder:text-base-content/40"
          />
        </div>

        <div className="flex items-end gap-12 h-16">
          
          {/* Distinct Items Checkbox */}
          <div className="flex items-center gap-3 mb-1">
            <Checkbox 
              id="distinct" 
              checked={isDistinct}
              onCheckedChange={(checked) => setIsDistinct(!!checked)}
              className="w-6 h-6 border-2 border-secondary rounded-sm data-[state=checked]:bg-secondary data-[state=checked]:text-base-100"
            />
            <label htmlFor="distinct" className="text-xl cursor-pointer">
              Distinct Items
            </label>
          </div>

          {/* Quantity Selector (Only visible if Distinct is OFF) */}
          {!isDistinct && (
            <div className="flex flex-col items-center gap-1 transition-all">
              <label className="text-lg">Quantity</label>
              <div className="flex items-center h-8">
                <button 
                  type="button"
                  onClick={decrementQuantity}
                  className="bg-base-200 hover:bg-base-300 h-full px-3 text-xl flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <input 
                  type="number" 
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 h-full border-[2px] border-secondary rounded-none text-center text-lg focus:outline-none bg-transparent m-0 appearance-none"
                />
                <button 
                  type="button"
                  onClick={incrementQuantity}
                  className="bg-base-200 hover:bg-base-300 h-full px-3 text-xl flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save & Cancel Buttons */}
        <div className="flex gap-4 mt-4">
          <button type="button" className="btn btn-secondary text-base-100 text-xl px-8 rounded-xl font-normal h-14">
            Save
          </button>
          <button type="button" className="btn btn-secondary text-base-100 text-xl px-8 rounded-xl font-normal h-14">
            Cancel
          </button>
        </div>
      </div>

      <div className="flex-shrink-0 mt-4 md:mt-0">
        <button 
          type="button"
          className="w-40 h-52 bg-[#e0e0e0] flex flex-col items-center hover:bg-[#d5d5d5] transition-colors overflow-hidden cursor-pointer border-none p-0"
        >
          <div className="flex-1 flex items-center justify-center w-full">
            <ImageIcon className="w-10 h-10 text-secondary" />
          </div>
          <div className="bg-[#cccccc] w-full py-2 text-center text-secondary">
            Upload Image
          </div>
        </button>
      </div>

      <div className="flex-shrink-0 w-full md:w-64 h-52 mt-4 md:mt-0">
        <textarea
          placeholder="Item Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full h-full border-[2px] border-secondary rounded-none p-3 text-base focus:outline-none focus:ring-1 focus:ring-secondary bg-transparent placeholder:text-base-content/50 resize-none"
        ></textarea>
      </div>

    </div>
  );
}