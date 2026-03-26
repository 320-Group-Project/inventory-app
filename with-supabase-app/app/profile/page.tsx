import PageTitle from "@/components/ui/pageTitle";

export default function ProfilePage() {
  return (
    <div className="flex flex-col items-left justify-center gap-4 p-8 bg-base-100 min-h-screen text-base-content">
      
      <PageTitle title="Your Profile" />

      <hr className="border-t border-secondary" />

      <div className="card-xl bg-base-100 w-full shadow-lg">
        <div className="card-body items-left text-left">
          <div className="flex flex-col md:flex-row gap-8 w-full">
            {/* Avatar */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-48 h-48 rounded-full bg-base-200 border-8 border-secondary flex items-center justify-center overflow-hidden">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-full h-full text-secondary translate-y-3 scale-125"
                  >
                    <path 
                      fillRule="evenodd"
                      d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                      clipRule="evenodd"
                    />
                  </svg>
              </div>
              <button
                type="button"
                className="underline mt-2 hover:text-secondary bg-transparent border-none cursor-pointer"
                > 
                Add picture 
              </button>
            </div>
            {/* Inputs */}
            <div className="flex-1 w-full">
              <h2 className="card-title font-normal">First Name:</h2>
              <input className="input input-bordered border-secondary/50 focus:border-secondary w-full" placeholder="First Name"/>

              <h2 className="card-title font-normal mt-4">Last Name:</h2>
              <input className="input input-bordered border-secondary/50 focus:border-secondary w-full" placeholder="Last Name"/>

              <h2 className="card-title font-normal mt-4">Email:</h2>
              <input type="email" className="input input-bordered border-secondary/50 focus:border-secondary w-full" placeholder="Email"/>

              {/* Save and Logout */}
              <div className="flex gap-4 mt-6">
                <button type="button" className="btn btn-secondary text-base-100 px-8">Save</button>
                <button type="button" className="btn btn-secondary text-base-100 px-8">Logout</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}