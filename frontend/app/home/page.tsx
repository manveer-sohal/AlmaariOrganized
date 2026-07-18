import { redirect } from "next/navigation";

/** Legacy marketing duplicate — prefer the canonical homepage. */
export default function LegacyHomeRedirect() {
  redirect("/");
}
