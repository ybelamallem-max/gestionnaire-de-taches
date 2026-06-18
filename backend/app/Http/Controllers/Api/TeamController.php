<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Models\TeamMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    private function teamRelations(): array
    {
        return [
            'owner',
            'members',
            'projects',
        ];
    }

    private function canAccessTeam(Request $request, Team $team): bool
    {
        $userId = $request->user()->id;

        if ($team->owner_id === $userId) {
            return true;
        }

        return TeamMember::where('team_id', $team->id)->where('user_id', $userId)->exists();
    }

    private function canManageTeam(Request $request, Team $team): bool
    {
        $userId = $request->user()->id;

        if ($team->owner_id === $userId) {
            return true;
        }

        return TeamMember::where('team_id', $team->id)
            ->where('user_id', $userId)
            ->whereIn('role', ['owner', 'admin'])
            ->exists();
    }

    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $teams = Team::with($this->teamRelations())
            ->where('owner_id', $userId)
            ->orWhereHas('members', fn ($q) => $q->where('users.id', $userId))
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'teams' => $teams,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $team = Team::create([
            'owner_id' => $request->user()->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        $team->members()->syncWithoutDetaching([
            $request->user()->id => ['role' => 'owner'],
        ]);

        return response()->json([
            'team' => $team->load($this->teamRelations()),
        ], 201);
    }

    public function addMember(Request $request, Team $team): JsonResponse
    {
        if (! $this->canManageTeam($request, $team)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $role = $validated['user_id'] === $team->owner_id ? 'owner' : 'member';

        $team->members()->syncWithoutDetaching([
            $validated['user_id'] => ['role' => $role],
        ]);

        return response()->json([
            'team' => $team->load($this->teamRelations()),
        ]);
    }

    public function removeMember(Request $request, Team $team, int $userId): JsonResponse
    {
        if (! $this->canManageTeam($request, $team)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($userId === (int) $team->owner_id) {
            return response()->json(['message' => 'Cannot remove owner'], 422);
        }

        $exists = TeamMember::where('team_id', $team->id)->where('user_id', $userId)->exists();

        if (! $exists) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $team->members()->detach($userId);

        return response()->json([
            'team' => $team->load($this->teamRelations()),
        ]);
    }

    public function updateMemberRole(Request $request, Team $team, int $userId): JsonResponse
    {
        if (! $this->canManageTeam($request, $team)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($userId === (int) $team->owner_id) {
            return response()->json(['message' => 'Cannot change owner role'], 422);
        }

        $validated = $request->validate([
            'role' => ['required', 'string', 'in:admin,member'],
        ]);

        $member = TeamMember::where('team_id', $team->id)->where('user_id', $userId)->first();

        if (! $member) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $team->members()->updateExistingPivot($userId, [
            'role' => $validated['role'],
        ]);

        return response()->json([
            'team' => $team->load($this->teamRelations()),
        ]);
    }
}

