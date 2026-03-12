export default function Page() {
  return (
    <><div data-theme="ULight" className="flex flex-col items-left justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">New Tile</h1>
      <line className="border-t" />
      <div className="card-xl bg-base-100 w-full shadow-lg">
        <div className="card-body items-left text-left">
          <h2 className="card-title">Tile Name</h2>
          <textarea className="textarea w-full" placeholder="Type here"></textarea>
          <h2 className="card-title">Add Members</h2>
          <textarea className="textarea w-full" placeholder="Member emails separated by &quot;,&quot;"></textarea>
          <button className="btn w-12 bg-black text-white">Save</button>
        </div>
      </div>
    </div></>

  )
}