import { Suspense } from "react";
import Loader from "@/components/loader";
import Home from "./page-dynamic";

export default async function Page() {
    return (
        <Suspense fallback={<Loader />}>
            <Home />
        </Suspense>
    )
}