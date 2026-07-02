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
use Illuminate\Support\Carbon;

class TaskManagerSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $users = [];
        foreach ($this->userDefinitions() as $definition) {
            $users[$definition['key']] = User::create([
                'name' => $definition['name'],
                'email' => $definition['email'],
                'password' => 'password',
                'role' => $definition['role'],
                'gender' => $definition['gender'],
                'phone' => $definition['phone'],
            ]);
        }

        $teams = [];
        foreach ($this->teamDefinitions($users) as $definition) {
            $teams[$definition['key']] = Team::create([
                'name' => $definition['name'],
                'description' => $definition['description'],
                'owner_id' => $definition['owner']->id,
            ]);

            $this->upsertTeamMember($teams[$definition['key']], $definition['owner'], 'owner');

            foreach ($definition['members'] as $member) {
                $this->upsertTeamMember(
                    $teams[$definition['key']],
                    $member['user'],
                    $member['role'],
                    $member['status'] ?? 'accepted'
                );
            }
        }

        $projects = [];
        foreach ($this->projectDefinitions($users, $teams, $now) as $definition) {
            $projects[$definition['key']] = Project::create([
                'team_id' => $definition['team']?->id,
                'owner_id' => $definition['owner']->id,
                'name' => $definition['name'],
                'description' => $definition['description'],
                'status' => $definition['status'],
                'start_date' => $definition['start_date'],
                'due_date' => $definition['due_date'],
            ]);
        }

        $taskBlueprints = $this->taskBlueprints();
        $tagPalette = $this->tagPalette();
        $commentTemplates = $this->commentTemplates();
        $notificationTypes = $this->notificationTemplates();

        $allTasks = [];
        $taskIndex = 0;

        foreach ($projects as $projectKey => $project) {
            $contributors = $this->projectContributors($projectKey, $projects, $users, $teams);
            $projectTasks = [];

            foreach ($taskBlueprints as $blueprintIndex => $blueprint) {
                $assignedUser = $contributors[$blueprintIndex % count($contributors)];
                $creator = $contributors[($blueprintIndex + 1) % count($contributors)];
                $status = $this->resolveTaskStatus($project->status, $blueprintIndex);
                $priority = $this->resolveTaskPriority($taskIndex);
                $dueDate = $this->resolveTaskDueDate($project->status, $status, $taskIndex, $now);
                $completedAt = $status === 'done'
                    ? $now->copy()->subDays(($taskIndex % 12) + 1)->setTime(9 + ($taskIndex % 6), 15)
                    : null;

                $task = Task::create([
                    'project_id' => $project->id,
                    'created_by' => $creator->id,
                    'assigned_to' => $assignedUser->id,
                    'title' => sprintf('%s - %s', $blueprint['title'], $project->name),
                    'description' => $blueprint['description'],
                    'status' => $status,
                    'priority' => $priority,
                    'due_date' => $dueDate,
                    'completed_at' => $completedAt,
                    'created_at' => $now->copy()->subDays(45 - ($taskIndex % 28))->setTime(8 + ($taskIndex % 8), 0),
                    'updated_at' => $status === 'done'
                        ? ($completedAt ?? $now)
                        : $now->copy()->subDays($taskIndex % 10)->setTime(10 + ($taskIndex % 7), 30),
                ]);

                foreach ($this->taskTagsForIndex($taskIndex, $tagPalette) as $tag) {
                    $this->upsertTag($task, $tag['name'], $tag['color']);
                }

                foreach ($this->taskCommentsForIndex($taskIndex, $contributors, $commentTemplates) as $comment) {
                    $this->upsertComment($task, $comment['user'], $comment['content'], $comment['created_at']);
                }

                $projectTasks[] = $task;
                $allTasks[] = $task;
                $taskIndex++;
            }

            if ($project->status === 'completed' && $projectTasks !== []) {
                $project->forceFill([
                    'updated_at' => collect($projectTasks)
                        ->filter(fn (Task $task) => $task->completed_at !== null)
                        ->map(fn (Task $task) => $task->completed_at)
                        ->max() ?? $project->updated_at,
                ])->save();
            }
        }

        foreach ($this->notificationsForTasks($allTasks, $projects, $users, $notificationTypes, $now) as $notification) {
            $this->upsertNotification(
                $notification['user'],
                $notification['project'],
                $notification['task'],
                $notification['type'],
                $notification['title'],
                $notification['message'],
                $notification['data'] ?? [],
                $notification['read_at'] ?? null,
                $notification['created_at'] ?? null
            );
        }
    }

    private function userDefinitions(): array
    {
        return [
            ['key' => 'admin', 'name' => 'Admin Plateforme', 'email' => 'admin@taskmanager.com', 'role' => 'admin', 'gender' => 'male', 'phone' => '0600000001'],
            ['key' => 'responsable', 'name' => 'Marie Responsable', 'email' => 'responsable@taskmanager.com', 'role' => 'responsable', 'gender' => 'female', 'phone' => '0600000002'],
            ['key' => 'alice', 'name' => 'Alice Martin', 'email' => 'alice@taskmanager.com', 'role' => 'user', 'gender' => 'female', 'phone' => '0600000003'],
            ['key' => 'bob', 'name' => 'Bob Dupont', 'email' => 'bob@taskmanager.com', 'role' => 'user', 'gender' => 'male', 'phone' => '0600000004'],
            ['key' => 'sara', 'name' => 'Sara Benali', 'email' => 'sara@taskmanager.com', 'role' => 'user', 'gender' => 'female', 'phone' => '0600000005'],
            ['key' => 'leo', 'name' => 'Léo Garnier', 'email' => 'leo@taskmanager.com', 'role' => 'user', 'gender' => 'male', 'phone' => '0600000006'],
            ['key' => 'nina', 'name' => 'Nina Petit', 'email' => 'nina@taskmanager.com', 'role' => 'user', 'gender' => 'female', 'phone' => '0600000007'],
            ['key' => 'yanis', 'name' => 'Yanis Moreau', 'email' => 'yanis@taskmanager.com', 'role' => 'user', 'gender' => 'male', 'phone' => '0600000008'],
            ['key' => 'ines', 'name' => 'Inès Robert', 'email' => 'ines@taskmanager.com', 'role' => 'user', 'gender' => 'female', 'phone' => '0600000009'],
            ['key' => 'theo', 'name' => 'Théo Laurent', 'email' => 'theo@taskmanager.com', 'role' => 'user', 'gender' => 'male', 'phone' => '0600000010'],
            ['key' => 'jade', 'name' => 'Jade Mercier', 'email' => 'jade@taskmanager.com', 'role' => 'user', 'gender' => 'female', 'phone' => '0600000011'],
            ['key' => 'mehdi', 'name' => 'Mehdi Faure', 'email' => 'mehdi@taskmanager.com', 'role' => 'user', 'gender' => 'male', 'phone' => '0600000012'],
            ['key' => 'claire', 'name' => 'Claire Noël', 'email' => 'claire@taskmanager.com', 'role' => 'user', 'gender' => 'female', 'phone' => '0600000013'],
            ['key' => 'hugo', 'name' => 'Hugo Renaud', 'email' => 'hugo@taskmanager.com', 'role' => 'user', 'gender' => 'male', 'phone' => '0600000014'],
            ['key' => 'emma', 'name' => 'Emma Colin', 'email' => 'emma@taskmanager.com', 'role' => 'user', 'gender' => 'female', 'phone' => '0600000015'],
            ['key' => 'paul', 'name' => 'Paul Masson', 'email' => 'paul@taskmanager.com', 'role' => 'user', 'gender' => 'male', 'phone' => '0600000016'],
            ['key' => 'lina', 'name' => 'Lina Besson', 'email' => 'lina@taskmanager.com', 'role' => 'user', 'gender' => 'female', 'phone' => '0600000017'],
            ['key' => 'noah', 'name' => 'Noah Gauthier', 'email' => 'noah@taskmanager.com', 'role' => 'user', 'gender' => 'male', 'phone' => '0600000018'],
        ];
    }

    private function teamDefinitions(array $users): array
    {
        return [
            [
                'key' => 'produit',
                'name' => 'Équipe Produit',
                'description' => 'Pilotage roadmap, design produit et arbitrages métier.',
                'owner' => $users['alice'],
                'members' => [
                    ['user' => $users['bob'], 'role' => 'admin'],
                    ['user' => $users['sara'], 'role' => 'member'],
                    ['user' => $users['jade'], 'role' => 'member'],
                    ['user' => $users['responsable'], 'role' => 'member'],
                ],
            ],
            [
                'key' => 'engineering',
                'name' => 'Engineering Core',
                'description' => 'Frontend, backend, perf et qualité.',
                'owner' => $users['bob'],
                'members' => [
                    ['user' => $users['leo'], 'role' => 'admin'],
                    ['user' => $users['nina'], 'role' => 'member'],
                    ['user' => $users['yanis'], 'role' => 'member'],
                    ['user' => $users['ines'], 'role' => 'member'],
                    ['user' => $users['hugo'], 'role' => 'member'],
                ],
            ],
            [
                'key' => 'ops',
                'name' => 'Ops & Support',
                'description' => 'Run, support client, monitoring et sécurité.',
                'owner' => $users['admin'],
                'members' => [
                    ['user' => $users['theo'], 'role' => 'admin'],
                    ['user' => $users['mehdi'], 'role' => 'member'],
                    ['user' => $users['paul'], 'role' => 'member'],
                    ['user' => $users['emma'], 'role' => 'member'],
                ],
            ],
            [
                'key' => 'marketing',
                'name' => 'Marketing & Growth',
                'description' => 'Lancement, acquisition et contenu.',
                'owner' => $users['claire'],
                'members' => [
                    ['user' => $users['lina'], 'role' => 'admin'],
                    ['user' => $users['sara'], 'role' => 'member'],
                    ['user' => $users['noah'], 'role' => 'member'],
                    ['user' => $users['jade'], 'role' => 'member', 'status' => 'pending_invite'],
                ],
            ],
            [
                'key' => 'data',
                'name' => 'Data & Insights',
                'description' => 'Tracking, reporting et qualité des données.',
                'owner' => $users['nina'],
                'members' => [
                    ['user' => $users['mehdi'], 'role' => 'admin'],
                    ['user' => $users['emma'], 'role' => 'member'],
                    ['user' => $users['responsable'], 'role' => 'member'],
                    ['user' => $users['paul'], 'role' => 'member', 'status' => 'pending_request'],
                ],
            ],
        ];
    }

    private function projectDefinitions(array $users, array $teams, Carbon $now): array
    {
        return [
            [
                'key' => 'prod_roadmap_q3',
                'team' => $teams['produit'],
                'owner' => $users['alice'],
                'name' => 'Roadmap Q3',
                'description' => 'Planification des livrables majeurs du trimestre.',
                'status' => 'active',
                'start_date' => $now->copy()->subDays(20)->toDateString(),
                'due_date' => $now->copy()->addDays(40)->toDateString(),
            ],
            [
                'key' => 'prod_refonte_mobile',
                'team' => $teams['produit'],
                'owner' => $users['alice'],
                'name' => 'Refonte Mobile',
                'description' => 'Optimisation de l’expérience mobile-first.',
                'status' => 'active',
                'start_date' => $now->copy()->subDays(35)->toDateString(),
                'due_date' => $now->copy()->addDays(18)->toDateString(),
            ],
            [
                'key' => 'prod_ux_audit',
                'team' => $teams['produit'],
                'owner' => $users['jade'],
                'name' => 'Audit UX',
                'description' => 'Audit complet des parcours critiques.',
                'status' => 'completed',
                'start_date' => $now->copy()->subDays(90)->toDateString(),
                'due_date' => $now->copy()->subDays(10)->toDateString(),
            ],
            [
                'key' => 'eng_api_v2',
                'team' => $teams['engineering'],
                'owner' => $users['bob'],
                'name' => 'API v2',
                'description' => 'Stabilisation des endpoints et versionnement API.',
                'status' => 'active',
                'start_date' => $now->copy()->subDays(25)->toDateString(),
                'due_date' => $now->copy()->addDays(25)->toDateString(),
            ],
            [
                'key' => 'eng_quality_gateway',
                'team' => $teams['engineering'],
                'owner' => $users['leo'],
                'name' => 'Quality Gateway',
                'description' => 'Tests, lint et contrôles de qualité avant livraison.',
                'status' => 'active',
                'start_date' => $now->copy()->subDays(18)->toDateString(),
                'due_date' => $now->copy()->addDays(12)->toDateString(),
            ],
            [
                'key' => 'eng_legacy_cleanup',
                'team' => $teams['engineering'],
                'owner' => $users['nina'],
                'name' => 'Legacy Cleanup',
                'description' => 'Nettoyage de modules historiques et dette technique.',
                'status' => 'archived',
                'start_date' => $now->copy()->subDays(140)->toDateString(),
                'due_date' => $now->copy()->subDays(70)->toDateString(),
            ],
            [
                'key' => 'ops_incident_readiness',
                'team' => $teams['ops'],
                'owner' => $users['admin'],
                'name' => 'Incident Readiness',
                'description' => 'Runbooks, astreintes et alerting de production.',
                'status' => 'active',
                'start_date' => $now->copy()->subDays(10)->toDateString(),
                'due_date' => $now->copy()->addDays(20)->toDateString(),
            ],
            [
                'key' => 'ops_security_hardening',
                'team' => $teams['ops'],
                'owner' => $users['theo'],
                'name' => 'Security Hardening',
                'description' => 'Durcissement de la plateforme et hygiène sécurité.',
                'status' => 'active',
                'start_date' => $now->copy()->subDays(22)->toDateString(),
                'due_date' => $now->copy()->addDays(35)->toDateString(),
            ],
            [
                'key' => 'ops_backup_program',
                'team' => $teams['ops'],
                'owner' => $users['admin'],
                'name' => 'Programme Backup 2026',
                'description' => 'Politique de sauvegarde, tests de restauration et PRA.',
                'status' => 'completed',
                'start_date' => $now->copy()->subDays(70)->toDateString(),
                'due_date' => $now->copy()->subDays(6)->toDateString(),
            ],
            [
                'key' => 'mkt_launch_fall',
                'team' => $teams['marketing'],
                'owner' => $users['claire'],
                'name' => 'Campagne Fall Launch',
                'description' => 'Plan média et assets de lancement.',
                'status' => 'active',
                'start_date' => $now->copy()->subDays(12)->toDateString(),
                'due_date' => $now->copy()->addDays(28)->toDateString(),
            ],
            [
                'key' => 'mkt_content_engine',
                'team' => $teams['marketing'],
                'owner' => $users['lina'],
                'name' => 'Content Engine',
                'description' => 'Industrialisation de la production de contenu.',
                'status' => 'active',
                'start_date' => $now->copy()->subDays(16)->toDateString(),
                'due_date' => $now->copy()->addDays(16)->toDateString(),
            ],
            [
                'key' => 'data_dashboard',
                'team' => $teams['data'],
                'owner' => $users['nina'],
                'name' => 'BI Dashboard',
                'description' => 'Refonte du tableau de bord décisionnel.',
                'status' => 'active',
                'start_date' => $now->copy()->subDays(15)->toDateString(),
                'due_date' => $now->copy()->addDays(21)->toDateString(),
            ],
            [
                'key' => 'data_tracking',
                'team' => $teams['data'],
                'owner' => $users['mehdi'],
                'name' => 'Tracking Unifié',
                'description' => 'Normalisation du plan de marquage.',
                'status' => 'completed',
                'start_date' => $now->copy()->subDays(85)->toDateString(),
                'due_date' => $now->copy()->subDays(8)->toDateString(),
            ],
            [
                'key' => 'personal_alice',
                'team' => null,
                'owner' => $users['alice'],
                'name' => 'Organisation personnelle Alice',
                'description' => 'Tâches personnelles de suivi, cadrage et préparation.',
                'status' => 'active',
                'start_date' => $now->copy()->subDays(9)->toDateString(),
                'due_date' => $now->copy()->addDays(14)->toDateString(),
            ],
            [
                'key' => 'personal_bob',
                'team' => null,
                'owner' => $users['bob'],
                'name' => 'Veille technique Bob',
                'description' => 'Améliorations perso, lectures et expérimentations.',
                'status' => 'active',
                'start_date' => $now->copy()->subDays(14)->toDateString(),
                'due_date' => $now->copy()->addDays(10)->toDateString(),
            ],
            [
                'key' => 'personal_sara_archive',
                'team' => null,
                'owner' => $users['sara'],
                'name' => 'Portfolio Design 2025',
                'description' => 'Ancien chantier personnel archivé.',
                'status' => 'archived',
                'start_date' => $now->copy()->subDays(180)->toDateString(),
                'due_date' => $now->copy()->subDays(120)->toDateString(),
            ],
        ];
    }

    private function taskBlueprints(): array
    {
        return [
            ['title' => 'Cadrer le besoin', 'description' => 'Clarifier le périmètre, les objectifs et les parties prenantes.'],
            ['title' => 'Rédiger les specs', 'description' => 'Formaliser la solution cible et les critères d’acceptation.'],
            ['title' => 'Préparer les maquettes', 'description' => 'Produire des écrans, variantes et annotations utiles à l’implémentation.'],
            ['title' => 'Implémenter la fonctionnalité', 'description' => 'Développer la première version exploitable du lot prévu.'],
            ['title' => 'Couvrir par des tests', 'description' => 'Ajouter des tests ciblés sur les comportements critiques et les régressions attendues.'],
            ['title' => 'Brancher les notifications', 'description' => 'Prévoir les retours utilisateur et les notifications associées au flux.'],
            ['title' => 'Contrôler la performance', 'description' => 'Vérifier les temps de réponse, le volume des données et l’expérience perçue.'],
            ['title' => 'Préparer la recette', 'description' => 'Construire le plan de test manuel et la checklist de validation.'],
        ];
    }

    private function tagPalette(): array
    {
        return [
            ['name' => 'frontend', 'color' => '#8b5cf6'],
            ['name' => 'backend', 'color' => '#22c55e'],
            ['name' => 'api', 'color' => '#f97316'],
            ['name' => 'urgent', 'color' => '#ef4444'],
            ['name' => 'ux', 'color' => '#06b6d4'],
            ['name' => 'data', 'color' => '#0ea5e9'],
            ['name' => 'ops', 'color' => '#64748b'],
            ['name' => 'qa', 'color' => '#14b8a6'],
            ['name' => 'research', 'color' => '#ec4899'],
            ['name' => 'product', 'color' => '#eab308'],
        ];
    }

    private function commentTemplates(): array
    {
        return [
            'Le besoin est validé côté métier, vous pouvez avancer sur la prochaine étape.',
            'Attention au cas limite sur les permissions et à la cohérence mobile.',
            'Je propose un point rapide demain matin pour vérifier les hypothèses restantes.',
            'La base est bonne, mais il faut encore nettoyer deux incohérences dans les données.',
            'Pensez à documenter la logique avant de basculer en recette.',
            'Le design est validé sous réserve du contraste sur mobile.',
            'On garde la logique existante, l’objectif est surtout de solidifier le flux.',
            'Les retours utilisateurs sont positifs, mais il manque encore la partie monitoring.',
        ];
    }

    private function notificationTemplates(): array
    {
        return [
            'task_assigned' => ['title' => 'Nouvelle assignation', 'message' => 'Une nouvelle tâche vous a été assignée.'],
            'task_completed' => ['title' => 'Tâche terminée', 'message' => 'Une tâche liée à votre périmètre a été terminée.'],
            'project_completed' => ['title' => 'Projet terminé', 'message' => 'Le projet a été clôturé après validation de toutes les étapes.'],
            'reminder' => ['title' => 'Rappel', 'message' => 'Une échéance importante approche sur votre périmètre.'],
            'mention' => ['title' => 'Mention reçue', 'message' => 'Vous avez été mentionné dans un commentaire de tâche.'],
        ];
    }

    private function projectContributors(string $projectKey, array $projects, array $users, array $teams): array
    {
        $project = $projects[$projectKey];

        if ($project->team_id === null) {
            $owner = $users[array_search($project->owner_id, array_column(array_map(fn ($user) => ['id' => $user->id], $users), 'id'), true) ?: 'alice'] ?? null;
            $owner = $owner instanceof User ? $owner : $users['alice'];

            return [$owner, $users['responsable'], $users['admin']];
        }

        $team = collect($teams)->firstWhere('id', $project->team_id);
        if (! $team instanceof Team) {
            return [$users['admin'], $users['responsable']];
        }

        $members = TeamMember::query()
            ->where('team_id', $team->id)
            ->where('status', 'accepted')
            ->with('user')
            ->get()
            ->pluck('user')
            ->filter()
            ->values()
            ->all();

        return $members !== [] ? $members : [$users['admin']];
    }

    private function resolveTaskStatus(string $projectStatus, int $index): string
    {
        if ($projectStatus === 'completed') {
            return 'done';
        }

        if ($projectStatus === 'archived') {
            return $index % 3 === 0 ? 'done' : ($index % 2 === 0 ? 'in_progress' : 'todo');
        }

        return match ($index % 6) {
            0, 1 => 'todo',
            2, 3 => 'in_progress',
            default => 'done',
        };
    }

    private function resolveTaskPriority(int $index): string
    {
        return match ($index % 8) {
            0 => 'urgent',
            1, 2 => 'high',
            3, 4, 5 => 'medium',
            default => 'low',
        };
    }

    private function resolveTaskDueDate(string $projectStatus, string $status, int $index, Carbon $now): ?Carbon
    {
        if ($projectStatus === 'archived') {
            return $now->copy()->subDays(45 - ($index % 20))->setTime(18, 0);
        }

        if ($projectStatus === 'completed') {
            return $now->copy()->subDays(20 - ($index % 8))->setTime(17, 0);
        }

        if ($status === 'done') {
            return $now->copy()->subDays(($index % 5) + 1)->setTime(16, 0);
        }

        if ($status === 'in_progress' && $index % 4 === 0) {
            return $now->copy()->subDays(($index % 3) + 1)->setTime(18, 0);
        }

        return $now->copy()->addDays(($index % 12) + 2)->setTime(18, 0);
    }

    private function taskTagsForIndex(int $index, array $tagPalette): array
    {
        $first = $tagPalette[$index % count($tagPalette)];
        $second = $tagPalette[($index + 3) % count($tagPalette)];

        if ($first['name'] === $second['name']) {
            return [$first];
        }

        return [$first, $second];
    }

    private function taskCommentsForIndex(int $index, array $contributors, array $templates): array
    {
        $count = match ($index % 5) {
            0 => 3,
            1, 2 => 2,
            default => 1,
        };

        $comments = [];
        for ($i = 0; $i < $count; $i++) {
            $comments[] = [
                'user' => $contributors[($index + $i) % count($contributors)],
                'content' => $templates[($index + $i) % count($templates)],
                'created_at' => Carbon::now()->subDays(($index % 12) + $i)->setTime(9 + $i, 20),
            ];
        }

        return $comments;
    }

    private function notificationsForTasks(array $tasks, array $projects, array $users, array $notificationTypes, Carbon $now): array
    {
        $notifications = [];

        foreach ($tasks as $index => $task) {
            $project = collect($projects)->firstWhere('id', $task->project_id);
            if (! $project instanceof Project) {
                continue;
            }

            $recipient = User::find($task->assigned_to ?: $project->owner_id);
            if (! $recipient instanceof User) {
                continue;
            }

            $typeKey = match (true) {
                $task->status === 'done' => 'task_completed',
                $task->due_date && Carbon::parse($task->due_date)->lt($now) => 'reminder',
                $index % 7 === 0 => 'mention',
                default => 'task_assigned',
            };

            $template = $notificationTypes[$typeKey];
            $notifications[] = [
                'user' => $recipient,
                'project' => $project,
                'task' => $task,
                'type' => $typeKey,
                'title' => $template['title'],
                'message' => sprintf('%s (%s)', $template['message'], $task->title),
                'data' => [
                    'task_id' => $task->id,
                    'project_id' => $project->id,
                    'task_title' => $task->title,
                ],
                'read_at' => $index % 3 === 0 ? $now->copy()->subDays($index % 6) : null,
                'created_at' => $now->copy()->subDays($index % 14)->setTime(11 + ($index % 6), 10),
            ];
        }

        $notifications[] = [
            'user' => $users['admin'],
            'project' => null,
            'task' => null,
            'type' => 'reminder',
            'title' => 'Pilotage hebdomadaire',
            'message' => 'Pensez à consulter les indicateurs globaux avant le comité de pilotage.',
            'data' => ['scope' => 'global'],
            'created_at' => $now->copy()->subDay()->setTime(8, 45),
        ];

        $notifications[] = [
            'user' => $users['responsable'],
            'project' => null,
            'task' => null,
            'type' => 'mention',
            'title' => 'Synthèse partagée',
            'message' => 'Une synthèse transversale vous attend sur la roadmap et la charge des équipes.',
            'data' => ['scope' => 'executive'],
            'created_at' => $now->copy()->subHours(6),
        ];

        return $notifications;
    }

    private function upsertTeamMember(Team $team, User $user, string $role, string $status = 'accepted'): void
    {
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $user->id,
            'role' => $role,
            'status' => $status,
        ]);
    }

    private function upsertTag(Task $task, string $name, ?string $color): void
    {
        Tag::create([
            'task_id' => $task->id,
            'name' => $name,
            'color' => $color,
        ]);
    }

    private function upsertComment(Task $task, User $user, string $content, ?Carbon $createdAt = null): void
    {
        Comment::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'content' => $content,
            'created_at' => $createdAt,
            'updated_at' => $createdAt ?? now(),
        ]);
    }

    private function upsertNotification(
        User $user,
        ?Project $project,
        ?Task $task,
        string $type,
        string $title,
        string $message,
        array $data = [],
        ?Carbon $readAt = null,
        ?Carbon $createdAt = null
    ): void {
        Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'project_id' => $project?->id,
            'task_id' => $task?->id,
            'data' => $data,
            'read_at' => $readAt,
            'created_at' => $createdAt,
            'updated_at' => $createdAt ?? now(),
        ]);
    }
}
