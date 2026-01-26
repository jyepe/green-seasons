## 2024-05-22 - Login Screen Refactor Constraint Conflict
**Learning:** Attempted to introduce inline validation errors (UX improvement) while refactoring `LoginScreen` to `useReducer`. This was flagged as a "behavior change" and rejected during code review because the original code used `Alert.alert`.
**Action:** When refactoring for "code quality" under strict "no behavior change" constraints, avoid UX improvements (like inline errors) even if they seem obvious or "better", unless explicitly requested. Stick to pure implementation refactors (state management only).
