/**
 * 09_partial_index.js
 * Demonstrates Partial Index in MongoDB
 * 
 * Concept:
 * A Partial Index indexes ONLY documents that satisfy a specified filter expression (partialFilterExpression).
 * Benefits:
 * - Smaller index size (saves RAM and disk storage)
 * - Lower write overhead during inserts and updates
 * - Faster queries on targeted active subsets of data
 */

const targetDb = typeof db !== "undefined" ? db.getSiblingDB("ecomDB") : null;
const database = targetDb || db;

print("\n========================================================");
print("   8. Partial Index Demonstration");
print("========================================================\n");

// Ensure clean state
try { database.users.dropIndex("email_1"); } catch (e) {}
try { database.products.dropIndex("price_1"); } catch (e) {}

// Part A: Users Collection Example (from Indexes.docx)
print("[Part A] Example 1: Active Users Partial Index (from documentation)");
print("Creating Partial Index on 'users' where status == 'active':");
print("db.users.createIndex({ email: 1 }, { partialFilterExpression: { status: 'active' } })");

database.users.createIndex(
    { email: 1 },
    { partialFilterExpression: { status: "active" } }
);

print("\nQuerying active user 'vasanth@gmail.com' with matching filter:");
const userExplainActive = database.users.find({
    email: "vasanth@gmail.com",
    status: "active"
}).explain("executionStats");
print(`Stage for active user lookup: ${userExplainActive.executionStats.executionStages.stage} (Used Partial Index)`);

print("\nQuerying inactive user 'rahul@gmail.com' (filter outside partial index):");
const userExplainInactive = database.users.find({
    email: "rahul@gmail.com",
    status: "inactive"
}).explain("executionStats");
print(`Stage for inactive user lookup: ${userExplainInactive.executionStats.executionStages.stage} (Fell back to COLLSCAN)`);

// Part B: Products Collection Partial Index
print("\n[Part B] Example 2: Active Products Partial Index (ecomDB.products)");
print("Creating Partial Index on 'price' where isActive == true:");
database.products.createIndex(
    { price: 1 },
    { partialFilterExpression: { isActive: true } }
);

print("\nExecuting query that satisfies partial index expression ({ price: { $gt: 50000 }, isActive: true }):");
const prodExplainMatch = database.products.find({
    price: { $gt: 50000 },
    isActive: true
}).explain("executionStats");
const statsMatch = prodExplainMatch.executionStats;

print(`Winning Stage        : ${statsMatch.executionStages.stage}`);
print(`Input Stage          : ${statsMatch.executionStages.inputStage ? statsMatch.executionStages.inputStage.stage : "N/A"}`);
print(`Documents Returned   : ${statsMatch.nReturned}`);
print(`Total Docs Examined  : ${statsMatch.totalDocsExamined}`);
print(`Total Keys Examined  : ${statsMatch.totalKeysExamined}`);
print(`Execution Time (ms)  : ${statsMatch.executionTimeMillis}`);

print("\nExecuting query without the filter ({ price: { $gt: 50000 } }):");
const prodExplainNoMatch = database.products.find({
    price: { $gt: 50000 }
}).explain("executionStats");
print(`Stage when filter omitted: ${prodExplainNoMatch.executionStats.executionStages.stage} (Cannot use partial index, uses COLLSCAN)`);

// Clean up
print("\n[Part C] Dropping Partial Indexes...");
database.users.dropIndex("email_1");
database.products.dropIndex("price_1");
print("\n[DONE] Partial Index Demonstration complete.\n");
