# PropGuide AI Design System

## Overview
This design system establishes consistent visual and interaction patterns for PropGuide AI, a real estate investment management platform designed for small real estate investors.

## Design Principles

### 1. Professional Trust
- Convey reliability and expertise in real estate investment
- Use colors and typography that inspire confidence
- Maintain clean, uncluttered interfaces

### 2. Data Clarity
- Prioritize readability of financial metrics
- Use clear visual hierarchy for important information
- Implement consistent data visualization patterns

### 3. Investor-Focused
- Design for quick decision-making
- Emphasize actionable insights
- Support both desktop and mobile workflows

## Color Palette

### Primary Colors - Trust & Growth Theme

#### Primary (Forest Green)
- **Main**: `#1B4D3E` - Primary actions, headers, navigation
- **Light**: `#2E7D32` - Hover states, light backgrounds
- **Dark**: `#0D2818` - Active states, dark backgrounds
- **Contrast Text**: `#ffffff`

#### Secondary (Gold)
- **Main**: `#D4AF37` - Secondary actions, highlights, wealth indicators
- **Light**: `#FFD700` - Light highlights, subtle accents
- **Dark**: `#B8860B` - Dark highlights, pressed states
- **Contrast Text**: `#000000`

#### Accent (Teal)
- **Main**: `#14b8a6` - Accent elements, links, interactive elements
- **Light**: `#5eead4` - Light accents, subtle highlights
- **Dark**: `#0f766e` - Dark accents, active states
- **Contrast Text**: `#ffffff`

#### Neutral (Gray Scale)
- **50**: `#fafafa` - Background surfaces
- **100**: `#f5f5f5` - Light backgrounds
- **200**: `#e5e5e5` - Borders, dividers
- **300**: `#d4d4d4` - Disabled elements
- **400**: `#a3a3a3` - Placeholder text
- **500**: `#737373` - Secondary text
- **600**: `#525252` - Primary text (secondary)
- **700**: `#404040` - Primary text
- **800**: `#262626` - High contrast text
- **900**: `#171717` - Maximum contrast text

### Status Colors
Property status indicators use sophisticated, varied colors for maximum distinction and professional appearance:

- **Opportunity**: `#6B8E6B` (Muted Sage Green) - Growth potential
- **Soft Offer**: `#D4A574` (Warm Beige) - Gentle caution, review needed
- **Hard Offer**: `#B8860B` (Dark Gold) - Action required, uses theme gold
- **Rehab**: `#A0522D` (Sienna Brown) - Attention needed
- **Operational**: `#4682B4` (Steel Blue) - Stable, performing
- **Needs Tenant**: `#9370DB` (Muted Purple) - Vacancy issue
- **Selling**: `#CD853F` (Peru) - Exit strategy

### Metric Colors
Financial metrics use color coding for quick assessment:

- **Positive**: `#22c55e` (Green) - Profitable, good performance
- **Caution**: `#f59e0b` (Amber) - Moderate performance, review
- **Negative**: `#ef4444` (Red) - Poor performance, attention needed
- **Neutral**: `#737373` (Gray) - No data or neutral state

## Typography

### Font Family
- **Primary**: `'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`
- **Monospace**: `'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace` (for financial data)

### Font Scale
- **H1**: `2.5rem` (40px) / `700` weight / `1.2` line height
- **H2**: `2rem` (32px) / `600` weight / `1.3` line height
- **H3**: `1.5rem` (24px) / `600` weight / `1.4` line height
- **H4**: `1.25rem` (20px) / `500` weight / `1.4` line height
- **H5**: `1.125rem` (18px) / `500` weight / `1.5` line height
- **H6**: `1rem` (16px) / `500` weight / `1.5` line height
- **Body**: `1rem` (16px) / `400` weight / `1.6` line height
- **Caption**: `0.875rem` (14px) / `400` weight / `1.5` line height
- **Small**: `0.75rem` (12px) / `400` weight / `1.4` line height

### Usage Guidelines
- **Headings**: Use for page titles, section headers, and important labels
- **Body**: Standard text for descriptions, notes, and general content
- **Caption**: Use for labels, metadata, and secondary information
- **Monospace**: Use for financial figures, addresses, and data that needs alignment

## Spacing System

### Base Unit
- **Base**: `8px` (0.5rem)
- All spacing values should be multiples of 8px

### Spacing Scale
- **xs**: `4px` (0.25rem)
- **sm**: `8px` (0.5rem)
- **md**: `16px` (1rem)
- **lg**: `24px` (1.5rem)
- **xl**: `32px` (2rem)
- **2xl**: `48px` (3rem)
- **3xl**: `64px` (4rem)

### Usage Guidelines
- **Component padding**: Use `md` (16px) for standard padding
- **Section spacing**: Use `lg` (24px) between major sections
- **Card spacing**: Use `md` (16px) internal, `lg` (24px) external
- **Form spacing**: Use `md` (16px) between form elements

## Border Radius

### Scale
- **sm**: `4px` - Small elements, badges
- **md**: `8px` - Standard elements, buttons
- **lg**: `12px` - Cards, containers
- **xl**: `16px` - Large containers, modals
- **2xl**: `24px` - Hero sections, large cards

### Usage Guidelines
- **Buttons**: Use `md` (8px) for standard buttons
- **Cards**: Use `lg` (12px) for property cards and containers
- **Modals**: Use `xl` (16px) for dialog containers
- **Badges**: Use `sm` (4px) for status indicators

## Shadows

### Elevation Scale
- **sm**: `0 1px 2px rgba(0,0,0,0.05)` - Subtle elevation
- **md**: `0 2px 8px rgba(0,0,0,0.08)` - Standard elevation
- **lg**: `0 4px 16px rgba(0,0,0,0.12)` - High elevation
- **xl**: `0 8px 32px rgba(0,0,0,0.16)` - Maximum elevation

### Usage Guidelines
- **Cards**: Use `md` shadow for property cards
- **Modals**: Use `lg` shadow for dialogs
- **Navigation**: Use `sm` shadow for subtle separation
- **Floating elements**: Use `lg` or `xl` for prominent elements

## Component Guidelines

### Buttons
- **Primary**: Forest green background, white text
- **Secondary**: Gold background, black text
- **Outlined**: Transparent background, colored border
- **Text**: Transparent background, colored text
- **Size**: Minimum 44px height for touch targets

### Cards
- **Background**: White (`#ffffff`)
- **Border**: Light gray (`#e5e5e5`)
- **Radius**: `lg` (12px)
- **Shadow**: `md` elevation
- **Padding**: `lg` (24px)

### Tables
- **Header**: Forest green background, white text
- **Rows**: Alternating white and light gray backgrounds
- **Hover**: Light green highlight (`#f0f9f4`)
- **Borders**: Light gray (`#e5e5e5`)

### Forms
- **Inputs**: White background, gray border (`#d4d4d4`)
- **Focus**: Forest green border (`#1B4D3E`)
- **Error**: Red border (`#ef4444`)
- **Labels**: Dark gray text (`#404040`)

## Accessibility

### Contrast Requirements
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio
- **Interactive elements**: Minimum 3:1 contrast ratio

### Color Accessibility
- Never rely solely on color to convey information
- Use icons, text, or patterns alongside color
- Test with color-blind simulation tools
- Provide alternative indicators for status

### Focus States
- **Visible focus**: Clear outline or background change
- **Keyboard navigation**: All interactive elements accessible via keyboard
- **Focus order**: Logical tab sequence through interface

## Responsive Design

### Breakpoints
- **xs**: `0px` - Mobile phones
- **sm**: `600px` - Large phones, small tablets
- **md**: `900px` - Tablets
- **lg**: `1200px` - Desktops
- **xl**: `1536px` - Large desktops

### Mobile-First Approach
- Design for mobile first, then enhance for larger screens
- Touch targets minimum 44px
- Readable text without zooming
- Thumb-friendly navigation

## Implementation Notes

### Material-UI Integration
- Extend MUI theme with custom colors
- Use MUI's spacing system (8px base)
- Leverage MUI's responsive breakpoints
- Customize component variants as needed

### CSS Custom Properties
```css
:root {
  --color-primary: #1B4D3E;
  --color-secondary: #D4AF37;
  --color-accent: #14b8a6;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}
```

## Mobile Card System

### Overview
A comprehensive mobile-first card system that automatically switches between table and card layouts based on screen size. The system prioritizes key financial metrics for quick decision-making.

### Key Components
- **PropertyCard**: Individual property display card
- **PropertyCardGrid**: Container for responsive card layout
- **useResponsiveLayout**: Hook for consistent responsive behavior

### Card Layout Structure
1. **Header**: Address + Status + Actions
2. **Key Metrics**: Rent %, ARV %, Equity, Cashflow (most prominent)
3. **Investment Scores**: Hold Score & Flip Score badges
4. **Property Details**: Secondary information
5. **Notes**: Collapsible notes section

### Responsive Breakpoints
- **Mobile** (`< 900px`): Single column cards, compact spacing
- **Tablet** (`900px - 1200px`): Single column cards, standard spacing  
- **Desktop** (`> 1200px`): Table layout (cards hidden)

### Usage Example
```typescript
<PropertyCardGrid
  properties={properties}
  title="Investment Opportunities"
  onEdit={handleEditProperty}
  onViewDetails={(property) => navigate(`/property/${property.id}`)}
  formatCurrency={formatCurrency}
  formatPercentage={formatPercentage}
  getRentRatioColor={getRentRatioColor}
  getARVRatioColor={getARVRatioColor}
  filterFunction={(property) => !['Operational', 'Selling'].includes(property.status)}
  emptyMessage="No properties found"
/>
```

## Design Tokens

### Status Color Functions
Status colors are centralized in `src/utils/statusColors.ts` for consistency across all components:

```typescript
// Import the shared utility
import { getStatusColor, getStatusOrder, getStatusDescription, getAllStatusColors } from '../utils/statusColors';

// Use in components
const color = getStatusColor('Opportunity'); // Returns '#6B8E6B'
const order = getStatusOrder('Soft Offer');  // Returns 1
const description = getStatusDescription('Rehab'); // Returns 'Attention needed'
const allColors = getAllStatusColors(); // Returns object with all status colors
```

**Available Functions:**
- `getStatusColor(status)` - Get color for a status
- `getStatusOrder(status)` - Get sort order for a status  
- `getStatusDescription(status)` - Get human-readable description
- `getAllStatusColors()` - Get all status colors as object

### Metric Color Functions
```typescript
export const getMetricColor = (value: number, thresholds: {good: number, caution: number}): string => {
  if (value >= thresholds.good) return '#22c55e';
  if (value >= thresholds.caution) return '#f59e0b';
  return '#ef4444';
};
```

## Future Considerations

### Dark Mode
- Prepare color palette for dark theme implementation
- Ensure sufficient contrast in dark mode
- Test all components in both light and dark themes

### Animation Guidelines
- Use subtle transitions (200-300ms)
- Ease-in-out timing functions
- Respect user's motion preferences
- Provide reduced motion alternatives

---

*This design system is a living document and should be updated as the application evolves. All team members should reference this document when making design decisions.*
