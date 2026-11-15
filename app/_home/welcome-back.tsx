import { cache } from "react";
import { getSessionUser } from "@/lib/auth";
import { getOwnedVillages } from "@/lib/village";
import { WelcomeBack } from "./welcome-back-view";
import { FindByTag } from "./find-by-tag";
import { Hero } from "./hero";

/** The viewer and their villages, loaded once per request (shared by the home page sections). */
const getReturningPlayer = cache(async () => {
  const viewer = await getSessionUser();
  const villages = viewer ? await getOwnedVillages(viewer.id) : [];
  return { viewer, villages };
});

/**
 * Top of the home page. New visitors (and logged-in people with no villages yet)
 * get the hero; returning players see their villages first.
 */
export async function HomeTop() {
  const { viewer, villages } = await getReturningPlayer();
  if (!viewer || villages.length === 0) return <Hero />;

  return <WelcomeBack name={viewer.name} villages={villages} />;
}

/** "Open by player tag" is only useful to people whose villages aren't listed above. */
export async function FindByTagUnlessListed() {
  const { villages } = await getReturningPlayer();
  return villages.length > 0 ? null : <FindByTag />;
}
