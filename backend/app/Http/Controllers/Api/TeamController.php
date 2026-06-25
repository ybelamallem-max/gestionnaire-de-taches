<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

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

    private function teamRelationsWithPending(): array
    {
        return [
            'owner',
            'allMembers',
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

        if ($request->user()->role === 'admin') {
            return true;
        }

        return TeamMember::where('team_id', $team->id)
            ->where('user_id', $userId)
            ->where('status', 'accepted')
            ->whereIn('role', ['owner', 'admin'])
            ->exists();
    }

    private function parseIdentifier(string $identifier): ?array
    {
        if (!str_contains($identifier, '#')) {
            return null;
        }

        [$name, $tag] = explode('#', $identifier, 2);
        $tag = str_pad($tag, 3, '0', STR_PAD_LEFT);

        return ['name' => trim($name), 'tag' => $tag];
    }

    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $teams = Team::with($this->teamRelationsWithPending())
            ->withCount(['members as members_count' => function ($query) {
                $query->where('status', 'accepted');
            }])
            ->orderByDesc('created_at')
            ->get();

        // Add user's membership status for each team
        $teams->each(function ($team) use ($userId) {
            $membership = TeamMember::where('team_id', $team->id)
                ->where('user_id', $userId)
                ->first();

            $team->user_membership = $membership ? [
                'status' => $membership->status,
                'role' => $membership->role,
            ] : null;
        });

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
            $request->user()->id => ['role' => 'owner', 'status' => 'accepted'],
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
            $validated['user_id'] => ['role' => $role, 'status' => 'accepted'],
        ]);

        return response()->json([
            'team' => $team->load($this->teamRelationsWithPending()),
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
            'team' => $team->load($this->teamRelationsWithPending()),
        ]);
    }

    public function invite(Request $request, Team $team): JsonResponse
    {
        if (! $this->canManageTeam($request, $team)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'identifier' => ['required', 'string'],
        ]);

        $parsed = $this->parseIdentifier($validated['identifier']);

        if (! $parsed) {
            throw ValidationException::withMessages([
                'identifier' => ['Format invalide. Utilisez le format Nom#XXX'],
            ]);
        }

        $targetUser = User::where('name', 'like', '%' . $parsed['name'] . '%')
            ->where('tag', $parsed['tag'])
            ->first();

        if (! $targetUser) {
            throw ValidationException::withMessages([
                'identifier' => ['Utilisateur non trouvé'],
            ]);
        }

        $existingMembership = TeamMember::where('team_id', $team->id)
            ->where('user_id', $targetUser->id)
            ->first();

        if ($existingMembership) {
            if ($existingMembership->status === 'accepted') {
                throw ValidationException::withMessages([
                    'identifier' => ['Cet utilisateur est déjà membre de l\'équipe'],
                ]);
            }

            if ($existingMembership->status === 'pending_invite') {
                throw ValidationException::withMessages([
                    'identifier' => ['Une invitation est déjà en attente pour cet utilisateur'],
                ]);
            }

            if ($existingMembership->status === 'pending_request') {
                throw ValidationException::withMessages([
                    'identifier' => ['Cet utilisateur a déjà une demande en attente'],
                ]);
            }

            // If rejected, update to pending_invite instead of creating new record
            if ($existingMembership->status === 'rejected') {
                $existingMembership->update(['status' => 'pending_invite']);

                Notification::create([
                    'user_id' => $targetUser->id,
                    'type' => 'team_invite',
                    'title' => 'Invitation à rejoindre une équipe',
                    'message' => "Vous avez été invité à rejoindre l'équipe {$team->name}",
                    'data' => json_encode(['team_id' => $team->id, 'team_name' => $team->name]),
                ]);

                return response()->json([
                    'team' => $team->load($this->teamRelations()),
                ]);
            }
        }

        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $targetUser->id,
            'role' => 'member',
            'status' => 'pending_invite',
        ]);

        Notification::create([
            'user_id' => $targetUser->id,
            'type' => 'team_invite',
            'title' => 'Invitation à rejoindre une équipe',
            'message' => "Vous avez été invité à rejoindre l'équipe {$team->name}",
            'data' => json_encode(['team_id' => $team->id, 'team_name' => $team->name]),
        ]);

        return response()->json([
            'team' => $team->load($this->teamRelationsWithPending()),
        ]);
    }

    public function requestToJoin(Request $request, Team $team): JsonResponse
    {
        $userId = $request->user()->id;

        $existingMembership = TeamMember::where('team_id', $team->id)
            ->where('user_id', $userId)
            ->first();

        if ($existingMembership) {
            if ($existingMembership->status === 'accepted') {
                return response()->json(['message' => 'Vous êtes déjà membre de cette équipe'], 422);
            }

            if ($existingMembership->status === 'pending_request') {
                return response()->json(['message' => 'Vous avez déjà une demande en attente'], 422);
            }

            if ($existingMembership->status === 'pending_invite') {
                return response()->json(['message' => 'Vous avez déjà une invitation en attente'], 422);
            }
        }

        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $userId,
            'role' => 'member',
            'status' => 'pending_request',
        ]);

        // Notify team admins and owner
        $admins = TeamMember::where('team_id', $team->id)
            ->where('status', 'accepted')
            ->where('role', 'admin')
            ->with('user')
            ->get();

        // Add owner to notification list
        $owner = User::find($team->owner_id);

        $notifyUserIds = $admins->pluck('user_id')->toArray();
        if ($owner) {
            $notifyUserIds[] = $owner->id;
        }

        foreach ($notifyUserIds as $userId) {
            Notification::create([
                'user_id' => $userId,
                'type' => 'team_request',
                'title' => 'Demande pour rejoindre une équipe',
                'message' => "{$request->user()->name} souhaite rejoindre l'équipe {$team->name}",
                'data' => json_encode(['team_id' => $team->id, 'team_name' => $team->name, 'user_id' => $request->user()->id]),
            ]);
        }

        return response()->json([
            'team' => $team->load($this->teamRelationsWithPending()),
        ]);
    }

    public function acceptMembership(Request $request, Team $team, int $userId): JsonResponse
    {
        if (! $this->canManageTeam($request, $team)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $member = TeamMember::where('team_id', $team->id)
            ->where('user_id', $userId)
            ->first();

        if (! $member) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if (! in_array($member->status, ['pending_invite', 'pending_request'])) {
            return response()->json(['message' => 'Invalid status'], 422);
        }

        $member->update(['status' => 'accepted']);

        Notification::create([
            'user_id' => $userId,
            'type' => 'team_accepted',
            'title' => 'Demande acceptée',
            'message' => $member->status === 'pending_invite'
                ? "Votre invitation à rejoindre l'équipe {$team->name} a été acceptée"
                : "Votre demande pour rejoindre l'équipe {$team->name} a été acceptée",
            'data' => json_encode(['team_id' => $team->id, 'team_name' => $team->name]),
        ]);

        return response()->json([
            'team' => $team->load($this->teamRelationsWithPending()),
        ]);
    }

    public function rejectMembership(Request $request, Team $team, int $userId): JsonResponse
    {
        if (! $this->canManageTeam($request, $team)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $member = TeamMember::where('team_id', $team->id)
            ->where('user_id', $userId)
            ->first();

        if (! $member) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if (! in_array($member->status, ['pending_invite', 'pending_request'])) {
            return response()->json(['message' => 'Invalid status'], 422);
        }

        $member->update(['status' => 'rejected']);

        Notification::create([
            'user_id' => $userId,
            'type' => 'team_rejected',
            'title' => 'Demande refusée',
            'message' => $member->status === 'pending_invite'
                ? "Votre invitation à rejoindre l'équipe {$team->name} a été refusée"
                : "Votre demande pour rejoindre l'équipe {$team->name} a été refusée",
            'data' => json_encode(['team_id' => $team->id, 'team_name' => $team->name]),
        ]);

        return response()->json([
            'team' => $team->load($this->teamRelationsWithPending()),
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

        Notification::create([
            'user_id' => $userId,
            'type' => 'team_removed',
            'title' => 'Retiré de l\'équipe',
            'message' => "Vous avez été retiré de l'équipe {$team->name}",
            'data' => json_encode(['team_id' => $team->id, 'team_name' => $team->name]),
        ]);

        return response()->json([
            'team' => $team->load($this->teamRelationsWithPending()),
        ]);
    }

    public function destroy(Request $request, Team $team): JsonResponse
    {
        if ($team->owner_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $memberCount = TeamMember::where('team_id', $team->id)
            ->where('status', 'accepted')
            ->count();

        if ($memberCount > 1) {
            return response()->json(['message' => 'L\'équipe doit avoir un seul membre pour être supprimée'], 422);
        }

        $team->delete();

        return response()->json([
            'message' => 'Équipe supprimée',
        ]);
    }
}

