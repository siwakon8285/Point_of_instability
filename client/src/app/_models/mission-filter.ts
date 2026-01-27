export interface MissionFilter {
    name?: string;
    status?: MissionStatus;
    exclude_owned_by?: number;
    exclude_joined_by?: number;
    owned_by?: number;
    joined_by?: number;
}

export type MissionStatus = 'Open' | 'InProgress' | 'Completed' | 'Failed';
