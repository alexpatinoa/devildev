# Changelog

## v0.5.1
### Added
- Structured architecture update flow with a user-facing update action
- Tool-driven agent flow for architecture modification
- Token-usage based credit accounting for architecture-related AI operations

### Improved
- Architecture modification dialog and decision logic for clearer tool selection
- More concise and deterministic agent responses
- Chat interface now includes per-message inline options for quicker actions
- Responses include termination metadata
- Support for partial-result recovery when errors occur

## v0.5.0
### Added
- Tool-driven chat agent with structured interview flow and clearer multi-stage responses
- Interactive interview UI to collect and refine user requirements
- Stack options system: generate, browse, and select multiple architecture/technology proposals
- Rich chat UI components including improved messages, input controls, progress indicators, and copyable prompts
- Component detail modal within architecture views for deeper inspection

### Improved
- Overall architecture exploration workflow
- Clarity and usability of AI-driven requirement gathering
- User experience across chat and architecture interaction flows

## v0.4.0
### Added
- Introduced a new credit-based system called Souls
- Each user is allocated Souls which are consumed based on AI usage

### Improved
- More predictable and fair AI usage across users
- Better resource allocation for sustained performance and scalability


## v0.3.1
### Added
- Now Pacts can be created via ChatBot
- Pacts can be used to directly create an issue on github

## v0.3.0
### Added
- Pacts for tracking bugs, tasks, and features within projects
- Manual pact creation and management

## v0.2.0
### Added
- Automatic architecture regeneration on GitHub push events via webhooks

### Improved
- Prompt quality for more accurate and consistent architecture analysis
- Architecture generation logic and component relationships
- Structured output format for better reliability and downstream usage

## v0.1.0
- Initial open-source release
- Spec-driven architecture generation
- GitHub integration
- Inngest background processing