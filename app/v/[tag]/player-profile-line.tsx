export interface PlayerSummary {
  name: string;
  townHallLevel: number;
  trophies: number;
  clanName: string | null;
  clanBadge: string | null;
}

/** One line under the village heading: clan badge, name, Town Hall, clan, trophies. */
export function PlayerProfileLine({ profile }: { profile: PlayerSummary }) {
  const { name, townHallLevel, trophies, clanName, clanBadge } = profile;
  return (
    <div className="flex items-center gap-2 min-w-0 animate-fade-in">
      {clanBadge && (
        // eslint-disable-next-line @next/next/no-img-element -- tiny remote badge, not worth next/image config
        <img src={clanBadge} alt="" className="w-6 h-6 shrink-0 object-contain drop-shadow-[0_2px_0_rgb(0_0_0/0.6)]" />
      )}
      <p className="text-sm font-semibold text-cream/90 truncate">
        <b className="font-extrabold text-cream">{name}</b>
        <span className="text-cream/60"> · </span>Town Hall {townHallLevel}
        {clanName && (
          <>
            <span className="text-cream/60"> · </span>
            {clanName}
          </>
        )}
        <span className="text-cream/60"> · </span>
        <span className="tabular-nums">🏆 {trophies.toLocaleString("en-US")}</span>
      </p>
    </div>
  );
}
