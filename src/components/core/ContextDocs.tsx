"use client"

import * as React from "react"

const MOCK_PRD = `# prd.md

## Product Overview
DevilDev is an AI-assisted development workspace that helps users explore architecture options and build software faster.

## Problem Statement
Developers lose time switching between planning, architecture discussion, and execution tools. Context is fragmented and hard to maintain.

## Goals
- Centralize planning and architecture context in one workflow.
- Reduce time from idea to implementation-ready output.
- Keep collaboration clear across chat, architecture, and docs.

## Target Users
- Solo developers building MVPs.
- Small product teams iterating quickly.
- Technical founders validating product ideas.

## Core Features
1. Conversational planning and iteration.
2. Architecture visualization and versioning.
3. Stack option comparison.
4. Context docs panel with project guidance.

## Success Metrics
- 30% reduction in planning-to-build cycle time.
- 50% of active users revisit generated architecture versions.
- Positive user feedback on clarity of workflow.

## Milestones
1. Core chat + architecture flow.
2. Stack options and selection.
3. Docs panel and context improvements.
4. Usability polish and analytics.

## Out of Scope
- Full project management suite.
- Source control hosting.
- Real-time multi-user editing in this phase.
`

export default function ContextDocs() {
  return (
    <div className="h-full bg-black text-white flex flex-col border border-gray-800 rounded-lg overflow-hidden">
      <div className="h-11 px-4 border-b border-gray-800 flex items-center">
        <p className="text-sm text-gray-300">
          Docs <span className="text-gray-500">/</span> <span className="text-white">prd.md</span>
        </p>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="whitespace-pre-wrap text-sm leading-6 text-gray-100">{MOCK_PRD}</pre>
      </div>
    </div>
  )
}
