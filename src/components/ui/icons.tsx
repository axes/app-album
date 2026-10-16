import {
  ArrowLeft,
  ArrowLeftRight,
  Check,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleX,
  Copy,
  Image as ImageGlyph,
  Info,
  LayoutGrid,
  List,
  LoaderCircle,
  Lock,
  Menu,
  Minus,
  Moon,
  Pencil,
  Plus,
  Search,
  Share2,
  Star,
  Sticker,
  Sun,
  Trash2,
  TriangleAlert,
  Trophy,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import type { SVGProps } from "react";

/**
 * DESIGN v2 §6 — the single icon module.
 *
 * Every icon in the product comes from here. `lucide-react` is imported with
 * one named import per glyph (never `import * as`), which keeps the bundle
 * tree-shakeable: the package declares `sideEffects: false`, so only the
 * icons actually referenced end up in the client bundle.
 *
 * No other file in `src/` may import `lucide-react` directly. That rule is
 * enforced twice: by the `no-restricted-imports` ESLint rule in
 * `eslint.config.mjs` and by `src/components/ui/icons.test.tsx`.
 *
 * The semantic map below is the contract: the same meaning always renders the
 * same glyph across the whole app. The keys are meaning-based, never
 * colour- or shape-based, so swapping a glyph is a one-line change here.
 */
export const ICONS = {
  // DESIGN v2 §6 mandatory map.
  albums: Sticker,
  explore: Search,
  profile: User,
  add: Plus,
  remove: Minus,
  owned: Check,
  repeated: Copy,
  special: Star,
  completed: Trophy,
  delete: Trash2,
  swap: ArrowLeftRight,
  share: Share2,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleX,
  info: Info,
  close: X,
  menu: Menu,
  grid: LayoutGrid,
  lock: Lock,
  loading: LoaderCircle,
  // Extensions required by the product but not covered by DESIGN v2 §6.
  // Reported explicitly in the phase report.
  sun: Sun, // theme selector (light)
  moon: Moon, // theme selector (dark)
  chevronUp: ChevronUp, // collapsible sections, move-up controls
  chevronDown: ChevronDown, // collapsible sections, move-down controls
  list: List, // "Lista" view toggle
  pencil: Pencil, // inline rename affordances in the admin catalog
  image: ImageGlyph, // album cover placeholder
  back: ArrowLeft, // "← Álbumes" contextual back links
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

/**
 * DESIGN v2 §6 sizes: 16 px in badges and field messages, 20 px in buttons,
 * alerts and desktop tabs, 24 px in mobile navigation.
 */
export const ICON_SIZES = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export type IconSize = keyof typeof ICON_SIZES;

/**
 * DESIGN v2 §6: the loading glyph is the only animated icon. It spins at
 * `--motion-spin` (800 ms) and the rotation is removed entirely under
 * `prefers-reduced-motion` (see `globals.css`), where the gerund label
 * ("Guardando…") carries the meaning on its own.
 */
const SPINNING_ICONS: ReadonlySet<IconName> = new Set<IconName>(["loading"]);

export type IconProps = Omit<SVGProps<SVGSVGElement>, "name" | "ref"> & {
  /** Semantic name from the DESIGN v2 §6 map. */
  name: IconName;
  /** `sm` 16 px, `md` 20 px, `lg` 24 px. Defaults to `md`. */
  size?: IconSize;
  /**
   * Accessible name. When present the icon becomes `role="img"` with an
   * `aria-label`; when absent it is decorative (`aria-hidden="true"`).
   * An icon-only button must carry its own `aria-label` on the button.
   */
  label?: string;
};

/**
 * Renders a DESIGN v2 icon.
 *
 * Stroke width is fixed at 2 and the colour always follows `currentColor`, so
 * an icon inherits the text colour of whatever it sits in. Sizing is driven by
 * the `size` token rather than by ad-hoc Tailwind classes, which keeps the
 * three DESIGN sizes the only ones in use.
 */
export function Icon({ name, size = "md", label, className, ...rest }: IconProps) {
  const Glyph = ICONS[name];

  // Fail loudly instead of rendering `undefined` as a React element. A typo in
  // a semantic name is a programming error, not a runtime condition, so it
  // must surface immediately with the list of valid names.
  if (!Glyph) {
    throw new Error(
      `Icon: unknown icon name "${String(name)}". Valid names: ${Object.keys(ICONS).join(", ")}.`,
    );
  }

  const pixels = ICON_SIZES[size];
  const spins = SPINNING_ICONS.has(name);

  return (
    <Glyph
      width={pixels}
      height={pixels}
      size={pixels}
      strokeWidth={2}
      color="currentColor"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable={false}
      className={[spins ? "animate-spin" : undefined, className]
        .filter(Boolean)
        .join(" ") || undefined}
      data-icon={name}
      {...rest}
    />
  );
}
