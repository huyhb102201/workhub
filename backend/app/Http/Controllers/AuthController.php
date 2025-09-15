<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;

class AuthController extends Controller
{
    public function __construct(private FirebaseAuth $firebase)
    {
    }

    public function login(Request $request)
    {
        // Lấy Bearer <idToken>
        $auth = $request->header('Authorization');
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
        $uid = $claims->get('sub');
        $email = $claims->get('email'); // có thể null nếu provider không cấp email
        $name = $claims->get('name') ?? 'User ' . Str::substr($uid, 0, 6);
        $photo = $claims->get('picture') ?? null;
        $emailVerified = (bool) ($claims->get('email_verified') ?? false);

        // NEW: lấy provider từ body (mặc định 'google' để backward-compatible)
        $provider = $request->input('provider', 'google');

        // Tìm theo email trước (để người dùng dùng nhiều provider vẫn là 1 account)
        // fallback theo firebase_uid nếu email null
        $account = null;
        if ($email) {
            $account = Account::where('email', $email)->first();
        }
        if (!$account) {
            $account = Account::where('firebase_uid', $uid)->first();
        }

        if (!$account) {
            $account = Account::create([
                'account_type_id' => 3,
                'name' => $name,
                'email' => $email,                    // có thể null nếu schema cho phép
                'password' => bcrypt(Str::random(32)),
                'firebase_uid' => $uid,
                'avatar_url' => $photo,
                'provider' => $provider,                 // <— lưu provider theo request
                'status' => 1,
                'last_login_at' => now(),
                'email_verified_at' => $emailVerified ? now() : null,
            ]);
        } else {
            // Cập nhật lần đăng nhập & avatar nếu trống; update provider lần đăng nhập này
            $account->update([
                'avatar_url' => $account->avatar_url ?: $photo,
                'last_login_at' => now(),
                'provider' => $provider,               // <— cập nhật theo lần đăng nhập hiện tại
                'firebase_uid' => $account->firebase_uid ?: $uid,
                'email_verified_at' => $account->email_verified_at ?: ($emailVerified ? now() : null),
            ]);
        }

        $token = $account->createToken('spa')->plainTextToken;

        return response()->json([
            'message' => 'Login OK',
            'user' => [
                'id' => $account->getKey(),
                'name' => $account->name,
                'email' => $account->email,
                'avatar_url' => $account->avatar_url,
                'provider' => $account->provider,
                'status' => $account->status,
                'last_login' => optional($account->last_login_at)->toIso8601String(),
            ],
            'token' => $token,
        ]);
    }
public function store(Request $request)
    {
        $data = $request->validate([
            'uid'       => 'required|string|max:191',
            'name'      => 'nullable|string|max:191',
            'email'     => 'nullable|email|max:191',
            'photoURL'  => 'nullable|string|max:2048',
            'provider'  => 'nullable|in:facebook,google,apple,github'
        ]);

        $provider = $data['provider'] ?? 'facebook';

        // Gộp account: ưu tiên tìm theo email, nếu ko có thì fallback theo uid
        $account = null;
        if (!empty($data['email'])) {
            $account = Account::where('email', $data['email'])->first();
        }
        if (!$account) {
            $account = Account::where('firebase_uid', $data['uid'])->first();
        }

        if (!$account) {
            $account = Account::create([
                'account_type_id'   => 3,
                'name'              => $data['name'] ?: ('User '.Str::substr($data['uid'], 0, 6)),
                'email'             => $data['email'] ?? null,   // cho phép null nếu schema cho phép
                'password'          => bcrypt(Str::random(32)),
                'firebase_uid'      => $data['uid'],
                'avatar_url'        => $data['photoURL'] ?? null,
                'provider'          => $provider,
                'status'            => 1,
                'last_login_at'     => now(),
            ]);
        } else {
            $account->update([
                'name'              => $account->name ?: ($data['name'] ?? $account->name),
                'email'             => $account->email ?: ($data['email'] ?? $account->email),
                'avatar_url'        => $account->avatar_url ?: ($data['photoURL'] ?? null),
                'firebase_uid'      => $account->firebase_uid ?: $data['uid'],
                'provider'          => $provider,
                'last_login_at'     => now(),
            ]);
        }

        // Trả về API token (Sanctum)
        $token = $account->createToken('spa')->plainTextToken;

        return response()->json([
            'message' => 'Login OK',
            'user' => [
                'id'         => $account->getKey(),
                'name'       => $account->name,
                'email'      => $account->email,
                'avatar_url' => $account->avatar_url,
                'provider'   => $account->provider,
                'status'     => $account->status,
                'last_login' => optional($account->last_login_at)->toIso8601String(),
            ],
            'token' => $token,
        ]);
    }
}
