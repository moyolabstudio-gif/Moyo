package com.springboot.project.service;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Project-wide persistence/permission policy shared by create/settings/list/main flows.
 * UI may change, but values persisted in PROJECTS should stay stable.
 */
public final class ProjectPolicy {

    public static final String SCOPE_PERSONAL = "PERSONAL";
    public static final String SCOPE_GROUP = "GROUP";

    public static final String ACCESS_OWNER_ONLY = "OWNER_ONLY";
    public static final String ACCESS_PARTICIPANTS = "PARTICIPANTS";
    public static final String ACCESS_WORKSPACE_READ = "WORKSPACE_READ";

    public static final int PROJECT_NAME_MAX_LENGTH = 80;
    public static final int PROJECT_ICON_MAX_LENGTH = 40;

    /** Canonical type codes. Keep for existing service callers. */
    public static final Set<String> TYPES = ProjectTypeCatalog.types().stream()
            .map(ProjectTypeCatalog.TypeDefinition::code)
            .collect(Collectors.toUnmodifiableSet());

    /** Canonical default icon per type. Keep for existing migration/service callers. */
    public static final Map<String, String> DEFAULT_ICONS;

    static {
        Map<String, String> defaults = new LinkedHashMap<>();
        for (ProjectTypeCatalog.TypeDefinition type : ProjectTypeCatalog.types()) {
            defaults.put(type.code(), type.defaultIcon());
        }
        DEFAULT_ICONS = Map.copyOf(defaults);
    }

    private ProjectPolicy() {}

    public static String normalizeType(String value) {
        return ProjectTypeCatalog.normalizeType(value);
    }

    /**
     * Accept an icon chosen by the user without coupling the persisted value to CSS classes.
     * Unknown-but-safe legacy keys are preserved for backward compatibility. New create/settings
     * UIs should only submit keys exposed by {@link ProjectTypeCatalog#icons()}.
     */
    public static String normalizeIcon(String value, String type) {
        String normalized = value == null ? null : value.trim().toLowerCase(Locale.ROOT);
        if (normalized != null && normalized.length() > PROJECT_ICON_MAX_LENGTH) {
            normalized = normalized.substring(0, PROJECT_ICON_MAX_LENGTH);
        }
        if (normalized != null && !normalized.matches("[a-z0-9-]+")) {
            normalized = null;
        }
        return normalized == null || normalized.isBlank()
                ? ProjectTypeCatalog.defaultIconOf(type)
                : normalized;
    }

    public static String normalizeAccessScope(String value, String projectScope) {
        if (SCOPE_PERSONAL.equalsIgnoreCase(projectScope)) return ACCESS_OWNER_ONLY;
        String normalized = normalizeCode(value);
        if (ACCESS_WORKSPACE_READ.equals(normalized)) return ACCESS_WORKSPACE_READ;
        return ACCESS_PARTICIPANTS;
    }

    private static String normalizeCode(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim().toUpperCase(Locale.ROOT);
    }
}
