<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'content',
        'author',
        'published_at',
        'image_url',
        'original_url',
        'status',
        'tags',
        'views',
        'enhanced_version',
    ];

    protected $casts = [
        'tags' => 'array',
        'enhanced_version' => 'array',
        'published_at' => 'datetime',
    ];
}
