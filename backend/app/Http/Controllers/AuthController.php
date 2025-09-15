<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;

class AuthController extends Controller
{
    public function __construct(private FirebaseAuth $firebase) {}

    public function login(Request $request)
    {
        // Lấy "Bearer <idToken>"
        $auth = $request->header('Authorization'); // "Bearer xxx"
        if (!$auth || !str_starts_with($auth, 'Bearer ')) {
            return response()->json(['message' => 'Missing Bearer token'], 400);
        }
        $idToken = substr($auth, 7);

        try {
            $verified = $this->firebase->verifyIdToken($idToken);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Invalid Firebase ID token', 'error' => $e->getMessage()], 401);
        }

        $claims = $verified->claims();
        $uid   = $claims->get('sub');
        $email = $claims->get('email');
        $name  = $claims->get('name') ?? 'User '.Str::substr($uid, 0, 6);
        $photo = $claims->get('picture') ?? null;
        $emailVerified = (bool) ($claims->get('email_verified') ?? false);

        // Tạo hoặc lấy account trong bảng accounts
        $account = Account::firstOrCreate(
            ['email' => $email],
            [
                'account_type_id' => 3,
                'name'           => $name,
                'password'       => bcrypt(Str::random(32)), // placeholder
                'firebase_uid'   => $uid,
                'avatar_url'     => $photo,
                'provider'       => 'google',
                'status'         => 1,
                'last_login_at'  => now(),
            ]
        );

        // Nếu account đã tồn tại, cập nhật last_login_at & avatar_url nếu chưa có
        if ($account->wasRecentlyCreated === false) {
            $account->update([
                'avatar_url'    => $account->avatar_url ?: $photo,
                'last_login_at' => now(),
            ]);
        }

        // cấp API token (Sanctum)
        $token = $account->createToken('spa')->plainTextToken;

        return response()->json([
            'message' => 'Login OK',
            'user' => [
                'id'         => $account->getKey(),
                'name'       => $account->name,
                'email'      => $account->email,
                'avatar_url' => $account->avatar_url,
                'status'     => $account->status,
                'last_login' => optional($account->last_login_at)->toIso8601String(),
            ],
            'token' => $token,
        ]);
    }
}
