<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileAvatarTest extends TestCase
{
    use RefreshDatabase;

    public function test_avatar_upload_returns_a_frontend_ready_avatar_url(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->post('/api/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('avatar.jpg'),
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Avatar mis à jour avec succès.');

        $avatar = $response->json('user.avatar');
        $avatarUrl = $response->json('avatar_url');

        $this->assertIsString($avatar);
        $this->assertSame($avatar, $avatarUrl);
        $this->assertStringContainsString('/storage/avatars/', $avatar);

        Storage::disk('public')->assertExists($user->fresh()->getAvatarPath());
    }

    public function test_me_returns_the_updated_avatar_immediately_after_upload(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->post('/api/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('avatar.png'),
        ])->assertOk();

        $response = $this->getJson('/api/me?t=' . now()->timestamp);

        $avatar = $response->json('user.avatar');

        $response->assertOk();
        $this->assertIsString($avatar);
        $this->assertStringContainsString('/storage/avatars/', $avatar);
        $this->assertSame($avatar, $response->json('user.avatar_url'));
    }

    public function test_avatar_upload_returns_a_clear_validation_message_for_oversized_files(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->post('/api/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('avatar.jpg')->size(3000),
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonPath('message', "L'image ne doit pas dépasser 2 Mo.")
            ->assertJsonValidationErrors(['avatar']);
    }
}
