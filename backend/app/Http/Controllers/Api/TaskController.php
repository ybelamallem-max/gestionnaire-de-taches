<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    private function canAccessTask(Request $request, Task $task): bool
    {
        $userId = $request->user()->id;

        return $task->created_by === $userId || $task->assigned_to === $userId;
    }

    private function taskRelations(): array
    {
        return [
            'project',
            'creator',
            'assignee',
            'tags',
            'comments.user',
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'string', 'in:todo,in_progress,done'],
            'priority' => ['sometimes', 'string', 'in:low,medium,high'],
        ]);

        $userId = $request->user()->id;

        $query = Task::with($this->taskRelations())
            ->where(function ($q) use ($userId) {
                $q->where('created_by', $userId)->orWhere('assigned_to', $userId);
            });

        if (array_key_exists('status', $validated)) {
            $query->where('status', $validated['status']);
        }

        if (array_key_exists('priority', $validated)) {
            $query->where('priority', $validated['priority']);
        }

        return response()->json([
            'tasks' => $query->orderByDesc('created_at')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['nullable', 'string', 'in:low,medium,high'],
            'deadline' => ['nullable', 'date'],
            'project_id' => ['required', 'integer', 'exists:projects,id'],
        ]);

        $task = Task::create([
            'project_id' => $validated['project_id'],
            'created_by' => $request->user()->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'priority' => $validated['priority'] ?? 'medium',
            'due_date' => $validated['deadline'] ?? null,
        ]);

        return response()->json([
            'task' => $task->load($this->taskRelations()),
        ], 201);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        if (! $this->canAccessTask($request, $task)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'priority' => ['sometimes', 'nullable', 'string', 'in:low,medium,high'],
            'deadline' => ['sometimes', 'nullable', 'date'],
            'project_id' => ['sometimes', 'integer', 'exists:projects,id'],
            'status' => ['sometimes', 'string', 'in:todo,in_progress,done'],
        ]);

        $attributes = $validated;

        if (array_key_exists('deadline', $validated)) {
            $attributes['due_date'] = $validated['deadline'];
            unset($attributes['deadline']);
        }

        if (array_key_exists('status', $attributes)) {
            if ($attributes['status'] === 'done') {
                $attributes['completed_at'] = now();
            } else {
                $attributes['completed_at'] = null;
            }
        }

        $task->fill($attributes);
        $task->save();

        return response()->json([
            'task' => $task->load($this->taskRelations()),
        ]);
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        if (! $this->canAccessTask($request, $task)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $payload = $task->load($this->taskRelations());
        $task->delete();

        return response()->json([
            'message' => 'OK',
            'task' => $payload,
        ]);
    }

    public function toggle(Request $request, Task $task): JsonResponse
    {
        if (! $this->canAccessTask($request, $task)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($task->status === 'in_progress') {
            $task->status = 'done';
            $task->completed_at = now();
        } else {
            $task->status = 'in_progress';
            $task->completed_at = null;
        }

        $task->save();

        return response()->json([
            'task' => $task->load($this->taskRelations()),
        ]);
    }

    public function assign(Request $request, Task $task): JsonResponse
    {
        if (! $this->canAccessTask($request, $task)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $task->assigned_to = $validated['user_id'];
        $task->save();

        return response()->json([
            'task' => $task->load($this->taskRelations()),
        ]);
    }
}
