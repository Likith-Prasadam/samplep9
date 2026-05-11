# Connected Intelligence

## Purpose

Connected Intelligence is the surveillance analysis workspace for asking natural-language questions over camera and batch-video evidence. The frontend currently presents it as a three-pane workflow: saved conversations on the left, the chat experience in the center, and evidence or scope filters on the right.

The main product goal is to let the system connect detections of the same person across multiple cameras, build a time-ordered trail of those sightings, and have the LLM explain what happened from that fused timeline.

## What the frontend currently implements

### Page structure

The page is composed in [src/features/connected-intelligence/index.tsx](src/features/connected-intelligence/index.tsx).

- Left pane: saved conversation threads and a New chat action.
- Center pane: the active conversation, model picker, suggested prompts, copy actions, and clear-chat flow.
- Right pane: scope filters for cameras and batches.

### Conversation management

The current hook is [src/features/connected-intelligence/hooks/use-connected-intelligence.ts](src/features/connected-intelligence/hooks/use-connected-intelligence.ts).

It handles:

- loading chat models from the org model query
- keeping only chat models selectable in the chat UI
- persisting the active conversation thread in Redux and local storage
- creating a new thread when the user sends the first message
- listing saved threads
- loading thread history when a thread is selected
- clearing history for the active thread
- sending chat messages through the backend stream API
- keeping the thread list current without reloading it after every completion

### Chat rendering

The shared assistant renderer is in [src/features/chat/components/assistant-thought-process.tsx](src/features/chat/components/assistant-thought-process.tsx).

The message wrapper is in [src/features/chat/components/message-bubble.tsx](src/features/chat/components/message-bubble.tsx).

This UI currently supports:

- a structured thought-process timeline for tool activity
- final answer rendering as markdown
- copy-to-clipboard for both user and assistant messages
- a single shared renderer pattern across chat surfaces

### Filters and scope

The main filter sidebar is in [src/features/connected-intelligence/components/connected-intelligence-sidebar.tsx](src/features/connected-intelligence/components/connected-intelligence-sidebar.tsx).

The conversation sidebar is in [src/features/connected-intelligence/components/connected-intelligence-conversation-sidebar.tsx](src/features/connected-intelligence/components/connected-intelligence-conversation-sidebar.tsx).

The current filter surface supports:

- zones
- primary city
- cities
- camera types
- resolutions
- camera tags
- zipcodes
- analysis timeframe

The analysis timeframe is currently a preset dropdown with a custom option that allows any value from 1 to 1440 minutes.

### Evidence and clips

The frontend already exposes batch clips as evidence cards through [src/features/connected-intelligence/components/connected-intelligence-clip-card.tsx](src/features/connected-intelligence/components/connected-intelligence-clip-card.tsx).

The hook also derives scope clips from batch video data and exposes camera counts from the cameras query.

### Transport and history

The backend chat stream is handled in [src/features/chat/chat-agent.ts](src/features/chat/chat-agent.ts).

The thread and history API helpers are in [src/features/chat/thread-api.ts](src/features/chat/thread-api.ts).

The current frontend expects the backend to support:

- streamed run lifecycle events
- tool-call start and end events
- text deltas for the final answer
- thread listing
- thread history retrieval
- thread deletion

## Current user-facing capabilities

The feature currently lets a user:

- choose an active conversation thread
- start a new investigation thread
- ask questions against the selected scope
- restrict the analysis by camera and batch filters
- set a timeframe window for the analysis
- see a thought-process section for tool usage and result handling
- copy the user prompt or the assistant response
- inspect batch clips as contextual evidence
- restore the active conversation after refresh through persisted chat-panel state

Suggested prompts already indicate the intended use cases:

- traffic congestion analysis
- security alert review
- pedestrian activity summary

## What use cases this feature is solving

### 1. Cross-camera event reconstruction

This is the core requirement. If the same person is seen on multiple cameras, the system should connect those sightings into one sequence and produce a timeline.

### 2. Natural-language investigation

Operators should be able to ask questions like:

- where did the person appear first
- which cameras captured the person next
- how long did the person stay in each area
- what evidence supports the conclusion

### 3. Time-windowed review

The analysis timeframe lets the operator bound the investigation to a short operational window instead of searching the full archive.

### 4. Scope reduction through filters

The filters are meant to reduce noise before the LLM reasons over the data:

- geographic scope through zones, city, and zipcodes
- camera class through types and resolutions
- semantic narrowing through tags
- batch clip context when live cameras are not available

### 5. Conversation-based investigation

The thread model supports iterative forensic work where a user refines the same question across several turns rather than starting over.

## Frontend data flow today

1. The page reads the cohort from the URL and loads the connected intelligence composer.
2. The hook queries org models, live camera filter values, batch filter values, cameras, and batch videos.
3. The sidebar shows the current scope and the conversation sidebar shows saved threads.
4. The user writes a prompt and the frontend builds a hybrid chat payload.
5. The payload includes the thread hash, selected model, inference modality, live window minutes, and a reduced filter map.
6. The backend stream sends run, tool, and text events.
7. The frontend turns those events into a visible assistant answer plus a thought-process timeline.
8. On completion, the thread list is updated locally so the sidebar does not repopulate from scratch.

## What the backend must provide for the main requirement

The real product requirement is not just chat. It is identity continuity across cameras.

For the frontend to show a trustworthy person-across-cameras timeline, the backend needs a normalized event model with at least these concepts:

- person or track identity
- camera identity
- timestamp or event time
- detection confidence
- evidence reference
- frame or clip reference
- attribute metadata such as hat, clothing, bag, or other distinguishing cues
- correlation or match confidence between sightings
- event ordering across cameras

The frontend can display the result, but it cannot invent this correlation on its own.

## Backend gap analysis checklist

### Identity and correlation

- Does the backend maintain a stable person or track identifier across multiple cameras?
- Is there a re-identification or correlation score between sightings?
- Can the system explain why two sightings were connected?
- Is there a way to distinguish the same person from different people wearing similar clothing?

### Timeline construction

- Does the backend return an ordered sighting timeline?
- Are events normalized into one schema for live and historical views?
- Can the backend emit explicit event types such as detection, movement, match, and conclusion?
- Are tool events separate from final narrative text, or are they serialized into a single answer string?

### Evidence and provenance

- Does each timeline step point to a camera, frame, or clip?
- Can the frontend open the evidence directly from the event?
- Is the evidence timestamp aligned to the camera clock and the global investigation clock?
- Is there confidence metadata for every inference the LLM makes?

### Query and retrieval

- Can the backend retrieve detections across multiple cameras for a single person or attribute profile?
- Can it search by time range, camera, location, and appearance attributes together?
- Can it rank likely matches instead of only returning raw detections?

### LLM reasoning contract

- Does the backend pass structured evidence into the LLM, or only a free-text summary?
- Can the LLM cite which events support each conclusion?
- Can it separate observations from assumptions?
- Can it distinguish confirmed sightings from probable matches?

### Thread and history contract

- Does history return the same event structure as live streaming?
- Do thread summaries include the metadata needed for the sidebar and conversation title?
- Can a thread be resumed without losing the investigative state?

## Frontend gaps that still matter

These are frontend-side gaps you should verify with backend while doing the deeper analysis:

- cameraHashes still exists in the filter state, but it is not part of the chat filter payload today.
- The current chat payload is scope-based, not identity-based.
- The UI can render a timeline, but it depends on the backend sending tool-style markup or equivalent normalized content.
- The frontend currently uses batch clips as context, but it does not build the cross-camera identity chain itself.
- There is no explicit evidence graph in the UI yet, only chat, clips, and thread history.

## What can be improved to make this whole and complete

### Product improvements

- Add a person-centric investigation mode, not just camera-scoped chat.
- Add explicit event labels such as first seen, re-identified, disappeared, reappeared, and last seen.
- Add a visual timeline with camera hops and confidence indicators.
- Add evidence citations for every conclusion.
- Add a case summary export for investigations.
- Add direct links from the timeline to the supporting clips or frames.

### Data-model improvements

- Introduce a normalized sighting event schema.
- Introduce a correlation schema for linking sightings across cameras.
- Introduce a stable track identity that survives camera transitions.
- Store the same representation for live stream and history.

### UX improvements

- Add a dedicated investigation header that shows subject, time range, and confidence.
- Show a compact timeline navigator for long cases.
- Add filters for appearance attributes such as hat, color, and clothing category.
- Show the number of matched cameras and the number of confirmed sightings.

## Questions to take to backend

Use these questions during gap analysis:

1. What is the canonical entity for a person across cameras: detection, track, or re-identification cluster?
2. What event schema do you return for each sighting?
3. How do you represent tool calls, reasoning steps, and final conclusions in history?
4. Can the backend return an ordered multi-camera timeline for a single person?
5. What evidence object links each event back to the camera clip or frame?
6. How do you score confidence for a cross-camera match?
7. Can the backend return the same shape for live SSE and saved history?
8. Is the current chat API meant to be investigative chat only, or is there already a person-correlation service behind it?

## Implementation references

- Page composition: [src/features/connected-intelligence/index.tsx](src/features/connected-intelligence/index.tsx)
- Composer hook: [src/features/connected-intelligence/hooks/use-connected-intelligence.ts](src/features/connected-intelligence/hooks/use-connected-intelligence.ts)
- Filter sidebar: [src/features/connected-intelligence/components/connected-intelligence-sidebar.tsx](src/features/connected-intelligence/components/connected-intelligence-sidebar.tsx)
- Conversation sidebar: [src/features/connected-intelligence/components/connected-intelligence-conversation-sidebar.tsx](src/features/connected-intelligence/components/connected-intelligence-conversation-sidebar.tsx)
- Chat panel: [src/features/connected-intelligence/components/connected-intelligence-chat-panel.tsx](src/features/connected-intelligence/components/connected-intelligence-chat-panel.tsx)
- Shared message rendering: [src/features/chat/components/message-bubble.tsx](src/features/chat/components/message-bubble.tsx)
- Thought-process renderer: [src/features/chat/components/assistant-thought-process.tsx](src/features/chat/components/assistant-thought-process.tsx)
- SSE transport: [src/features/chat/chat-agent.ts](src/features/chat/chat-agent.ts)
- Thread and history API: [src/features/chat/thread-api.ts](src/features/chat/thread-api.ts)

## Bottom line

The frontend already supports an investigation workflow, thread persistence, filter-driven scope reduction, clip context, and a thought-process timeline. What it does not yet prove is the backend capability to correlate the same person across multiple cameras and return a trustworthy, ordered, evidence-backed timeline.

That correlation layer is the main backend gap to validate.
