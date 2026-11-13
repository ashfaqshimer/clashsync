import { Clock, Loader2, Search, Shield } from "lucide-react";
import type { ClashPlayerProfile } from "@/lib/clash-api";
import { Button } from "@/app/_components/ui/button";

interface TagLookupTabProps {
  playerTagInput: string;
  onPlayerTagInputChange: (value: string) => void;
  isLoadingProfile: boolean;
  onLookup: () => void;
  playerProfile: ClashPlayerProfile | null;
  lookupNote: string | null;
}

export function TagLookupTab({
  playerTagInput,
  onPlayerTagInputChange,
  isLoadingProfile,
  onLookup,
  playerProfile,
  lookupNote,
}: TagLookupTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-display text-lg text-gold-300">
            #
          </div>
          <input
            type="text"
            value={playerTagInput}
            onChange={(e) => onPlayerTagInputChange(e.target.value)}
            placeholder="Enter player tag (e.g. R8L9R2GVG or #R8L9R2GVG)"
            aria-label="Player tag"
            className="field h-12 pl-9 pr-4 text-sm font-mono"
          />
        </div>

        <Button
          size="lg"
          variant="blue"
          onClick={onLookup}
          disabled={!playerTagInput.trim() || isLoadingProfile}
        >
          {isLoadingProfile ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Lookup Tag</span>
            </>
          )}
        </Button>
      </div>

      {playerProfile && <PlayerProfileCard profile={playerProfile} />}

      {lookupNote && (
        <div className="well flex items-start gap-2.5 p-3.5 text-sm font-semibold text-gold-100">
          <Clock className="w-4 h-4 mt-0.5 text-gold-300 shrink-0" />
          <span>{lookupNote}</span>
        </div>
      )}
    </div>
  );
}

function PlayerProfileCard({ profile }: { profile: ClashPlayerProfile }) {
  return (
    <div className="well p-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {profile.clan?.badgeUrls?.small && (
          // eslint-disable-next-line @next/next/no-img-element -- tiny remote badge, not worth next/image config
          <img
            src={profile.clan.badgeUrls.small}
            alt="Clan Badge"
            className="w-11 h-11 object-contain drop-shadow-[0_2px_0_rgb(0_0_0/0.6)]"
          />
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="heading-outline text-lg">
              {profile.name}
            </span>
            <span className="badge badge-sky font-mono">
              {profile.tag}
            </span>
          </div>
          <p className="text-xs font-semibold text-cream/75 mt-1">
            Town Hall {profile.townHallLevel} ·{" "}
            {profile.clan?.name || "No Clan"} · 🏆{" "}
            <span className="tabular-nums">{profile.trophies}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold text-cream/70">
        <Shield className="w-4 h-4 text-sky" />
        <span>Official Supercell profile</span>
      </div>
    </div>
  );
}
