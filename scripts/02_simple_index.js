/**
 * 02_simple_index.js
 * Demonstrates Single Field (Simple) Index in MongoDB
 * 
 * Concept:
 * An index on a single field of a document. By default, MongoDB creates an index
 * on '_id'. Creating an index on frequently queried fields eliminates full collection
 * scans (COLLSCAN) and enables index key scans (IXSCAN).
 */

const targetDb = typeof db !== "undefined" ? db.getSiblingDB("ecomDB") : null;
const database = targetDb || db;

print("\n========================================================");
print("   1. Simple (Single Field) Index Demonstration");
print("========================================================\n");

// Ensure clean index state
try { database.products.dropIndex("price_1"); } catch (e) {}

// Step 1: Baseline Query without Index
print("[Step 1] Executing query WITHOUT Index: db.products.find({ price: { $gt: 50000 } })");
const explainBefore = database.products.find({ price: { $gt: 50000 } }).explain("executionStats");
const statsBefore = explainBefore.executionStats;

print("\n--- Execution Stats BEFORE Index ---");
print(`Winning Stage        : ${statsBefore.executionStages.stage}`);
print(`Documents Returned   : ${statsBefore.nReturned}`);
print(`Total Docs Examined  : ${statsBefore.totalDocsExamined}`);
print(`Total Keys Examined  : ${statsBefore.totalKeysExamined}`);
print(`Execution Time (ms)  : ${statsBefore.executionTimeMillis}`);
print(`Note: A 'COLLSCAN' scans all documents in the collection from start to finish.`);

// Step 2: Create Single Field Index
print("\n[Step 2] Creating Single Field Index: db.products.createIndex({ price: 1 })");
const indexResult = database.products.createIndex({ price: 1 });
print(`Index Created        : ${indexResult}`);

// Step 3: Inspect Existing Indexes
print("\n[Step 3] Checking Active Indexes: db.products.getIndexes()");
const indexes = database.products.getIndexes();
indexes.forEach(idx => {
    print(` - Name: ${idx.name}, Key: ${JSON.stringify(idx.key)}`);
});

// Step 4: Query with Index
print("\n[Step 4] Executing query WITH Index: db.products.find({ price: { $gt: 50000 } })");
const explainAfter = database.products.find({ price: { $gt: 50000 } }).explain("executionStats");
const statsAfter = explainAfter.executionStats;

print("\n--- Execution Stats AFTER Index ---");
print(`Winning Stage        : ${statsAfter.executionStages.stage}`);
print(`Input Stage          : ${statsAfter.executionStages.inputStage ? statsAfter.executionStages.inputStage.stage : "N/A"}`);
print(`Documents Returned   : ${statsAfter.nReturned}`);
print(`Total Docs Examined  : ${statsAfter.totalDocsExamined}`);
print(`Total Keys Examined  : ${statsAfter.totalKeysExamined}`);
print(`Execution Time (ms)  : ${statsAfter.executionTimeMillis}`);
print(`Note: Query now uses IXSCAN (Index Scan) -> FETCH stage, only reading relevant documents.`);

// Step 5: Clean up (Drop Index)
print("\n[Step 5] Dropping the Index: db.products.dropIndex('price_1')");
const dropResult = database.products.dropIndex("price_1");
print(`Drop Index Result    : ${JSON.stringify(dropResult)}`);
print("\n[DONE] Simple Index Demonstration complete.\n");
