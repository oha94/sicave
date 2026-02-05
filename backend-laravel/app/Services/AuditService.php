<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class AuditService
{
    /**
     * Log an action to the audit table.
     *
     * @param string $action
     * @param string|null $entityType
     * @param int|null $entityId
     * @param array|null $oldValues
     * @param array|null $newValues
     * @param string|null $description
     * @param array|null $metadata
     * @return AuditLog
     */
    public static function log(
        string $action,
        ?string $entityType = null,
        ?int $entityId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $description = null,
        ?array $metadata = null
    ) {
        return AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'description' => $description,
            'metadata' => $metadata
        ]);
    }
}
