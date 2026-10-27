/**
 * 03_compound_index.js
 * Demonstrates Compound Index in MongoDB
 * 
 * Concept:
 * A Compound Index is created on two or more fields of a document.
 * It helps MongoDB efficiently execute queries that filter or sort on multiple fields together.
 * Field order matters: follow the ESR Rule (Equality -> Sort -> Range).
 */

const targetDb = typeof db !== "undefined" ? db.getSiblingDB("ecomDB") : null;
const database = targetDb || db;

print("\n========================================================");
print("   2. Compound Index Demonstration");
print("========================================================\n");

// Ensure clean index state
try { database.products.dropIndex("category_1_price_-1"); } catch (e) {}

// Step 1: Baseline Query without Compound Index
print("[Step 1] Executing multi-field query WITHOUT Compound Index:");
print("db.products.find({ category: 'Electronics', price: { $gt: 50000 } })");
const explainBefore = database.products.find({
    category: "Electronics",
    price: { $gt: 50000 }
}).explain("executionStats");
const statsBefore = explainBefore.executionStats;

print("\n--- Execution Stats BEFORE Compound Index ---");
print(`Winning Stage        : ${statsBefore.executionStages.stage}`);
print(`Documents Returned   : ${statsBefore.nReturned}`);
print(`Total Docs Examined  : ${statsBefore.totalDocsExamined}`);
print(`Execution Time (ms)  : ${statsBefore.executionTimeMillis}`);

// Step 2: Create Compound Index
print("\n[Step 2] Creating Compound Index: db.products.createIndex({ category: 1, price: -1 })");
print("Note: 1 = Ascending order, -1 = Descending order");
const indexResult = database.products.createIndex({ category: 1, price: -1 });
print(`Index Created        : ${indexResult}`);

// Step 3: Inspect Indexes
print("\n[Step 3] Active Indexes:");
database.products.getIndexes().forEach(idx => {
    print(` - ${idx.name} : ${JSON.stringify(idx.key)}`);
});

// Step 4: Query with Compound Index
print("\n[Step 4] Executing multi-field query WITH Compound Index:");
const explainAfter = database.products.find({
    category: "Electronics",
    price: { $gt: 50000 }
}).explain("executionStats");
const statsAfter = explainAfter.executionStats;

print("\n--- Execution Stats AFTER Compound Index ---");
print(`Winning Stage        : ${statsAfter.executionStages.stage}`);
print(`Input Stage          : ${statsAfter.executionStages.inputStage ? statsAfter.executionStages.inputStage.stage : "N/A"}`);
print(`Documents Returned   : ${statsAfter.nReturned}`);
print(`Total Docs Examined  : ${statsAfter.totalDocsExamined}`);
print(`Total Keys Examined  : ${statsAfter.totalKeysExamined}`);
print(`Execution Time (ms)  : ${statsAfter.executionTimeMillis}`);
print(`Reduction in Docs Examined: ${statsBefore.totalDocsExamined - statsAfter.totalDocsExamined} documents skipped!`);

// Step 5: Clean up
print("\n[Step 5] Dropping Compound Index: db.products.dropIndex('category_1_price_-1')");
database.products.dropIndex("category_1_price_-1");
print("\n[DONE] Compound Index Demonstration complete.\n");
