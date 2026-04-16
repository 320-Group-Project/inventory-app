"use client";

import { useState } from "react";

interface CounterProps{
    Title: string;
}

export function Counter({Title}: CounterProps){

    const [quantity, setQuantity] = useState(1);

    const incrementQuantity = () => setQuantity(prev => prev + 1);
    const decrementQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

    return (
        <div className="flex flex-col items-center gap-1 transition-all">
            <label className="text-lg">{Title}</label>
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
    )
}