# MongoDB Indexes Practical Lab & Performance Analysis

[![MongoDB](https://img.shields.io/badge/MongoDB-8.2%2B-green.svg)](https://www.mongodb.com/)
[![Mongosh](https://img.shields.io/badge/mongosh-2.12%2B-blue.svg)](https://www.mongodb.com/docs/mongodb-shell/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A complete, practical implementation and benchmarking laboratory for **MongoDB Indexing Strategies**, based on the curriculum in [`Indexes.docx`](./Indexes.docx).

This repository contains fully functional, modular scripts to generate 5,000 synthetic e-commerce records, create and test all **9 primary MongoDB index types**, measure execution statistics (`executionStats`), and demonstrate the dramatic performance leap from `COLLSCAN` (Collection Scan) to `IXSCAN` (Index Scan).

---

## Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Repository Structure](#repository-structure)
- [Prerequisites & Setup](#prerequisites--setup)
- [Quick Start](#quick-start)
- [Index Types Covered](#index-types-covered)
  - [1. Simple (Single Field) Index](#1-simple-single-field-index)
  - [2. Compound Index](#2-compound-index)
  - [3. Multikey Index](#3-multikey-index)
  - [4. Text Index](#4-text-index)
  - [5. Hashed Index](#5-hashed-index)
  - [6. Geospatial (2dsphere) Index](#6-geospatial-2dsphere-index)
  - [7. Unique & Sparse Index](#7-unique--sparse-index)
  - [8. Partial Index](#8-partial-index)
  - [9. Wildcard Index](#9-wildcard-index)
- [Performance Benchmark Results](#performance-benchmark-results)
- [Deep Dive Documentation](#deep-dive-documentation)
- [License](#license)

---

## Overview & Architecture

Indexes in MongoDB are special data structures (B-Trees) that store a small portion of the collection's data in an easy-to-traverse form. Without indexes, MongoDB must perform a **Collection Scan (`COLLSCAN`)**, reading every single document to fulfill a query.

This lab implements an automated synthetic data pipeline generating **5,000 realistic e-commerce products** across 10 categories, 10 brands, nested seller info, GeoJSON coordinates, tags arrays, sparse email addresses, and discount fields.

```
       Query Request
             │
             ▼
     ┌───────────────┐
     │ Query Planner │
     └───────┬───────┘
             │
      Index Exists?
      ├───── Yes ────► [ IXSCAN ] ──► [ FETCH ] ──► Rapid Result (O(log N))
      │
      └───── No  ────► [ COLLSCAN ] ──────────────► Slow Scan of ALL Documents (O(N))
```

---

## Repository Structure

```
mongodb-indexes/
├── .gitignore
├── package.json                       # NPM script definitions for testing and benchmarking
├── README.md                          # Main project guide and documentation
├── Indexes.docx                       # Original laboratory exercise curriculum document
├── AGGREGATION PIPELINES.docx         # Reference notes for MongoDB Aggregation
├── CRUD Operations.docx               # Reference notes for MongoDB CRUD Operations
├── scripts/
│   ├── 01_seed_data.js                # Seeds 5,000 documents into ecomDB.products & users
│   ├── 02_simple_index.js             # Single field index demo on 'price'
│   ├── 03_compound_index.js           # Compound index demo on 'category' + 'price' (ESR rule)
│   ├── 04_multikey_index.js           # Multikey index demo on array 'tags'
│   ├── 05_text_index.js               # Full-text search index demo on 'description'
│   ├── 06_hashed_index.js             # Hashed index demo on 'productId' (sharding key)
│   ├── 07_geospatial_index.js         # 2dsphere index demo on GeoJSON 'location' ($near)
│   ├── 08_unique_sparse_index.js      # Unique + Sparse index demo on 'email'
│   ├── 09_partial_index.js            # Partial index demo using partialFilterExpression
│   ├── 10_wildcard_index.js           # Wildcard index demo on arbitrary fields ("$**")
│   └── 11_benchmark_runner.js         # Automated benchmark comparison test suite
├── docs/
│   ├── index_types_guide.md           # Detailed theoretical guide for all 9 index types
│   ├── performance_comparison.md      # Detailed COLLSCAN vs IXSCAN execution analysis
│   └── esr_rule_and_best_practices.md # Production best practices & ESR Rule
└── test/
    └── run_tests.bat                  # One-click Windows batch runner for all scripts
```

---

## Prerequisites & Setup

1. **MongoDB Server (Community or Enterprise v6.0 - v8.x)**
   Ensure `mongod` is running locally on the default port `27017`.
   ```bash
   # Verify connection
   mongosh --eval "db.version()"
   ```

2. **MongoDB Shell (`mongosh`)**
   Used to execute the standalone indexing scripts.

3. **Node.js (Optional, v18+)**
   Allows running scripts via `npm run <command>`.

---

## Quick Start

### 1. Seed the Database
Populate `ecomDB.products` with 5,000 synthetic records:
```bash
mongosh ecomDB scripts/01_seed_data.js
# Or with npm:
npm run seed
```

### 2. Run the Full Performance Benchmark Suite
Execute the automated harness to measure before-and-after performance:
```bash
mongosh ecomDB scripts/11_benchmark_runner.js
# Or with npm:
npm run benchmark
```

### 3. Run Individual Demonstrations
```bash
mongosh ecomDB scripts/02_simple_index.js
mongosh ecomDB scripts/03_compound_index.js
mongosh ecomDB scripts/04_multikey_index.js
mongosh ecomDB scripts/05_text_index.js
mongosh ecomDB scripts/06_hashed_index.js
mongosh ecomDB scripts/07_geospatial_index.js
mongosh ecomDB scripts/08_unique_sparse_index.js
mongosh ecomDB scripts/09_partial_index.js
mongosh ecomDB scripts/10_wildcard_index.js
```

---

## Index Types Covered

### 1. Simple (Single Field) Index
- **File**: [`scripts/02_simple_index.js`](./scripts/02_simple_index.js)
- **Concept**: An index on a single scalar field.
- **Creation**:
  ```javascript
  db.products.createIndex({ price: 1 });
  ```
- **Query**:
  ```javascript
  db.products.find({ price: { $gt: 50000 } }).explain("executionStats");
  ```
- **Impact**: Cuts documents examined from **5,000 (`COLLSCAN`)** to **2,323 (`IXSCAN` + `FETCH`)**.

### 2. Compound Index
- **File**: [`scripts/03_compound_index.js`](./scripts/03_compound_index.js)
- **Concept**: An index spanning two or more fields (`category` ascending, `price` descending). Follows the ESR (Equality, Sort, Range) rule.
- **Creation**:
  ```javascript
  db.products.createIndex({ category: 1, price: -1 });
  ```
- **Query**:
  ```javascript
  db.products.find({ category: "Electronics", price: { $gt: 50000 } }).explain("executionStats");
  ```
- **Impact**: Reduces documents examined by **95.2%** (5,000 down to 240).

### 3. Multikey Index
- **File**: [`scripts/04_multikey_index.js`](./scripts/04_multikey_index.js)
- **Concept**: Automatically created when indexing an array field (`tags`). MongoDB generates index entries for every item in the array.
- **Creation**:
  ```javascript
  db.products.createIndex({ tags: 1 });
  ```
- **Query**:
  ```javascript
  db.products.find({ tags: "bestseller" }).explain("executionStats");
  ```
- **Impact**: Enables direct array element lookup without unwinding or scanning.

### 4. Text Index
- **File**: [`scripts/05_text_index.js`](./scripts/05_text_index.js)
- **Concept**: Provides full-text tokenization, word stemming, and stop-word filtering across string fields.
- **Creation**:
  ```javascript
  db.products.createIndex({ description: "text" });
  ```
- **Query**:
  ```javascript
  db.products.find({ $text: { $search: "Samsung" } }).explain("executionStats");
  ```
- **Impact**: Replaces slow regex table scans with high-speed `TEXT_MATCH` stage and relevance scoring (`textScore`).

### 5. Hashed Index
- **File**: [`scripts/06_hashed_index.js`](./scripts/06_hashed_index.js)
- **Concept**: Computes an MD5 64-bit hash of the field value. Distributes keys evenly across shards.
- **Creation**:
  ```javascript
  db.products.createIndex({ productId: "hashed" });
  ```
- **Query**:
  ```javascript
  db.products.find({ productId: 101 }).explain("executionStats");
  ```
- **Impact**: Examines **1 key and 1 document** out of 5,000 (100% precision).

### 6. Geospatial (2dsphere) Index
- **File**: [`scripts/07_geospatial_index.js`](./scripts/07_geospatial_index.js)
- **Concept**: Supports spherical geometry queries on Earth coordinates using GeoJSON `Point` objects (`[longitude, latitude]`).
- **Creation**:
  ```javascript
  db.products.createIndex({ location: "2dsphere" });
  ```
- **Query**:
  ```javascript
  db.products.find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [77.0, 11.1] },
        $maxDistance: 10000 // 10 km
      }
    }
  }).explain("executionStats");
  ```
- **Impact**: Enables `GEO_NEAR_2DSPHERE` stage with automatic distance calculation.

### 7. Unique & Sparse Index
- **File**: [`scripts/08_unique_sparse_index.js`](./scripts/08_unique_sparse_index.js)
- **Concept**:
  - `unique: true` guarantees no two documents have identical values.
  - `sparse: true` only indexes documents where the field actually exists, preventing duplicate `null` collision errors when documents lack the field.
- **Creation**:
  ```javascript
  db.products.createIndex({ email: 1 }, { unique: true, sparse: true });
  ```

### 8. Partial Index
- **File**: [`scripts/09_partial_index.js`](./scripts/09_partial_index.js)
- **Concept**: Indexes only documents meeting a specific filter condition (`partialFilterExpression`). Saves RAM and disk storage.
- **Creation**:
  ```javascript
  // On users:
  db.users.createIndex(
    { email: 1 },
    { partialFilterExpression: { status: "active" } }
  );

  // On products:
  db.products.createIndex(
    { price: 1 },
    { partialFilterExpression: { isActive: true } }
  );
  ```
- **Query**:
  ```javascript
  db.products.find({ price: { $gt: 50000 }, isActive: true }).explain("executionStats");
  ```

### 9. Wildcard Index
- **File**: [`scripts/10_wildcard_index.js`](./scripts/10_wildcard_index.js)
- **Concept**: Dynamically indexes arbitrary or polymorphic fields throughout documents using `"$**"`.
- **Creation**:
  ```javascript
  db.products.createIndex({ "$**": 1 });
  ```
- **Query**:
  ```javascript
  db.products.find({ "seller.city": "Chennai" }).explain("executionStats");
  ```

---

## Performance Benchmark Results

Actual benchmark metrics gathered from running [`scripts/11_benchmark_runner.js`](./scripts/11_benchmark_runner.js) on **5,000 documents**:

```
-------------------------------------------------------------------------------------------------------------------
Index Scenario        Stage Before    Stage After         Docs (Before)   Docs (After)  Keys Examined  Docs Skipped %
-------------------------------------------------------------------------------------------------------------------
1. Simple (Single)    COLLSCAN        FETCH               5000            2323          2323           53.5%
2. Compound           COLLSCAN        FETCH               5000            240           240            95.2%
3. Multikey (Array)   COLLSCAN        FETCH               5000            1250          1250           75.0%
4. Text Search        COLLSCAN        TEXT_MATCH          5000            500           500            90.0%
5. Hashed             COLLSCAN        FETCH               5000            1             1              100.0%
6. Geospatial (2ds)   COLLSCAN        GEO_NEAR_2DSPHERE   5000            551           657            89.0%
7. Partial Index      COLLSCAN        FETCH               5000            1850          1850           63.0%
8. Wildcard ($**)     COLLSCAN        FETCH               5000            500           500            90.0%
-------------------------------------------------------------------------------------------------------------------
```

### Key Takeaways:
1. **Compound Index**: Achieved a **95.2% reduction** in documents examined, directly returning the 240 target records without wasted disk reads.
2. **Hashed Index**: Produced instant $O(1)$ equality resolution, scanning **1 key and 1 document** out of 5,000.
3. **Geospatial & Text**: Enabled search stages (`GEO_NEAR_2DSPHERE`, `TEXT_MATCH`) that are mathematically impossible or extremely prohibitive with plain collection scans.

---

## Deep Dive Documentation

- [Detailed Guide to All 9 Index Types](./docs/index_types_guide.md)
- [Performance & Execution Analysis](./docs/performance_comparison.md)
- [ESR Rule & Production Indexing Best Practices](./docs/esr_rule_and_best_practices.md)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
