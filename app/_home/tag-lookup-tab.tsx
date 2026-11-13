import { Clock, Loader2, Search, Shield } from "lucide-react";
import type { ClashPlayerProfile } from "@/lib/clash-api";

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
      <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-mono text-sm font-bold">
            #
          </div>
          <input
            type="text"
            value={playerTagInput}
            onChange={(e) => onPlayerTagInputChange(e.target.value)}
            placeholder="Enter player tag (e.g. R8L9R2GVG or #R8L9R2GVG)"
            className="w-full pl-9 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition"
          />
        </div>

        <button
          type="button"
          onClick={onLookup}
          disabled={!playerTagInput.trim() || isLoadingProfile}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-sky-500/20 transition cursor-pointer"
        >
          {isLoadingProfile ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Lookup Tag</span>
            </>
          )}
        </button>
      </div>

      {playerProfile && <PlayerProfileCard profile={playerProfile} />}

      {lookupNote && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-200">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{lookupNote}</span>
        </div>
      )}
    </div>
  );
}

function PlayerProfileCard({ profile }: { profile: ClashPlayerProfile }) {
  return (
    <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {profile.clan?.badgeUrls?.small && (
          // eslint-disable-next-line @next/next/no-img-element -- tiny remote badge, not worth next/image config
          <img
            src={profile.clan.badgeUrls.small}
            alt="Clan Badge"
            className="w-10 h-10 object-contain"
          />
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white">
              {profile.name}
            </span>
            <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
              {profile.tag}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Town Hall {profile.townHallLevel} ·{" "}
            {profile.clan?.name || "No Clan"} · 🏆{" "}
            {profile.trophies}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
        <Shield className="w-4 h-4 text-sky-400" />
        <span>Official Supercell profile</span>
      </div>
    </div>
  );
}
