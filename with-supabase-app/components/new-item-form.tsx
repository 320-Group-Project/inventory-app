"use client";

import { cn } from "@/lib/utils";
import PageTitle from "@/components/ui/pageTitle";
import AnnotatedImage from "@/components/ui/annotatedImage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function NewItemForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
  
  return (
    <div className={cn("max-w-5xl mx-auto bg-base-100 rounded-[2.5rem] border border-base-200 shadow-sm p-8 md:p-12", className)} {...props}>
      
      {/* --- Top Nav Section --- */}
      <div className="w-full mb-8">
        <PageTitle title="New Item" />
        <hr className="border-secondary border-t-[3px] mt-4 w-full" />
      </div>

      {/* --- Main Content Flex Row --- */}
      <div className="flex flex-col md:flex-row gap-10 items-start w-full mt-10">

        {/* --- Form Inputs --- */}
        <div className="flex flex-col gap-10 flex-1 w-full pl-4">

          {/* Condition Section */}
          <div className="flex flex-col gap-4">
            <Label className="text-2xl font-normal">Condition</Label>
            
            <div className="flex flex-wrap gap-x-10 gap-y-3 mt-1">
              {/* New (Default Checked) */}
              <div className="flex items-center gap-3">
                <input 
                  type="radio" 
                  name="condition" 
                  id="cond-new" 
                  className="radio radio-secondary border-2 border-secondary checked:bg-secondary w-6 h-6" 
                  defaultChecked 
                />
                <Label htmlFor="cond-new" className="text-xl font-normal cursor-pointer">
                  New
                </Label>
              </div>
              
              {/* Fair */}
              <div className="flex items-center gap-3">
                <input 
                  type="radio" 
                  name="condition" 
                  id="cond-fair" 
                  className="radio radio-secondary border-2 border-secondary checked:bg-secondary w-6 h-6" 
                />
                <Label htmlFor="cond-fair" className="text-xl font-normal cursor-pointer">
                  Fair
                </Label>
              </div>
              
              {/* Damaged */}
              <div className="flex items-center gap-3">
                <input 
                  type="radio" 
                  name="condition" 
                  id="cond-damaged" 
                  className="radio radio-secondary border-2 border-secondary checked:bg-secondary w-6 h-6" 
                />
                <Label htmlFor="cond-damaged" className="text-xl font-normal cursor-pointer">
                  Damaged
                </Label>
              </div>
            </div>
          </div>

          {/* Availability Section */}
          <div className="flex flex-col gap-4">
            <Label className="text-2xl font-normal">Availability</Label>
            
            <div className="flex flex-wrap gap-x-10 gap-y-3 mt-1">
              {/* Available (Default Checked) */}
              <div className="flex items-center gap-3">
                <input 
                  type="radio" 
                  name="availability" 
                  id="avail-available" 
                  className="radio radio-secondary border-2 border-secondary checked:bg-secondary w-6 h-6" 
                  defaultChecked 
                />
                <Label htmlFor="avail-available" className="text-xl font-normal cursor-pointer">
                  Available
                </Label>
              </div>
              
              {/* Checked Out */}
              <div className="flex items-center gap-3">
                <input 
                  type="radio" 
                  name="availability" 
                  id="avail-checkedout" 
                  className="radio radio-secondary border-2 border-secondary checked:bg-secondary w-6 h-6" 
                />
                <Label htmlFor="avail-checkedout" className="text-xl font-normal cursor-pointer">
                  Checked Out
                </Label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <Button 
              type="button" 
              className="bg-secondary text-base-100 hover:bg-secondary/90 px-8 h-14 text-xl rounded-2xl font-normal"
            >
              Save
            </Button>
            <Button 
              type="button" 
              className="bg-secondary text-base-100 hover:bg-secondary/90 px-8 h-14 text-xl rounded-2xl font-normal"
            >
              Cancel
            </Button>
          </div>

        </div>

        {/* --- Image Upload Placeholder --- */}
        <div className="flex-shrink-0 mt-4 md:mt-0">
          <AnnotatedImage text="Upload Image" />
        </div>

        {/* --- Item Description --- */}
        <div className="flex-shrink-0 w-full md:w-64 h-52 mt-4 md:mt-0">
          <textarea
            placeholder="Item Description"
            className="w-full h-full border-[2px] border-secondary rounded-none p-3 text-base focus:outline-none focus:ring-1 focus:ring-secondary bg-transparent placeholder:text-base-content/50 resize-none"
          ></textarea>
        </div>

      </div>
    </div>
  );
}