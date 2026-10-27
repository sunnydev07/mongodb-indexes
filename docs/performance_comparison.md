# MongoDB Index Performance Benchmark & Analysis

This document provides a detailed breakdown of the performance characteristics observed when benchmarking queries before and after applying MongoDB indexes.

The benchmark was executed against a local MongoDB instance populated with **5,000 synthetic e-commerce documents** using `scripts/11_benchmark_runner.js`.

---

## 1. Summary Benchmark Matrix

| # | Index Scenario | Target Field(s) | Stage (Before) | Stage (After) | Docs Examined (Before) | Docs Examined (After) | Keys Examined | Docs Skipped / Reduction % |
|---|----------------|-----------------|----------------|---------------|------------------------|-----------------------|---------------|----------------------------|
| 1 | **Simple (Single Field)** | `price` | `COLLSCAN` | `FETCH` + `IXSCAN` | 5,000 | 2,323 | 2,323 | **53.5%** |
| 2 | **Compound Index** | `category`, `price` | `COLLSCAN` | `FETCH` + `IXSCAN` | 5,000 | 240 | 240 | **95.2%** |
| 3 | **Multikey Index** | `tags` (Array) | `COLLSCAN` | `FETCH` + `IXSCAN` | 5,000 | 1,250 | 1,250 | **75.0%** |
| 4 | **Text Index** | `description` | `COLLSCAN` (Regex) | `TEXT_MATCH` | 5,000 | 500 | 500 | **90.0%** |
| 5 | **Hashed Index** | `productId` | `COLLSCAN` | `FETCH` + `IXSCAN` | 5,000 | 1 | 1 | **100.0% (99.98%)** |
| 6 | **Geospatial Index** | `location` (Point) | `COLLSCAN` | `GEO_NEAR_2DSPHERE` | 5,000 | 551 | 657 | **89.0%** |
| 7 | **Partial Index** | `price` (`isActive: true`) | `COLLSCAN` | `FETCH` + `IXSCAN` | 5,000 | 1,850 | 1,850 | **63.0%** |
| 8 | **Wildcard Index** | `"$**"` (`seller.city`) | `COLLSCAN` | `FETCH` + `IXSCAN` | 5,000 | 500 | 500 | **90.0%** |

---

## 2. Key Metrics Explained

### `COLLSCAN` (Collection Scan)
- MongoDB reads every document in the collection sequentially from disk or memory.
- `totalDocsExamined` is always equal to the total document count in the collection (5,000 in this lab).
- As collection size grows to millions of records, query response times degrade linearly ($O(N)$).

### `IXSCAN` (Index Scan)
- MongoDB navigates a balanced B-Tree index structure ($O(\log N)$).
- Only examines index keys matching the search condition.
- `totalKeysExamined` reflects how selective the index is.

### `FETCH`
- After identifying matching documents in `IXSCAN`, MongoDB retrieves the actual document contents from storage.
- If all requested fields are contained in the index itself, MongoDB can perform a **Covered Query** (0 documents fetched, `PROJECTION_COVERED`).

### `totalDocsExamined` vs `nReturned`
- **Optimal Ratio (1:1)**: For every document examined, one document is returned. This indicates a highly efficient index.
- **Poor Ratio (e.g. 5000:240)**: 5,000 documents examined to return only 240 documents. This signals an unindexed or poorly indexed query.

---

## 3. Deep Dive: Compound Index Efficiency (95.2% Reduction)

In the unindexed query:
```javascript
db.products.find({ category: "Electronics", price: { $gt: 50000 } })
```
- MongoDB scanned **5,000 documents** to find the 240 matching products.
- With compound index `{ category: 1, price: -1 }`:
  - `totalKeysExamined`: **240**
  - `totalDocsExamined`: **240**
  - `nReturned`: **240**
  - **Efficiency Ratio**: Exactly **1.0 (100% precision)**. 4,760 documents were completely skipped.

---

## 4. Deep Dive: Hashed Equality Lookup (100% Efficiency)

Query:
```javascript
db.products.find({ productId: 101 })
```
- Without index: 5,000 documents examined.
- With hashed index `{ productId: "hashed" }`:
  - **1 key examined**
  - **1 document examined**
  - **1 document returned**
- Speedup factor: over **5,000x fewer documents examined**.
