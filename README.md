# Multi-Filter Dashboard with Live Summary Panel

A high-performance, real-time client-side analytics dashboard with tight React state isolation, debounced search inputs, and dynamic filter aggregation.

## Architecture & Core Design Rules

### 1. Unified State via `useReducer`
To avoid synchronization bugs where summary panels briefly mismatch the data table, all filter inputs manage state inside a single `useReducer` action handler.

### 2. Single Derived Pipeline (`useMemo`)
- Both the **Live Summary Panel** and the **Data Table** consume the identical memoized result `filteredRows`:
```ts
const filteredRows = useMemo(() => applyAll(SALES_DATA, filters), [filters]);