import PageTitle from "@/components/ui/pageTitle"

export default function Page() {
    return (
      <><div className="flex flex-col items-left justify-center gap-4 p-8">
        <PageTitle title="Add Members" />
        <line className="border-t" />
          <div className="card-body items-left text-left">
            <h2 className="card-title">Members Emails:</h2>
            <textarea className="textarea w-full" placeholder="Member emails separated by &quot;,&quot;"></textarea>
            <button className="btn w-12 bg-black text-white">Save</button>
        </div>
      </div></>
  
    )
  }