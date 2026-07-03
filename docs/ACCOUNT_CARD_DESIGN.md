# Account Card Design Specification

## Overview

The Account Card is a premium, professional component designed to display comprehensive user account information including balance, trading statistics, and account status. It combines data clarity with visual hierarchy and real-time interactions.

---

## Design System

### Color Palette

| Element | Color | Purpose |
|---------|-------|---------|
| **Primary (Blue)** | `oklch(0.55 0.25 260)` | Account balance, key metrics |
| **Secondary (Gold)** | `oklch(0.7 0.15 70)` | P&L display, highlights |
| **Accent (Purple)** | `oklch(0.6 0.2 300)` | Statistics, secondary actions |
| **Success (Green)** | `oklch(0.6 0.25 140)` | Profit, positive metrics |
| **Danger (Red)** | `oklch(0.6 0.25 25)` | Losses, negative metrics |
| **Background** | `oklch(0.04 0.01 240)` | Deep midnight |
| **Card** | `oklch(0.08 0.02 240 / 0.5)` | Soft card with blur |

### Typography

- **Headlines** (2xl, 3xl): Bold, high contrast
- **Body Text** (sm, base): Regular weight for readability
- **Labels** (xs): Uppercase, tracking-wider, muted tone
- **Numbers** (xl, 3xl): Bold, monospace-compatible

### Spacing & Sizing

- **Card Padding**: 1.5rem (p-6)
- **Section Gaps**: 1.5rem (gap-6)
- **Border Radius**: 0.75rem (--radius)
- **Max Width**: 42rem (max-w-2xl)

---

## Component Layout

### 1. Header Section
```
┌─────────────────────────────────────────────────────┐
│ John Trader                              [👁] [↻]   │
│ john@example.com                                     │
│ [✓ Active] Updated 2:34 PM                           │
└─────────────────────────────────────────────────────┘
```

**Elements:**
- User name (large, bold)
- Email address (muted)
- Status badge (color-coded)
- Last updated timestamp
- Show/hide balance toggle button
- Refresh button (optional)

**Status Colors:**
- Active: Green background with checkmark
- Inactive: Gray background with dot
- Verification Pending: Yellow background with hourglass

---

### 2. Balance Section
```
┌──────────────────────┬──────────────────────┐
│ ACCOUNT BALANCE      │ TOTAL P&L            │
│ $25,840.50     [📋]  │ ↗ $5,840.50          │
│ Available: $18,540.50│ +29.2%               │
└──────────────────────┴──────────────────────┘
```

**Account Balance Card:**
- Large, prominent display
- Blue glow effect on hover
- Copy-to-clipboard button
- Available balance subtitle
- Blurred when balance hidden

**P&L Card:**
- Trending indicator (up/down arrow)
- Color-coded (green = profit, red = loss)
- Percentage change displayed
- Gold glow effect for positive returns

---

### 3. Trading Statistics
```
┌──────────┬──────────┬──────────┬──────────┐
│ TOTAL    │ WIN RATE │ STREAK   │ AVG      │
│ TRADES   │          │          │ RETURN   │
│ 142      │ 68.3%    │ 8        │ 2.4%     │
│          │          │ wins     │          │
└──────────┴──────────┴──────────┴──────────┘
```

**Grid (2x2 on mobile, 4x1 on desktop):**
- Total Trades: Primary foreground color
- Win Rate: Green accent
- Consecutive Wins: Purple accent
- Avg Return: Primary accent

---

### 4. Quick Actions
```
┌──────────────────┬──────────────────┐
│ 💾 Deposit       │ 📊 View All      │
│                  │    Trades        │
└──────────────────┴──────────────────┘
```

**Buttons:**
- Primary action (Deposit): Primary color with transparency
- Secondary action (View All): Accent color with transparency
- Hover state: Increased opacity
- Small, uppercase labels

---

## Visual Effects

### Glass Morphism
```css
background: linear-gradient(135deg, rgba(15, 22, 41, 0.6), rgba(26, 35, 53, 0.6));
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.08);
```

### Glow Effects

**Blue Glow (Account Balance):**
```css
box-shadow: 0 0 25px oklch(0.6 0.2 250 / 0.2),
            inset 0 0 15px oklch(0.6 0.2 250 / 0.05);
```

**Gold Glow (P&L):**
```css
box-shadow: 0 0 25px oklch(0.7 0.15 70 / 0.2),
            inset 0 0 15px oklch(0.7 0.15 70 / 0.05);
```

### Loading State
- Skeleton animation with pulse effect
- Maintains card structure
- 2-3 second animation duration

### Balance Hidden State
- Dollar amounts replaced with dots (••••••••)
- Icon toggle shows/hides content
- Smooth transitions
- Maintains layout stability

---

## Responsive Design

### Desktop (md: 768px+)
- 2-column balance section
- 4-column statistics grid
- Full width optimal at max-w-2xl
- Larger typography

### Mobile (< 768px)
- Single column balance section
- 2x2 statistics grid
- Full width with padding
- Slightly smaller typography
- Touch-friendly button sizes

---

## Interaction States

### Button Hover
```css
background: linear-gradient(...);
opacity: 0.8 → 1.0;
transition: all 200ms ease-in-out;
```

### Copy to Clipboard
- Tooltip or status message
- Icon changes temporarily
- Auto-reverts after 2 seconds

### Refresh Action
- Loading spinner on button
- API call initiated
- Data updates smoothly
- Optional success toast

### Show/Hide Balance
- Smooth opacity transition
- Icon toggles between eye and eye-off
- All monetary values toggle together
- Layout remains stable

---

## Data States

### Loading State
- Skeleton loaders for each section
- Maintains card proportions
- Pulse animation
- Shows depth with opacity variations

### Error State
- Red accent color
- Error icon and message
- Retry button
- Graceful fallback to default data

### Empty State
- Zero values displayed
- Gray accent colors
- "No data yet" messages
- Call-to-action button

---

## Accessibility

### Semantic HTML
- `<h2>` for user name
- `<p>` for descriptive text
- `<button>` for interactive elements
- Proper heading hierarchy

### ARIA Labels
```tsx
<button title="Hide balance" aria-label="Toggle balance visibility">
  {showBalance ? <Eye /> : <EyeOff />}
</button>
```

### Color Contrast
- All text meets WCAG AA standards (4.5:1 minimum)
- Not relying on color alone for information
- Icons paired with text labels

### Keyboard Navigation
- Tab-focus visible on all buttons
- Focus rings match design system
- Logical tab order

---

## Variants

### Compact Variant
```tsx
<AccountCard compact={true} hideStats={false} hideActions={false} />
```
- Reduced padding
- Smaller typography
- Single-column layout
- Minimal spacing

### Read-Only Variant
```tsx
<AccountCard readOnly={true} />
```
- No interactive buttons
- No copy functionality
- No refresh button
- Display-only mode

### Full Detail Variant
```tsx
<AccountCard detailed={true} />
```
- Additional sections (recent trades, account history)
- More statistics
- Transaction breakdown
- Historical charts

---

## Usage Example

```tsx
import { AccountCard } from '@/components/account-card';

export function Dashboard() {
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch account data
    fetchAccountData().then(data => {
      setAccountData(data);
      setLoading(false);
    });
  }, []);

  const handleRefresh = async () => {
    const newData = await fetchAccountData();
    setAccountData(newData);
  };

  return (
    <AccountCard 
      data={accountData}
      isLoading={loading}
      onRefresh={handleRefresh}
      showFullBalance={true}
    />
  );
}
```

---

## File Structure

```
components/
├── account-card.tsx          ← Main component
├── account-card.test.tsx     ← Unit tests
└── variants/
    ├── compact.tsx           ← Compact layout
    ├── detailed.tsx          ← Full detail version
    └── read-only.tsx         ← Display-only version

docs/
├── ACCOUNT_CARD_DESIGN.md    ← This file
└── ACCOUNT_CARD_USAGE.md     ← Integration guide
```

---

## Performance Considerations

- **Memoization**: Component uses React.memo for optimization
- **Lazy Loading**: Data fetching can be async
- **Animations**: CSS-based for smooth 60fps
- **Bundle Size**: ~8KB gzipped with dependencies

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Theming

The component respects Tailwind CSS custom properties:

```css
--primary: oklch(0.55 0.25 260);
--secondary: oklch(0.7 0.15 70);
--accent: oklch(0.6 0.2 300);
--background: oklch(0.04 0.01 240);
--card: oklch(0.08 0.02 240 / 0.5);
```

Override these in `globals.css` to rebrand the component.
