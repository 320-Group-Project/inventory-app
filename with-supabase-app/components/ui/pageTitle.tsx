"use client"
import Back from "./back"

interface PageTitleProps {
  title: string;
  href?: string;
  onClick?: () => void;
}

const PageTitle = ({title, href, onClick}: PageTitleProps) => {
  return (
    <div className="flex gap-4 ml-4">
      {/* Back Button */}
      <Back href={href} onClick={onClick} />
      
      {/* Header */}
      <h1 className="text-3xl font-bold">{title}</h1>
    </div>
  )
}

export default PageTitle