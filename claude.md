CODE QUALITY AND SECURITY

Apply the following standards:

TypeScript

Avoid any.

Prefer explicit and reusable types.

Avoid unnecessary type assertions.

Handle nullable values correctly.

Maintain strict type safety.

React and Next.js

Avoid unnecessary re-renders.

Avoid unnecessary client-side state.

Keep components focused.

Handle loading and error states properly.

Follow the existing project's conventions.

Security

Never expose secrets or sensitive information.

Never trust client-side validation alone.

Respect server-side authorization.

Avoid insecure token storage.

Handle authentication errors safely.

Validate all untrusted input.

Avoid leaking sensitive information through logs or error messages.

Maintainability

Use descriptive naming.

Keep functions focused.

Avoid giant components.

Avoid duplicated business logic.

Avoid unnecessary comments.

Keep the code easy for another developer to understand.

STRICT RULES

Do not modify protected existing infrastructure without authorization.

Do not change existing database schemas or backend configurations that are explicitly provided as fixed components.

Do not replace real backend integration with mock data.

Do not hardcode dynamic server data.

Do not install unnecessary dependencies.

Do not ignore errors.

Do not remove existing tests to hide failures.

Do not introduce unrelated features.

Do not make unnecessary architectural changes.

Do not claim tests passed without executing them.

Do not leave required functionality unfinished.

Do not commit or push changes without my explicit authorization.

If an existing implementation conflicts with the requirements, explain the issue and propose the safest solution before changing protected components.

FINAL QUALITY GATE

Before considering the work complete:

Verify every requirement against the attached PDF.

Verify all relevant user workflows.

Run all automated tests.

Run TypeScript checks.

Run ESLint.

Run the production build.

Review security and error handling.

Check for regressions.

Verify responsive behavior.

Review the final implementation for unnecessary complexity.

Provide an honest final report with:

Implemented functionality.

Architecture and important technical decisions.

Files created and modified.

Tests implemented and execution results.

TypeScript, lint, and build results.

Remaining limitations or known issues.

Instructions for running the project.

WORKING MODE

Start in PLANNING MODE.

First, investigate the repository and read the attached PDF.

Then present a detailed, realistic implementation plan.

Do not modify files, install dependencies, or start implementation during the initial planning phase.

Wait for my explicit approval before writing code.

Once approved, execute the plan incrementally, following strict TDD.

Your objective is to deliver professional-quality software, not merely code that works on the happy path.