(function(global){
 'use strict';
 const root=document.getElementById('moyoNoteModal');
 if(!root)return;
 const source=document.getElementById('moyoNoteModalEditor');
 const statusEl=document.getElementById('moyoNoteModalStatus');
 const retryBtn=document.getElementById('moyoNoteModalRetry');
 const libraryEl=document.getElementById('moyoNoteModalLibrary');
 const titleWrap=document.getElementById('moyoNoteModalTitleWrap');
 const titleInput=document.getElementById('moyoNoteModalTitle');
 const titleHint=document.getElementById('moyoNoteModalTitleHint');
 const contentMeta=document.getElementById('moyoNoteModalContentMeta');
 const documentMeta=document.getElementById('moyoNoteModalDocumentMeta');
 const authorEl=document.getElementById('moyoNoteModalAuthor');
 const dateEl=document.getElementById('moyoNoteModalDate');
 const readonlyEl=document.getElementById('moyoNoteModalReadonly');
 const modeToggle=document.getElementById('moyoNoteModalModeToggle');
 const pdfBtn=document.getElementById('moyoNoteModalPdf');
 const printBtn=document.getElementById('moyoNoteModalPrint');
 const infoToggle=document.getElementById('moyoNoteModalInfoToggle');
 const infoPanel=document.getElementById('moyoNoteModalInfoPanel');
 const infoClose=document.getElementById('moyoNoteModalInfoClose');
 const infoTitle=document.getElementById('moyoNoteModalInfoTitle');
 const infoLibrary=document.getElementById('moyoNoteModalInfoLibrary');
 const moveLibraryBtn=document.getElementById('moyoNoteModalMoveLibrary');
 const infoAuthor=document.getElementById('moyoNoteModalInfoAuthor');
 const infoCreated=document.getElementById('moyoNoteModalInfoCreated');
 const infoUpdatedBy=document.getElementById('moyoNoteModalInfoUpdatedBy');
 const infoUpdated=document.getElementById('moyoNoteModalInfoUpdated');
 const shareManageBtn=document.getElementById('moyoNoteModalShareManage');
 const permissionsSection=document.getElementById('moyoNoteModalPermissionsSection');
 const accessField=document.getElementById('moyoNoteModalAccessField');
 const accessScopeBtn=document.getElementById('moyoNoteModalAccessScope');
 const accessRestrictedBtn=document.getElementById('moyoNoteModalAccessRestricted');
 const accessHelp=document.getElementById('moyoNoteModalAccessHelp');
 const editorsField=document.getElementById('moyoNoteModalEditorsField');
 const editorsEl=document.getElementById('moyoNoteModalEditors');
 const historyBtn=document.getElementById('moyoNoteModalHistory');
 const deleteBtn=document.getElementById('moyoNoteModalDelete');
 const metaEls=contentMeta?{
  image:contentMeta.querySelector('[data-note-meta="image"] strong'),
  table:contentMeta.querySelector('[data-note-meta="table"] strong'),
  link:contentMeta.querySelector('[data-note-meta="link"] strong'),
  video:contentMeta.querySelector('[data-note-meta="video"] strong')
 }:null;
 const contextPath=document.body?.dataset?.contextPath||'';
 const normalizeUploadUrlForDisplay=value=>{
  const url=String(value||'');
  if(!contextPath||!url.startsWith('/upload/'))return url;
  return contextPath+url;
 };
 const normalizeRichContentForDisplay=html=>{
  const text=String(html||'');
  if(!contextPath||!text.includes('/upload/'))return text;
  const wrap=document.createElement('div');
  wrap.innerHTML=text;
  wrap.querySelectorAll('[src],[href]').forEach(node=>{
   ['src','href'].forEach(attr=>{
    if(!node.hasAttribute(attr))return;
    const value=node.getAttribute(attr)||'';
    if(value.startsWith('/upload/'))node.setAttribute(attr,contextPath+value);
   });
  });
  return wrap.innerHTML;
 };
 const normalizeRichContentForStorage=html=>{
  const text=String(html||'');
  if(!contextPath||!text.includes(contextPath+'/upload/'))return text;
  const wrap=document.createElement('div');
  wrap.innerHTML=text;
  wrap.querySelectorAll('[src],[href]').forEach(node=>{
   ['src','href'].forEach(attr=>{
    if(!node.hasAttribute(attr))return;
    const value=node.getAttribute(attr)||'';
    if(value.startsWith(contextPath+'/upload/'))node.setAttribute(attr,value.slice(contextPath.length));
   });
  });
  return wrap.innerHTML;
 };
 const RETRY_DELAYS=[800,1600,3000];
 const DRAFT_TTL=24*60*60*1000;
 let editor=null;
 let noteId=null;
 let context=null;
 let saveTimer=null;
 let activeSavePromise=null;
 let saveRequested=false;
 let lastSavedSnapshot=null;
 let openToken=0;
 let closing=false;
 let deletingCurrent=false;
 let titleMode='auto';
 let currentTitle='';
 let lastError=null;
 let hydrating=false;
 let canEditCurrent=true;
 let mode='EDIT';
 let canDeleteCurrent=false;
 let canManageShareCurrent=false;
 let shareModalApi=null;
 let detailState=null;
 let infoTitleTimer=null;
 let historyBaseline=null;
 let historyCheckpointPromise=null;
 let editorSummaryToken=0;
 let restrictedAccess=false;
 let accessModeLoaded=false;
 let accessModeLoading=false;

 function setStatus(text,state,showRetry){
  if(statusEl){
   statusEl.textContent=text||'';
   statusEl.classList.remove('is-saving','is-saved','is-error');
   if(state)statusEl.classList.add('is-'+state);
  }
  if(retryBtn)retryBtn.hidden=!showRetry;
 }
 function setLibrary(name){
  if(!libraryEl)return;
  const label=String(name||'라이브러리').trim()||'라이브러리';
  libraryEl.textContent=label;
  libraryEl.title='저장 라이브러리 · '+label;
  if(infoLibrary)infoLibrary.textContent=label;
 }
 function plainText(html){
  const div=document.createElement('div');
  div.innerHTML=html||'';
  return (div.textContent||'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
 }
 function autoTitle(html){
  const wrap=document.createElement('div');
  wrap.innerHTML=html||'';
  const blocks=wrap.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote,td,th,pre');
  let text='';
  for(const block of blocks){
   const candidate=(block.textContent||'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
   if(candidate){text=candidate;break;}
  }
  if(!text){
   text=(wrap.textContent||'').replace(/\u00a0/g,' ').split(/\r?\n/)
    .map(line=>line.replace(/\s+/g,' ').trim()).find(Boolean)||'';
  }
  if(!text)return '새 노트';
  const limit=60;
  return text.length>limit?text.slice(0,limit).trim()+'…':text;
 }
 function hasContent(html){
  return plainText(html).length>0||/<(img|table|figure|iframe|video|oembed)\b/i.test(html||'');
 }
 function contentStats(html){
  const wrap=document.createElement('div');
  wrap.innerHTML=html||'';
  return {
   image:wrap.querySelectorAll('img').length,
   table:wrap.querySelectorAll('table').length,
   link:wrap.querySelectorAll('a[href]').length,
   video:wrap.querySelectorAll('video,iframe,oembed').length
  };
 }
 function renderContentMeta(data){
  if(!contentMeta||!metaEls)return;
  const stats=contentStats(data);
  const total=stats.image+stats.table+stats.link+stats.video;
  contentMeta.hidden=total===0;
  Object.keys(metaEls).forEach(key=>{
   const strong=metaEls[key];
   const item=strong&&strong.closest('.moyo-note-modal__meta-item');
   if(strong)strong.textContent=String(stats[key]||0);
   if(item)item.hidden=!(stats[key]>0);
  });
  updateExportActions(data);
 }

 function updateExportActions(data){
  const visible=hasContent(data)||!!noteId||!!currentTitle;
  if(pdfBtn)pdfBtn.hidden=!visible;
  if(printBtn)printBtn.hidden=!visible;
 }
 function exportTitle(){
  return normalizeTitle(currentTitle||titleInput?.value)||autoTitle(currentData())||'노트';
 }
 function exportMetaText(){
  const author=(authorEl?.textContent||'').trim();
  const date=(dateEl?.textContent||'').trim();
  const library=(libraryEl?.textContent||'').trim();
  return [library,author,date].filter(Boolean).join(' · ');
 }
 function buildExportStage(){
  const stage=document.createElement('div');
  stage.className='moyo-note-modal__export-stage';
  const content=document.createElement('div');
  content.className='moyo-note-modal__export-content ck-content';
  content.innerHTML=normalizeRichContentForDisplay(currentData());
  stage.append(content);
  return stage;
 }
 function safeFileName(value){
  return String(value||'note').replace(/[\\/:*?"<>|]/g,'_').trim()||'note';
 }
 function loadExternalScript(src){
  return new Promise((resolve,reject)=>{
   const existing=document.querySelector(`script[src="${src}"]`);
   if(existing){
    if(existing.dataset.loaded==='true'||existing.readyState==='complete')resolve();
    else{
     existing.addEventListener('load',resolve,{once:true});
     existing.addEventListener('error',reject,{once:true});
    }
    return;
   }
   const script=document.createElement('script');
   script.src=src;
   script.async=true;
   script.onload=()=>{script.dataset.loaded='true';resolve();};
   script.onerror=()=>reject(new Error('script load failed: '+src));
   document.head.appendChild(script);
  });
 }
 async function ensurePdfLibraries(){
  if(!global.html2canvas)await loadExternalScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
  if(!global.jspdf?.jsPDF)await loadExternalScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
 }
 function waitForExportImages(stage){
  const images=[...stage.querySelectorAll('img')];
  if(!images.length)return Promise.resolve();
  return Promise.all(images.map(img=>{
   if(img.complete)return img.decode?.().catch(()=>{})||Promise.resolve();
   return new Promise(resolve=>{
    img.addEventListener('load',resolve,{once:true});
    img.addEventListener('error',resolve,{once:true});
   });
  }));
 }
 function exportPageBreaks(stage,pageHeight){
  const total=Math.max(stage.scrollHeight,stage.offsetHeight);
  const stageRect=stage.getBoundingClientRect();
  const content=stage.querySelector('.moyo-note-modal__export-content');
  const selectors='figure,img,blockquote,pre,tr';
  const protectedBlocks=[...(content?.querySelectorAll(selectors)||[])].filter(el=>{
   const parent=el.parentElement?.closest(selectors);
   return !parent||!content?.contains(parent);
  }).map(el=>{
   const rect=el.getBoundingClientRect();
   return {top:rect.top-stageRect.top,bottom:rect.bottom-stageRect.top,height:rect.height};
  }).filter(item=>item.height>1);
  const tables=[...(content?.querySelectorAll('table')||[])].map(el=>{
   const rect=el.getBoundingClientRect();
   return {top:rect.top-stageRect.top,bottom:rect.bottom-stageRect.top,height:rect.height};
  }).filter(item=>item.height>1&&item.height<pageHeight*.92);
  protectedBlocks.push(...tables);
  const breaks=[0];
  let start=0;
  const minFill=Math.min(120,pageHeight*.12);
  while(start+pageHeight<total-1){
   let cut=start+pageHeight;
   const crossing=protectedBlocks
    .filter(item=>item.top<cut-1&&item.bottom>cut+1&&item.height<pageHeight*.96&&item.top>start+minFill)
    .sort((a,b)=>a.top-b.top)[0];
   if(crossing)cut=crossing.top;
   if(cut<=start+minFill)cut=Math.min(start+pageHeight,total);
   breaks.push(cut);
   start=cut;
  }
  breaks.push(total);
  return breaks;
 }
 async function downloadPdf(){
  if(!hasContent(currentData())&&!noteId)return;
  if(pdfBtn)pdfBtn.disabled=true;
  let stage=null;
  try{
   await ensurePdfLibraries();
   stage=buildExportStage();
   document.body.appendChild(stage);
   await waitForExportImages(stage);
   const pageWidth=210,pageHeight=297;
   const pageMarginTop=15,pageMarginBottom=18;
   const printableHeight=pageHeight-pageMarginTop-pageMarginBottom;
   const pageHeightCss=stage.offsetWidth*printableHeight/pageWidth;
   const breaks=exportPageBreaks(stage,pageHeightCss);
   const canvas=await global.html2canvas(stage,{
    scale:2,
    useCORS:true,
    allowTaint:true,
    backgroundColor:'#ffffff',
    logging:false,
    windowWidth:stage.scrollWidth,
    windowHeight:stage.scrollHeight
   });
   const {jsPDF}=global.jspdf;
   const pdf=new jsPDF('p','mm','a4');
   const scaleY=canvas.height/Math.max(stage.scrollHeight,stage.offsetHeight);
   for(let i=0;i<breaks.length-1;i++){
    const top=Math.max(0,Math.round(breaks[i]*scaleY));
    const bottom=Math.min(canvas.height,Math.round(breaks[i+1]*scaleY));
    const sliceHeight=Math.max(1,bottom-top);
    const pageCanvas=document.createElement('canvas');
    pageCanvas.width=canvas.width;
    pageCanvas.height=sliceHeight;
    const ctx=pageCanvas.getContext('2d');
    ctx.fillStyle='#ffffff';
    ctx.fillRect(0,0,pageCanvas.width,pageCanvas.height);
    ctx.drawImage(canvas,0,top,canvas.width,sliceHeight,0,0,canvas.width,sliceHeight);
    if(i>0)pdf.addPage();
    const renderedHeight=sliceHeight*pageWidth/canvas.width;
    pdf.addImage(
     pageCanvas.toDataURL('image/jpeg',0.96),
     'JPEG',
     0,
     pageMarginTop,
     pageWidth,
     Math.min(renderedHeight,printableHeight),
     undefined,
     'FAST'
    );
   }
   pdf.save(safeFileName(exportTitle())+'.pdf');
  }catch(error){
   console.error('[MOYO Note] PDF 저장 실패:',error);
   global.alert('PDF 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
  }finally{
   stage?.remove();
   if(pdfBtn)pdfBtn.disabled=false;
  }
 }
 function printNote(){
  if(!hasContent(currentData())&&!noteId)return;
  const stage=buildExportStage();
  const popup=global.open('','_blank','width=900,height=1100');
  if(!popup){
   global.alert('인쇄 창을 열 수 없습니다. 팝업 차단 설정을 확인해주세요.');
   return;
  }
  const title=exportTitle();
  popup.document.open();
  popup.document.write(`<!doctype html><html><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title><style>
   @page{size:A4;margin:15mm 16mm 18mm;}
   *{box-sizing:border-box}
   body{margin:0;color:#202838;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",Arial,sans-serif}
   h1{margin:0 0 8px;font-size:26px;line-height:1.35}
   .content{font-size:14px;line-height:1.75;color:#2f3747;overflow-wrap:anywhere}
   img{display:block;max-width:100%;max-height:245mm;width:auto;height:auto;object-fit:contain;break-inside:avoid;page-break-inside:avoid}
   table{width:100%;border-collapse:collapse} th,td{border:1px solid #dfe4ea;padding:7px 9px;vertical-align:top}
   figure,blockquote,pre{max-width:100%;break-inside:avoid;page-break-inside:avoid} figure{margin-left:0;margin-right:0}
   tr{break-inside:avoid;page-break-inside:avoid} iframe{max-width:100%}
  </style></head><body><div class="content">${stage.querySelector('.moyo-note-modal__export-content').innerHTML}</div></body></html>`);
  popup.document.close();
  popup.addEventListener('load',()=>setTimeout(()=>{popup.focus();popup.print();},120),{once:true});
 }

 function normalizeTitle(value){
  return String(value||'').replace(/\s+/g,' ').trim().slice(0,120);
 }
 function renderTitle(data){
  if(!titleWrap||!titleInput)return;
  const visible=hasContent(data)||!!noteId||!!currentTitle;
  titleWrap.hidden=!visible;
  updateExportActions(data);
  if(!visible)return;
  if(titleMode==='auto'){
   currentTitle=autoTitle(data);
   if(document.activeElement!==titleInput&&titleInput.value!==currentTitle)titleInput.value=currentTitle;
  }else if(document.activeElement!==titleInput&&titleInput.value!==currentTitle){
   titleInput.value=currentTitle;
  }
  titleWrap.classList.toggle('is-manual',titleMode==='manual');
  if(infoTitle&&document.activeElement!==infoTitle)infoTitle.value=currentTitle;
  if(titleHint)titleHint.textContent='본문에서 자동으로 만들었어요';
 }
 function titleForSave(data){
  if(titleMode==='manual'){
   const manual=normalizeTitle(currentTitle||titleInput?.value);
   return manual||autoTitle(data);
  }
  return autoTitle(data);
 }
 function form(data){
  const fd=new FormData();
  Object.entries(data).forEach(([k,v])=>{
   if(v!==null&&v!==undefined&&v!=='')fd.append(k,String(v));
  });
  return fd;
 }
 function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
 function formatDate(value){
  if(!value)return '';
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return '';
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,'0');
  const d=String(date.getDate()).padStart(2,'0');
  return `${y}.${m}.${d}`;
 }
 function formatDateTime(value){
  if(!value)return '-';
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return '-';
  const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');
  const hh=String(date.getHours()).padStart(2,'0'),mm=String(date.getMinutes()).padStart(2,'0');
  return `${y}.${m}.${d} ${hh}:${mm}`;
 }
 function escapeHtml(value){
  return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 }
 function shareStatusActive(value){
  const status=String(value||'').trim().toUpperCase();
  return status==='ACCEPTED'||status==='PENDING';
 }
 function syncPermissionsSection(){
  if(!permissionsSection)return;
  permissionsSection.hidden=!!accessField?.hidden&&!!editorsField?.hidden;
 }
 function renderEditorSummary(shares){
  if(!editorsField||!editorsEl)return;
  if(!noteId){editorsField.hidden=true;editorsEl.innerHTML='';syncPermissionsSection();return;}
  const rows=[];
  const authorName=String(detailState?.userName||'').trim();
  rows.push(authorName
    ? {name:authorName,meta:'작성자',pending:false}
    : {name:'작성자',meta:'',pending:false});
  (Array.isArray(shares)?shares:[]).forEach(share=>{
   const permission=String(share?.permissionType||share?.PERMISSION_TYPE||'VIEW').toUpperCase();
   if(permission!=='EDIT')return;
   const status=String(share?.shareStatus||share?.SHARE_STATUS||share?.status||share?.STATUS||'').toUpperCase();
   if(!shareStatusActive(status))return;
   const type=String(share?.targetType||share?.TARGET_TYPE||'').toUpperCase();
   const name=String(share?.targetName||share?.TARGET_NAME||'').trim();
   if(!name)return;
   const meta='편집';
   rows.push({name,meta,pending:false});
  });
  const seen=new Set();
  const unique=rows.filter(row=>{const key=`${row.name}|${row.meta}`;if(seen.has(key))return false;seen.add(key);return true;});
  editorsEl.innerHTML=unique.map(row=>{
   const metaText=String(row.meta||'').trim();
   return `<span class="moyo-note-modal__editor-chip"><span>${escapeHtml(row.name)}</span>${metaText?`<small>${escapeHtml(metaText)}</small>`:''}</span>`;
  }).join('');
  editorsField.hidden=false;
  syncPermissionsSection();
 }
 async function refreshEditorSummary(){
  const token=++editorSummaryToken;
  if(!noteId){renderEditorSummary([]);return;}
  try{
   const params=new URLSearchParams({contentType:'NOTE',contentId:String(noteId),shareMode:'SHARE'});
   const data=await requestJson('/share/api/targets?'+params.toString());
   if(token!==editorSummaryToken)return;
   renderEditorSummary(Array.isArray(data?.shares)?data.shares:[]);
  }catch(error){
   if(token!==editorSummaryToken)return;
   console.warn('[MOYO Note] 편집 가능 사용자 조회 실패:',error);
   renderEditorSummary([]);
  }
 }
 function isGroupContent(){
  const scope=String(context?.scopeType||detailState?.scopeType||'').toUpperCase();
  if(scope==='GROUP'||scope==='WORKSPACE'||scope==='WS')return true;
  if(scope==='PROJECT'||scope==='PROJ'){
   // 기존 프로젝트 노트의 NOTES.WS_ID가 비어 있어도 상세 API가
   // PROJECTS.WS_ID를 기준으로 확정한 값을 우선 사용한다.
   if(detailState&&Object.prototype.hasOwnProperty.call(detailState,'groupContent')){
    return detailState.groupContent===true||String(detailState.groupContent).toUpperCase()==='TRUE';
   }
   return !!(context?.wsId||detailState?.wsId);
  }
  return false;
 }
 function renderAccessMode(){
  const visible=!!noteId&&isGroupContent()&&canManageShareCurrent;
  if(accessField)accessField.hidden=!visible;
  syncPermissionsSection();
  if(!visible)return;
  accessScopeBtn?.classList.toggle('is-selected',!restrictedAccess);
  accessRestrictedBtn?.classList.toggle('is-selected',restrictedAccess);
  if(accessScopeBtn)accessScopeBtn.disabled=accessModeLoading;
  if(accessRestrictedBtn)accessRestrictedBtn.disabled=accessModeLoading;
  if(accessHelp)accessHelp.textContent=restrictedAccess
   ? '작성자와 권한이 있는 멤버만 확인할 수 있습니다.'
   : '현재 그룹/프로젝트 멤버가 확인할 수 있습니다.';
  syncPermissionsSection();
 }
 async function loadAccessMode(force){
  if(!noteId||!isGroupContent()||!canManageShareCurrent){accessModeLoaded=false;restrictedAccess=false;renderAccessMode();return false;}
  if(accessModeLoading)return restrictedAccess;
  if(accessModeLoaded&&!force){renderAccessMode();return restrictedAccess;}
  accessModeLoading=true;renderAccessMode();
  try{
   const data=await requestJson('/share/api/access-mode?contentType=NOTE&contentId='+encodeURIComponent(noteId));
   restrictedAccess=data?.restricted===true||String(data?.restricted||'').toUpperCase()==='TRUE';
   accessModeLoaded=true;
  }finally{accessModeLoading=false;renderAccessMode();}
  return restrictedAccess;
 }
 async function updateAccessMode(nextMode){
  if(!noteId||!isGroupContent()||!canManageShareCurrent)return;
  const nextRestricted=String(nextMode||'').toUpperCase()==='RESTRICTED';
  if(accessModeLoading||(accessModeLoaded&&restrictedAccess===nextRestricted))return;
  accessModeLoading=true;renderAccessMode();
  try{
   const body=new URLSearchParams({contentType:'NOTE',contentId:String(noteId),mode:nextRestricted?'RESTRICTED':'SCOPE'});
   const res=await fetch(contextPath+'/share/api/access-mode',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:body.toString(),credentials:'same-origin'});
   const data=await res.json().catch(()=>({}));
   if(!res.ok||data.success===false)throw new Error(data.message||'공개 범위를 변경하지 못했습니다.');
   restrictedAccess=data?.restricted===true||String(data?.restricted||'').toUpperCase()==='TRUE';
   accessModeLoaded=true;
   global.dispatchEvent(new CustomEvent('moyo:content-access-changed',{detail:{contentType:'NOTE',contentId:Number(noteId),restricted:restrictedAccess}}));
  }catch(error){alert(error?.message||'공개 범위를 변경하지 못했습니다.');}
  finally{accessModeLoading=false;renderAccessMode();}
 }
 function renderInfo(detail){
  detailState=detail||detailState;
  if(infoTitle){infoTitle.value=currentTitle||'';infoTitle.readOnly=!canEditCurrent;}
  if(infoAuthor)infoAuthor.textContent=String(detailState?.userName||'-');
  if(infoCreated)infoCreated.textContent=formatDateTime(detailState?.regDt);
  if(infoUpdatedBy)infoUpdatedBy.textContent=String(detailState?.updatedByName||detailState?.userName||'-');
  if(infoUpdated)infoUpdated.textContent=formatDateTime(detailState?.updDt||detailState?.regDt);
  if(moveLibraryBtn)moveLibraryBtn.disabled=!noteId||!canEditCurrent;
  if(shareManageBtn){
   shareManageBtn.hidden=!noteId||!canManageShareCurrent;
   shareManageBtn.innerHTML=isGroupContent()?'<i class="fa-solid fa-user-pen" aria-hidden="true"></i> 권한 멤버 관리':'<i class="fa-solid fa-share-nodes" aria-hidden="true"></i> 공유 관리';
  }
  renderAccessMode();
  if(historyBtn)historyBtn.hidden=!noteId;
  if(deleteBtn)deleteBtn.hidden=!noteId||!canDeleteCurrent;
 }
 function setInfoOpen(open){
  if(!infoPanel)return;
  const next=!!open&&!!noteId;
  infoPanel.hidden=!next;
  if(infoToggle){infoToggle.classList.toggle('is-active',next);infoToggle.setAttribute('aria-pressed',next?'true':'false');}
  root.classList.toggle('is-info-open',next);
  if(next){renderInfo(detailState);refreshEditorSummary();loadAccessMode(false).catch(()=>{});}
 }

 function ensureShareModal(){
  if(shareModalApi)return shareModalApi;
  if(!global.CommonPeopleModal||typeof global.CommonPeopleModal.init!=='function')throw new Error('공유 모달을 불러오지 못했습니다.');
  const modalEl=document.getElementById('moyoNoteShareModal');
  if(modalEl){
   modalEl.dataset.currentUserId=String(document.body?.dataset?.userId||'');
  }
  shareModalApi=global.CommonPeopleModal.init({
   contentType:'NOTE',
   friendOnly:true,
   persist:true,
   shareMode:'PERMISSION',
   scopeType:String(context?.scopeType||detailState?.scopeType||''),
   wsId:context?.wsId||detailState?.wsId||null,
   projId:context?.projId||detailState?.projId||null,
   enablePermission:true,
   bodyOpenClass:'note-share-modal-open',
   reloadOnPersist:false,
   currentUserId:String(document.body?.dataset?.userId||''),
   ids:{
    openButton:'moyoNoteShareOpenHidden',permissionButton:'moyoNotePermissionOpenHidden',modal:'moyoNoteShareModal',
    keyword:'moyoNoteShareKeyword',applyButton:'moyoNoteShareApply',title:'moyoNoteShareModalTitle',
    context:'moyoNoteShareContext',candidates:'moyoNoteShareCandidates',selected:'moyoNoteShareSelected',
    hiddenFields:'moyoNoteShareHiddenFields',count:'moyoNoteShareCount',permissionCount:'moyoNotePermissionCount',
    modalCount:'moyoNoteShareModalCount',initialSharesSource:'moyoNoteShareInitialSource',
    workspaceMemberSource:'moyoNoteWorkspaceMemberSource',projectMemberSource:'moyoNoteProjectMemberSource',
    workspaceTargetSource:'moyoNoteWorkspaceTargetSource',projectTargetSource:'moyoNoteProjectTargetSource'
   },
   onPersistSuccess(){
    refreshCurrentDetailAfterShare().catch(()=>{});
    refreshEditorSummary().catch(()=>{});
    global.dispatchEvent(new CustomEvent('moyo:note-updated',{detail:{noteId:Number(noteId)||0,title:currentTitle||'',reason:'share'}}));
   }
  });
  return shareModalApi;
 }
 async function refreshDetailAfterCreate(){
  if(!noteId)return;
  try{
   const detail=await requestJson('/note/api/detail?noteId='+encodeURIComponent(noteId));
   canEditCurrent=detail.canEdit!==false;
   canDeleteCurrent=detail.canDelete===true;
   canManageShareCurrent=detail.canManageShare===true;
   detailState={...(detailState||{}),...detail};
   if(context){
    if(detail.scopeType)context.scopeType=detail.scopeType;
    if(detail.wsId!=null)context.wsId=detail.wsId;
    if(detail.projId!=null)context.projId=detail.projId;
    if(detail.folderId!==undefined)context.folderId=detail.folderId;
   }
   renderDocumentMeta(detailState);
   renderInfo(detailState);
   renderMode();
  }catch(error){
   console.warn('[MOYO Note] 신규 노트 상세 동기화 실패:',error);
  }
 }

 async function refreshCurrentDetailAfterShare(){
  if(!noteId)return;
  try{
   const detail=await requestJson('/note/api/detail?noteId='+encodeURIComponent(noteId));
   canEditCurrent=detail.canEdit!==false;
   canDeleteCurrent=detail.canDelete===true;
   canManageShareCurrent=detail.canManageShare===true;
   detailState={...(detailState||{}),...detail};
   renderDocumentMeta(detailState);
   renderInfo(detailState);
   if(!canEditCurrent&&mode==='EDIT')applyMode('VIEW');
   else renderMode();
  }catch(error){console.warn('[MOYO Note] 공유 후 권한 새로고침 실패:',error);}
 }
 function prepareShareTarget(){
  if(!noteId||!canManageShareCurrent)throw new Error('공유를 관리할 권한이 없습니다.');
  const open=document.getElementById('moyoNoteShareOpenHidden');
  const modalEl=document.getElementById('moyoNoteShareModal');
  if(open)open.dataset.shareContentId=String(noteId);
  if(modalEl){
   modalEl.dataset.contentId=String(noteId);
   modalEl.dataset.ownerUserId=String(detailState?.userId||document.body?.dataset?.userId||'');
   modalEl.dataset.currentUserId=String(document.body?.dataset?.userId||'');
   modalEl.dataset.shareModeType=isGroupContent()?'MEMBER_PERMISSION':'PERMISSION';
   modalEl.dataset.scopeType=String(context?.scopeType||detailState?.scopeType||'');
   modalEl.dataset.wsId=String(context?.wsId||detailState?.wsId||'');
   modalEl.dataset.projId=String(context?.projId||detailState?.projId||'');
  }
 }
 function openShareManager(){
  try{
   prepareShareTarget();
   const api=ensureShareModal();
   if(api&&typeof api.openShare==='function')api.openShare();
  }catch(error){alert(error?.message||'공유 설정을 열지 못했습니다.');}
 }

 function renderDocumentMeta(detail){
  if(!documentMeta)return;
  if(!detail){documentMeta.hidden=true;return;}
  if(authorEl)authorEl.textContent=String(detail.userName||'작성자');
  if(dateEl){
   const reg=formatDate(detail.regDt);
   const upd=formatDate(detail.updDt);
   dateEl.textContent=upd&&upd!==reg?`${reg||upd} · 수정 ${upd}`:(reg||upd||'');
  }
  if(readonlyEl)readonlyEl.hidden=detail.canEdit!==false;
  documentMeta.hidden=false;
 }
 function setEditorReadOnly(readOnly){
  if(!editor)return;
  const lockId='moyo-note-modal-readonly';
  try{
   if(readOnly&&typeof editor.enableReadOnlyMode==='function')editor.enableReadOnlyMode(lockId);
   else if(!readOnly&&typeof editor.disableReadOnlyMode==='function')editor.disableReadOnlyMode(lockId);
  }catch(error){console.warn('[MOYO Note] 읽기 전용 전환 실패:',error);}
  if(titleInput)titleInput.readOnly=!!readOnly;
 }
 function renderMode(){
  const isEdit=mode==='EDIT';
  root.classList.toggle('is-view',!isEdit);
  root.classList.toggle('is-edit',isEdit);
  if(infoToggle)infoToggle.hidden=!noteId;
  if(modeToggle){
   modeToggle.hidden=!noteId||!canEditCurrent;
   modeToggle.textContent=isEdit?'보기':'편집';
   modeToggle.setAttribute('aria-pressed',isEdit?'true':'false');
   modeToggle.title=isEdit?'보기 모드로 전환':'편집 모드로 전환';
  }
  if(readonlyEl){
   readonlyEl.hidden=canEditCurrent;
   readonlyEl.textContent='읽기 전용';
  }
  if(titleHint)titleHint.hidden=!isEdit;
 }
 function applyMode(nextMode){
  mode=nextMode==='VIEW'?'VIEW':'EDIT';
  setEditorReadOnly(mode!=='EDIT');
  renderMode();
 }
 async function enterEdit(){
  if(!canEditCurrent||mode==='EDIT')return;
  applyMode('EDIT');
  setStatus(isDirty()?'저장 대기':'편집 중');
  setTimeout(()=>editor?.editing?.view?.focus(),0);
 }
 async function enterView(){
  if(mode!=='EDIT')return;
  await flush();
  if(isDirty()){
   setStatus('저장 확인 필요','error',true);
   return;
  }
  try{await checkpointHistory();}catch(error){console.error('[MOYO Note] 변경 기록 저장 실패:',error);setStatus('변경 기록 저장 실패','error',true);return;}
  applyMode('VIEW');
  setStatus(canEditCurrent?'보기':'읽기 전용',canEditCurrent?'saved':null);
 }
 async function requestJson(url){
  const response=await fetch(contextPath+url,{credentials:'same-origin',headers:{Accept:'application/json'}});
  const json=await response.json().catch(()=>({}));
  if(!response.ok||json.success===false)throw new Error(json.message||'노트를 불러오지 못했습니다.');
  return json;
 }
 async function request(url,data){
  let response;
  try{
   response=await fetch(contextPath+url,{method:'POST',body:form(data),credentials:'same-origin'});
  }catch(error){
   error.transient=true;
   throw error;
  }
  const json=await response.json().catch(()=>({}));
  if(!response.ok||json.success===false){
   const error=new Error(json.message||'노트를 저장하지 못했습니다.');
   error.status=response.status;
   error.transient=response.status===408||response.status===425||response.status===429||response.status>=500;
   throw error;
  }
  return json;
 }
 async function requestWithRetry(url,data){
  let error=null;
  for(let attempt=0;attempt<=RETRY_DELAYS.length;attempt+=1){
   if(!navigator.onLine){
    error=new Error('오프라인 상태입니다.');
    error.transient=true;
    break;
   }
   try{
    if(attempt>0)setStatus('재시도 중…','saving');
    return await request(url,data);
   }catch(err){
    error=err;
    if(!err.transient||attempt>=RETRY_DELAYS.length)break;
    await sleep(RETRY_DELAYS[attempt]);
   }
  }
  throw error||new Error('노트를 저장하지 못했습니다.');
 }
 function scopePayload(){
  const scope=String(context?.scopeType||'PERSONAL').toUpperCase();
  if(scope==='GROUP'||scope==='WORKSPACE')return {scope:'WS',wsId:context?.wsId||context?.scopeId};
  if(scope==='PROJECT')return {scope:'PROJ',projId:context?.projId||context?.scopeId,wsId:context?.wsId||null};
  return {scope:'PRIVATE'};
 }
 function currentData(){return editor?normalizeRichContentForStorage(editor.getData()):'';}
 function markEmptyState(data){
  root.classList.toggle('is-empty',!hasContent(data));
  renderTitle(data);
  renderContentMeta(data);
 }
 function contextDraftKey(){
  if(!context)return null;
  const scope=String(context.scopeType||'PERSONAL').toUpperCase();
  const scopeId=context.projId||context.wsId||context.scopeId||'me';
  const folder=context.folderId||'root';
  return 'moyo:note-draft:'+scope+':'+scopeId+':'+folder;
 }
 function draftKey(){
  return noteId?'moyo:note-draft:id:'+noteId:contextDraftKey();
 }
 function persistLocalDraft(){
  const key=draftKey();
  if(!key||!editor)return;
  const data=currentData();
  if(!hasContent(data)&&!noteId){
   localStorage.removeItem(key);
   return;
  }
  try{
   localStorage.setItem(key,JSON.stringify({
    data,
    title:normalizeTitle(currentTitle||titleInput?.value),
    titleMode,
    noteId:noteId||null,
    savedAt:Date.now()
   }));
  }catch(_){/* localStorage unavailable */}
 }
 function clearLocalDraft(includeContext){
  const keys=[draftKey()];
  if(includeContext)keys.push(contextDraftKey());
  try{keys.filter(Boolean).forEach(key=>localStorage.removeItem(key));}catch(_){/* noop */}
 }
 function readLocalDraft(){
  const key=draftKey();
  if(!key)return null;
  try{
   const raw=localStorage.getItem(key);
   if(!raw)return null;
   const draft=JSON.parse(raw);
   if(!draft||!draft.savedAt||Date.now()-Number(draft.savedAt)>DRAFT_TTL){
    localStorage.removeItem(key);
    return null;
   }
   return draft;
  }catch(_){return null;}
 }
 function currentSnapshot(){
  const data=currentData();
  return {
   data,
   title:titleForSave(data),
   folderId:context?.folderId==null?'':String(context.folderId)
  };
 }
 function snapshotsEqual(a,b){
  return !!a&&!!b&&a.data===b.data&&a.title===b.title&&a.folderId===b.folderId;
 }
 function historySnapshot(){
  const snap=currentSnapshot();
  return {data:snap.data,title:snap.title};
 }
 function historySnapshotsEqual(a,b){
  return !!a&&!!b&&a.data===b.data&&a.title===b.title;
 }
 async function checkpointHistory(){
  if(!noteId||!canEditCurrent||deletingCurrent)return false;
  if(historyCheckpointPromise)return historyCheckpointPromise;
  const current=historySnapshot();
  if(historySnapshotsEqual(current,historyBaseline))return false;
  historyCheckpointPromise=(async()=>{
   await flush();
   const saved=historySnapshot();
   if(historySnapshotsEqual(saved,historyBaseline))return false;
   const result=await request('/note/api/history/checkpoint',{noteId});
   if(result.success!==true)throw new Error(result.message||'변경 기록을 남기지 못했습니다.');
   historyBaseline={...saved};
   return true;
  })().finally(()=>{historyCheckpointPromise=null;});
  return historyCheckpointPromise;
 }
 function isDirty(){
  if(!editor)return false;
  return !snapshotsEqual(currentSnapshot(),lastSavedSnapshot);
 }
 function markPending(){
  persistLocalDraft();
  if(hasContent(currentData())||noteId)setStatus(navigator.onLine?'저장 대기':'오프라인 · 저장 대기',navigator.onLine?null:'error',!navigator.onLine);
 }
 async function saveSnapshot(snapshot){
  if(!canEditCurrent||mode!=='EDIT')throw new Error('편집 상태가 아닙니다.');
  let created=false;
  let savedTitle=snapshot.title;
  if(!noteId){
   const result=await requestWithRetry('/note/api/quick-create',{
    ...scopePayload(),
    folderId:context?.folderId,
    noteTitle:snapshot.title,
    memo:snapshot.data
   });
   noteId=Number(result.noteId)||null;
   if(noteId)canDeleteCurrent=true;
   renderMode();
   savedTitle=String(result.noteTitle||snapshot.title);
   created=true;
   if(!noteId)throw new Error('노트 번호를 확인하지 못했습니다.');
  }else{
   const result=await requestWithRetry('/note/autosave',{
    noteId,
    noteTitle:snapshot.title,
    memo:snapshot.data,
    folderId:context?.folderId
   });
   savedTitle=String(result.noteTitle||snapshot.title);
  }
  lastSavedSnapshot={...snapshot,title:savedTitle};
  if(created)historyBaseline={data:snapshot.data,title:savedTitle};
  currentTitle=savedTitle;
  if(detailState){detailState.noteTitle=savedTitle;detailState.updDt=new Date().toISOString();}
  renderInfo(detailState);
  if(created)refreshEditorSummary();
  if(titleInput&&document.activeElement!==titleInput)titleInput.value=savedTitle;
  renderTitle(snapshot.data);
  clearLocalDraft(created);
  lastError=null;
  setStatus('저장됨','saved');
  document.dispatchEvent(new CustomEvent('moyo:note-saved',{
   detail:{noteId,noteTitle:savedTitle,created}
  }));
 }
 async function waitUploads(){
  if(!editor)return;
  if(global.MoyoCkeditor&&typeof global.MoyoCkeditor.waitForUploads==='function'){
   const hasPendingImage=editor._moyoActiveUploads>0||/src\s*=\s*["']data:image\//i.test(currentData());
   if(hasPendingImage)setStatus('이미지 업로드 중…','saving');
   await global.MoyoCkeditor.waitForUploads(editor);
   markEmptyState(currentData());
  }
 }
 async function persist(options){
  if(deletingCurrent)return;
  const force=!!options?.force;
  if(!editor||!context||!canEditCurrent||mode!=='EDIT')return;
  clearTimeout(saveTimer);
  saveTimer=null;
  const data=currentData();
  markEmptyState(data);

  if(!hasContent(data)&&!noteId){
   clearLocalDraft();
   setStatus('바로 적어보세요');
   return;
  }
  if(!force&&!isDirty())return;

  if(activeSavePromise){
   saveRequested=true;
   await activeSavePromise.catch(()=>{});
   if(force||isDirty()||saveRequested)return persist({force});
   return;
  }

  saveRequested=false;
  try{
   await waitUploads();
  }catch(error){
   console.error('[MOYO Note] 이미지 업로드 대기 실패:',error);
   lastError=error;
   persistLocalDraft();
   setStatus('업로드 확인 필요','error',true);
   return;
  }

  const snapshot=currentSnapshot();
  if(!force&&snapshotsEqual(snapshot,lastSavedSnapshot))return;
  persistLocalDraft();
  setStatus('저장 중…','saving');
  activeSavePromise=saveSnapshot(snapshot)
   .catch(error=>{
    console.error('[MOYO Note] 자동 저장 실패:',error);
    lastError=error;
    persistLocalDraft();
    setStatus(navigator.onLine?'저장 실패 · 임시 보관됨':'오프라인 · 임시 보관됨','error',true);
    throw error;
   })
   .finally(()=>{activeSavePromise=null;});

  try{await activeSavePromise;}catch(_){return;}

  if(isDirty()||saveRequested){
   saveRequested=false;
   return persist();
  }
 }
 function scheduleSave(delay){
  if(deletingCurrent)return;
  clearTimeout(saveTimer);
  markPending();
  saveTimer=setTimeout(()=>{persist().catch(()=>{});},delay==null?650:delay);
 }
 async function flush(){
  clearTimeout(saveTimer);
  saveTimer=null;
  persistLocalDraft();
  await waitUploads().catch(()=>{});
  if(activeSavePromise){
   saveRequested=true;
   await activeSavePromise.catch(()=>{});
  }
  if(editor&&hasContent(currentData())&&isDirty())await persist({force:true});
  if(activeSavePromise)await activeSavePromise.catch(()=>{});
  if(editor&&hasContent(currentData())&&isDirty())await persist({force:true});
  persistLocalDraft();
 }
 async function ensureEditor(token){
  if(editor)return editor;
  if(!global.MoyoCkeditor)throw new Error('공통 CKEditor를 불러오지 못했습니다.');
  editor=await global.MoyoCkeditor.create(source,{
   profile:'NOTE',
   uploadUrl:contextPath+'/note/image-upload',
   resolveUploadedUrl:normalizeUploadUrlForDisplay,
   placeholder:'무엇이든 바로 적어보세요.'
  });
  editor.model.document.on('change:data',()=>{
   const data=currentData();
   markEmptyState(data);
   if(hydrating||!canEditCurrent||mode!=='EDIT')return;
   persistLocalDraft();
   if(hasContent(data))scheduleSave();
   else if(!noteId){clearLocalDraft();setStatus('바로 적어보세요');}
  });
  if(token===openToken)setTimeout(()=>editor.editing.view.focus(),0);
  return editor;
 }
 async function open(options){
  if(closing)return;
  openToken+=1;
  const token=openToken;
  const requested={...(options||{})};
  context=requested;
  noteId=requested.noteId?Number(requested.noteId):null;
  lastSavedSnapshot=null;
  titleMode=noteId?'manual':'auto';
  currentTitle='';
  lastError=null;
  canEditCurrent=true;
  canDeleteCurrent=false;
  canManageShareCurrent=false;
  detailState=null;
  accessModeLoaded=false;restrictedAccess=false;
  historyBaseline=null;
  setInfoOpen(false);
  mode=noteId?'VIEW':'EDIT';
  if(titleInput){titleInput.value='';titleInput.readOnly=false;}
  if(titleWrap){titleWrap.hidden=true;titleWrap.classList.remove('is-manual');}
  if(documentMeta)documentMeta.hidden=true;
  if(contentMeta)contentMeta.hidden=true;
  if(pdfBtn)pdfBtn.hidden=true;
  if(printBtn)printBtn.hidden=true;
  if(metaEls)Object.values(metaEls).forEach(el=>{if(el){el.textContent='0';const item=el.closest('.moyo-note-modal__meta-item');if(item)item.hidden=true;}});
  saveRequested=false;
  clearTimeout(saveTimer);
  root.hidden=false;
  root.setAttribute('aria-hidden','false');
  root.classList.add('is-empty');
  document.body.style.overflow='hidden';
  setLibrary(context.libraryName);
  setStatus(noteId?'불러오는 중…':'바로 적어보세요',noteId?'saving':null);
  try{
   const instance=await ensureEditor(token);
   if(noteId){
    const detail=await requestJson('/note/api/detail?noteId='+encodeURIComponent(noteId));
    if(token!==openToken)return;
    context={
     ...context,
     scopeType:detail.scopeType||context.scopeType||'PERSONAL',
     wsId:detail.wsId??context.wsId??null,
     projId:detail.projId??context.projId??null,
     scopeId:detail.projId??detail.wsId??context.scopeId??null,
     folderId:detail.folderId??null,
     libraryName:detail.folderName||'라이브러리'
    };
    setLibrary(context.libraryName);
    titleMode='manual';
    currentTitle=normalizeTitle(detail.noteTitle)||autoTitle(detail.memo||'');
    if(titleInput)titleInput.value=currentTitle;
    hydrating=true;
    instance.setData(normalizeRichContentForDisplay(detail.memo||''));
    hydrating=false;
    markEmptyState(detail.memo||'');
    renderDocumentMeta(detail);
    canEditCurrent=detail.canEdit!==false;
    canDeleteCurrent=detail.canDelete===true;
    canManageShareCurrent=detail.canManageShare===true;
    detailState=detail;
    renderInfo(detail);
    refreshEditorSummary();
    applyMode('VIEW');
    lastSavedSnapshot={
     data:detail.memo||'',
     title:currentTitle,
     folderId:context.folderId==null?'':String(context.folderId)
    };
    historyBaseline={data:detail.memo||'',title:currentTitle};
    const draft=readLocalDraft();
    if(draft&&Number(draft.noteId)===noteId&&hasContent(draft.data)&&canEditCurrent&&draft.data!==detail.memo){
     titleMode=draft.titleMode==='manual'?'manual':'auto';
     currentTitle=normalizeTitle(draft.title)||currentTitle;
     hydrating=true;
     instance.setData(normalizeRichContentForDisplay(draft.data||''));
     hydrating=false;
     markEmptyState(draft.data||'');
     if(titleInput)titleInput.value=currentTitle;
     applyMode('EDIT');
     setStatus(navigator.onLine?'임시본 복구 · 저장 대기':'임시본 복구 · 오프라인','error',!navigator.onLine);
     scheduleSave(300);
    }else{
     setStatus(canEditCurrent?'보기':'읽기 전용',canEditCurrent?'saved':null);
    }
   }else{
    canEditCurrent=true;
    applyMode('EDIT');
    renderDocumentMeta(null);
    const draft=readLocalDraft();
    if(draft&&hasContent(draft.data)){
     noteId=Number(draft.noteId)||null;
     renderMode();
     titleMode=draft.titleMode==='manual'?'manual':'auto';
     currentTitle=normalizeTitle(draft.title);
     hydrating=true;
     instance.setData(normalizeRichContentForDisplay(draft.data||''));
     hydrating=false;
     markEmptyState(draft.data||'');
     applyMode('EDIT');
     setStatus(navigator.onLine?'임시본 복구 · 저장 대기':'임시본 복구 · 오프라인','error',!navigator.onLine);
     scheduleSave(300);
    }else{
     hydrating=true;
     instance.setData('');
     hydrating=false;
    }
   }
   if(mode==='EDIT'&&canEditCurrent)setTimeout(()=>instance.editing.view.focus(),0);
  }catch(error){
   hydrating=false;
   console.error('[MOYO Note] 노트 열기 실패:',error);
   setStatus(error.message||'노트를 열지 못했습니다.','error');
  }
 }
 async function close(options){
  if(root.hidden||closing)return;
  closing=true;
  try{
   if(!options?.skipFlush){
    await flush();
    if(noteId&&canEditCurrent&&!deletingCurrent){
     try{await checkpointHistory();}catch(error){console.error('[MOYO Note] 변경 기록 저장 실패:',error);}
    }
   }
   setInfoOpen(false);
   root.hidden=true;
   root.setAttribute('aria-hidden','true');
   document.body.style.overflow='';
  }finally{closing=false;}
 }
 if(titleInput){
  titleInput.addEventListener('focus',()=>{
   if(!canEditCurrent||mode!=='EDIT')return;
   if(titleMode==='auto')titleInput.select();
  });
  titleInput.addEventListener('input',()=>{
   if(!canEditCurrent||mode!=='EDIT')return;
   if(!hasContent(currentData())&&!noteId)return;
   titleMode='manual';
   currentTitle=normalizeTitle(titleInput.value);
   if(titleWrap)titleWrap.classList.add('is-manual');
   persistLocalDraft();
   scheduleSave(450);
  });
  titleInput.addEventListener('blur',()=>{
   if(!canEditCurrent||mode!=='EDIT'||titleMode!=='manual')return;
   currentTitle=normalizeTitle(titleInput.value);
   if(!currentTitle){
    titleMode='auto';
    currentTitle=autoTitle(currentData());
    titleInput.value=currentTitle;
    if(titleWrap)titleWrap.classList.remove('is-manual');
   }
   persistLocalDraft();
   scheduleSave(0);
  });
 }

 async function saveInfoTitle(){
  if(!noteId||!canEditCurrent||!infoTitle)return;
  const next=normalizeTitle(infoTitle.value);
  if(!next){infoTitle.value=currentTitle;return;}
  if(next===currentTitle)return;
  clearTimeout(infoTitleTimer);
  setStatus('저장 중…','saving');
  try{
   const result=await requestWithRetry('/note/autosave',{noteId,noteTitle:next,memo:currentData(),folderId:context?.folderId});
   currentTitle=String(result.noteTitle||next);
   titleMode='manual';
   if(titleInput)titleInput.value=currentTitle;
   if(titleWrap)titleWrap.classList.add('is-manual');
   const snap=currentSnapshot();
   lastSavedSnapshot={...snap,title:currentTitle};
   if(detailState){detailState.noteTitle=currentTitle;detailState.updDt=new Date().toISOString();}
   renderTitle(currentData());renderInfo(detailState);
   clearLocalDraft();
   setStatus('저장됨','saved');
   document.dispatchEvent(new CustomEvent('moyo:note-saved',{detail:{noteId,noteTitle:currentTitle,created:false}}));
  }catch(error){
   console.error('[MOYO Note] 제목 수정 실패:',error);
   infoTitle.value=currentTitle;
   setStatus('제목 저장 실패','error',true);
  }
 }
 function folderScopeQuery(){
  const payload=scopePayload();
  const params=new URLSearchParams();
  Object.entries(payload).forEach(([k,v])=>{if(v!==null&&v!==undefined&&v!=='')params.set(k,String(v));});
  return params.toString();
 }
 async function openLibraryMove(){
  if(!noteId||!canEditCurrent||!global.CommonFolderModal)return;
  try{
   const result=await requestJson('/note/api/folders?'+folderScopeQuery());
   const folders=Array.isArray(result.folders)?result.folders:[];
   const select=document.createElement('select');
   const rootOption=document.createElement('option');
   rootOption.value='';rootOption.textContent='라이브러리';rootOption.dataset.root='true';rootOption.dataset.depth='0';rootOption.dataset.parentId='';select.appendChild(rootOption);
   const byParent=new Map();
   folders.forEach(folder=>{const key=folder.parentFolderId==null?'':String(folder.parentFolderId);if(!byParent.has(key))byParent.set(key,[]);byParent.get(key).push(folder);});
   const append=(parent,depth)=>{(byParent.get(parent)||[]).forEach(folder=>{const option=document.createElement('option');option.value=String(folder.folderId);option.textContent=folder.folderName||'라이브러리';option.dataset.depth=String(depth);option.dataset.parentId=parent;select.appendChild(option);append(String(folder.folderId),depth+1);});};
   append('',0);
   select.value=context?.folderId==null?'':String(context.folderId);
   const moveContext={...scopePayload()};
   const libraryAdapter={
    create:async(_context,data)=>{
     const created=await request('/note/api/folder/create',{...scopePayload(),parentFolderId:data.parentFolderId||'',folderName:data.folderName});
     return {folderId:created.folderId,folderName:data.folderName,depth:data.depth||0};
    }
   };
   global.CommonFolderModal.openSelect({
    selectElement:select,adapter:libraryAdapter,context:moveContext,title:'이동',description:'이동할 대상 라이브러리를 선택하세요.',confirmLabel:'이동',canManage:true,showManageActions:false,instantSelect:false,showCurrent:true,treeMode:true,createLabel:'새 라이브러리',createPrompt:'새 라이브러리 이름을 입력해 주세요.',unclassifiedLabel:'라이브러리',unclassifiedDescription:'최상위 라이브러리',folderDescription:'이 라이브러리로 이동',
    onConfirm:async folder=>{
     const selectedId=String(folder.folderId||'');
     const currentId=context?.folderId==null?'':String(context.folderId);
     if(selectedId===currentId)return;
     const moved=await request('/note/api/folder/move-note',{noteId,folderId:selectedId});
     if(moved.success!==true)throw new Error(moved.message||'라이브러리를 이동하지 못했습니다.');
     context.folderId=selectedId?Number(selectedId):null;context.libraryName=folder.folderName||'라이브러리';setLibrary(context.libraryName);
     if(lastSavedSnapshot)lastSavedSnapshot={...lastSavedSnapshot,folderId:selectedId};
     if(detailState){detailState.folderId=context.folderId;detailState.folderName=context.libraryName;detailState.updDt=new Date().toISOString();}
     renderInfo(detailState);setStatus('이동됨','saved');
     document.dispatchEvent(new CustomEvent('moyo:note-saved',{detail:{noteId,noteTitle:currentTitle,created:false,moved:true}}));
    }
   });
  }catch(error){console.error('[MOYO Note] 라이브러리 이동 실패:',error);setStatus(error.message||'라이브러리 이동 실패','error');}
 }
 async function openNoteHistory(){
  if(!noteId||!global.CommonNoteHistoryModal)return;
  if(historyBtn)historyBtn.disabled=true;
  try{
   if(canEditCurrent){
    await flush();
    await checkpointHistory();
   }
   await global.CommonNoteHistoryModal.open({
    contextPath,
    noteId,
    noteTitle:currentTitle||'노트',
    canRestore:canEditCurrent,
    onRestored:async result=>{
     const restoredTitle=normalizeTitle(result?.noteTitle)||'새 노트';
     const restoredData=String(result?.noteContent||'');
     titleMode='manual';
     currentTitle=restoredTitle;
     hydrating=true;
     editor?.setData(normalizeRichContentForDisplay(restoredData));
     hydrating=false;
     if(titleInput)titleInput.value=restoredTitle;
     markEmptyState(restoredData);
     renderTitle(restoredData);
     renderContentMeta(restoredData);
     lastSavedSnapshot={data:restoredData,title:restoredTitle,folderId:context?.folderId==null?'':String(context.folderId)};
     historyBaseline={data:restoredData,title:restoredTitle};
     if(detailState){
      detailState.noteTitle=restoredTitle;
      detailState.memo=restoredData;
      detailState.updDt=result?.updDt||new Date().toISOString();
      detailState.updatedBy=result?.updatedBy??detailState.updatedBy;
      detailState.updatedByName=result?.updatedByName||detailState.updatedByName;
     }
     renderDocumentMeta(detailState);
     renderInfo(detailState);
     clearLocalDraft(true);
     setStatus('복원됨','saved');
     document.dispatchEvent(new CustomEvent('moyo:note-saved',{detail:{noteId,noteTitle:restoredTitle,created:false,restored:true}}));
    }
   });
  }catch(error){
   console.error('[MOYO Note] 변경 기록 열기 실패:',error);
   setStatus(error.message||'변경 기록을 열지 못했습니다.','error',true);
  }finally{if(historyBtn)historyBtn.disabled=false;}
 }

 async function trashCurrentNote(){
  if(!noteId||!canDeleteCurrent||deletingCurrent)return;
  if(!global.confirm('이 노트를 휴지통으로 이동할까요?'))return;
  deletingCurrent=true;
  clearTimeout(saveTimer);
  saveTimer=null;
  saveRequested=false;
  if(deleteBtn)deleteBtn.disabled=true;
  setStatus('휴지통으로 이동 중…','saving');
  try{
   // 이미 서버로 나간 저장만 마무리하고, 삭제 직전 새 autosave는 만들지 않는다.
   if(activeSavePromise)await activeSavePromise.catch(()=>{});
   const deletedId=noteId;
   const result=await request('/note/api/note/trash',{noteId:deletedId});
   if(result.success!==true)throw new Error(result.message||'노트를 삭제하지 못했습니다.');
   clearLocalDraft(true);
   lastSavedSnapshot=null;
   await close({skipFlush:true});
   document.dispatchEvent(new CustomEvent('moyo:note-deleted',{detail:{noteId:deletedId}}));
  }catch(error){
   console.error('[MOYO Note] 노트 삭제 실패:',error);
   deletingCurrent=false;
   if(deleteBtn)deleteBtn.disabled=false;
   setStatus(error.message||'삭제 실패','error',true);
   if(isDirty())scheduleSave(300);
   return;
  }
  deletingCurrent=false;
  if(deleteBtn)deleteBtn.disabled=false;
 }
 if(pdfBtn)pdfBtn.addEventListener('click',()=>{
  if(!global.confirm('현재 노트를 PDF로 저장할까요?'))return;
  downloadPdf();
 });
 if(printBtn)printBtn.addEventListener('click',()=>{
  if(!global.confirm('현재 노트를 인쇄할까요?'))return;
  printNote();
 });
 if(infoToggle)infoToggle.addEventListener('click',()=>setInfoOpen(infoPanel?.hidden!==false));
 if(infoClose)infoClose.addEventListener('click',()=>setInfoOpen(false));
 if(infoTitle){
  infoTitle.addEventListener('input',()=>{if(!canEditCurrent)return;clearTimeout(infoTitleTimer);infoTitleTimer=setTimeout(()=>saveInfoTitle(),500);});
  infoTitle.addEventListener('blur',()=>{if(!canEditCurrent)return;clearTimeout(infoTitleTimer);saveInfoTitle();});
  infoTitle.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();infoTitle.blur();}});
 }
 if(moveLibraryBtn)moveLibraryBtn.addEventListener('click',openLibraryMove);
 if(shareManageBtn)shareManageBtn.addEventListener('click',openShareManager);
 if(accessScopeBtn)accessScopeBtn.addEventListener('click',()=>updateAccessMode('SCOPE'));
 if(accessRestrictedBtn)accessRestrictedBtn.addEventListener('click',()=>updateAccessMode('RESTRICTED'));

 if(historyBtn)historyBtn.addEventListener('click',openNoteHistory);
 if(deleteBtn)deleteBtn.addEventListener('click',trashCurrentNote);

 if(modeToggle){
  modeToggle.addEventListener('click',()=>{
   if(mode==='EDIT')enterView().catch(()=>{});
   else enterEdit().catch(()=>{});
  });
 }
 if(retryBtn){
  retryBtn.addEventListener('click',()=>{
   lastError=null;
   retryBtn.hidden=true;
   persist({force:true}).catch(()=>{});
  });
 }
 root.addEventListener('click',e=>{
  if(e.target.closest('[data-note-modal-close]'))close();
 });
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!root.hidden){e.preventDefault();close();}
 });
 global.addEventListener('offline',()=>{
  if(root.hidden)return;
  persistLocalDraft();
  if(hasContent(currentData())||noteId)setStatus('오프라인 · 임시 보관됨','error',true);
 });
 global.addEventListener('online',()=>{
  if(root.hidden)return;
  if(isDirty()){
   setStatus('연결됨 · 저장 대기');
   scheduleSave(150);
  }
 });
 global.addEventListener('beforeunload',persistLocalDraft);
 global.MoyoNoteModal={
  open,
  close,
  flush,
  retry:()=>persist({force:true}),
  getNoteId:()=>noteId,
  isDirty,
  getMode:()=>mode,
  enterEdit,
  enterView
 };
})(window);
