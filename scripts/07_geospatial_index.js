/**
 * 07_geospatial_index.js
 * Demonstrates Geospatial (2dsphere) Index in MongoDB
 * 
 * Concept:
 * A Geospatial Index enables high-speed location-based queries on coordinates
 * on an Earth-like sphere. MongoDB supports GeoJSON objects (Points, LineStrings, Polygons)
 * and spatial operators ($near, $geoWithin, $geoIntersects).
 * Format: coordinates are always specified as [longitude, latitude].
 */

const targetDb = typeof db !== "undefined" ? db.getSiblingDB("ecomDB") : null;
const database = targetDb || db;

print("\n========================================================");
print("   6. Geospatial (2dsphere) Index Demonstration");
print("========================================================\n");

// Ensure clean state
try { database.products.dropIndex("location_2dsphere"); } catch (e) {}

// Step 1: Note that $near queries REQUIRE a geospatial index in MongoDB
print("[Step 1] Creating 2dsphere Geospatial Index on 'location':");
print("db.products.createIndex({ location: '2dsphere' })");
const indexResult = database.products.createIndex({ location: "2dsphere" });
print(`Index Created        : ${indexResult}`);

// Step 2: Query nearby stores/products within 10km (10,000 meters)
print("\n[Step 2] Executing Geo-spatial $near Query:");
print("Finding products within 10 km of coordinates [77.0, 11.1]...");

const geoQuery = {
    location: {
        $near: {
            $geometry: {
                type: "Point",
                coordinates: [77.0, 11.1]
            },
            $maxDistance: 10000 // 10 km in meters
        }
    }
};

const explain = database.products.find(geoQuery).explain("executionStats");
const stats = explain.executionStats;

print("\n--- Execution Stats for Geospatial Query ---");
print(`Winning Stage        : ${stats.executionStages.stage}`);
print(`Documents Returned   : ${stats.nReturned}`);
print(`Total Docs Examined  : ${stats.totalDocsExamined}`);
print(`Execution Time (ms)  : ${stats.executionTimeMillis}`);

// Step 3: Fetch top 3 closest items
print("\n[Step 3] Top 3 Closest Products Found:");
const nearbyProducts = database.products.find(geoQuery, {
    name: 1,
    "seller.city": 1,
    location: 1
}).limit(3).toArray();

nearbyProducts.forEach((p, idx) => {
    print(` [${idx + 1}] ${p.name} in ${p.seller.city} at coordinates [${p.location.coordinates.join(", ")}]`);
});

// Step 4: Clean up
print("\n[Step 4] Dropping 2dsphere Index: db.products.dropIndex('location_2dsphere')");
database.products.dropIndex("location_2dsphere");
print("\n[DONE] Geospatial Index Demonstration complete.\n");
