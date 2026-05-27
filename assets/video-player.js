/**
 * AIDP Video Player · renders ```video briefs from Niche-I as
 * interactive in-browser presentations with auto-advancing scenes,
 * voice narration via Web Speech API, and screen-record CTA.
 *
 * Brief schema (must match master-agent system prompt):
 *   {
 *     title: string,
 *     total_seconds: number,
 *     scenes: [
 *       { seconds:number, title:string, narration:string, visual:string, background:string }
 *     ]
 *   }
 *
 * Usage:
 *   const html = AIDP_VIDEO.renderBriefCard(briefJson, uniqueId);
 *   element.innerHTML = html;
 *   AIDP_VIDEO.bindCard(element, briefJson, uniqueId);
 *
 * Globals: window.AIDP_VIDEO
 */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function attr(s) {
    return esc(s).replace(/'/g, '&#39;');
  }

  /* ─── render the card · static markup the LLM stream can inject ── */

  function renderBriefCard(brief, id) {
    const scenesCount = (brief.scenes && brief.scenes.length) || 0;
    const totalSecs = brief.total_seconds || scenesCount * 8;

    /* Build hidden scene data the player will read. */
    const scenesJson = JSON.stringify(brief.scenes || []).replace(/</g, '\\u003c');

    return `
<div class="aidp-video-card" id="vid-card-${id}" data-scenes='${attr(scenesJson)}' style="margin:10px 0;border:1px solid var(--b1,#E2E7F1);border-radius:10px;overflow:hidden;background:#fff;max-width:640px">
  <div class="aidp-video-header" style="padding:10px 14px;background:linear-gradient(135deg,#1A2238 0%,#3D8EFF 100%);color:#fff;display:flex;align-items:center;justify-content:space-between">
    <div>
      <div style="font-weight:600;font-size:14px">🎬 ${esc(brief.title || 'Untitled video')}</div>
      <div style="font-size:11px;opacity:.8">${scenesCount} scenes · ~${totalSecs}s · interactive presentation</div>
    </div>
    <div style="display:flex;gap:6px">
      <button onclick="AIDP_VIDEO.play('${id}')" style="background:#FFD070;color:#1A2238;border:0;padding:6px 14px;border-radius:6px;font-weight:600;cursor:pointer;font-size:12px">▶ Play</button>
    </div>
  </div>
  <div class="aidp-video-stage" id="vid-stage-${id}" style="aspect-ratio:16/9;background:#1A2238;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;position:relative">
    <div style="opacity:.6;font-size:13px">Press <strong>▶ Play</strong> to start the presentation.</div>
  </div>
  <div class="aidp-video-controls" style="padding:8px 14px;background:#F8FAFD;display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#5B6B8A;flex-wrap:wrap;gap:8px">
    <div id="vid-status-${id}">Ready · ${scenesCount} scenes</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button onclick="AIDP_VIDEO.recordHint('${id}')" title="How to record this as an MP4" style="background:transparent;border:1px solid var(--b1,#E2E7F1);padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px">📹 Record</button>
      <button onclick="AIDP_VIDEO.exportBrief('${id}')" title="Download brief JSON" style="background:transparent;border:1px solid var(--b1,#E2E7F1);padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px">💾 Brief</button>
      <button onclick="AIDP_VIDEO.shareTwitter('${id}')" title="Share on X (Twitter)" style="background:#000;color:#fff;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px">𝕏 Share</button>
      <button onclick="AIDP_VIDEO.shareLinkedIn('${id}')" title="Share on LinkedIn" style="background:#0A66C2;color:#fff;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px">in Share</button>
      <button onclick="AIDP_VIDEO.shareYouTubeHint('${id}')" title="Upload to YouTube · requires CR-AGENT-OUTPUT" style="background:#FF0000;color:#fff;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px">▶ YT</button>
    </div>
  </div>
</div>`;
  }

  /* ─── player state per card ────────────────────────────────────── */

  const _state = {};   // id → { idx, timer, scenes, speech }

  function ensure(id) {
    if (!_state[id]) {
      const card = document.getElementById('vid-card-' + id);
      let scenes = [];
      if (card) {
        try { scenes = JSON.parse(card.getAttribute('data-scenes') || '[]'); } catch { scenes = []; }
      }
      _state[id] = { idx: -1, timer: null, scenes: scenes, speech: null };
    }
    return _state[id];
  }

  /* ─── playback ─────────────────────────────────────────────────── */

  function play(id) {
    const s = ensure(id);
    if (!s.scenes.length) return;
    stop(id);            // reset if mid-flight
    s.idx = 0;
    showScene(id);
  }

  function showScene(id) {
    const s = _state[id];
    if (!s || s.idx < 0 || s.idx >= s.scenes.length) { stop(id); return; }
    const scene = s.scenes[s.idx];
    const stage = document.getElementById('vid-stage-' + id);
    const status = document.getElementById('vid-status-' + id);
    if (!stage) return;

    const bg = scene.background && /^#[0-9A-Fa-f]{3,8}$/.test(scene.background)
      ? scene.background
      : '#1A2238';

    stage.style.background = bg;
    stage.innerHTML = `
      <div style="position:absolute;top:10px;left:14px;font-size:11px;opacity:.6">Scene ${s.idx + 1} / ${s.scenes.length}</div>
      <div style="font-family:Fraunces,Georgia,serif;font-size:24px;font-weight:600;margin-bottom:12px">${esc(scene.title || '')}</div>
      <div style="font-size:14px;opacity:.85;max-width:80%;line-height:1.5">${esc(scene.visual || '')}</div>
      <div style="position:absolute;bottom:10px;right:14px;font-size:10px;opacity:.5">${esc(scene.narration ? '🔊 ' + scene.narration.slice(0, 60) + (scene.narration.length > 60 ? '…' : '') : '')}</div>
    `;
    if (status) status.textContent = `Playing scene ${s.idx + 1} / ${s.scenes.length}`;

    /* Narrate via Web Speech API if available. */
    if (scene.narration && 'speechSynthesis' in window) {
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(scene.narration);
        u.rate = 1.0; u.pitch = 1; u.volume = 0.95;
        s.speech = u;
        speechSynthesis.speak(u);
      } catch (e) { /* speech not supported · ignore */ }
    }

    const dur = Math.max(2, Math.min(60, parseInt(scene.seconds, 10) || 8)) * 1000;
    s.timer = setTimeout(() => {
      s.idx += 1;
      if (s.idx >= s.scenes.length) {
        stop(id);
        if (status) status.textContent = `Complete · ${s.scenes.length} scenes played`;
        const stage2 = document.getElementById('vid-stage-' + id);
        if (stage2) {
          stage2.innerHTML = `<div style="text-align:center"><div style="font-size:32px;margin-bottom:12px">✓</div><div>Presentation complete</div><button onclick="AIDP_VIDEO.play('${id}')" style="margin-top:16px;background:#FFD070;color:#1A2238;border:0;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer">▶ Replay</button></div>`;
        }
      } else {
        showScene(id);
      }
    }, dur);
  }

  function stop(id) {
    const s = _state[id];
    if (!s) return;
    if (s.timer) { clearTimeout(s.timer); s.timer = null; }
    try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch {}
  }

  /* ─── helpers ──────────────────────────────────────────────────── */

  function recordHint(id) {
    alert(
      'To record this presentation as an MP4:\n\n' +
      '1. Press Win+Alt+R (Windows Game Bar) or use OBS Studio / built-in screen recorder\n' +
      '2. Select this browser tab/window\n' +
      '3. Click ▶ Play above\n' +
      '4. Stop recording when the presentation completes\n\n' +
      'For server-rendered MP4 with branded templates, build CR-AGENT-01 (Output agent · Remotion pipeline).'
    );
  }

  function exportBrief(id) {
    const s = ensure(id);
    if (!s.scenes.length) return;
    const card = document.getElementById('vid-card-' + id);
    const brief = { title: 'Niche-I video brief', total_seconds: s.scenes.reduce((a, x) => a + (x.seconds || 8), 0), scenes: s.scenes };
    const blob = new Blob([JSON.stringify(brief, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `niche-i-video-brief-${Date.now()}.json`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  /* ─── social share · uses platform share intent URLs ───────────── */

  function _buildShareText(id) {
    const s = ensure(id);
    const card = document.getElementById('vid-card-' + id);
    const title = card ? (card.querySelector('.aidp-video-header div div')?.textContent || 'Niche-I video') : 'Niche-I video';
    const sceneList = (s.scenes || []).slice(0, 3).map(x => '• ' + (x.title || x.narration || '').slice(0, 60)).join('\n');
    return `${title}\n\nGenerated by Niche-I (AIDP · AI Digital Planner). Highlights:\n${sceneList}\n\nLearn more: https://aidp-platform.pages.dev`;
  }

  function shareTwitter(id) {
    const text = _buildShareText(id);
    const url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function shareLinkedIn(id) {
    /* LinkedIn's "share" intent supports a URL · we share the AIDP landing.
       For full post composition, LinkedIn requires a real OAuth-authenticated upload. */
    const aidpUrl = 'https://aidp-platform.pages.dev';
    const url = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(aidpUrl);
    window.open(url, '_blank', 'noopener,noreferrer');
    /* Also copy a suggested post body to clipboard for paste-in. */
    const text = _buildShareText(id);
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    alert('LinkedIn share opened in a new tab.\n\nSuggested post body copied to your clipboard — paste it into the LinkedIn composer.');
  }

  function shareYouTubeHint(id) {
    alert(
      'YouTube upload requires:\n\n' +
      '1. A real MP4 file (Niche-I generates briefs · MP4 rendering is CR-AGENT-OUTPUT)\n' +
      '2. YouTube Data API v3 credentials + OAuth user authorization\n' +
      '3. A backend route that handles the resumable upload\n\n' +
      'For now: press 📹 Record above to screen-capture the presentation as an MP4, then upload manually via studio.youtube.com.\n\n' +
      'Roadmap to one-click YouTube upload:\n' +
      '• Phase 1: CR-AGENT-OUTPUT ships Remotion server renderer (2 weeks)\n' +
      '• Phase 2: CR-AGENT-COMMS wraps YouTube + LinkedIn + IG + X upload APIs (1 week)\n' +
      '• Phase 3: Wire "Publish to social" button → triggers render + upload via OAuth'
    );
  }

  /* ─── extract brief from markdown · used by renderMd hooks ─────── */

  function extractBriefs(markdown) {
    const out = [];
    const re = /```video\s*([\s\S]*?)```/gi;
    let m, idx = 0;
    while ((m = re.exec(markdown))) {
      let json = null;
      try { json = JSON.parse(m[1].trim()); } catch (_) { json = null; }
      if (json && json.scenes) {
        const id = 'b' + Date.now().toString(36) + (idx++);
        out.push({ id: id, brief: json, raw: m[0] });
      }
    }
    return out;
  }

  /* ─── expose globally ──────────────────────────────────────────── */

  window.AIDP_VIDEO = {
    renderBriefCard: renderBriefCard,
    extractBriefs:   extractBriefs,
    play:    play,
    stop:    stop,
    recordHint:  recordHint,
    exportBrief: exportBrief,
    shareTwitter:     shareTwitter,
    shareLinkedIn:    shareLinkedIn,
    shareYouTubeHint: shareYouTubeHint
  };

  if (typeof console !== 'undefined') console.info('[AIDP_VIDEO] player ready');
})();
