---
name: AI cost policy
description: Provider choice for the coding assistant when cost avoidance matters.
---

Use Groq for the coding assistant so it does not rely on the paid OpenAI integration.

**Why:** The user said they do not want to spend money and added a Groq API key for the coding assistant.

**How to apply:** Keep the editor's create, fix, explain, and improve requests on Groq. Do not silently fall back to the paid OpenAI provider if Groq is unavailable or rate-limited.
