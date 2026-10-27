# MongoDB Indexing Best Practices & The ESR Rule

Designing effective indexes requires balancing read acceleration with write performance and RAM usage. This guide outlines standard best practices and production rules.

---

## 1. The ESR Rule (Equality, Sort, Range)

The **ESR Rule** is the golden rule for defining the order of fields in a **Compound Index**:

```
[Equality]  ->  [Sort]  ->  [Range]
```

### Why ESR Order Matters

1. **Equality (E)**:
   - Place fields tested for exact equality first (e.g., `{ status: "active", category: "Electronics" }`).
   - This immediately prunes the search space down to the smallest possible subset.

2. **Sort (S)**:
   - Place fields used in the `sort()` operation second.
   - If sort keys match index order following equality filters, MongoDB performs an **Index Sort** rather than an in-memory blocking sort (`SORT` stage with memory limits).

3. **Range (R)**:
   - Place fields filtered with range operators (`$gt`, `$gte`, `$lt`, `$lte`, `$in`) last.
   - Once a range filter is encountered in an index scan, subsequent index keys cannot be used for sorting without scanning extra index entries.

### Example Scenario
Query:
```javascript
db.products.find({
    category: "Laptops",       // Equality
    price: { $gte: 30000 }     // Range
}).sort({ rating: -1 })        // Sort
```

**Optimal Compound Index**:
```javascript
db.products.createIndex({
    category: 1,    // 1. Equality
    rating: -1,     // 2. Sort
    price: 1        // 3. Range
});
```

---

## 2. Memory & Storage Best Practices

### Keep Working Set & Indexes in RAM
- MongoDB indexes are stored in WiredTiger B-Trees.
- If your indexes exceed available RAM, MongoDB must swap index pages from disk to memory, creating severe I/O bottlenecks.
- Check index sizes using:
```javascript
db.products.totalIndexSize(); // Total size in bytes
db.products.stats().indexSizes; // Per-index size breakdown
```

### Avoid Over-Indexing
- Every index on a collection increases the cost of write operations (`insert`, `update`, `delete`).
- For every document inserted, MongoDB must insert corresponding keys into **every active index**.
- Remove unused indexes using profiling and index usage stats:
```javascript
db.products.aggregate([{ $indexStats: {} }]);
```

---

## 3. Covered Queries

A **Covered Query** is a query that can be satisfied **entirely** from an index without reading any documents from storage (`totalDocsExamined: 0`).

Requirements for a covered query:
1. All fields in the query predicate must be part of the index.
2. All fields returned in the projection must be part of the index.
3. The `_id` field must be explicitly excluded if it is not in the index (`{ _id: 0, ... }`).

Example:
```javascript
// Index on category and price
db.products.createIndex({ category: 1, price: 1 });

// Covered query:
db.products.find(
    { category: "Books" },
    { _id: 0, category: 1, price: 1 }
).explain("executionStats");
// Stage: PROJECTION_COVERED, totalDocsExamined: 0
```

---

## 4. Modern MongoDB Index Features

### Hidden Indexes (MongoDB 4.4+)
Before dropping an index in production, test the impact of its absence by hiding it:
```javascript
// Hide an index from the query planner
db.products.hideIndex("price_1");

// If queries remain performant, safely drop it:
db.products.dropIndex("price_1");

// Or unhide if needed:
db.products.unhideIndex("price_1");
```

### Partial Indexes vs Sparse Indexes
Prefer **Partial Indexes** with `partialFilterExpression` over **Sparse Indexes** for new applications. Partial indexes are more expressive and provide strict filter verification during query planning.
