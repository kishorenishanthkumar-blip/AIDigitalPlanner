/**
 * AIDP API client · centralized helpers for calling the 13-agent fleet.
 *
 * Two entry points:
 *   1. window.AIDP.streamChat(message, callbacks)   · SSE chat via master /chat
 *   2. window.AIDP.callAgent(agent, tool, args)     · direct sub-agent MCP call
 *
 * All other modules import via the window.AIDP global rather than ES modules
 * to keep the pages-deploy bundle ES5-compatible and dependency-free.
 *
 * Auth: pulls user email from localStorage["aidp_user_email"] set by the
 * existing auth flow. Falls back to a guest email if not signed in.
 */
(function () {
  'use strict';

  const SUBDOMAIN = 'kishorenishanthkumar';

  const CONFIG = {
    MASTER_URL: `https://aiagenticplanner.${SUBDOMAIN}.workers.dev`,
    AGENTS: {
      DISCOVERY:    `https://aiagenticplanner-discovery.${SUBDOMAIN}.workers.dev`,
      ARCHITECTURE: `https://aiagenticplanner-architecture.${SUBDOMAIN}.workers.dev`,
      REQUIREMENTS: `https://aiagenticplanner-requirements.${SUBDOMAIN}.workers.dev`,
      ACTIONS:      `https://aiagenticplanner-actions.${SUBDOMAIN}.workers.dev`,
      SOW:          `https://aiagenticplanner-sow.${SUBDOMAIN}.workers.dev`,
      GOVERNANCE:   `https://aiagenticplanner-governance.${SUBDOMAIN}.workers.dev`,
      OPERATIONS:   `https://aiagenticplanner-operations.${SUBDOMAIN}.workers.dev`,
      EXCEPTION:    `https://aiagenticplanner-exception.${SUBDOMAIN}.workers.dev`,
      KNOWLEDGE:    `https://aiagenticplanner-knowledge.${SUBDOMAIN}.workers.dev`,
      IAC:          `https://aiagenticplanner-iac.${SUBDOMAIN}.workers.dev`,
      PATCH:        `https://aiagenticplanner-patch.${SUBDOMAIN}.workers.dev`,
      VALIDATOR:    `https://aiagenticplanner-validator.${SUBDOMAIN}.workers.dev`,
      TESTDATA:     `https://aiagenticplanner-testdata.${SUBDOMAIN}.workers.dev`,
      TEST_DESIGN:  `https://aiagenticplanner-test-design.${SUBDOMAIN}.workers.dev`,
      TESTING:      `https://aiagenticplanner-testing-master.${SUBDOMAIN}.workers.dev`,
      TESTING_MASTER: `https://aiagenticplanner-testing-master.${SUBDOMAIN}.workers.dev`,
      ORCHESTRATOR: `https://aiagenticplanner-orchestrator.${SUBDOMAIN}.workers.dev`,
      INSIGHTS:     `https://aiagenticplanner-insights.${SUBDOMAIN}.workers.dev`
    },
    DEFAULT_USER: 'guest@aidp.demo',
    TIMEOUT_MS: 30000
  };

  function getUserEmail() {
    try {
      return localStorage.getItem('aidp_user_email')
          || localStorage.getItem('aidp_email')
          || CONFIG.DEFAULT_USER;
    } catch {
      return CONFIG.DEFAULT_USER;
    }
  }

  /* ─── streamChat · SSE wrapper for Nishi ─────────────── */

  /**
   * Stream a chat reply from master /chat as SSE events.
   *
   * Callbacks (all optional):
   *   onChunk({content})              · LLM-streamed text fragment
   *   onToolCall({tool, args})        · master decided to invoke a tool
   *   onToolResult({tool, result})    · tool returned, before LLM continues
   *   onToolError({tool, message})    · tool throw or non-2xx
   *   onError({code, message})        · stream-level error
   *   onDone()                        · stream complete
   *
   * Returns a function that aborts the in-flight request.
   */
  async function streamChat(message, callbacks) {
    callbacks = callbacks || {};
    const controller = new AbortController();
    const url = `${CONFIG.MASTER_URL}/chat`;

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_email: getUserEmail(),
        message: message
      }),
      signal: controller.signal
    }).then(async (resp) => {
      if (!resp.ok) {
        callbacks.onError && callbacks.onError({ code: 'http_error', message: `HTTP ${resp.status}` });
        return;
      }
      if (!resp.body) {
        callbacks.onError && callbacks.onError({ code: 'no_body', message: 'Response has no readable stream' });
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;
            /* Legacy support for [DONE] sentinel · master uses {type:"done"} instead */
            if (raw === '[DONE]') {
              callbacks.onDone && callbacks.onDone();
              return;
            }
            let evt;
            try { evt = JSON.parse(raw); } catch (_) { continue; }

            switch (evt.type) {
              /* Master event shapes from apps/master-agent/src/index.ts */
              case 'ready':        /* {request_id} · stream opened */
                callbacks.onReady && callbacks.onReady(evt);
                break;
              case 'tool_use':     /* {agent, tool, bound, matched_keyword, rationale} */
                callbacks.onToolCall && callbacks.onToolCall({
                  toolName: evt.tool, tool: evt.tool, name: evt.tool,
                  agent: evt.agent, bound: evt.bound,
                  matched_keyword: evt.matched_keyword, rationale: evt.rationale
                });
                break;
              case 'tool_result':  /* {text} */
                callbacks.onToolResult && callbacks.onToolResult(evt);
                break;
              case 'tool_error':   /* {message} */
                callbacks.onToolError && callbacks.onToolError(evt);
                break;
              case 'tool_skipped': /* {reason} */
                if (callbacks.onToolSkipped) callbacks.onToolSkipped(evt);
                else if (callbacks.onToolError) callbacks.onToolError({ message: 'skipped · ' + evt.reason });
                break;
              case 'token':        /* {text} · streaming LLM output */
                callbacks.onChunk && callbacks.onChunk({ content: evt.text, text: evt.text });
                break;
              case 'error':        /* {code, message} */
                callbacks.onError && callbacks.onError(evt);
                break;
              case 'done':         /* {request_id, cost_usd, prompt_tokens, completion_tokens, latency_ms} */
                callbacks.onDone && callbacks.onDone(evt);
                return;
              /* Legacy/alternate event names · kept for forward compatibility */
              case 'chunk':       callbacks.onChunk     && callbacks.onChunk(evt); break;
              case 'tool_call':   callbacks.onToolCall  && callbacks.onToolCall(evt); break;
            }
          }
        }
        callbacks.onDone && callbacks.onDone();
      } catch (err) {
        if (err.name === 'AbortError') return;
        callbacks.onError && callbacks.onError({ code: 'stream_error', message: err.message });
      }
    }).catch((err) => {
      if (err.name === 'AbortError') return;
      callbacks.onError && callbacks.onError({ code: 'fetch_error', message: err.message });
    });

    return () => controller.abort();
  }

  /* ─── callAgent · direct sub-agent MCP call ──────────── */

  /**
   * Call a tool on a specific sub-agent via JSON-RPC.
   * Returns the parsed JSON payload from the tool response.
   *
   * Usage:
   *   const result = await AIDP.callAgent('DISCOVERY', 'discovery_list_capabilities', { user_email });
   *
   * Throws on HTTP errors, JSON-RPC errors, or unparseable responses.
   */
  async function callAgent(agentName, toolName, args) {
    args = args || {};
    /* Auto-inject user_email from the auth flow if the caller didn't pass it.
       Most sub-agent tools require it as the tenant key. */
    if (args.user_email === undefined) args.user_email = getUserEmail();
    const baseUrl = CONFIG.AGENTS[String(agentName).toUpperCase()];
    if (!baseUrl) throw new Error(`Unknown agent: ${agentName}`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

    try {
      const resp = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          method: 'tools/call',
          params: { name: toolName, arguments: args }
        }),
        signal: controller.signal
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status} from ${agentName}.${toolName}`);

      const env = await resp.json();
      if (env.error) throw new Error(`JSON-RPC error: ${env.error.message || JSON.stringify(env.error)}`);

      const text = env.result?.content?.[0]?.text;
      if (text === undefined) throw new Error(`Empty content from ${agentName}.${toolName}`);
      if (env.result?.isError) throw new Error(`Tool error: ${text}`);

      try { return JSON.parse(text); } catch (_) { return { raw: text }; }
    } finally {
      clearTimeout(timer);
    }
  }

  /* ─── health checks ──────────────────────────────────── */

  async function fleetHealth() {
    const target = `${CONFIG.AGENTS.VALIDATOR}/mcp`;
    const resp = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'health-' + Date.now(),
        method: 'tools/call',
        params: { name: 'validator_health_all', arguments: {} }
      })
    });
    const env = await resp.json();
    return JSON.parse(env.result.content[0].text);
  }

  /* ─── expose globally ────────────────────────────────── */

  window.AIDP = {
    streamChat: streamChat,
    callAgent:  callAgent,
    fleetHealth: fleetHealth,
    getUserEmail: getUserEmail,
    CONFIG: CONFIG
  };

  /* Console banner so devs know the client is loaded. */
  if (typeof console !== 'undefined' && console.info) {
    console.info('[AIDP] API client v1 loaded · master:', CONFIG.MASTER_URL);
  }
})();
