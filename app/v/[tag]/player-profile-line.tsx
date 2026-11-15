export interface PlayerSummary {
  name: string;
  townHallLevel: number;
  trophies: number;
  clanName: string | null;
  clanBadge: string | null;
}

/** One line under the village heading: clan badge, (name), Town Hall, clan, trophies. */
export function PlayerProfileLine({ profile, showName = true }: { profile: PlayerSummary; showName?: boolean }) {
  const { name, townHallLevel, trophies, clanName, clanBadge } = profile;
  const sep = <span className="text-cream/60"> · </span>;
  return (
    <div className="flex items-center gap-2 min-w-0 animate-fade-in">
      {clanBadge && (
        // eslint-disable-next-line @next/next/no-img-element -- tiny remote badge, not worth next/image config
        <img src={clanBadge} alt="" className="w-6 h-6 shrink-0 object-contain drop-shadow-[0_2px_0_rgb(0_0_0/0.6)]" />
      )}
      <p className="text-sm font-semibold text-cream/90 truncate">
        {showName && (
          <>
            <b className="font-extrabold text-cream">{name}</b>
            {sep}
          </>
        )}
        Town Hall {townHallLevel}
        {clanName && (
          <>
            {sep}
            {clanName}
          </>
        )}
        {sep}
        <span className="tabular-nums">🏆 {trophies.toLocaleString("en-US")}</span>
      </p>
    </div>
  );
}
