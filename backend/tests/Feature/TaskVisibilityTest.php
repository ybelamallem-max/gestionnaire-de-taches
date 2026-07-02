<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TaskVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_tasks_index_excludes_tasks_from_completed_and_archived_projects_by_default(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $activeTask = $this->createTaskForProjectStatus($user, 'active', 'Tache active');
        $this->createTaskForProjectStatus($user, 'completed', 'Tache terminee');
        $this->createTaskForProjectStatus($user, 'archived', 'Tache archivee');

        $response = $this->getJson('/api/tasks');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'tasks')
            ->assertJsonPath('tasks.0.id', $activeTask->id);
    }

    public function test_tasks_index_can_include_completed_and_archived_project_tasks_explicitly(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $activeTask = $this->createTaskForProjectStatus($user, 'active', 'Tache active');
        $completedTask = $this->createTaskForProjectStatus($user, 'completed', 'Tache terminee');
        $archivedTask = $this->createTaskForProjectStatus($user, 'archived', 'Tache archivee');

        $response = $this->getJson('/api/tasks?include_archived=true');

        $response
            ->assertOk()
            ->assertJsonCount(3, 'tasks');

        $taskIds = collect($response->json('tasks'))->pluck('id')->all();

        $this->assertEqualsCanonicalizing(
            [$activeTask->id, $completedTask->id, $archivedTask->id],
            $taskIds
        );
    }

    public function test_stats_exclude_tasks_from_completed_and_archived_projects(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);
        User::factory()->create();
        Sanctum::actingAs($admin);

        $this->createTaskForProjectStatus($admin, 'active', 'Todo active', 'todo');
        $this->createTaskForProjectStatus($admin, 'active', 'Done active', 'done', [
            'completed_at' => Carbon::now()->startOfWeek()->addDay(),
        ]);
        $this->createTaskForProjectStatus($admin, 'active', 'Overdue active', 'in_progress', [
            'due_date' => Carbon::today()->subDay(),
        ]);
        $this->createTaskForProjectStatus($admin, 'completed', 'Done completed', 'done');
        $this->createTaskForProjectStatus($admin, 'archived', 'In progress archived', 'in_progress');

        $response = $this->getJson('/api/stats');

        $response
            ->assertOk()
            ->assertJsonPath('scope', 'global')
            ->assertJsonPath('tasks_total', 3)
            ->assertJsonPath('tasks_todo', 1)
            ->assertJsonPath('tasks_done', 1)
            ->assertJsonPath('tasks_in_progress', 1)
            ->assertJsonPath('tasks_overdue', 1)
            ->assertJsonPath('tasks_done_this_week', 1)
            ->assertJsonPath('completion_rate', 33)
            ->assertJsonPath('weekly_completion_rate', 33)
            ->assertJsonPath('active_tasks_total', 2)
            ->assertJsonPath('users_total', 2)
            ->assertJsonPath('workload_average_active_tasks', 1);
    }

    public function test_personal_stats_include_real_workload_and_overdue_metrics(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        Sanctum::actingAs($user);

        $this->createTaskForProjectStatus($user, 'active', 'Assignee todo', 'todo', [
            'assigned_to' => $user->id,
        ]);
        $this->createTaskForProjectStatus($user, 'active', 'Assignee overdue', 'in_progress', [
            'assigned_to' => $user->id,
            'due_date' => Carbon::today()->subDays(2),
        ]);
        $this->createTaskForProjectStatus($user, 'active', 'Assignee done', 'done', [
            'assigned_to' => $user->id,
            'completed_at' => Carbon::now()->startOfWeek()->addHours(2),
        ]);
        $this->createTaskForProjectStatus($user, 'active', 'Created for other user', 'todo', [
            'assigned_to' => $otherUser->id,
        ]);
        $this->createTaskForProjectStatus($user, 'archived', 'Archived personal', 'todo', [
            'assigned_to' => $user->id,
            'due_date' => Carbon::today()->subDay(),
        ]);

        $response = $this->getJson('/api/stats');

        $response
            ->assertOk()
            ->assertJsonPath('scope', 'personal')
            ->assertJsonPath('tasks_total', 4)
            ->assertJsonPath('tasks_todo', 2)
            ->assertJsonPath('tasks_done', 1)
            ->assertJsonPath('tasks_in_progress', 1)
            ->assertJsonPath('tasks_overdue', 1)
            ->assertJsonPath('tasks_done_this_week', 1)
            ->assertJsonPath('assigned_tasks_total', 3)
            ->assertJsonPath('active_assigned_tasks', 2)
            ->assertJsonPath('workload_percent', 67);
    }

    private function createTaskForProjectStatus(
        User $user,
        string $projectStatus,
        string $title,
        string $taskStatus = 'todo',
        array $taskOverrides = []
    ): Task {
        $project = Project::create([
            'team_id' => null,
            'owner_id' => $user->id,
            'name' => "Projet {$projectStatus} {$title}",
            'status' => $projectStatus,
        ]);

        return Task::create(array_merge([
            'project_id' => $project->id,
            'created_by' => $user->id,
            'assigned_to' => $user->id,
            'title' => $title,
            'status' => $taskStatus,
            'priority' => 'medium',
        ], $taskOverrides));
    }
}
