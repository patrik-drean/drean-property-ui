# TASK-042: Component Decomposition - Manual Testing Guide

## Overview
This guide covers manual testing for the component decomposition task, which extracted helper functions, styles, and components from large page components into smaller, reusable modules.

---

## Functional Testing

### Test Case 1: PropertyCard Display (All Variants)
**Prerequisites**: Application running, logged in as admin

**Steps**:
1. Navigate to Properties page
2. Observe PropertyCard components in the list view

**Expected**:
- Cards display correctly with metrics (Cashflow, Rent Ratio, ARV Ratio, Equity)
- Investment Scores (Hold/Flip) show with correct color coding:
  - Green: Score >= 7
  - Yellow/Amber: Score 5-7
  - Red: Score < 5
- Action buttons (View, Edit, Archive) are visible and clickable

**Steps for Compact Variant**:
1. Resize browser to mobile width (< 768px)
2. View the compact property cards

**Expected**:
- Compact metrics grid shows (Rent %, ARV %, Hold, Flip)
- All values display correctly
- Colors match the score thresholds

---

### Test Case 2: Property Leads Page - Toolbar
**Prerequisites**: Application running, logged in, some leads exist

**Steps**:
1. Navigate to Property Leads page
2. Verify toolbar displays correctly

**Expected**:
- "Property Leads" title visible
- "View Sales Report" button links to /reports?tab=3
- "Archived Leads" button is visible
- "Add Lead" button is visible
- If any leads are converted, converted count badge appears

**Selection Testing**:
1. Select one or more leads using checkboxes
2. Verify "Delete Selected (N)" button appears with correct count
3. Click the delete button
4. Verify onBulkDelete dialog/action triggers

**Archive Toggle**:
1. Click "Archived Leads" button
2. Verify button text changes to "Hide Archived"
3. Verify archived leads now show in the list
4. Click again to hide

---

### Test Case 3: Property Leads Page - Sorting
**Prerequisites**: Application running, at least 5+ leads with varying data

**Steps**:
1. Navigate to Property Leads page
2. Observe the default sort order

**Expected Sort Order**:
1. Non-archived leads appear before archived
2. Not contacted leads appear first (sorted by lead score descending)
3. Contacted leads sorted by most recent contact date
4. Equal scores/dates sorted by units (descending)
5. Final tiebreaker: alphabetical by address

**Verification**:
- Create leads with different contact dates and scores
- Verify they appear in expected order

---

### Test Case 4: Properties Page - Display
**Prerequisites**: Application running, logged in, some properties exist

**Steps**:
1. Navigate to Properties page
2. Verify table displays correctly

**Expected**:
- Table headers styled correctly
- Row hover effects work
- Score colors display correctly:
  - Green: Score 9-10
  - Amber: Score 7-8
  - Orange: Score 5-6
  - Red: Score < 5
- Text colors contrast correctly with backgrounds

---

### Test Case 5: Lead Score Calculation
**Prerequisites**: Can add/edit leads

**Steps**:
1. Add a new lead with:
   - Listing Price: $80,000
   - Square Footage: 1000
2. Observe the calculated lead score

**Expected**:
- ARV Guess = 160 * 1000 = $160,000
- Ratio = $80,000 / $160,000 = 0.50
- Score should be 10 (green)

**Score Threshold Verification**:
| Listing Price | Sq Ft | Ratio | Expected Score | Color |
|---------------|-------|-------|----------------|-------|
| $80,000 | 1000 | 50% | 10 | Green |
| $88,000 | 1000 | 55% | 9 | Green |
| $96,000 | 1000 | 60% | 8 | Green |
| $104,000 | 1000 | 65% | 7 | Yellow |
| $120,000 | 1000 | 75% | 5 | Yellow |
| $136,000 | 1000 | 85% | 3 | Red |
| $152,000 | 1000 | 95% | 1 | Red |

---

## Edge Cases

### EC1: Empty State
- [ ] Properties page with no properties shows appropriate message
- [ ] Leads page with no leads shows appropriate message
- [ ] No converted leads: badge should not appear in toolbar

### EC2: Null/Missing Data
- [ ] Lead with null square footage shows score of 0 (grey)
- [ ] Property with missing financial data shows "-" or 0 appropriately
- [ ] Metadata display handles malformed JSON gracefully

### EC3: Boundary Values
- [ ] Very large numbers format correctly ($1,500,000,000)
- [ ] Negative cashflow shows with correct color (red)
- [ ] 0% rent ratio shows red
- [ ] 100% ARV ratio shows red

### EC4: Selection State
- [ ] Select All works correctly
- [ ] Deselect All works correctly
- [ ] Selected count updates immediately
- [ ] Delete button appears/disappears based on selection

---

## UX/Visual Checks

### Responsive Design
- [ ] Desktop view (>= 1200px): Full table layout
- [ ] Tablet view (768-1199px): Adjusted columns
- [ ] Mobile view (< 768px): Card/compact view
- [ ] Toolbar buttons stack vertically on mobile

### Loading States
- [ ] Loading spinner shows while data fetches
- [ ] Skeleton states (if implemented) display correctly

### Error Messages
- [ ] API errors show user-friendly messages
- [ ] Form validation errors display correctly
- [ ] Network errors handled gracefully

### Color Consistency
- [ ] Score colors consistent across all views
- [ ] Text contrast meets accessibility standards
- [ ] Hover states visible

---

## Accessibility Checks

### Keyboard Navigation
- [ ] Can tab through all interactive elements
- [ ] Focus indicators visible on buttons
- [ ] Enter key triggers button actions
- [ ] Escape closes modals/dialogs

### Screen Reader
- [ ] Buttons have aria-labels where needed
- [ ] Table headers properly associated with cells
- [ ] Tooltips accessible

---

## Regression Testing

### Core Functionality Still Works
- [ ] Add new lead - form submits correctly
- [ ] Edit existing lead - changes persist
- [ ] Delete lead - confirmation + removal
- [ ] Add new property - form submits correctly
- [ ] Edit property - changes persist
- [ ] Archive/unarchive leads works
- [ ] Filter leads by status works
- [ ] Search leads works

### No Console Errors
1. Open browser DevTools > Console
2. Navigate through app pages
3. Verify no new JavaScript errors appear

### Performance
- [ ] Page load times similar to before
- [ ] No visible lag when sorting
- [ ] Table scroll performance acceptable

---

## Test Completion Checklist

| Category | Tests | Status |
|----------|-------|--------|
| Functional - PropertyCard | 2 | ⬜ |
| Functional - LeadsToolbar | 3 | ⬜ |
| Functional - Sorting | 1 | ⬜ |
| Functional - Properties Display | 1 | ⬜ |
| Functional - Score Calculation | 1 | ⬜ |
| Edge Cases | 4 | ⬜ |
| UX/Visual | 4 | ⬜ |
| Accessibility | 2 | ⬜ |
| Regression | 3 | ⬜ |
| **Total** | **21** | ⬜ |

---

## Sign-Off

**Tested By**: ________________

**Date**: ________________

**Environment**:
- Browser: ________________
- Screen Size: ________________

**Notes**:
