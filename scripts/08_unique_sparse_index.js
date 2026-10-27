/**
 * 08_unique_sparse_index.js
 * Demonstrates Unique and Sparse Indexes in MongoDB
 * 
 * Concept:
 * - A UNIQUE index rejects duplicate values for the indexed field.
 * - A SPARSE index only includes entries for documents that actually have the indexed field.
 * Combining UNIQUE + SPARSE:
 * In a standard unique index, MongoDB treats missing fields as null. If two documents lack
 * the field, the second insert fails with a duplicate key error!
 * Making the unique index SPARSE allows multiple documents to omit the field without collision.
 */

const targetDb = typeof db !== "undefined" ? db.getSiblingDB("ecomDB") : null;
const database = targetDb || db;

print("\n========================================================");
print("   7. Unique and Sparse Index Demonstration");
print("========================================================\n");

// Ensure clean state
try { database.products.dropIndex("email_1"); } catch (e) {}

// Step 1: Create Unique + Sparse Index
print("[Step 1] Creating Unique + Sparse Index: db.products.createIndex({ email: 1 }, { unique: true, sparse: true })");
const indexResult = database.products.createIndex(
    { email: 1 },
    { unique: true, sparse: true }
);
print(`Index Created        : ${indexResult}`);

// Step 2: Query existing unique email
print("\n[Step 2] Querying document by unique email: customer3@example.com");
const found = database.products.findOne({ email: "customer3@example.com" });
if (found) {
    print(`Found Document       : ID ${found.productId}, Name: '${found.name}', Email: '${found.email}'`);
} else {
    print("Document not found.");
}

// Step 3: Test Uniqueness Enforcement (Attempt duplicate insertion)
print("\n[Step 3] Testing Unique Constraint enforcement (Attempting duplicate insert)...");
try {
    database.products.insertOne({
        productId: 99999,
        name: "Duplicate Email Test Product",
        email: "customer3@example.com", // Duplicate email!
        price: 25000
    });
    print("[ERROR] Duplicate insert unexpectedly succeeded!");
} catch (err) {
    print(`[SUCCESS] Duplicate insertion was properly blocked by Unique Index!`);
    print(`Caught Expected Error: ${err.message}`);
}

// Step 4: Verify Sparse Property (Insert document without email)
print("\n[Step 4] Testing Sparse Property (Inserting document WITHOUT email field)...");
try {
    const sparseInsert = database.products.insertOne({
        productId: 99998,
        name: "No Email Product Test",
        price: 15000
    });
    print(`[SUCCESS] Inserted document without email: ${sparseInsert.insertedId}`);
    database.products.deleteOne({ productId: 99998 });
} catch (err) {
    print(`[ERROR] Sparse insertion failed: ${err.message}`);
}

// Step 5: Clean up
print("\n[Step 5] Dropping Unique Sparse Index: db.products.dropIndex('email_1')");
database.products.dropIndex("email_1");
print("\n[DONE] Unique & Sparse Index Demonstration complete.\n");
