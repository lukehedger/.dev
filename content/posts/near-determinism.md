---
title: "Near-determinism"
description: "LLMs might never be deterministic but we can get close"
publishDate: 2026-11-25
tags: ["ai", "software-engineering"]
---

When you set an agent off to work on your codebase do you know what to expect?

With a sound enough mental model, you are able to look at a piece of work - a ticket, a prompt, a message - and visualise the implementation. Perhaps not the exact lines you’d write but the edges of it - enough to get you started with something to aim and the details will fall into place around the outline as you work.

Now, will your agent’s output match this picture?

If yes, stop reading - you’ve hit near-determinism: there is one clear way to implement a change to the codebase.

If not, you’ve got some work to do.

For an agent to work safely and autonomously, it needs useful constraints and effective methods to verify its own work. Without these things, an agent must get creative and fill in the gaps - this is where the non-determinism can begin to take over. You’re going to get _slop_.

Slop is a result of the agent being creative without constraints.

Creativity is good for ideation and early design work - the times when you are not clear on the path forward and want to throw concepts around for inspiration and direction.

However, for pure implementation work, you want to strictly limit an agent’s creativity. You do this by removing all ambiguity from your request. The layers of clarity are:

- ARCHITECTURE.md
- DOMAIN.md
- Source code
- Task description (in a ticket or prompt)

That’s all you need. Don’t over-complicate the agent’s context. Let it derive code quality and good patterns from the source code - quality compounds. Keep AGENTS.md short and focused on the above layers.

The final fail-safe is to prompt the agent to check for ambiguity and gaps in the task description and acceptance criteria, answer the questions as far as it can with its context and surface to the operator as a last resort.
