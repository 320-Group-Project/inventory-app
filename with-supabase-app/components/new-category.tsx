"use client";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { ItemNameInput } from "./ItemNameInput";
import { Counter } from "./Counter";
import AnnotatedImage from "./ui/annotatedImage";
import { BigButton } from "./ui/BigButton";
import { DescriptionBox } from "./ui/DescriptionBox";

export function NewCategoryContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  
  const [isDistinct, setIsDistinct] = useState(true); 

  return (
    <div className={cn("flex flex-col md:flex-row gap-10 items-start w-full", className)} {...props}>
      
      <div className="flex flex-col gap-10 flex-1 w-full">
        
        {/* Item Name Input */}
        <ItemNameInput/>

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
            <Counter Title="Quantity"/>
          )}
        </div>

        {/* Save & Cancel Buttons */}
        <div className="flex gap-4 mt-4">
          <BigButton Title="Save"/>
          <BigButton Title="Cancel"/>
        </div>
      </div>

      <div className="flex-shrink-0 mt-4 md:mt-0">
        <AnnotatedImage text="Upload Image"/>
      </div>

      <DescriptionBox/>

    </div>
  );
}