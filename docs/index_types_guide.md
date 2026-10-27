# Comprehensive Guide to MongoDB Index Types

This guide provides an in-depth breakdown of the 9 primary index types in MongoDB covered in this project, explaining their internal mechanics, practical syntax, execution plans, and ideal use cases.

---

## 1. Simple (Single Field) Index

### Concept
A Single Field Index stores ordered references to a single field within documents. By default, MongoDB automatically creates an ascending unique index on the `_id` field.

### Syntax
```javascript
// Ascending index (1)
db.products.createIndex({ price: 1 });

// Descending index (-1)
db.products.createIndex({ price: -1 });
```

### Execution Difference
- **Without Index (`COLLSCAN`)**: MongoDB inspects every single document in the collection (`totalDocsExamined: 5000`).
- **With Index (`IXSCAN` -> `FETCH`)**: MongoDB traverses the B-Tree index structure, locates the matching keys, and fetches only the relevant documents (`totalDocsExamined: ~2323`).

### Management
```javascript
// List all indexes
db.products.getIndexes();

// Drop index by name
db.products.dropIndex("price_1");
```

---

## 2. Compound Index

### Concept
A Compound Index contains references to multiple fields within each document. The order of fields in the index definition is critical and dictates how MongoDB can satisfy queries.

### Syntax
```javascript
// Category ascending, Price descending
db.products.createIndex({ category: 1, price: -1 });
```

### The ESR Rule (Equality, Sort, Range)
When designing compound indexes, structure keys following the ESR rule:
1. **E (Equality)**: Fields queried with exact values (`category: "Electronics"`).
2. **S (Sort)**: Fields used for ordering results (`sort({ createdAt: -1 })`).
3. **R (Range)**: Fields queried with range operators (`price: { $gt: 50000 }`).

### Index Prefix Rule
A compound index on `{ category: 1, price: -1, brand: 1 }` can support queries on:
- `category`
- `category` AND `price`
- `category` AND `price` AND `brand`
It cannot efficiently support queries on `price` alone without `category`.

---

## 3. Multikey Index

### Concept
When an indexed field contains an array value, MongoDB automatically flags the index as **Multikey**. It creates a distinct index entry for every element in the array.

### Syntax
```javascript
// tags is an array: ["electronics", "popular", "bestseller"]
db.products.createIndex({ tags: 1 });
```

### Querying
```javascript
db.products.find({ tags: "bestseller" });
```

### Important Constraints
- In a compound multikey index, **at most one** of the indexed fields can be an array to avoid combinatorial explosion of index entries.

---

## 4. Text Index

### Concept
A Text Index provides full-text search capability over string content. It breaks text into word stems, strips punctuation, and removes language-specific stop words (e.g., "the", "an", "is").

### Syntax
```javascript
db.products.createIndex({ description: "text" });
```

### Querying with Relevance Scoring
```javascript
db.products.find(
    { $text: { $search: "Samsung Electronics" } },
    { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } });
```

### Limitations
- A collection can have at most **one** text index (though it can span multiple string fields).
- Case-insensitive and diacritic-insensitive by default.

---

## 5. Hashed Index

### Concept
A Hashed Index computes a hash (MD5-based 64-bit integer) of the field's value and indexes the hash value rather than the raw data.

### Syntax
```javascript
db.products.createIndex({ productId: "hashed" });
```

### Primary Use Case: Sharding
Hashed indexes guarantee an even, uniform distribution of keys across chunks and shards, preventing "hot spots" when values are monotonically increasing (e.g., auto-incrementing IDs or timestamps).

### Trade-off
- Supports high-speed **equality queries** (`productId: 101`).
- **Does NOT support range queries** (`$gt`, `$lt`).

---

## 6. Geospatial (2dsphere) Index

### Concept
A `2dsphere` index supports queries that calculate geometries on an Earth-like sphere. It adheres to the WGS84 coordinate reference system.

### GeoJSON Point Structure
```json
{
  "location": {
    "type": "Point",
    "coordinates": [longitude, latitude] // Note: Longitude first!
  }
}
```

### Syntax
```javascript
db.products.createIndex({ location: "2dsphere" });
```

### Geospatial Query ($near)
```javascript
db.products.find({
    location: {
        $near: {
            $geometry: {
                type: "Point",
                coordinates: [77.0, 11.1]
            },
            $maxDistance: 10000 // In meters (10 km)
        }
    }
});
```

---

## 7. Unique and Sparse Indexes

### Unique Index
Ensures no two documents have identical values for the indexed field:
```javascript
db.products.createIndex({ email: 1 }, { unique: true });
```

### The Null Collision Problem
In MongoDB, if a document lacks the `email` field, the index stores a `null` value. If multiple documents lack `email`, a standard unique index rejects the second document with an `E11000 duplicate key error`.

### Sparse Index Solution
A Sparse Index only indexes documents where the field exists:
```javascript
db.products.createIndex(
    { email: 1 },
    { unique: true, sparse: true }
);
```
Documents without the `email` field are skipped by the index, allowing multiple documents without emails while strictly guaranteeing uniqueness among documents that do have emails.

---

## 8. Partial Index

### Concept
A Partial Index indexes only documents that satisfy a specified filter expression (`partialFilterExpression`). It is a flexible, powerful evolution of sparse indexes.

### Syntax Examples

#### Example 1: Active Users Only (from Indexes.docx)
```javascript
db.users.createIndex(
    { email: 1 },
    { partialFilterExpression: { status: "active" } }
);
```

#### Example 2: Active Products Only
```javascript
db.products.createIndex(
    { price: 1 },
    { partialFilterExpression: { isActive: true } }
);
```

### Advantages Over Sparse Indexes
1. Can filter on arbitrary criteria (`$gt`, `$exists`, `$eq`, `$type`).
2. Can filter on fields different from the indexed field.
3. Greatly reduces index RAM consumption and disk footprint.

---

## 9. Wildcard Index

### Concept
A Wildcard Index (`"$**"`) indexes unknown or arbitrary fields within documents.

### Syntax
```javascript
// Index all fields in the document
db.products.createIndex({ "$**": 1 });

// Index all subfields under a nested document
db.products.createIndex({ "customAttributes.$**": 1 });
```

### Ideal Scenarios
- **E-Commerce Product Catalogs**: Different categories have completely different specifications (e.g., laptops have RAM/CPU; shoes have size/material).
- **Dynamic User Forms**: Where users can define custom key-value attributes.
- **Polymorphic Schemas**: Dynamic schema structures where defining individual indexes ahead of time is impractical.
