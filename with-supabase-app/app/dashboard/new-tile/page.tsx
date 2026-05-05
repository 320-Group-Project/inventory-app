import Link from "next/link"
import Navbar from "@/components/ui/navbar"
import PageTitle from "@/components/ui/pageTitle"
import { Input } from "@/components/ui/input"
import { BigButton } from "@/components/ui/BigButton"

export default function Page() {
    return (
        <><Navbar />
        <div className="flex flex-col items-left justify-center gap-4 p-8">
            <PageTitle title="New Tile" href="/dashboard"/>
            <hr className="border-t w-full" />
            <div className="card-xl bg-base-100 w-full shadow-lg">
                <div className="card-body items-left text-left">
                    <h2 className="card-title">Tile Name</h2>
                    <Input className="w-full" placeholder="Type here" />                    <h2 className="card-title">Add Members</h2>
                    <textarea className="textarea w-full" placeholder="Member emails separated by &quot;,&quot;"></textarea>
                    <Link href="/dashboard" className="inline-block mt-2">
                        <BigButton Title="Save" />
                    </Link>
                </div>
            </div>
        </div></>

    )
}