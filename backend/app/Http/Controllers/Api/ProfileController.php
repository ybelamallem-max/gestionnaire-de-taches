<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->load(['teams', 'ownedTeams']);

        return response()->json([
            'user' => $user->toApiUser(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $request->user()->id],
            'current_password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        return response()->json([
            'user' => $user->fresh()->toApiUser(),
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'Mot de passe mis à jour avec succès.',
        ]);
    }

    public function updateAvatar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ], [
            'avatar.required' => 'Veuillez sélectionner une image à envoyer.',
            'avatar.image' => 'Le fichier sélectionné doit être une image valide.',
            'avatar.mimes' => 'Formats acceptés : JPG, PNG ou WebP.',
            'avatar.max' => "L'image ne doit pas dépasser 2 Mo.",
        ]);

        $user = $request->user();
        $previousAvatarPath = $user->getAvatarPath();

        if ($previousAvatarPath) {
            Storage::disk('public')->delete($previousAvatarPath);
        }

        $path = $validated['avatar']->store('avatars', 'public');

        $user->update([
            'avatar' => $path,
        ]);

        $freshUser = $user->fresh();
        $avatarUrl = $freshUser->getAvatarUrl();

        return response()->json([
            'message' => 'Avatar mis à jour avec succès.',
            'user' => $freshUser->toApiUser(),
            'avatar' => $avatarUrl,
            'avatar_url' => $avatarUrl,
        ]);
    }
}
