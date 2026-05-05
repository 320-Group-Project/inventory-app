import Navbar from "@/components/ui/navbar"
import PageTitle from "@/components/ui/pageTitle"
import { BigButton } from "@/components/ui/BigButton"

export default function Page() {
    return (
      <>
      <Navbar />
      <div className="flex flex-col items-left justify-center gap-4 p-8">
        <PageTitle title="Add Members" />
        <line className="border-t" />
          <div className="card-body items-left text-left">
            <h2 className="card-title">Members Emails:</h2>
            <textarea className="textarea w-full" placeholder="Member emails separated by &quot;,&quot;"></textarea>
            <a href="../settings" className="inline-block">
              <BigButton Title="Save" />
            </a>
        </div>
      </div>
    </>
  )
}