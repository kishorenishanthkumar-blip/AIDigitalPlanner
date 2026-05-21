"""Six-agent AI pipeline.

Order:
    1. DiscoveryParser  — extracts themes from unstructured input
    2. EpicGenerator    — produces epics
    3. StoryWriter      — user stories in canonical format
    4. AcceptanceCriteria — Given/When/Then per story
    5. EstimationAgent  — Fibonacci story points
    6. PlatformMapper   — Jira + Rally export payloads
"""
