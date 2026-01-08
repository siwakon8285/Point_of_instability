export interface Mission {
    id: number;
    name: string;
    description: string | null;
    status: string;
    chief_id: number;
    crew_count: number;
    created_at: string;
    updated_at: string;
}

export interface Brawler {
    display_name: string;
    avatar_url: string;
    mission_success_count: number;
    mission_joined_count: number;
}
