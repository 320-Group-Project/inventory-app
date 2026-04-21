"use client"

import Image from "next/image";

interface AnnotatedImageProps {
  text?: string;
  src?: string;
  alt?: string;
}

const AnnotatedImage = ({text, src, alt}: AnnotatedImageProps) => {
  return (
    <div className="flex flex-col">
      {/* Image */}
      {
        src!=undefined?
        <Image src={src} alt={alt ?? ""} height={230} width={230}/>:
        <button className="bg-[#d9d9d9] hover:bg-[#d0d0d0] transition-colors" style={{height: 230, width: 230, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <svg width="66" height="66" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.75 57.75H52.25C55.2876 57.75 57.75 55.2876 57.75 52.25V13.75C57.75 10.7124 55.2876 8.25 52.25 8.25H13.75C10.7124 8.25 8.25 10.7124 8.25 13.75V52.25C8.25 55.2876 10.7124 57.75 13.75 57.75ZM13.75 57.75L44 27.5L57.75 41.25M27.5 23.375C27.5 25.6532 25.6532 27.5 23.375 27.5C21.0968 27.5 19.25 25.6532 19.25 23.375C19.25 21.0968 21.0968 19.25 23.375 19.25C25.6532 19.25 27.5 21.0968 27.5 23.375Z" stroke="#1E1E1E" strokeWidth="5.775" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      }
      
      {/* Text */}
      <div style={{backgroundColor: "#C5C5C5", height: 68, width: 230, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <p className="text-xl">{text ?? ""}</p>
      </div>
    </div>
  )
}

export default AnnotatedImage