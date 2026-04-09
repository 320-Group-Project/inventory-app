"use client"
import Back from "./back"

interface PageTitleProps {
  title: string;
  href: string
}

const PageTitle = ({title, href}: PageTitleProps) => {
  return (
    <div className="flex gap-4 ml-4">
      {/* Back Button */}
      <Back href={href}></Back>
      
      {/* Header */}
      <h1 className="text-3xl font-bold">{title}</h1>
    </div>
  )
}

export default PageTitle