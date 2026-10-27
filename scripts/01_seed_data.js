/**
 * 01_seed_data.js
 * Generates and seeds 5,000 realistic e-commerce product documents into 'ecomDB.products'
 * and sample user documents into 'ecomDB.users' as specified in Indexes.docx.
 */

// Switch to ecomDB
const targetDb = typeof db !== "undefined" ? db.getSiblingDB("ecomDB") : null;
const database = targetDb || db;

print("\n========================================================");
print("   MongoDB Indexing Lab: Data Seeding Pipeline");
print("========================================================\n");

// Clean previous collections
print("Dropping existing 'products' and 'users' collections in ecomDB...");
database.products.drop();
database.users.drop();

// Master arrays for synthetic generation
const categories = [
    "Electronics",
    "Mobiles",
    "Laptops",
    "Clothing",
    "Books",
    "Furniture",
    "Shoes",
    "Accessories",
    "Home Appliances",
    "Sports"
];

const brands = [
    "Apple",
    "Samsung",
    "Dell",
    "HP",
    "Lenovo",
    "Sony",
    "Nike",
    "Adidas",
    "Puma",
    "OnePlus"
];

const cities = [
    "Chennai",
    "Bangalore",
    "Hyderabad",
    "Coimbatore",
    "Salem",
    "Erode",
    "Tiruchengode",
    "Madurai",
    "Trichy",
    "Pondicherry"
];

const tags = [
    "new",
    "popular",
    "discount",
    "premium",
    "bestseller",
    "trending",
    "featured",
    "budget"
];

const paymentMethods = [
    "UPI",
    "Credit Card",
    "Debit Card",
    "Cash",
    "Net Banking"
];

let products = [];
const TOTAL_PRODUCTS = 5000;
const BATCH_SIZE = 500;

print(`Generating ${TOTAL_PRODUCTS} product documents...`);

for (let i = 1; i <= TOTAL_PRODUCTS; i++) {
    const category = categories[i % categories.length];
    const brand = brands[i % brands.length];
    const city = cities[i % cities.length];
    const price = Math.floor(Math.random() * 90000) + 1000;
    const quantity = Math.floor(Math.random() * 10) + 1;
    const rating = Number((Math.random() * 4 + 1).toFixed(1));

    const productTags = [
        tags[i % tags.length],
        tags[(i + 2) % tags.length]
    ];

    const product = {
        productId: i,
        name: brand + " Product " + i,
        category: category,
        brand: brand,
        price: price,
        quantity: quantity,
        rating: rating,
        description: "This is a high quality " + category + " product from " + brand + " with excellent features and performance.",
        tags: productTags,
        seller: {
            sellerId: 1000 + (i % 100),
            name: "Seller " + (i % 100),
            city: city
        },
        location: {
            type: "Point",
            coordinates: [
                Number((76.95 + (Math.random() * 0.5)).toFixed(6)),
                Number((11.00 + (Math.random() * 0.5)).toFixed(6))
            ]
        },
        paymentMethods: paymentMethods,
        isActive: i % 5 !== 0,
        createdAt: new Date(2024, i % 12, (i % 28) + 1)
    };

    // Add email to every 3rd document (Sparse Index testing)
    if (i % 3 === 0) {
        product.email = "customer" + i + "@example.com";
    }

    // Add discount to every 4th document (Partial Index testing)
    if (i % 4 === 0) {
        product.discount = Math.floor(Math.random() * 40) + 5;
    }

    products.push(product);

    if (products.length === BATCH_SIZE) {
        database.products.insertMany(products);
        products = [];
    }
}

if (products.length > 0) {
    database.products.insertMany(products);
}

// Seed sample users collection for partial index demo from Indexes.docx
print("Seeding sample 'users' collection for Partial Index demonstration...");
const sampleUsers = [
    { name: "Vasanth", email: "vasanth@gmail.com", status: "active" },
    { name: "Rahul", email: "rahul@gmail.com", status: "inactive" },
    { name: "Kumar", email: "kumar@gmail.com", status: "active" }
];
database.users.insertMany(sampleUsers);

// Verification and stats
const count = database.products.countDocuments();
const userCount = database.users.countDocuments();
const sampleDoc = database.products.findOne();

print("\n--- Seeding Summary ---");
print(`Database: ecomDB`);
print(`Total Products Seeded : ${count}`);
print(`Total Users Seeded    : ${userCount}`);
print(`Sample Product ID     : ${sampleDoc.productId}`);
print(`Sample Product Category: ${sampleDoc.category}`);
print(`Sample Location GeoJSON: ${JSON.stringify(sampleDoc.location)}`);
print("\n[SUCCESS] Data seeding completed successfully!\n");
