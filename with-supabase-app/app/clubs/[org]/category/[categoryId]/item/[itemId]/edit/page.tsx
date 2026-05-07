import { Suspense } from "react";
import { EditItemContent } from "./edit-content";

export default function EditItemPage() {
  return (
    <Suspense>
      <EditItemContent />
    </Suspense>
  );
}
