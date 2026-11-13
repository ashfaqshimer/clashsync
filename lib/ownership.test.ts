import { beforeEach, describe, expect, it, vi } from "vitest";

let viewer: { id: string; name: string; image: null } | null = null;
vi.mock("@/lib/auth", () => ({ getSessionUser: async () => viewer }));

const { getVillageAccess } = await import("./ownership");

const TAG = "#PY";
const alice = { id: "alice", name: "Alice", image: null };

beforeEach(() => {
  viewer = null;
});

describe("getVillageAccess", () => {
  it("lets anyone edit an unclaimed village, and claims it for a logged-in viewer", async () => {
    const village = { playerTag: TAG, ownerId: null };
    expect(await getVillageAccess(village)).toMatchObject({ canEdit: true, isOwner: false, shouldClaim: false });

    viewer = alice;
    expect(await getVillageAccess(village)).toMatchObject({ canEdit: true, isOwner: false, shouldClaim: true });
  });

  it("only lets the owning account edit a claimed village", async () => {
    const village = { playerTag: TAG, ownerId: "alice" };
    expect(await getVillageAccess(village)).toMatchObject({ canEdit: false, isOwner: false });

    viewer = { id: "mallory", name: "M", image: null };
    expect(await getVillageAccess(village)).toMatchObject({ canEdit: false, isOwner: false });

    viewer = alice;
    expect(await getVillageAccess(village)).toMatchObject({ canEdit: true, isOwner: true, shouldClaim: false });
  });
});
