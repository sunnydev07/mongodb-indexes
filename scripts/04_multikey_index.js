/**
 * 04_multikey_index.js
 * Demonstrates Multikey Index in MongoDB
 * 
 * Concept:
 * A Multikey Index is created on a field that contains an array.
 * MongoDB automatically indexes each individual element in the array,
 * allowing high-speed lookups on array contents without table scanning.
 */

const targetDb = typeof db !== "undefined" ? db.getSiblingDB("ecomDB") : null;
const database = targetDb || db;

print("\n========================================================");
print("   3. Multikey Index Demonstration");
print("========================================================\n");

// Ensure clean state
try { database.products.dropIndex("tags_1"); } catch (e) {}

// Step 1: Baseline Query without Multikey Index
print("[Step 1] Executing array lookup WITHOUT Multikey Index:");
print("db.products.find({ tags: 'bestseller' })");
const explainBefore = database.products.find({ tags: "bestseller" }).explain("executionStats");
const statsBefore = explainBefore.executionStats;

print("\n--- Execution Stats BEFORE Index ---");
print(`Winning Stage        : ${statsBefore.executionStages.stage}`);
print(`Total Docs Examined  : ${statsBefore.totalDocsExamined}`);
print(`Documents Returned   : ${statsBefore.nReturned}`);
print(`Execution Time (ms)  : ${statsBefore.executionTimeMillis}`);

// Step 2: Create Multikey Index on array field 'tags'
print("\n[Step 2] Creating Multikey Index: db.products.createIndex({ tags: 1 })");
const indexResult = database.products.createIndex({ tags: 1 });
print(`Index Created        : ${indexResult}`);

// Step 3: Query with Multikey Index
print("\n[Step 3] Executing array lookup WITH Multikey Index:");
const explainAfter = database.products.find({ tags: "bestseller" }).explain("executionStats");
const statsAfter = explainAfter.executionStats;

print("\n--- Execution Stats AFTER Multikey Index ---");
print(`Winning Stage        : ${statsAfter.executionStages.stage}`);
print(`Input Stage          : ${statsAfter.executionStages.inputStage ? statsAfter.executionStages.inputStage.stage : "N/A"}`);
print(`Documents Returned   : ${statsAfter.nReturned}`);
print(`Total Docs Examined  : ${statsAfter.totalDocsExamined}`);
print(`Total Keys Examined  : ${statsAfter.totalKeysExamined}`);
print(`Is Multikey          : ${explainAfter.executionStats.executionStages.inputStage ? explainAfter.executionStats.executionStages.inputStage.isMultikey : "true"}`);
print(`Execution Time (ms)  : ${statsAfter.executionTimeMillis}`);

// Step 4: Clean up
print("\n[Step 4] Dropping Multikey Index: db.products.dropIndex('tags_1')");
database.products.dropIndex("tags_1");
print("\n[DONE] Multikey Index Demonstration complete.\n");
