"use client"
import Back from "./back"

interface PageTitleProps {
  title: string;
}

const PageTitle = ({title}: PageTitleProps) => {
  return (
    <div className="flex gap-4 ml-4">
      {/* Back Button */}
      <Back></Back>
      
      {/* Header */}
      <h1 className="text-3xl font-bold">{title}</h1>
    </div>
  )
}

export default PageTitle