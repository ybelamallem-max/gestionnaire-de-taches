<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    private function canAccessTask(Request $request, Task $task): bool
    {
        if ($request->user()->canViewAll()) {
            return true;
        }

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
            'scope' => ['sometimes', 'string', 'in:me,mine,team,all'],
            'status' => ['sometimes', 'string', 'in:todo,in_progress,done'],
            'priority' => ['sometimes', 'string', 'in:low,medium,high,urgent'],
        ]);

        $user = $request->user();
        $scope = $validated['scope'] ?? 'me';

        if ($scope === 'all') {
            if (! $user->canViewAll()) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $query = Task::with($this->taskRelations());
        } else {
            $userId = $user->id;

            if ($scope === 'mine') {
                $query = Task::with($this->taskRelations())
                    ->where('assigned_to', $userId);
            } else {
                $query = Task::with($this->taskRelations())
                    ->where(function ($q) use ($userId) {
                        $q->where('created_by', $userId)->orWhere('assigned_to', $userId);
                    });
            }
        }

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
            'priority' => ['nullable', 'string', 'in:low,medium,high,urgent'],
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
            'priority' => ['sometimes', 'nullable', 'string', 'in:low,medium,high,urgent'],
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

        $oldStatus = $task->status;
        $task->fill($attributes);
        $task->save();

        if ($oldStatus !== 'done' && $task->status === 'done') {
            $task->load('project');
            
            // Send task completion notification to team members
            if ($task->project && $task->project->team_id) {
                $members = \App\Models\TeamMember::where('team_id', $task->project->team_id)
                    ->where('user_id', '!=', $request->user()->id)
                    ->get();
                
                foreach ($members as $member) {
                    Notification::create([
                        'user_id' => $member->user_id,
                        'task_id' => $task->id,
                        'project_id' => $task->project_id,
                        'type' => 'task_completed',
                        'title' => 'Tâche terminée',
                        'message' => "La tâche \"{$task->title}\" a été terminée",
                        'data' => json_encode(['task_id' => $task->id, 'task_title' => $task->title, 'project_id' => $task->project_id]),
                    ]);
                }
            }

            // Check if all tasks in the project are completed
            if ($task->project) {
                $totalTasks = $task->project->tasks()->count();
                $completedTasks = $task->project->tasks()->where('status', 'done')->count();
                
                if ($totalTasks > 0 && $totalTasks === $completedTasks && $task->project->status !== 'completed') {
                    $task->project->status = 'completed';
                    $task->project->save();

                    // Send project completion notification to all relevant users
                    $notifiedUsers = [];
                    
                    // Notify project owner if not the current user
                    if ($task->project->owner_id && $task->project->owner_id != $request->user()->id) {
                        Notification::create([
                            'user_id' => $task->project->owner_id,
                            'project_id' => $task->project->id,
                            'type' => 'project_completed',
                            'title' => 'Projet terminé',
                            'message' => "Le projet \"{$task->project->name}\" a été automatiquement terminé car toutes ses tâches sont complétées",
                            'data' => json_encode(['project_id' => $task->project->id, 'project_name' => $task->project->name]),
                        ]);
                        $notifiedUsers[] = $task->project->owner_id;
                    }

                    // Notify all team members (including the current user)
                    if ($task->project->team_id) {
                        $allMembers = \App\Models\TeamMember::where('team_id', $task->project->team_id);
                        
                        // Exclude already notified users
                        if (!empty($notifiedUsers)) {
                            $allMembers->whereNotIn('user_id', $notifiedUsers);
                        }
                        
                        $members = $allMembers->get();
                        
                        foreach ($members as $member) {
                            Notification::create([
                                'user_id' => $member->user_id,
                                'project_id' => $task->project->id,
                                'type' => 'project_completed',
                                'title' => 'Projet terminé',
                                'message' => "Le projet \"{$task->project->name}\" a été automatiquement terminé car toutes ses tâches sont complétées",
                                'data' => json_encode(['project_id' => $task->project->id, 'project_name' => $task->project->name]),
                            ]);
                        }
                    }
                }
            }
        }

        $response = [
            'task' => $task->load($this->taskRelations()),
        ];

        // Include project in response if it was marked as completed
        if ($task->project && $task->project->status === 'completed') {
            $response['project'] = $task->project->load($task->project->team ? 'team' : null);
        }

        return response()->json($response);
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

        $oldStatus = $task->status;

        if ($task->status === 'in_progress') {
            $task->status = 'done';
            $task->completed_at = now();
        } else {
            $task->status = 'in_progress';
            $task->completed_at = null;
        }

        $task->save();

        // Check if task was just marked as done
        if ($oldStatus !== 'done' && $task->status === 'done') {
            $task->load('project');
            
            // Check if all tasks in the project are completed
            if ($task->project) {
                $totalTasks = $task->project->tasks()->count();
                $completedTasks = $task->project->tasks()->where('status', 'done')->count();
                
                if ($totalTasks > 0 && $totalTasks === $completedTasks && $task->project->status !== 'completed') {
                    $task->project->status = 'completed';
                    $task->project->save();

                    // Send project completion notification to all relevant users
                    $notifiedUsers = [];
                    
                    // Notify project owner if not the current user
                    if ($task->project->owner_id && $task->project->owner_id != $request->user()->id) {
                        Notification::create([
                            'user_id' => $task->project->owner_id,
                            'project_id' => $task->project->id,
                            'type' => 'project_completed',
                            'title' => 'Projet terminé',
                            'message' => "Le projet \"{$task->project->name}\" a été automatiquement terminé car toutes ses tâches sont complétées",
                            'data' => json_encode(['project_id' => $task->project->id, 'project_name' => $task->project->name]),
                        ]);
                        $notifiedUsers[] = $task->project->owner_id;
                    }

                    // Notify all team members (including the current user)
                    if ($task->project->team_id) {
                        $allMembers = \App\Models\TeamMember::where('team_id', $task->project->team_id);
                        
                        // Exclude already notified users
                        if (!empty($notifiedUsers)) {
                            $allMembers->whereNotIn('user_id', $notifiedUsers);
                        }
                        
                        $members = $allMembers->get();
                        
                        foreach ($members as $member) {
                            Notification::create([
                                'user_id' => $member->user_id,
                                'project_id' => $task->project->id,
                                'type' => 'project_completed',
                                'title' => 'Projet terminé',
                                'message' => "Le projet \"{$task->project->name}\" a été automatiquement terminé car toutes ses tâches sont complétées",
                                'data' => json_encode(['project_id' => $task->project->id, 'project_name' => $task->project->name]),
                            ]);
                        }
                    }
                }
            }
        }

        $response = [
            'task' => $task->load($this->taskRelations()),
        ];

        // Include project in response if it was marked as completed
        if ($task->project && $task->project->status === 'completed') {
            $response['project'] = $task->project->load($task->project->team ? 'team' : null);
        }

        return response()->json($response);
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

        if ($task->assigned_to && $task->assigned_to !== $request->user()->id) {
            Notification::create([
                'user_id' => $task->assigned_to,
                'task_id' => $task->id,
                'type' => 'task_assigned',
                'title' => 'Tâche assignée',
                'message' => "La tâche \"{$task->title}\" vous a été assignée",
                'data' => json_encode(['task_id' => $task->id, 'task_title' => $task->title]),
            ]);
        }

        return response()->json([
            'task' => $task->load($this->taskRelations()),
        ]);
    }
}
