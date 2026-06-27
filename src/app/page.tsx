// Module: Landing Redirect | Owner: Frontend Lead
// The platform opens directly onto the surveillance dashboard.
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
