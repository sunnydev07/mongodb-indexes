/**
 * 05_text_index.js
 * Demonstrates Text Index in MongoDB
 * 
 * Concept:
 * A Text Index allows fast full-text searching inside string fields.
 * It tokenizes words, drops stop words (e.g., 'the', 'a', 'is'), stems words,
 * and enables search queries using the '$text' and '$search' operators.
 */

const targetDb = typeof db !== "undefined" ? db.getSiblingDB("ecomDB") : null;
const database = targetDb || db;

print("\n========================================================");
print("   4. Text Index Demonstration");
print("========================================================\n");

// Ensure clean state
try { database.products.dropIndex("description_text"); } catch (e) {}

// Step 1: Query without Text Index (Exact Match / Regex)
print("[Step 1] Querying description without Text Index (Exact match scan):");
const explainBefore = database.products.find({
    description: "This is a high quality Clothing product from HP with excellent features and performance."
}).explain("executionStats");
print(`Before Index Stage   : ${explainBefore.executionStats.executionStages.stage}`);
print(`Total Docs Examined  : ${explainBefore.executionStats.totalDocsExamined}`);

// Step 2: Create Text Index on 'description'
print("\n[Step 2] Creating Text Index: db.products.createIndex({ description: 'text' })");
const indexResult = database.products.createIndex({ description: "text" });
print(`Index Created        : ${indexResult}`);

// Step 3: Execute Text Search using $text operator
print("\n[Step 3] Executing Text Search: db.products.find({ $text: { $search: 'Samsung' } })");
const explainAfter = database.products.find({
    $text: { $search: "Samsung" }
}).explain("executionStats");
const statsAfter = explainAfter.executionStats;

print("\n--- Execution Stats for Text Search ---");
print(`Winning Stage        : ${statsAfter.executionStages.stage}`);
print(`Documents Returned   : ${statsAfter.nReturned}`);
print(`Total Docs Examined  : ${statsAfter.totalDocsExamined}`);
print(`Execution Time (ms)  : ${statsAfter.executionTimeMillis}`);

// Step 4: Text Search with Relevance Score projection
print("\n[Step 4] Top 3 Search Results sorted by Text Relevance Score:");
const searchResults = database.products.find(
    { $text: { $search: "Samsung Electronics" } },
    { score: { $meta: "textScore" }, name: 1, description: 1 }
).sort({ score: { $meta: "textScore" } }).limit(3).toArray();

searchResults.forEach((doc, idx) => {
    print(` [${idx + 1}] Product: ${doc.name} (Score: ${doc.score.toFixed(2)})`);
});

// Step 5: Clean up
print("\n[Step 5] Dropping Text Index: db.products.dropIndex('description_text')");
database.products.dropIndex("description_text");
print("\n[DONE] Text Index Demonstration complete.\n");
