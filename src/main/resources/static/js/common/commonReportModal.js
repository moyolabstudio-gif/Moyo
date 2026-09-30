(function(global){
  'use strict';

  const DEFAULT_REASONS = [
    ['SPAM','스팸/홍보성 내용'],
    ['ABUSE','욕설/비방'],
    ['INAPPROPRIATE','부적절한 내용'],
    ['PRIVACY','개인정보 노출'],
    ['ETC','기타']
  ];
  let currentConfig = null;
  let initialized = false;

  const byId = id => document.getElementById(id);
  const modal = () => byId('commonReportModal');
  const options = () => Array.from(document.querySelectorAll('.common-report-reason-option'));

  function setMessage(message, tone){
    const box = byId('commonReportMessage');
    if(!box) return;
    box.textContent = message || '';
    box.className = 'common-report-message' + (tone ? ' is-' + tone : '');
  }

  function updateCounter(){
    const textarea = byId('commonReportDetail');
    const count = byId('commonReportDetailCount');
    if(textarea && count) count.textContent = String(textarea.value.length);
  }

  function setReason(value, focusButton){
    const hidden = byId('commonReportReason');
    const text = byId('commonReportReasonText');
    const button = byId('commonReportReasonButton');
    const items = options();
    const selected = items.find(option => option.dataset.value === value) || items[0];
    if(!selected) return;
    if(hidden) hidden.value = selected.dataset.value;
    if(text) text.textContent = selected.querySelector('span')?.textContent || '';
    items.forEach(option => {
      const active = option === selected;
      option.classList.toggle('is-selected', active);
      option.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    closeReasonMenu(false);
    if(focusButton && button) button.focus();
  }

  function openReasonMenu(){
    const wrap = byId('commonReportReasonCustom');
    const button = byId('commonReportReasonButton');
    if(!wrap || !button) return;
    wrap.classList.add('is-open');
    button.setAttribute('aria-expanded','true');
  }

  function closeReasonMenu(restoreFocus){
    const wrap = byId('commonReportReasonCustom');
    const button = byId('commonReportReasonButton');
    if(!wrap || !button) return;
    wrap.classList.remove('is-open');
    button.setAttribute('aria-expanded','false');
    if(restoreFocus) button.focus();
  }

  function normalizeConfig(config){
    const cfg = Object.assign({
      targetType:'CONTENT',
      targetId:null,
      targetLabel:'콘텐츠',
      endpoint:'',
      method:'POST',
      successMessage:'신고가 접수되었습니다. 관리자가 확인할게요.',
      duplicateMessage:'이미 신고한 항목입니다.',
      errorMessage:'신고 접수에 실패했습니다.',
      closeDelay:850
    }, config || {});
    if(!cfg.targetLabel) cfg.targetLabel = cfg.targetType || '콘텐츠';
    return cfg;
  }

  function open(config){
    init();
    const root = modal();
    if(!root) return;
    currentConfig = normalizeConfig(config);
    const label = byId('commonReportTargetLabel');
    const detail = byId('commonReportDetail');
    const submit = byId('commonReportSubmitBtn');
    if(label) label.textContent = currentConfig.targetLabel;
    if(detail) detail.value = '';
    if(submit){ submit.disabled = false; submit.textContent = '신고 접수'; }
    setReason('SPAM',false);
    setMessage('','');
    updateCounter();
    root.classList.remove('is-submitting');
    root.classList.add('is-open');
    root.setAttribute('aria-hidden','false');
    document.body.classList.add('common-report-open');
    window.setTimeout(() => byId('commonReportReasonButton')?.focus(),0);
  }

  function close(){
    const root = modal();
    if(!root) return;
    root.classList.remove('is-open','is-submitting');
    root.setAttribute('aria-hidden','true');
    document.body.classList.remove('common-report-open');
    closeReasonMenu(false);
    setMessage('','');
    currentConfig = null;
  }

  function makePayload(cfg, reason, detail){
    const base = {targetType:cfg.targetType,targetId:cfg.targetId,reason,detail};
    return typeof cfg.buildPayload === 'function' ? cfg.buildPayload(base, cfg) : base;
  }

  async function submit(){
    const cfg = currentConfig;
    const root = modal();
    const submitBtn = byId('commonReportSubmitBtn');
    if(!cfg || !root) return;
    if(cfg.targetId === undefined || cfg.targetId === null || cfg.targetId === ''){
      setMessage('신고 대상 정보를 찾을 수 없습니다.','error');
      return;
    }
    if(!cfg.endpoint){
      setMessage('신고 접수 경로가 설정되지 않았습니다.','error');
      return;
    }
    const reason = byId('commonReportReason')?.value || 'SPAM';
    const detail = (byId('commonReportDetail')?.value || '').trim();
    const payload = makePayload(cfg,reason,detail);
    root.classList.add('is-submitting');
    if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = '접수 중…'; }
    setMessage('','');
    try{
      const response = await fetch(cfg.endpoint,{
        method:cfg.method || 'POST',
        headers:Object.assign({'Content-Type':'application/json'},cfg.headers || {}),
        body:JSON.stringify(payload)
      });
      let data = {};
      try{ data = await response.json(); }catch(ignore){}
      const status = data && data.status;
      if(status === 'DUPLICATE'){
        setMessage(data.message || cfg.duplicateMessage,'warning');
        return;
      }
      if(!response.ok || (status && status !== 'SUCCESS')){
        setMessage(data.message || cfg.errorMessage,'error');
        return;
      }
      setMessage(data.message || cfg.successMessage,'success');
      if(typeof cfg.onSuccess === 'function') cfg.onSuccess(data,cfg);
      window.setTimeout(close,Number(cfg.closeDelay) || 850);
    }catch(error){
      console.error('공통 신고 접수 실패:',error);
      setMessage(cfg.networkErrorMessage || '신고 접수 중 오류가 발생했습니다.','error');
    }finally{
      root.classList.remove('is-submitting');
      if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = '신고 접수'; }
    }
  }

  function init(){
    if(initialized) return;
    const root = modal();
    if(!root) return;
    initialized = true;
    const reasonButton = byId('commonReportReasonButton');
    const reasonWrap = byId('commonReportReasonCustom');
    const detail = byId('commonReportDetail');
    const submitBtn = byId('commonReportSubmitBtn');
    const items = options();
    detail?.addEventListener('input',updateCounter);
    submitBtn?.addEventListener('click',submit);
    root.querySelectorAll('[data-common-report-close]').forEach(el => el.addEventListener('click',close));
    reasonButton?.addEventListener('click',function(event){event.stopPropagation();reasonWrap?.classList.contains('is-open')?closeReasonMenu(false):openReasonMenu();});
    reasonButton?.addEventListener('keydown',function(event){
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        event.preventDefault();openReasonMenu();
        const selectedIndex=Math.max(0,items.findIndex(item=>item.classList.contains('is-selected')));
        const nextIndex=event.key==='ArrowDown'?Math.min(items.length-1,selectedIndex+1):Math.max(0,selectedIndex-1);
        items[nextIndex]?.focus();
      }
    });
    items.forEach((option,index)=>{
      option.addEventListener('click',event=>{event.stopPropagation();setReason(option.dataset.value,true);});
      option.addEventListener('keydown',event=>{
        if(event.key==='ArrowDown'||event.key==='ArrowUp'){
          event.preventDefault();
          const nextIndex=event.key==='ArrowDown'?Math.min(items.length-1,index+1):Math.max(0,index-1);
          items[nextIndex]?.focus();
        }else if(event.key==='Enter'||event.key===' '){event.preventDefault();setReason(option.dataset.value,true);}
        else if(event.key==='Escape'){event.preventDefault();closeReasonMenu(true);}
      });
    });
    document.addEventListener('click',event=>{if(reasonWrap && !reasonWrap.contains(event.target)) closeReasonMenu(false);});
    document.addEventListener('keydown',event=>{
      if(event.key!=='Escape'||!root.classList.contains('is-open')) return;
      if(reasonWrap?.classList.contains('is-open')) closeReasonMenu(true); else close();
    });
  }

  global.CommonReportModal = {open,close,submit,init,setReason,reasons:DEFAULT_REASONS.slice()};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})(window);
