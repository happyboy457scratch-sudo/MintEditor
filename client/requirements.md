## Packages
@monaco-editor/react | Code editor component (VS Code internals)
xterm | Terminal emulator for the browser
xterm-addon-fit | Resizes xterm to fit its container
uuid | For generating temporary non-authenticated session IDs
framer-motion | For premium UI animations and transitions
date-fns | Date formatting for project history

## Notes
Backend expects `x-session-id` header for anonymous users to track usage and project ownership.
Monaco editor loads web workers automatically.
Xterm requires its CSS to be imported.
Using dark theme by default across the entire app for a premium developer feel.
