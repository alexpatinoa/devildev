export enum TerminatingTools {
    INTERVIEW_USER = "interview_user",
    GENERAL_RESPONSE = "general_response"
}

export const TERMINATING_TOOLS = new Set(["interview_user", "general_response"]);

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