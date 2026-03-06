export enum TerminatingTools {
    INTERVIEW_USER = "interview_user",
    GENERAL_RESPONSE = "general_response",
    TIER_1 = "tier_1",
    TIER_2 = "tier_2",
    UPDATE_ARCHITECTURE = "update_architecture",
}

export const TERMINATING_TOOLS = new Set(["interview_user", "general_response", "tier_1", "tier_2", "update_architecture"]);

/** Parsed output from general_response tool */
export interface GeneralResponsePayload {
    response: string;
}

/** Single question in interview_user tool output */
export interface InterviewQuestion {
    title: string;
    description: string;
    options: string[];
    multiselect: boolean;
}

/** Parsed output from interview_user tool */
export interface InterviewPayload {
    questions: InterviewQuestion[];
}

/** One answered question from the user (saved in message JSON) */
export interface InterviewAnswer {
    questionIndex: number;
    selected: string[];
}

/** Parsed output from tier_1 tool */
export interface Tier1Payload {
    response: string;
    prompt: string;
}

/** Parsed output from tier_2 tool */
export interface Tier2Payload {
    response: string;
    context: string;
}

/** Parsed output from update_architecture tool */
export interface UpdateArchitecturePayload {
    response: string;
    changeRequirement: string;
}