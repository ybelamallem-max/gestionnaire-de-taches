<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\Team;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $tasksQuery = Task::query()->where(function ($q) use ($userId) {
            $q->where('created_by', $userId)->orWhere('assigned_to', $userId);
        });

        $tasksTotal = (clone $tasksQuery)->count();
        $tasksDone = (clone $tasksQuery)->where('status', 'done')->count();
        $tasksInProgress = (clone $tasksQuery)->where('status', 'in_progress')->count();

        $teamsTotal = Team::query()
            ->where('owner_id', $userId)
            ->orWhereHas('members', fn ($q) => $q->where('users.id', $userId))
            ->count();

        return response()->json([
            'tasks_total' => $tasksTotal,
            'tasks_done' => $tasksDone,
            'tasks_in_progress' => $tasksInProgress,
            'teams_total' => $teamsTotal,
        ]);
    }
}

