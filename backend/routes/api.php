<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::post('/auth/firebase', [AuthController::class, 'login']);
use Kreait\Firebase\Auth as FirebaseAuth;

Route::get('/firebase-test', function (FirebaseAuth $auth) {
    return response()->json([
        'project_id' => $auth->getTenantId() ?? 'connected',
    ]);
});

