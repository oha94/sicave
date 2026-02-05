<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

use App\Http\Controllers\Api\StockReceptionController;
use App\Http\Controllers\Api\SupplierReturnController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\AuthController;
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::prefix('stock')->group(function () {
    Route::get('receptions', [StockReceptionController::class, 'index']);
    Route::post('receptions', [StockReceptionController::class, 'store']);
    Route::post('receptions/{reception}/validate', [StockReceptionController::class, 'validateReception']);
    Route::get('receptions/{reception}', [StockReceptionController::class, 'show']);

    // Supplier Returns
    Route::post('supplier-returns/{supplier_return}/status', [SupplierReturnController::class, 'updateStatus']);
    Route::apiResource('supplier-returns', SupplierReturnController::class);
});

use App\Http\Controllers\Api\ExpenseController;

// ...

Route::prefix('inventory')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/', [InventoryController::class, 'store']);
    Route::post('/{inventory}/validate', [InventoryController::class, 'validateInventory']);
    Route::put('/{inventory}', [InventoryController::class, 'update']);
    Route::get('/{inventory}', [InventoryController::class, 'show']);
});

Route::apiResource('expenses', ExpenseController::class);

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('warehouses', \App\Http\Controllers\Api\WarehouseController::class);
    Route::apiResource('users', \App\Http\Controllers\Api\UserController::class);
    Route::patch('clients/{client}/toggle-status', [\App\Http\Controllers\Api\ClientController::class, 'toggleStatus']);
    Route::apiResource('clients', \App\Http\Controllers\Api\ClientController::class);

    Route::post('invoices/{invoice}/report', [\App\Http\Controllers\Api\InvoiceController::class, 'report']);
    Route::apiResource('invoices', \App\Http\Controllers\Api\InvoiceController::class);

    Route::apiResource('suppliers', \App\Http\Controllers\Api\SupplierController::class);

    Route::post('products/{product}/deactivate', [\App\Http\Controllers\Api\ProductController::class, 'deactivate']);
    Route::post('products/{sourceProduct}/merge', [\App\Http\Controllers\Api\ProductController::class, 'merge']);
    Route::post('products/{product}/unpack', [\App\Http\Controllers\Api\ProductController::class, 'unpack']);
    Route::post('products/{id}/reactivate', [\App\Http\Controllers\Api\ProductController::class, 'reactivate']);
    Route::get('products/{id}/stats', [\App\Http\Controllers\Api\ProductController::class, 'stats']);
    Route::get('products/unpacking-history', [\App\Http\Controllers\Api\ProductController::class, 'unpackingHistory']);
    Route::apiResource('products', \App\Http\Controllers\Api\ProductController::class);

    Route::get('payments', [\App\Http\Controllers\Api\PaymentController::class, 'index']);
    Route::post('payments', [\App\Http\Controllers\Api\PaymentController::class, 'store']);
    Route::get('debtors', [\App\Http\Controllers\Api\PaymentController::class, 'getDebtors']);
    Route::get('clients/{id}/debt', [\App\Http\Controllers\Api\PaymentController::class, 'getClientDebt']);

    Route::post('stock-adjustments', [\App\Http\Controllers\Api\StockAdjustmentController::class, 'store']);

    Route::apiResource('categories', \App\Http\Controllers\Api\CategoryController::class);
    Route::apiResource('shelves', \App\Http\Controllers\Api\ShelfController::class);

    Route::get('settings', [\App\Http\Controllers\Api\SettingController::class, 'index']);
    Route::post('settings', [\App\Http\Controllers\Api\SettingController::class, 'update']);
    Route::post('settings/otp/generate', [\App\Http\Controllers\Api\SettingController::class, 'generateOtp']);
    Route::post('settings/otp/verify', [\App\Http\Controllers\Api\SettingController::class, 'verifyOtp']);
    Route::post('settings/logo', [\App\Http\Controllers\Api\SettingController::class, 'uploadLogo']);

    Route::apiResource('cash-counts', \App\Http\Controllers\Api\CashCountController::class);

    Route::prefix('work-days')->group(function () {
        Route::get('current', [\App\Http\Controllers\Api\WorkDayController::class, 'current']);
        Route::get('check', [\App\Http\Controllers\Api\WorkDayController::class, 'check']);
        Route::post('open', [\App\Http\Controllers\Api\WorkDayController::class, 'open']);
        Route::post('close', [\App\Http\Controllers\Api\WorkDayController::class, 'close']);
    });

    // Reports
    Route::prefix('reports')->group(function () {
        // Financial Reports
        Route::get('financial/summary', [\App\Http\Controllers\Api\ReportController::class, 'financialSummary']);
        Route::get('financial/journal', [\App\Http\Controllers\Api\ReportController::class, 'cashJournal']);
        Route::get('financial/counts', [\App\Http\Controllers\Api\ReportController::class, 'cashCounts']);
        Route::get('financial/expenses', [\App\Http\Controllers\Api\ReportController::class, 'expenses']);
        Route::get('financial/clients', [\App\Http\Controllers\Api\ReportController::class, 'clientBalances']);
        Route::get('financial/pos', [\App\Http\Controllers\Api\ReportController::class, 'financialPointsOfSale']);

        // Stock Reports
        Route::get('stock/movements', [\App\Http\Controllers\Api\ReportController::class, 'stockMovements']);
        Route::get('stock/value', [\App\Http\Controllers\Api\ReportController::class, 'stockValue']);
        Route::get('stock/dormant', [\App\Http\Controllers\Api\ReportController::class, 'stockDormant']);
        Route::get('stock/alerts', [\App\Http\Controllers\Api\ReportController::class, 'stockAlerts']);
        Route::get('stock/inventories', [\App\Http\Controllers\Api\ReportController::class, 'stockInventories']);

        // Audit Reports
        Route::get('audit/price-changes', [\App\Http\Controllers\Api\ReportController::class, 'auditPriceChanges']);
        Route::get('audit/deletions', [\App\Http\Controllers\Api\ReportController::class, 'auditDeletions']);
        Route::get('audit/closures', [\App\Http\Controllers\Api\ReportController::class, 'auditClosures']);
    });

    Route::get('purchase-orders/suggestions', [\App\Http\Controllers\Api\PurchaseOrderController::class, 'suggestions']);
    Route::apiResource('purchase-orders', \App\Http\Controllers\Api\PurchaseOrderController::class);
});
