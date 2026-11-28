import { notFound } from "next/navigation";

// Every unknown path is redirected under a locale by the proxy and ends here, so the 404 page is translated.
export default function UnknownPage() {
  notFound();
}
