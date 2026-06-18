<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    private function canAccessTask(Request $request, Task $task): bool
    {
        $userId = $request->user()->id;

        return $task->created_by === $userId || $task->assigned_to === $userId;
    }

    public function index(Request $request, Task $task): JsonResponse
    {
        if (! $this->canAccessTask($request, $task)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $comments = Comment::with(['user', 'task'])
            ->where('task_id', $task->id)
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'comments' => $comments,
        ]);
    }

    public function store(Request $request, Task $task): JsonResponse
    {
        if (! $this->canAccessTask($request, $task)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'content' => ['required', 'string'],
        ]);

        $comment = Comment::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        return response()->json([
            'comment' => $comment->load(['user', 'task']),
        ], 201);
    }

    public function destroy(Request $request, Comment $comment): JsonResponse
    {
        if ($comment->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $payload = $comment->load(['user', 'task']);
        $comment->delete();

        return response()->json([
            'message' => 'OK',
            'comment' => $payload,
        ]);
    }
}
