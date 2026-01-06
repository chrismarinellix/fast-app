# Fast! App - Design System

## Design Philosophy
Clean, minimal, focused. Inspired by wall-display project aesthetic.
No clutter - just the essential information during a fast.

## Color Palette

### Primary Colors
- **Green (Success/Active)**: `#22c55e`
- **Yellow (Warning/Caution)**: `#eab308`
- **Orange (Energy)**: `#f97316`
- **Purple (Transformation)**: `#8b5cf6`
- **Red (Danger/Stop)**: `#ef4444`

### Neutral Colors
- **Background**: `#fafafa`
- **Card Background**: `#ffffff`
- **Border**: `#e5e5e5`
- **Text Primary**: `#1f2937`
- **Text Secondary**: `#6b7280`
- **Text Muted**: `#9ca3af`

## Typography

- **Font**: System font stack (native to each OS)
- **Heading (App Title)**: 48-64px, bold
- **Timer Display**: 48px, bold, monospace feel
- **Section Headers**: 18-20px, semibold
- **Body Text**: 14-16px, regular
- **Small/Labels**: 12-13px, medium

## Component Styles

### Buttons
```css
/* Primary Button */
background: #22c55e;
color: white;
padding: 12px 24px;
border-radius: 12px;
font-weight: 600;
box-shadow: 0 4px 14px rgba(34, 197, 94, 0.3);

/* Hover */
transform: translateY(-2px);
box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);

/* Secondary Button */
background: transparent;
border: 2px solid #e5e5e5;
color: #374151;
```

### Cards
```css
background: white;
border-radius: 16px;
padding: 24px;
box-shadow: 0 1px 3px rgba(0,0,0,0.1);
```

### Progress Bar
```css
/* Track */
background: #e5e5e5;
height: 8px;
border-radius: 4px;

/* Fill */
background: linear-gradient(90deg, #22c55e, #16a34a);
transition: width 0.5s ease;
```

### Milestone Dots
```css
/* Inactive */
width: 12px;
height: 12px;
border-radius: 50%;
background: #e5e5e5;

/* Active/Completed */
background: #22c55e;
box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);

/* Current */
animation: pulse 2s infinite;
```

## Layout

### Mobile First
- Single column layout
- Full-width cards
- Touch-friendly tap targets (min 44px)

### Desktop
- Max-width container: 600px
- Centered content
- More whitespace

## Fasting Milestones (13 stages)

| Hour | Title | Color | Icon |
|------|-------|-------|------|
| 0 | Fast Begins | Gray | Clock |
| 2 | Digestion Winding Down | Gray | Clock |
| 4 | Blood Sugar Stable | Yellow | Zap |
| 6 | Fat Burning Begins | Orange | Flame |
| 8 | Growth Hormone Rising | Orange | TrendingUp |
| 10 | Ketosis Starting | Purple | Sparkles |
| 12 | Ketosis Deepening | Purple | Brain |
| 16 | Autophagy Begins | Purple | Heart |
| 18 | Peak Fat Burning | Orange | Flame |
| 20 | Deep Autophagy | Purple | Sparkles |
| 24 | Full Day Complete | Green | Award |
| 36 | Extended Autophagy | Purple | Star |
| 48 | Deep Cellular Renewal | Green | Target |

## Mood/Feeling Options (29 options)

### Physical (Green tones)
- Energetic, Strong, Focused, Clear-headed, Light

### Emotional (Blue tones)
- Calm, Motivated, Proud, Peaceful, Grateful

### Challenges (Orange/Red tones)
- Hungry, Tired, Irritable, Headache, Dizzy

### Cravings (Purple tones)
- Craving sweets, Craving carbs, Craving coffee, Thinking about food

## Animation Guidelines

- **Transitions**: 0.2-0.3s ease
- **Hover effects**: Subtle lift (translateY -2px)
- **Loading states**: Pulse animation
- **Timer**: Smooth countdown (1s intervals)
- **Progress bar**: Smooth width transitions

## Accessibility

- Sufficient color contrast (4.5:1 minimum)
- Focus visible states on interactive elements
- Touch targets minimum 44x44px
- Screen reader friendly labels
