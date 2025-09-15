<?php

// app/Models/Account.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Account extends Model
{
    use HasApiTokens;

    protected $table = 'accounts';
    protected $primaryKey = 'account_id';
    public $timestamps = true;

    protected $fillable = [
        'account_type_id',
        'firebase_uid',
        'name',
        'avatar_url',    // <-- đổi thành avatar_url
        'provider',
        'email',
        'password',
        'status',
        'last_login_at',
    ];

    protected $casts = [
        'last_login_at' => 'datetime',
    ];

    protected $hidden = ['password'];
}
