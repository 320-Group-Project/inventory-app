export default function Page() {
    return (
      <><div className="flex flex-col items-left justify-center gap-4 p-8">
        <h1 className="text-3xl font-bold">Add Members</h1>
        <line className="border-t" />
          <div className="card-body items-left text-left">
            <h2 className="card-title">Members Emails:</h2>
            <textarea className="textarea w-full" placeholder="Member emails separated by &quot;,&quot;"></textarea>
            <button className="btn w-12 bg-black text-white">Save</button>
        </div>
      </div></>
  
    )
  }