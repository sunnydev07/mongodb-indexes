/**
 * 10_wildcard_index.js
 * Demonstrates Wildcard Index in MongoDB
 * 
 * Concept:
 * A Wildcard Index ("$**") indexes arbitrary or unpredictable fields across documents.
 * It is ideal for:
 * - Dynamic attributes in e-commerce catalogs (e.g. specs differing between clothes, laptops, phones)
 * - Polymorphic schemas where fields vary widely
 * - Rapid prototyping without having to define separate indexes for every field
 */

const targetDb = typeof db !== "undefined" ? db.getSiblingDB("ecomDB") : null;
const database = targetDb || db;

print("\n========================================================");
print("   9. Wildcard Index ('$**') Demonstration");
print("========================================================\n");

// Ensure clean state
try { database.products.dropIndex("$**_1"); } catch (e) {}

// Step 1: Create Wildcard Index
print("[Step 1] Creating Wildcard Index: db.products.createIndex({ '$**': 1 })");
const indexResult = database.products.createIndex({ "$**": 1 });
print(`Index Created        : ${indexResult}`);

// Step 2: Query nested subdocument field: seller.city
print("\n[Step 2] Querying nested field 'seller.city': 'Chennai'");
const explainNested = database.products.find({ "seller.city": "Chennai" }).explain("executionStats");
const statsNested = explainNested.executionStats;

print("\n--- Execution Stats for Nested Field Query ---");
print(`Winning Stage        : ${statsNested.executionStages.stage}`);
print(`Input Stage          : ${statsNested.executionStages.inputStage ? statsNested.executionStages.inputStage.stage : "N/A"}`);
print(`Documents Returned   : ${statsNested.nReturned}`);
print(`Total Docs Examined  : ${statsNested.totalDocsExamined}`);
print(`Total Keys Examined  : ${statsNested.totalKeysExamined}`);
print(`Execution Time (ms)  : ${statsNested.executionTimeMillis}`);

// Step 3: Query top-level arbitrary field: brand
print("\n[Step 3] Querying another field 'brand': 'Dell' using the same Wildcard Index:");
const explainBrand = database.products.find({ brand: "Dell" }).explain("executionStats");
const statsBrand = explainBrand.executionStats;

print(`Winning Stage        : ${statsBrand.executionStages.stage}`);
print(`Documents Returned   : ${statsBrand.nReturned}`);
print(`Total Docs Examined  : ${statsBrand.totalDocsExamined}`);
print(`Total Keys Examined  : ${statsBrand.totalKeysExamined}`);

// Step 4: Clean up
print("\n[Step 4] Dropping Wildcard Index: db.products.dropIndex('$**_1')");
database.products.dropIndex("$**_1");
print("\n[DONE] Wildcard Index Demonstration complete.\n");
