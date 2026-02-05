# PropGuide Frontend

React SPA for real estate investment analysis and lead management.

**Full guidelines**: See `../CLAUDE.md` for architecture, patterns, and workflow.

## Tech Stack
- React 18.2 with TypeScript 4.9
- Material-UI 5 with custom theme
- React Router DOM 7
- Axios for API calls
- Jest + React Testing Library

## Project Structure
```
src/
├── components/        # Feature components
│   └── shared/       # Reusable components (PropertyCard, etc.)
├── contexts/         # React Context (PropertiesContext)
├── hooks/            # Custom hooks (useLeadsFilters, usePropertyForm)
├── pages/            # Route-level components
├── services/         # API layer (api.ts, mock/)
├── types/            # TypeScript interfaces
├── utils/            # Helpers (statusColors, scoreCalculator)
└── theme.ts          # MUI theme config
```

## Key Patterns

### Components
```typescript
// Named exports, function components, explicit props
export const MyComponent: React.FC<MyComponentProps> = ({ data, onUpdate }) => {
  // ...
};
```

### Custom Hooks
```typescript
// Naming: use{Feature}{Purpose}
export const useLeadsFilters = (leads: Lead[]): UseLeadsFiltersReturn => {
  // Filter state and logic
};
```

### API Layer
```typescript
// Use the abstraction layer, not direct axios
import { api } from '../services';
const properties = await api.getProperties();
```

### Styling
- Always use theme values: `theme.palette.primary.main`
- Use `sx` prop for component-specific styles
- Theme colors: forest green (#1B4D3E), gold (#D4AF37), teal (#14b8a6)

## Key Utilities
- `getStatusColor(status)` - Consistent status colors
- `getStatusOrder(status)` - Sort order for statuses
- `useResponsiveLayout()` - Breakpoint detection

## Commands
```bash
npm start       # Dev server at localhost:3000
npm test        # Run Jest tests
npm run build   # Production build (deploys to GitHub Pages)
```

## Environment Variables
```bash
REACT_APP_API_BASE_URL=https://your-api-url
REACT_APP_USE_MOCK_API=false
```
