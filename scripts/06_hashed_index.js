/**
 * 06_hashed_index.js
 * Demonstrates Hashed Index in MongoDB
 * 
 * Concept:
 * A Hashed Index computes a hash of the indexed field's value and indexes the hash.
 * Hashed indexes provide uniform data distribution across shards, making them the
 * standard choice for hash-based sharding keys.
 * Note: Hashed indexes support equality lookups ($eq, $in), but do NOT support range queries ($gt, $lt).
 */

const targetDb = typeof db !== "undefined" ? db.getSiblingDB("ecomDB") : null;
const database = targetDb || db;

print("\n========================================================");
print("   5. Hashed Index Demonstration");
print("========================================================\n");

// Ensure clean state
try { database.products.dropIndex("productId_hashed"); } catch (e) {}

// Step 1: Query without Hashed Index
print("[Step 1] Querying productId without Hashed Index:");
const explainBefore = database.products.find({ productId: 101 }).explain("executionStats");
print(`Before Index Stage   : ${explainBefore.executionStats.executionStages.stage}`);
print(`Total Docs Examined  : ${explainBefore.executionStats.totalDocsExamined}`);

// Step 2: Create Hashed Index
print("\n[Step 2] Creating Hashed Index: db.products.createIndex({ productId: 'hashed' })");
const indexResult = database.products.createIndex({ productId: "hashed" });
print(`Index Created        : ${indexResult}`);

// Step 3: Inspect Index Entry
print("\n[Step 3] Checking Hashed Index specification:");
database.products.getIndexes().filter(idx => idx.name.includes("hashed")).forEach(idx => {
    print(` - ${idx.name} : ${JSON.stringify(idx.key)}`);
});

// Step 4: Query with Hashed Index
print("\n[Step 4] Executing equality query WITH Hashed Index:");
const explainAfter = database.products.find({ productId: 101 }).explain("executionStats");
const statsAfter = explainAfter.executionStats;

print("\n--- Execution Stats AFTER Hashed Index ---");
print(`Winning Stage        : ${statsAfter.executionStages.stage}`);
print(`Input Stage          : ${statsAfter.executionStages.inputStage ? statsAfter.executionStages.inputStage.stage : "N/A"}`);
print(`Documents Returned   : ${statsAfter.nReturned}`);
print(`Total Docs Examined  : ${statsAfter.totalDocsExamined}`);
print(`Total Keys Examined  : ${statsAfter.totalKeysExamined}`);
print(`Execution Time (ms)  : ${statsAfter.executionTimeMillis}`);

// Step 5: Clean up
print("\n[Step 5] Dropping Hashed Index: db.products.dropIndex('productId_hashed')");
database.products.dropIndex("productId_hashed");
print("\n[DONE] Hashed Index Demonstration complete.\n");
