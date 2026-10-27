@echo off
REM ========================================================
REM   MongoDB Index Lab Test & Benchmark Runner
REM ========================================================

echo ========================================================
echo   Running MongoDB Indexes Lab Test Suite
echo ========================================================

echo.
echo [1/11] Seeding ecomDB with 5,000 products...
mongosh ecomDB scripts/01_seed_data.js

echo.
echo [2/11] Testing Simple (Single Field) Index...
mongosh ecomDB scripts/02_simple_index.js

echo.
echo [3/11] Testing Compound Index...
mongosh ecomDB scripts/03_compound_index.js

echo.
echo [4/11] Testing Multikey Index...
mongosh ecomDB scripts/04_multikey_index.js

echo.
echo [5/11] Testing Text Index...
mongosh ecomDB scripts/05_text_index.js

echo.
echo [6/11] Testing Hashed Index...
mongosh ecomDB scripts/06_hashed_index.js

echo.
echo [7/11] Testing Geospatial Index...
mongosh ecomDB scripts/07_geospatial_index.js

echo.
echo [8/11] Testing Unique and Sparse Index...
mongosh ecomDB scripts/08_unique_sparse_index.js

echo.
echo [9/11] Testing Partial Index...
mongosh ecomDB scripts/09_partial_index.js

echo.
echo [10/11] Testing Wildcard Index...
mongosh ecomDB scripts/10_wildcard_index.js

echo.
echo [11/11] Running Full Performance Benchmark Suite...
mongosh ecomDB scripts/11_benchmark_runner.js

echo.
echo ========================================================
echo   All MongoDB Index Tests and Benchmarks Completed!
echo ========================================================
pause
