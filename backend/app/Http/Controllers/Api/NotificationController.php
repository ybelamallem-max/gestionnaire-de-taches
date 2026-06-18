<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    private function notificationRelations(): array
    {
        return [
            'project',
            'task',
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::with($this->notificationRelations())
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'notifications' => $notifications,
        ]);
    }

    public function read(Request $request, Notification $notification): JsonResponse
    {
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (! $notification->read_at) {
            $notification->read_at = now();
            $notification->save();
        }

        return response()->json([
            'notification' => $notification->load($this->notificationRelations()),
        ]);
    }
}

