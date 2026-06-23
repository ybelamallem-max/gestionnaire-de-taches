<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\Team;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

    private function personalStats(int $userId): array
    {
        $tasksQuery = Task::query()->where(function ($q) use ($userId) {
            $q->where('created_by', $userId)->orWhere('assigned_to', $userId);
        });

        $tasksTotal = (clone $tasksQuery)->count();
        $tasksDone = (clone $tasksQuery)->where('status', 'done')->count();
        $tasksInProgress = (clone $tasksQuery)->where('status', 'in_progress')->count();
        $tasksTodo = (clone $tasksQuery)->where('status', 'todo')->count();

        $teamsTotal = Team::query()
            ->where('owner_id', $userId)
            ->orWhereHas('members', fn ($q) => $q->where('users.id', $userId))
            ->count();

        return [
            'scope' => 'personal',
            'tasks_total' => $tasksTotal,
            'tasks_done' => $tasksDone,
            'tasks_in_progress' => $tasksInProgress,
            'tasks_todo' => $tasksTodo,
            'teams_total' => $teamsTotal,
        ];
    }

    private function globalStats(): array
    {
        $tasksTotal = Task::count();
        $tasksDone = Task::where('status', 'done')->count();
        $tasksInProgress = Task::where('status', 'in_progress')->count();
        $tasksTodo = Task::where('status', 'todo')->count();

        $projectsTotal = Project::count();
        $projectsActive = Project::where('status', 'active')->count();
        $projectsCompleted = Project::where('status', 'completed')->count();
        $projectsArchived = Project::where('status', 'archived')->count();

        $teamsTotal = Team::count();

        $projectsSummary = Project::with(['team', 'tasks'])
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

        return [
            'scope' => 'global',
            'tasks_total' => $tasksTotal,
            'tasks_done' => $tasksDone,
            'tasks_in_progress' => $tasksInProgress,
            'tasks_todo' => $tasksTodo,
            'teams_total' => $teamsTotal,
            'projects_total' => $projectsTotal,
            'projects_active' => $projectsActive,
            'projects_completed' => $projectsCompleted,
            'projects_archived' => $projectsArchived,
            'projects_summary' => $projectsSummary,
        ];
    }
}
