# Product Principles

1. **Professional outside, low-friction inside**  
   The tool must feel structurally serious and professionally credible, while requiring near-zero configuration to generate the first useful trace.

2. **Show behavior before explaining theory**  
   Prioritize rendering concrete tool calls, actual code changes, and explicit failure points over visualizing abstract LLM reasoning or prompt structures.

3. **Summarize first, drill down second**  
   Default to high-level timeline views and failure states. Allow users to inspect raw JSON payloads and deep trace details only when they choose to dig deeper.

4. **Trust by default**  
   Local-first execution, minimal environment permissions, and strict data boundaries are mandatory. Traces never leave the machine unless explicitly exported by the user.

5. **Narrow scope beats overloaded scope**  
   We must solve the core debugging correlation problem perfectly before expanding into adjacent categories like cost analytics or generalized APM.
