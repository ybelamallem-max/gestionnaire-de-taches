<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class StatsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->canViewAll()) {
            return response()->json($this->globalStats());
        }

        return response()->json($this->personalStats($user->id));
    }

    private function taskMetrics(Builder $tasksQuery): array
    {
        $today = Carbon::today();
        $startOfWeek = Carbon::now()->startOfWeek();
        $endOfWeek = Carbon::now()->endOfWeek();

        $tasksTotal = (clone $tasksQuery)->count();
        $tasksDone = (clone $tasksQuery)->where('status', 'done')->count();
        $tasksInProgress = (clone $tasksQuery)->where('status', 'in_progress')->count();
        $tasksTodo = (clone $tasksQuery)->where('status', 'todo')->count();
        $tasksOverdue = (clone $tasksQuery)
            ->where('status', '!=', 'done')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', $today)
            ->count();
        $tasksDoneThisWeek = (clone $tasksQuery)
            ->where('status', 'done')
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$startOfWeek, $endOfWeek])
            ->count();

        return [
            'tasks_total' => $tasksTotal,
            'tasks_done' => $tasksDone,
            'tasks_in_progress' => $tasksInProgress,
            'tasks_todo' => $tasksTodo,
            'tasks_overdue' => $tasksOverdue,
            'tasks_done_this_week' => $tasksDoneThisWeek,
            'completion_rate' => $tasksTotal > 0 ? (int) round(($tasksDone / $tasksTotal) * 100) : 0,
            'weekly_completion_rate' => $tasksTotal > 0 ? (int) round(($tasksDoneThisWeek / $tasksTotal) * 100) : 0,
        ];
    }

    private function recentActivity(Builder $tasksQuery): array
    {
        return (clone $tasksQuery)
            ->with('project:id,name')
            ->orderByDesc('updated_at')
            ->limit(4)
            ->get()
            ->map(function (Task $task) {
                return [
                    'id' => $task->id,
                    'type' => 'task',
                    'title' => $task->title,
                    'status' => $task->status,
                    'project_name' => $task->project?->name,
                    'updated_at' => $task->updated_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();
    }

    private function personalStats(int $userId): array
    {
        $tasksQuery = Task::query()
            ->visibleInGlobalLists()
            ->where(function ($q) use ($userId) {
                $q->where('created_by', $userId)->orWhere('assigned_to', $userId);
            });

        $assignedTasksQuery = Task::query()
            ->visibleInGlobalLists()
            ->where('assigned_to', $userId);

        $assignedTasksTotal = (clone $assignedTasksQuery)->count();
        $activeAssignedTasks = (clone $assignedTasksQuery)
            ->whereIn('status', ['todo', 'in_progress'])
            ->count();

        $teamsTotal = Team::query()
            ->where('owner_id', $userId)
            ->orWhereHas('members', fn ($q) => $q->where('users.id', $userId))
            ->count();

        return array_merge($this->taskMetrics($tasksQuery), [
            'scope' => 'personal',
            'teams_total' => $teamsTotal,
            'assigned_tasks_total' => $assignedTasksTotal,
            'active_assigned_tasks' => $activeAssignedTasks,
            'workload_percent' => $assignedTasksTotal > 0
                ? (int) round(($activeAssignedTasks / $assignedTasksTotal) * 100)
                : 0,
            'recent_activity' => $this->recentActivity($tasksQuery),
        ]);
    }

    private function globalStats(): array
    {
        $tasksQuery = Task::query()->visibleInGlobalLists();

        $activeTasksTotal = (clone $tasksQuery)
            ->whereIn('status', ['todo', 'in_progress'])
            ->count();

        $projectsTotal = Project::count();
        $projectsActive = Project::where('status', 'active')->count();
        $projectsCompleted = Project::where('status', 'completed')->count();
        $projectsArchived = Project::where('status', 'archived')->count();

        $teamsTotal = Team::count();
        $usersTotal = User::count();

        $projectsSummary = Project::query()
            ->where('status', 'active')
            ->with(['team', 'tasks'])
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get()
            ->map(function (Project $project) {
                $tasks = $project->tasks;
                $total = $tasks->count();
                $done = $tasks->where('status', 'done')->count();

                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'status' => $project->status,
                    'team_name' => $project->team?->name,
                    'due_date' => $project->due_date?->toDateString(),
                    'tasks_total' => $total,
                    'tasks_done' => $done,
                    'tasks_in_progress' => $tasks->where('status', 'in_progress')->count(),
                    'tasks_todo' => $tasks->where('status', 'todo')->count(),
                    'progress_percent' => $total > 0 ? (int) round(($done / $total) * 100) : 0,
                ];
            })
            ->values();

        return array_merge($this->taskMetrics($tasksQuery), [
            'scope' => 'global',
            'teams_total' => $teamsTotal,
            'users_total' => $usersTotal,
            'active_tasks_total' => $activeTasksTotal,
            'workload_average_active_tasks' => $usersTotal > 0
                ? round($activeTasksTotal / $usersTotal, 1)
                : 0,
            'projects_total' => $projectsTotal,
            'projects_active' => $projectsActive,
            'projects_completed' => $projectsCompleted,
            'projects_archived' => $projectsArchived,
            'projects_summary' => $projectsSummary,
            'recent_activity' => $this->recentActivity($tasksQuery),
        ]);
    }
}
