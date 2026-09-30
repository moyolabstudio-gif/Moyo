(() => {
  const modal = document.querySelector('[data-board-channel-modal]');
  if (!modal) return;

  const wsId = modal.dataset.wsId;
  const projId = modal.dataset.projId && modal.dataset.projId !== 'null' ? modal.dataset.projId : '';
  const base = `/api/workspace/${encodeURIComponent(wsId)}/board/channels`;
  const newInput = modal.querySelector('[data-board-channel-new]');
  const createBtn = modal.querySelector('[data-board-channel-create]');
  const charCount = modal.querySelector('[data-board-channel-char-count]');
  const countEl = modal.querySelector('[data-board-channel-count]');
  const feedback = modal.querySelector('[data-board-channel-feedback]');
  const list = modal.querySelector('[data-board-channel-list]');
  let dragged = null;
  let pageNeedsRefresh = false;

  const withProj = (url) => projId ? `${url}${url.includes('?') ? '&' : '?'}projId=${encodeURIComponent(projId)}` : url;
  const json = async (url, options = {}) => {
    const res = await fetch(withProj(url), {headers:{'Content-Type':'application/json'}, ...options});
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.message || body.status || '요청을 처리하지 못했습니다.');
    return body;
  };

  let feedbackTimer = null;
  const setFeedback = (message = '', success = false) => {
    if (!feedback) return;
    if (feedbackTimer) { clearTimeout(feedbackTimer); feedbackTimer = null; }
    feedback.textContent = message;
    feedback.classList.toggle('success', !!success);
    feedback.hidden = !message;
    if (message && success) {
      feedbackTimer = setTimeout(() => setFeedback(''), 2200);
    }
  };

  if (feedback && !feedback.textContent.trim()) feedback.hidden = true;

  const generalRows = () => [...modal.querySelectorAll('[data-channel-id][data-channel-type="GENERAL"]')];
  const syncCount = () => {
    const count = generalRows().length;
    modal.dataset.generalCount = String(count);
    if (countEl) countEl.textContent = String(count);
    if (createBtn) createBtn.disabled = count >= 5;
  };

  const closeDeletePanels = (except) => {
    modal.querySelectorAll('.board-channel-delete-panel').forEach(panel => {
      if (panel === except) return;
      panel.hidden = true;
      const select = panel.querySelector('.board-channel-move-target');
      if (select) { select.hidden = true; select.value = ''; }
      const title = panel.querySelector('[data-delete-title]');
      const message = panel.querySelector('[data-delete-message]');
      const confirm = panel.querySelector('[data-action="delete-confirm"]');
      if (title) title.textContent = '이 게시판을 삭제할까요?';
      if (message) message.textContent = '삭제 기록은 남고, 게시글이 있으면 다른 게시판으로 옮긴 뒤 삭제해요.';
      if (confirm) { confirm.textContent = '삭제'; confirm.disabled = false; }
    });
  };

  const openModal = () => {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    setFeedback('');
    setTimeout(() => newInput?.focus(), 30);
  };

  const closeModal = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
    closeDeletePanels();
    if (pageNeedsRefresh) location.reload();
  };

  document.querySelectorAll('[data-board-channel-open]').forEach(btn => btn.addEventListener('click', openModal));
  modal.querySelectorAll('[data-board-channel-close]').forEach(btn => btn.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  const syncCreateCounter = () => {
    if (charCount) charCount.textContent = String(newInput?.value.length || 0);
  };
  newInput?.addEventListener('input', syncCreateCounter);
  newInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); createBtn?.click(); }
  });
  syncCreateCounter();

  createBtn?.addEventListener('click', async () => {
    const name = newInput?.value.trim() || '';
    if (!name) { setFeedback('게시판 이름을 입력해주세요.'); newInput?.focus(); return; }
    if (generalRows().length >= 5) { setFeedback('일반 게시판은 최대 5개까지 만들 수 있어요.'); return; }
    createBtn.disabled = true;
    try {
      const r = await json(base,{method:'POST',body:JSON.stringify({channelName:name})});
      if (r.status !== 'SUCCESS') { setFeedback(r.message || '추가하지 못했습니다.'); return; }
      pageNeedsRefresh = true;
      setFeedback(`‘${name}’ 게시판을 추가했어요.`, true);
      newInput.value = '';
      syncCreateCounter();
      setTimeout(() => location.reload(), 350);
    } catch(e) {
      setFeedback(e.message);
    } finally {
      syncCount();
      if (generalRows().length < 5) createBtn.disabled = false;
    }
  });

  modal.addEventListener('input', (e) => {
    const input = e.target.closest('.board-channel-name-input');
    if (!input) return;
    const row = input.closest('[data-channel-id]');
    const save = row?.querySelector('[data-action="rename"]');
    if (save) {
      const changed = input.value.trim() !== (row.dataset.originalName || '').trim();
      save.hidden = !changed;
      save.disabled = !changed;
    }
  });

  modal.addEventListener('keydown', (e) => {
    const input = e.target.closest('.board-channel-name-input');
    if (!input) return;
    const row = input.closest('[data-channel-id]');
    if (e.key === 'Enter') {
      e.preventDefault();
      const save = row?.querySelector('[data-action="rename"]');
      if (save && !save.hidden && !save.disabled) save.click();
    } else if (e.key === 'Escape') {
      input.value = row?.dataset.originalName || '';
      const save = row?.querySelector('[data-action="rename"]');
      if (save) { save.hidden = true; save.disabled = true; }
      input.blur();
    }
  });

  modal.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const row = btn.closest('[data-channel-id]');
    if (!row) return;
    const id = row.dataset.channelId;
    const action = btn.dataset.action;

    if (action === 'delete-open') {
      const panel = row.querySelector('.board-channel-delete-panel');
      closeDeletePanels(panel);
      panel.hidden = false;
      return;
    }
    if (action === 'delete-cancel') {
      closeDeletePanels();
      return;
    }

    try {
      if (action === 'rename') {
        const input = row.querySelector('.board-channel-name-input');
        const name = input.value.trim();
        if (!name) { setFeedback('게시판 이름을 입력해주세요.'); input.focus(); return; }
        btn.disabled = true;
        const r = await json(`${base}/${id}/name`,{method:'PUT',body:JSON.stringify({channelName:name})});
        if(r.status !== 'SUCCESS') { setFeedback(r.message || '이름을 변경하지 못했습니다.'); btn.disabled = false; return; }
        row.dataset.originalName = name;
        btn.hidden = true;
        btn.disabled = true;
        pageNeedsRefresh = true;
        setFeedback(`‘${name}’ 이름으로 저장했어요.`, true);
      } else if (action === 'toggle') {
        const active = row.classList.contains('inactive');
        const r = await json(`${base}/${id}/active`,{method:'PUT',body:JSON.stringify({active})});
        if(r.status !== 'SUCCESS') { setFeedback(r.message || '상태를 변경하지 못했습니다.'); return; }
        row.classList.toggle('inactive', !active);
        btn.classList.toggle('on', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        btn.setAttribute('aria-label', `${row.dataset.originalName || '게시판'} ${active ? '숨기기' : '표시하기'}`);
        const state = row.querySelector('[data-board-channel-state]');
        if (state) state.textContent = active ? '표시 중' : '숨김';
        pageNeedsRefresh = true;
        setFeedback(active ? '게시판을 다시 표시했어요.' : '게시판을 숨겼어요.', true);
      } else if (action === 'delete-confirm') {
        const panel = row.querySelector('.board-channel-delete-panel');
        const target = panel.querySelector('.board-channel-move-target');
        const targetId = target && !target.hidden ? target.value : '';
        if (target && !target.hidden && !targetId) { setFeedback('게시글을 이동할 게시판을 선택해주세요.'); target.focus(); return; }
        btn.disabled = true;
        const u = `${base}/${id}${targetId ? `?moveToChannelId=${encodeURIComponent(targetId)}` : ''}`;
        const r = await json(u,{method:'DELETE'});
        if (r.status === 'MOVE_REQUIRED') {
          const title = panel.querySelector('[data-delete-title]');
          const message = panel.querySelector('[data-delete-message]');
          if (title) title.textContent = `게시글 ${r.postCount}개를 먼저 옮겨주세요.`;
          if (message) message.textContent = '이동할 게시판을 선택하면 게시글을 옮긴 뒤 이 게시판을 삭제해요.';
          target.hidden = false;
          btn.textContent = '이동 후 삭제';
          btn.disabled = false;
          target.focus();
          return;
        }
        if(r.status !== 'SUCCESS') { setFeedback(r.message || '삭제하지 못했습니다.'); btn.disabled = false; return; }
        row.remove();
        pageNeedsRefresh = true;
        syncCount();
        setFeedback('게시판을 삭제했어요. 삭제 기록은 보존돼요.', true);
      }
    } catch(err) {
      setFeedback(err.message);
      btn.disabled = false;
    }
  });

  list?.addEventListener('dragstart', e => {
    const row=e.target.closest('[data-channel-id]');
    if(!row) return;
    dragged=row;
    row.classList.add('dragging');
    e.dataTransfer?.setData('text/plain', row.dataset.channelId || '');
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  });
  list?.addEventListener('dragover', e => {
    e.preventDefault();
    if(!dragged) return;
    const over=e.target.closest('[data-channel-id]');
    if(!over || over===dragged) return;
    const rect=over.getBoundingClientRect();
    list.insertBefore(dragged, e.clientY < rect.top + rect.height/2 ? over : over.nextSibling);
  });
  list?.addEventListener('dragend', async () => {
    if(!dragged) return;
    dragged.classList.remove('dragging');
    dragged=null;
    const ids=generalRows().map(r=>Number(r.dataset.channelId));
    try {
      const r=await json(`${base}/order`,{method:'PUT',body:JSON.stringify({channelIds:ids})});
      if(r.status !== 'SUCCESS') { setFeedback(r.message || '순서를 저장하지 못했습니다.'); return; }
      pageNeedsRefresh = true;
      setFeedback('게시판 순서를 저장했어요.', true);
    } catch(e){ setFeedback(e.message); }
  });

  syncCount();
})();
