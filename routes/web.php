<?php

use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\DokuWebhookController;
use App\Http\Controllers\FakeDokuCheckoutController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');
Route::post('/checkout/demo', [CheckoutController::class, 'store'])->name('checkout.demo');
Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
Route::get('/payments/{order}', [PaymentController::class, 'show'])->name('payments.show');
Route::get('/payments/{order}/return', [PaymentController::class, 'show'])->name('payments.return');
Route::post('/payments/{payment}/sync', [PaymentController::class, 'sync'])->name('payments.sync');
Route::post('/webhooks/doku', DokuWebhookController::class)->name('doku.webhook');
Route::get('/sandbox/doku/checkout/{order}', [FakeDokuCheckoutController::class, 'show'])->name('sandbox.doku.checkout');
Route::post('/sandbox/doku/checkout/{order}', [FakeDokuCheckoutController::class, 'update'])->name('sandbox.doku.checkout.update');

Route::get('/dashboard', function () {
    return redirect()->route('payments.index');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
