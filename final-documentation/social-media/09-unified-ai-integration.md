# Unified AI Integration

## Social Content Studio AI Facade
The SocialAIAssistant acts strictly as a thin facade over the core AITools. It does NOT have its own prompt framework or orchestrator. Its boundary is limited to returning string suggestions prefixed with [SUGGESTED CONTENT]. AI cannot approve, schedule, or publish posts directly.