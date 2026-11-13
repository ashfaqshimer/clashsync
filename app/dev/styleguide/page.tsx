import { ArrowRight, BellRing, ClipboardPaste, FlaskConical, Hammer, Loader2, PawPrint, Search, Sparkles, Wrench, Zap } from "lucide-react";
import { Badge, IconChip, Pip } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { Card, CardHeader, Heading, Well } from "@/app/_components/ui/card";
import { CategoryBadge } from "@/app/_components/ui/category";
import { StatusTile } from "@/app/_components/ui/status-tile";

export const metadata = { title: "Style guide | ClashSync" };

/** Dev-only: every design-system component and variant on one page. */
export default function StyleGuide() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <Heading as="h1" size="xl" gold>
        ClashSync style guide
      </Heading>

      <Card className="space-y-3 p-5">
        <span className="label-caps">Headings · Lilita One, outlined</span>
        <Heading as="p" size="xl">Sync Village</Heading>
        <Heading as="p" size="lg" gold>#PQL2VGU8</Heading>
        <Heading as="p" size="md">Active Upgrades (12)</Heading>
        <Heading as="p" size="sm">Discord alerts</Heading>
        <p className="max-w-prose text-sm text-muted">
          Body copy is Nunito. Paste your village export data to track all active builders, laboratory research, and
          pet upgrades.
        </p>
        <p className="text-xs font-semibold text-faint">Faint text (hints, secondary details).</p>
      </Card>

      <Card className="space-y-4 p-5">
        <span className="label-caps">Buttons · bevelled, press-down on click</span>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">
            Sync Village <ArrowRight className="h-5 w-5" />
          </Button>
          <Button>
            <Sparkles className="h-4 w-4" /> Load Sample
          </Button>
          <Button variant="green">
            Open live dashboard <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="blue">
            <Search className="h-4 w-4" /> Lookup Tag
          </Button>
          <Button variant="discord">Log in with Discord</Button>
          <Button variant="red">Turn off</Button>
          <Button variant="stone">
            <ClipboardPaste className="h-4 w-4" /> Paste
          </Button>
          <Button variant="ghost" size="sm">Undo Builder Potion</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small gold</Button>
          <Button size="sm" variant="stone">Send test</Button>
          <Button disabled>
            <Loader2 className="h-4 w-4 animate-spin" /> Syncing Village...
          </Button>
          <Button disabled variant="green">Disabled</Button>
          <Button iconOnly variant="stone" size="sm" aria-label="Icon only">
            <BellRing className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card tone="wood" className="space-y-4 p-5 sm:p-6">
          <CardHeader
            as="h3"
            icon={<IconChip><Hammer /></IconChip>}
            title="Sync Village"
            actions={<Button size="sm" variant="stone">Export Data</Button>}
          />
          <p className="text-sm text-cream/90">Wood panel: the main section of a page (home sync form, dashboard header).</p>
          <textarea
            rows={3}
            aria-label="Example field"
            className="field p-3 font-mono text-xs"
            placeholder='Paste your village export here (it starts with {"tag": "#…)'
          />
          <div className="flex justify-end">
            <Button>Sync Village <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </Card>

        <Card className="space-y-3 p-5">
          <CardHeader
            as="h3"
            icon={<IconChip tone="elixir" size="sm"><FlaskConical /></IconChip>}
            title="Laboratory"
            count={2}
          />
          <Well as="ul" className="divide-y divide-black/30">
            {[
              ["Electro Dragon", "Lv 5 → 6", "1d 4h 18m"],
              ["Healing Spell", "Lv 9 → 10", "11h 01m"],
            ].map(([name, lvl, t]) => (
              <li key={name} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-cream">{name}</div>
                  <div className="text-[11px] text-faint">{lvl} · Sat 4:12 PM</div>
                </div>
                <span className="timer text-sm text-gold-300">{t}</span>
              </li>
            ))}
          </Well>
          <input aria-label="Example input" className="field px-3 py-2 text-sm" placeholder="Your player tag (starts with #, shown under your name in-game)" />
        </Card>
      </div>

      <Card className="space-y-3 p-5">
        <span className="label-caps">Badges, icon chips, pips</span>
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category="BUILDER" />
          <CategoryBadge category="LABORATORY" />
          <CategoryBadge category="PET_HOUSE" />
          <CategoryBadge category="BUILDER_BASE" />
          <CategoryBadge category="OTHER" />
          <Badge tone="green" icon={<Zap className="h-3 w-3" />}>Extra Slot / Goblin</Badge>
          <Badge tone="red">Live Tracker</Badge>
          <Badge tone="discord">on</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <IconChip size="lg"><Hammer /></IconChip>
          <IconChip size="lg" tone="elixir"><FlaskConical /></IconChip>
          <IconChip size="lg" tone="green"><PawPrint /></IconChip>
          <IconChip size="lg" tone="sky"><Wrench /></IconChip>
          <IconChip size="lg" tone="stone"><BellRing /></IconChip>
          <span className="relative">
            <IconChip size="lg" tone="discord"><BellRing /></IconChip>
            <Pip className="absolute -top-2 -right-2">3</Pip>
          </span>
        </div>
      </Card>

      <div className="space-y-2">
        <span className="label-caps">Status tiles · gold rim + pip when something is idle</span>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatusTile icon={Hammer} tone="gold" label="Builders" headline="4/6 busy" detail="2 builders idle!" alert />
          <StatusTile icon={FlaskConical} tone="elixir" label="Laboratory" headline="Busy" detail="Free in 1d 4h 18m" alert={false} />
          <StatusTile icon={PawPrint} tone="green" label="Pet House" headline="Idle" detail="Pet House is idle" alert />
          <StatusTile icon={Wrench} tone="sky" label="Builder Base" headline="Busy" detail="Free in 3h 07m" alert={false} />
        </div>
      </div>

      <Card className="space-y-2 p-5">
        <span className="label-caps">Countdowns · tabular digits (columns line up while ticking)</span>
        <Well className="space-y-1 p-3">
          {["1d 11h 11m 11s", "8d 88h 88m 88s", "0d 04h 20m 01s"].map((t) => (
            <div key={t} className="timer text-lg text-gold-300">{t}</div>
          ))}
        </Well>
      </Card>
    </main>
  );
}
