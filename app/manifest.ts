import type { MetadataRoute } from "next";

/** Lets players pin ClashSync to their home screen with the right name, icon and colours. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ClashSync",
    short_name: "ClashSync",
    description: "Live builder, lab and pet timers for Clash of Clans, with Discord alerts.",
    start_url: "/",
    display: "standalone",
    background_color: "#07101d",
    theme_color: "#0c1828",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
