<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TagController extends Controller
{
    private function canAccessTask(Request $request, Task $task): bool
    {
        if ($request->user()->canViewAll()) {
            return true;
        }

        $userId = $request->user()->id;

        return $task->created_by === $userId || $task->assigned_to === $userId;
    }

    public function store(Request $request, Task $task): JsonResponse
    {
        if (! $this->canAccessTask($request, $task)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('tags', 'name')->where(fn ($q) => $q->where('task_id', $task->id)),
            ],
            'color' => ['nullable', 'string', 'max:50'],
        ]);

        $tag = $task->tags()->create([
            'name' => $validated['name'],
            'color' => $validated['color'] ?? null,
        ]);

        return response()->json([
            'tag' => $tag->load(['task']),
        ], 201);
    }

    public function destroy(Request $request, Tag $tag): JsonResponse
    {
        $task = $tag->task()->first();

        if (! $task || ! $this->canAccessTask($request, $task)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $payload = $tag->load(['task']);
        $tag->delete();

        return response()->json([
            'message' => 'OK',
            'tag' => $payload,
        ]);
    }
}
