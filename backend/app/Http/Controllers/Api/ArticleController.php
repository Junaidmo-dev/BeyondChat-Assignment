<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    public function index(Request $request)
    {
        $query = Article::query();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json(
            $query->orderBy('published_at', 'desc')->paginate(10)
        );
    }



    public function show($id)
    {
        $article = Article::find($id);

        if (!$article) {
            return response()->json(['message' => 'Article not found'], 404);
        }

        return response()->json($article);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'slug' => 'required|string|unique:articles,slug',
        ]);

        $article = Article::create($validated);

        return response()->json($article, 201);
    }

    public function update(Request $request, $id)
    {
        $article = Article::find($id);
        
        if (!$article) {
            return response()->json(['message' => 'Article not found'], 404);
        }

        $article->update($request->all());

        return response()->json($article);
    }

    public function destroy($id)
    {
        $article = Article::find($id);
        
        if (!$article) {
            return response()->json(['message' => 'Article not found'], 404);
        }

        $article->delete();

        return response()->json(['message' => 'Article deleted']);
    }
}
