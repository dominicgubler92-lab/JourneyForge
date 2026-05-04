# Agent Instructions

This file gives coding agents shared guidance for working on JourneyForge.

## Project Intent

JourneyForge is a practical travel planning app. The product should help users organize trips, compare options, and turn loose planning material into a clear itinerary.

## Development Principles

- Keep changes small, understandable, and aligned with the existing structure.
- Prefer clear domain names such as `trip`, `itinerary`, `destination`, `booking`, `budget`, and `traveler`.
- Do not add new frameworks or heavy dependencies without a clear reason.
- Avoid speculative features unless they support the current milestone.
- Keep user-facing text concise and useful.

## Frontend Expectations

- Build the actual planning experience first, not a marketing landing page.
- Use layouts that support scanning and editing travel details.
- Prefer practical controls, clear navigation, and responsive views.
- Avoid decorative UI that makes planning information harder to read.

## Repository Hygiene

- Update `README.md` when setup, scripts, or project direction changes.
- Add tests when behavior becomes non-trivial or shared across modules.
- Keep generated files, local secrets, build output, and dependency folders out of Git.
- Never commit API keys, tokens, credentials, personal travel documents, or booking confirmations.

## Open Decisions

- Tech stack
- Data model
- Authentication needs
- Whether the first version is local-only, single-user, or collaborative

