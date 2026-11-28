export { intlayerProxy as proxy } from "next-intlayer/proxy";

export const config = {
  // Everything except the auth API, the dev helpers (/code, /email), Next internals and files.
  matcher: ["/((?!api/|api$|code/|code$|email/|email$|_next/|.*\\..*).*)"],
};
