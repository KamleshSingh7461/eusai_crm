// Role Hierarchy and Permissions Utility

export enum UserRole {
    DIRECTOR = 'DIRECTOR',
    MANAGER = 'MANAGER',
    TEAM_LEADER = 'TEAM_LEADER',
    EMPLOYEE = 'EMPLOYEE',
    INTERN = 'INTERN'
}

// Role hierarchy levels (higher number = more authority)
export const ROLE_LEVELS: Record<UserRole, number> = {
    [UserRole.DIRECTOR]: 5,
    [UserRole.MANAGER]: 4,
    [UserRole.TEAM_LEADER]: 3,
    [UserRole.EMPLOYEE]: 2,
    [UserRole.INTERN]: 1
};

// Check if a user has permission based on role hierarchy
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
    return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
}

// Check if user can manage another user
export function canManage(managerRole: UserRole, subordinateRole: UserRole): boolean {
    return ROLE_LEVELS[managerRole] > ROLE_LEVELS[subordinateRole];
}

// Get roles that a user can assign (one level below them)
export function getAssignableRoles(userRole: UserRole): UserRole[] {
    const userLevel = ROLE_LEVELS[userRole];
    return Object.entries(ROLE_LEVELS)
        .filter(([_, level]) => level < userLevel)
        .map(([role]) => role as UserRole);
}

// Permission checks for specific actions
export const Permissions = {
    // Milestone permissions
    canCreateMilestones: (role: UserRole) => hasPermission(role, UserRole.TEAM_LEADER),
    canAssignMilestones: (role: UserRole) => hasPermission(role, UserRole.MANAGER),
    canViewAllMilestones: (role: UserRole) => hasPermission(role, UserRole.MANAGER),
    canEditAnyMilestone: (role: UserRole) => hasPermission(role, UserRole.MANAGER),

    // Report permissions
    canViewAllReports: (role: UserRole) => hasPermission(role, UserRole.MANAGER),
    canViewDirectReports: (role: UserRole) => hasPermission(role, UserRole.TEAM_LEADER),
    canExportReports: (role: UserRole) => hasPermission(role, UserRole.MANAGER),

    // User management
    canManageUsers: (role: UserRole) => hasPermission(role, UserRole.MANAGER),
    canViewOrgChart: (role: UserRole) => hasPermission(role, UserRole.TEAM_LEADER),

    // Project permissions
    canCreateProjects: (role: UserRole) => hasPermission(role, UserRole.MANAGER),
    canAssignTasks: (role: UserRole) => hasPermission(role, UserRole.TEAM_LEADER),

    // Analytics
    canViewAnalytics: (role: UserRole) => hasPermission(role, UserRole.MANAGER),
    canViewDirectorDashboard: (role: UserRole) => hasPermission(role, UserRole.DIRECTOR),
};

// Get role display name
export function getRoleDisplayName(role: UserRole): string {
    const names: Record<UserRole, string> = {
        [UserRole.DIRECTOR]: 'Director',
        [UserRole.MANAGER]: 'Manager',
        [UserRole.TEAM_LEADER]: 'Team Leader',
        [UserRole.EMPLOYEE]: 'Employee',
        [UserRole.INTERN]: 'Intern'
    };
    return names[role];
}

// Get role color for UI
export function getRoleColor(role: UserRole): string {
    const colors: Record<UserRole, string> = {
        [UserRole.DIRECTOR]: '#6554C0', // Purple
        [UserRole.MANAGER]: '#0052CC', // Blue
        [UserRole.TEAM_LEADER]: '#00875A', // Green
        [UserRole.EMPLOYEE]: '#172B4D', // Dark blue
        [UserRole.INTERN]: '#6B778C' // Gray
    };
    return colors[role];
}
