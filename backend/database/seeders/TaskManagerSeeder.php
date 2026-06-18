<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Notification;
use App\Models\Project;
use App\Models\Tag;
use App\Models\Task;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Database\Seeder;

class TaskManagerSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@taskmanager.com'],
            [
                'name' => 'Admin',
                'password' => 'password',
                'role' => 'admin',
                'gender' => 'male',
            ]
        );

        $alice = User::firstOrCreate(
            ['email' => 'alice@taskmanager.com'],
            [
                'name' => 'Alice Martin',
                'password' => 'password',
                'role' => 'user',
                'gender' => 'female',
            ]
        );

        $bob = User::firstOrCreate(
            ['email' => 'bob@taskmanager.com'],
            [
                'name' => 'Bob Dupont',
                'password' => 'password',
                'role' => 'user',
                'gender' => 'male',
            ]
        );

        $sara = User::firstOrCreate(
            ['email' => 'sara@taskmanager.com'],
            [
                'name' => 'Sara Benali',
                'password' => 'password',
                'role' => 'user',
                'gender' => 'female',
            ]
        );

        $teamProduit = Team::firstOrCreate(
            ['name' => 'Équipe Produit', 'owner_id' => $alice->id],
            ['description' => 'Équipe principale']
        );

        $teamOps = Team::firstOrCreate(
            ['name' => 'Équipe Ops', 'owner_id' => $admin->id],
            ['description' => 'Support / Ops']
        );

        $this->upsertTeamMember($teamProduit, $alice, 'owner');
        $this->upsertTeamMember($teamProduit, $bob, 'admin');
        $this->upsertTeamMember($teamProduit, $sara, 'member');

        $this->upsertTeamMember($teamOps, $admin, 'owner');
        $this->upsertTeamMember($teamOps, $alice, 'member');

        $projectGeneral = Project::firstOrCreate(
            ['team_id' => $teamProduit->id, 'name' => 'Général'],
            [
                'owner_id' => $alice->id,
                'description' => 'Projet par défaut',
                'status' => 'active',
            ]
        );

        $projectRefonte = Project::firstOrCreate(
            ['team_id' => $teamProduit->id, 'name' => 'Refonte UI'],
            [
                'owner_id' => $alice->id,
                'description' => 'Modernisation de l’interface',
                'status' => 'active',
                'due_date' => now()->addDays(30)->toDateString(),
            ]
        );

        $projectOps = Project::firstOrCreate(
            ['team_id' => $teamOps->id, 'name' => 'Ops'],
            [
                'owner_id' => $admin->id,
                'description' => 'Maintenance et support',
                'status' => 'active',
            ]
        );

        $taskSetup = Task::firstOrCreate(
            [
                'project_id' => $projectGeneral->id,
                'created_by' => $alice->id,
                'title' => 'Configurer le projet',
            ],
            [
                'description' => 'Installer les dépendances et vérifier la configuration.',
                'priority' => 'high',
                'status' => 'todo',
                'assigned_to' => $bob->id,
                'due_date' => now()->addDays(7),
            ]
        );

        $taskNotifs = Task::firstOrCreate(
            [
                'project_id' => $projectGeneral->id,
                'created_by' => $alice->id,
                'title' => 'Notifications: lecture',
            ],
            [
                'description' => 'Ajouter la page notifications + marquer comme lue.',
                'priority' => 'medium',
                'status' => 'in_progress',
                'assigned_to' => $sara->id,
                'due_date' => now()->addDays(3),
            ]
        );

        $taskDemo = Task::firstOrCreate(
            [
                'project_id' => $projectRefonte->id,
                'created_by' => $alice->id,
                'title' => 'Préparer la démo',
            ],
            [
                'description' => 'Préparer un scénario complet.',
                'priority' => 'medium',
                'status' => 'done',
                'assigned_to' => $alice->id,
                'due_date' => now()->subDays(1),
                'completed_at' => now()->subHours(2),
            ]
        );

        $taskBackup = Task::firstOrCreate(
            [
                'project_id' => $projectOps->id,
                'created_by' => $admin->id,
                'title' => 'Backup base de données',
            ],
            [
                'description' => 'Mettre en place une stratégie de backup.',
                'priority' => 'high',
                'status' => 'todo',
                'assigned_to' => $admin->id,
                'due_date' => now()->addDays(14),
            ]
        );

        $this->upsertTag($taskSetup, 'backend', '#22c55e');
        $this->upsertTag($taskSetup, 'setup', '#3b82f6');
        $this->upsertTag($taskNotifs, 'frontend', '#a855f7');
        $this->upsertTag($taskNotifs, 'api', '#f97316');
        $this->upsertTag($taskDemo, 'ux', '#06b6d4');

        $this->upsertComment($taskSetup, $alice, 'Peux-tu prendre cette tâche aujourd’hui ?');
        $this->upsertComment($taskSetup, $bob, 'OK, je m’en occupe.');
        $this->upsertComment($taskNotifs, $sara, 'Je commence par l’UI puis je branche l’API.');

        $this->upsertNotification(
            $bob,
            $projectGeneral,
            $taskSetup,
            'task_assigned',
            'Nouvelle assignation',
            'Une tâche vous a été assignée.'
        );

        $this->upsertNotification(
            $sara,
            $projectGeneral,
            $taskNotifs,
            'task_assigned',
            'Nouvelle assignation',
            'Une tâche vous a été assignée.'
        );

        $this->upsertNotification(
            $alice,
            $projectRefonte,
            $taskDemo,
            'task_completed',
            'Tâche terminée',
            'La tâche “Préparer la démo” est terminée.'
        );

        $this->upsertNotification(
            $admin,
            $projectOps,
            $taskBackup,
            'reminder',
            'Rappel',
            'Pensez à planifier le backup.'
        );
    }

    private function upsertTeamMember(Team $team, User $user, string $role): void
    {
        TeamMember::firstOrCreate(
            ['team_id' => $team->id, 'user_id' => $user->id],
            ['role' => $role]
        );
    }

    private function upsertTag(Task $task, string $name, ?string $color): void
    {
        Tag::firstOrCreate(
            ['task_id' => $task->id, 'name' => $name],
            ['color' => $color]
        );
    }

    private function upsertComment(Task $task, User $user, string $content): void
    {
        Comment::firstOrCreate(
            ['task_id' => $task->id, 'user_id' => $user->id, 'content' => $content]
        );
    }

    private function upsertNotification(
        User $user,
        ?Project $project,
        ?Task $task,
        string $type,
        string $title,
        string $message
    ): void {
        Notification::firstOrCreate(
            [
                'user_id' => $user->id,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'project_id' => $project?->id,
                'task_id' => $task?->id,
            ],
            ['data' => []]
        );
    }
}

