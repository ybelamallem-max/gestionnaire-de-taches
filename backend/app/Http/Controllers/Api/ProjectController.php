<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Project;
use App\Models\TeamMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    private function projectRelations(): array
    {
        return [
            'team',
            'owner',
            'tasks.tags',
        ];
    }

    private function canAccessProject(Request $request, Project $project): bool
    {
        if ($request->user()->canViewAll()) {
            return true;
        }

        $userId = $request->user()->id;

        if ($project->owner_id === $userId) {
            return true;
        }

        $team = $project->team()->first();

        if ($team && $team->owner_id === $userId) {
            return true;
        }

        return TeamMember::where('team_id', $project->team_id)->where('user_id', $userId)->exists();
    }

    private function canManageProject(Request $request, Project $project): bool
    {
        $userId = $request->user()->id;

        if ($project->owner_id === $userId) {
            return true;
        }

        $team = $project->team()->first();

        if ($team && $team->owner_id === $userId) {
            return true;
        }

        return TeamMember::where('team_id', $project->team_id)
            ->where('user_id', $userId)
            ->whereIn('role', ['owner', 'admin'])
            ->exists();
    }

    private function canAccessTeam(Request $request, int $teamId): bool
    {
        $user = $request->user();

        if ($user->canViewAll() || $user->role === 'responsable') {
            return \App\Models\Team::where('id', $teamId)->exists();
        }

        $userId = $user->id;

        return \App\Models\Team::where('id', $teamId)
            ->where(function ($q) use ($userId) {
                $q->where('owner_id', $userId)->orWhereHas('members', fn ($m) => $m->where('users.id', $userId));
            })
            ->exists();
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'scope' => ['sometimes', 'string', 'in:me,team,all'],
        ]);

        $user = $request->user();
        $scope = $validated['scope'] ?? 'me';

        if ($scope === 'all') {
            if (! $user->canViewAll()) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $projects = Project::with($this->projectRelations())
                ->where('status', '!=', 'completed')
                ->orderByDesc('created_at')
                ->get();
        } elseif ($scope === 'team') {
            $userId = $user->id;

            $projects = Project::with($this->projectRelations())
                ->where('status', '!=', 'completed')
                ->whereNotNull('team_id')
                ->where(function ($q) use ($userId) {
                    $q->whereHas('team', fn ($t) => $t->where('owner_id', $userId))
                      ->orWhereHas('team.members', fn ($m) => $m->where('users.id', $userId));
                })
                ->orderByDesc('created_at')
                ->get();
        } else {
            $userId = $user->id;

            $projects = Project::with($this->projectRelations())
                ->where('status', '!=', 'completed')
                ->where(function ($q) use ($userId) {
                    $q->whereNull('team_id')->where('owner_id', $userId)
                      ->orWhereHas('team', fn ($t) => $t->where('owner_id', $userId))
                      ->orWhereHas('team.members', fn ($m) => $m->where('users.id', $userId));
                })
                ->orderByDesc('created_at')
                ->get();
        }

        return response()->json([
            'projects' => $projects,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:active,completed,archived'],
            'deadline' => ['nullable', 'date'],
            'team_id' => ['nullable', 'integer', 'exists:teams,id'],
        ]);

        if ($validated['team_id'] && ! $this->canAccessTeam($request, (int) $validated['team_id'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $project = Project::create([
            'team_id' => $validated['team_id'] ?? null,
            'owner_id' => $request->user()->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? 'active',
            'due_date' => $validated['deadline'] ?? null,
        ]);

        return response()->json([
            'project' => $project->load($this->projectRelations()),
        ], 201);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        if (! $this->canManageProject($request, $project)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'nullable', 'string', 'in:active,completed,archived'],
            'deadline' => ['sometimes', 'nullable', 'date'],
            'team_id' => ['sometimes', 'integer', 'exists:teams,id'],
        ]);

        if (array_key_exists('team_id', $validated)) {
            if (! $this->canAccessTeam($request, (int) $validated['team_id'])) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $attributes = $validated;

        if (array_key_exists('deadline', $validated)) {
            $attributes['due_date'] = $validated['deadline'];
            unset($attributes['deadline']);
        }

        $oldStatus = $project->status;
        $project->fill($attributes);
        $project->save();

        if (array_key_exists('status', $validated) && $validated['status'] === 'completed' && $oldStatus !== 'completed') {
            if ($project->team_id) {
                $members = TeamMember::where('team_id', $project->team_id)
                    ->where('user_id', '!=', $request->user()->id)
                    ->get();
                
                foreach ($members as $member) {
                    Notification::create([
                        'user_id' => $member->user_id,
                        'project_id' => $project->id,
                        'type' => 'project_completed',
                        'title' => 'Projet terminé',
                        'message' => "Le projet \"{$project->name}\" a été terminé",
                        'data' => json_encode(['project_id' => $project->id, 'project_name' => $project->name]),
                    ]);
                }
            }
        }

        return response()->json([
            'project' => $project->load($this->projectRelations()),
        ]);
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        if (! $this->canManageProject($request, $project)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $payload = $project->load($this->projectRelations());
        $project->delete();

        return response()->json([
            'message' => 'OK',
            'project' => $payload,
        ]);
    }

    public function progress(Request $request, Project $project): JsonResponse
    {
        if (! $this->canAccessProject($request, $project)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $total = $project->tasks()->count();
        $completed = $project->tasks()->where('status', 'done')->count();

        return response()->json([
            'project' => $project->load($this->projectRelations()),
            'completed_tasks' => $completed,
            'total_tasks' => $total,
        ]);
    }

    public function archive(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            $projects = Project::with($this->projectRelations())
                ->where('status', 'completed')
                ->orderByDesc('created_at')
                ->get();
        } elseif ($user->role === 'responsable') {
            $projects = Project::with($this->projectRelations())
                ->where('status', 'completed')
                ->orderByDesc('created_at')
                ->get();
        } else {
            $userId = $user->id;

            $projects = Project::with($this->projectRelations())
                ->where('status', 'completed')
                ->where(function ($q) use ($userId) {
                    $q->whereNull('team_id')->where('owner_id', $userId)
                      ->orWhereHas('team', fn ($t) => $t->where('owner_id', $userId))
                      ->orWhereHas('team.members', fn ($m) => $m->where('users.id', $userId));
                })
                ->orderByDesc('created_at')
                ->get();
        }

        return response()->json([
            'projects' => $projects,
        ]);
    }
}
