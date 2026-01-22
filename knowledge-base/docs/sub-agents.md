---
source: https://docs.anthropic.com/en/docs/claude-code/sub-agents
fetched: 2026-01-18T13:48:57.421Z
hash: 78e466b5455f7b17712cf10d7d38b713
---

Subagents are specialized AI assistants that handle specific types of tasks. Each subagent runs in its own context window with a custom system prompt, specific tool access, and independent permissions. When Claude encounters a task that matches a subagent’s description, it delegates to that subagent, which works independently and returns results. Subagents help you:

*   **Preserve context** by keeping exploration and implementation out of your main conversation
*   **Enforce constraints** by limiting which tools a subagent can use
*   **Reuse configurations** across projects with user-level subagents
*   **Specialize behavior** with focused system prompts for specific domains
*   **Control costs** by routing tasks to faster, cheaper models like Haiku

Claude uses each subagent’s description to decide when to delegate tasks. When you create a subagent, write a clear description so Claude knows when to use it. Claude Code includes several built-in subagents like **Explore**, **Plan**, and **general-purpose**. You can also create custom subagents to handle specific tasks. This page covers the [built-in subagents](#built-in-subagents), [how to create your own](#quickstart-create-your-first-subagent), [full configuration options](#configure-subagents), [patterns for working with subagents](#work-with-subagents), and [example subagents](#example-subagents).

## 

[​

](#built-in-subagents)