<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Notification;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    private function canAccessTask(Request $request, Task $task): bool
    {
        if ($request->user()->canViewAll()) {
            return true;
        }

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

        $content = $validated['content'];
        preg_match_all('/@([\w\s]+)#(\d{3})/', $content, $matches);
        if (!empty($matches[1])) {
            foreach ($matches[1] as $index => $name) {
                $tag = $matches[2][$index] ?? null;
                $user = User::where('name', $name)->first();
                if ($user && $user->id !== $request->user()->id) {
                    Notification::create([
                        'user_id' => $user->id,
                        'task_id' => $task->id,
                        'type' => 'comment_mention',
                        'title' => 'Mention dans un commentaire',
                        'message' => "Vous avez été mentionné dans un commentaire sur la tâche \"{$task->title}\"",
                        'data' => json_encode(['task_id' => $task->id, 'task_title' => $task->title]),
                    ]);
                }
            }
        }

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
