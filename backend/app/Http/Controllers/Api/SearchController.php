<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\Project;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:2'],
        ]);

        $q = $validated['q'];
        $user = $request->user();

        // Search tasks
        $tasksQuery = Task::with('project')
            ->where('title', 'like', "%{$q}%");

        if (!$user->canViewAll()) {
            $userId = $user->id;
            $tasksQuery->where(function ($query) use ($userId) {
                $query->where('created_by', $userId)
                    ->orWhere('assigned_to', $userId);
            });
        }

        $tasks = $tasksQuery->limit(5)->get();

        // Search projects
        $projectsQuery = Project::with('team')
            ->where('name', 'like', "%{$q}%");

        if (!$user->canViewAll()) {
            $userId = $user->id;
            $projectsQuery->where('owner_id', $userId)
                ->orWhereHas('team', fn ($t) => $t->where('owner_id', $userId))
                ->orWhereHas('team.members', fn ($m) => $m->where('users.id', $userId));
        }

        $projects = $projectsQuery->limit(5)->get();

        // Search teams (all teams are visible to all users)
        $teams = Team::where('name', 'like', "%{$q}%")
            ->limit(5)
            ->get();

        // Search users (all users are visible)
        $users = User::where('name', 'like', "%{$q}%")
            ->select('id', 'name', 'email', 'tag')
            ->limit(5)
            ->get();

        return response()->json([
            'tasks' => $tasks,
            'projects' => $projects,
            'teams' => $teams,
            'users' => $users,
        ]);
    }
}
