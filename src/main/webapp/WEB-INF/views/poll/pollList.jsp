<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>투표</title>
<style>
body{margin:0;background:#f6f8fa;color:#111827;font-family:'Pretendard',sans-serif}
.poll-page{max-width:1120px;margin:34px auto 72px;padding:0 24px;box-sizing:border-box}
.poll-top-link{display:inline-flex;margin-bottom:18px;color:#64748b;text-decoration:none;font-size:14px;font-weight:800}
.poll-hero{display:flex;justify-content:space-between;gap:18px;align-items:center;padding:28px 32px;margin-bottom:22px;background:radial-gradient(circle at 92% 16%,rgba(85,221,191,.18),transparent 28%),radial-gradient(circle at 6% 100%,rgba(74,144,226,.12),transparent 32%),#fff;border:1px solid #e4ebf2;border-radius:24px;box-shadow:0 10px 30px rgba(32,48,64,.045)}
.poll-hero h2{margin:0;font-size:28px;font-weight:900;letter-spacing:-.04em}.poll-hero p{margin:8px 0 0;color:#64748b;font-size:14px;font-weight:700}
.poll-scope-badge{display:inline-flex;align-items:center;height:28px;padding:0 11px;border-radius:999px;border:1px solid #dbeafe;background:#eef6ff;color:#2563eb;font-size:12px;font-weight:900}
.poll-layout{display:grid;grid-template-columns:minmax(0,1fr) 390px;gap:18px;align-items:start}
.poll-card{background:#fff;border:1px solid #e4ebf2;border-radius:20px;box-shadow:0 8px 22px rgba(32,48,64,.035);padding:22px;box-sizing:border-box}
.poll-card-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.poll-card h3{margin:0;font-size:18px;font-weight:900}

.active-poll-question{margin:0 0 8px;font-size:18px;font-weight:900}.active-poll-meta{margin-bottom:12px;color:#94a3b8;font-size:12px;font-weight:800}
.poll-option-list{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
.poll-option-btn{display:flex;flex-direction:column;gap:8px;min-height:48px;padding:10px;border:1px solid #e4ebf2;border-radius:14px;background:#fff;font-family:inherit;font-weight:900;color:#334155;cursor:pointer;text-align:left;overflow:hidden}
.poll-option-btn:hover{background:#f8fbff;border-color:#bfdbfe}.poll-option-btn.selected{border-color:#4A90E2;box-shadow:0 0 0 3px rgba(74,144,226,.12)}.poll-option-btn:disabled{cursor:not-allowed;opacity:.8}
.poll-option-image{width:100%;aspect-ratio:16/10;object-fit:contain;object-position:center;border-radius:10px;background:#f8fafc;padding:8px;box-sizing:border-box}
.poll-option-bottom{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center;width:100%}
.option-number{display:inline-flex;align-items:center;justify-content:center;width:23px;height:23px;border-radius:999px;background:#eef6ff;color:#2563eb;font-size:11px;font-weight:900}
.poll-option-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.poll-count{display:inline-flex;align-items:center;justify-content:center;min-width:44px;height:22px;padding:0 7px;border-radius:999px;background:#eef6ff;color:#2563eb;font-size:11px;font-weight:900}
.poll-empty{min-height:110px;display:flex;align-items:center;justify-content:center;border:1px dashed #dce3ea;border-radius:15px;background:#fafbfc;color:#94a3b8;font-size:13px;font-weight:800;text-align:center}
.poll-history-list{display:flex;flex-direction:column;gap:9px}.poll-history-item{display:block;padding:12px 13px;border:1px solid #eef2f6;border-radius:14px;background:#fff;cursor:pointer}
.poll-history-item:hover,.poll-history-item.active{border-color:#bfdbfe;background:#f8fbff}.poll-history-item strong{display:block;min-width:0;font-size:14px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.poll-history-item span{display:block;margin-top:4px;color:#94a3b8;font-size:11px;font-weight:800}
.poll-status{display:inline-flex;align-items:center;height:23px;padding:0 8px;border-radius:999px;font-size:11px;font-weight:900}.poll-status.active{background:#e9fff9;border:1px solid #a7f3d0;color:#059669}.poll-status.closed{background:#f8fafc;border:1px solid #e4ebf2;color:#64748b}
.poll-form-row{margin-bottom:14px}.form-label-row{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}.form-label-row label,.poll-form-row>label{color:#334155;font-size:12px;font-weight:900}
.poll-input{width:100%;min-height:40px;padding:0 12px;border:1px solid #d8e0e8;border-radius:12px;box-sizing:border-box;font-family:inherit;font-weight:800;outline:none}.poll-input:focus{border-color:#4A90E2;box-shadow:0 0 0 3px rgba(74,144,226,.12)}
.poll-deadline-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(92px,.55fr) minmax(92px,.55fr);gap:10px}.time-unit-wrap{display:grid;grid-template-columns:1fr auto;gap:5px;align-items:center}.time-unit{color:#64748b;font-size:12px;font-weight:900}
.poll-option-input-list{display:flex;flex-direction:column;gap:9px}.poll-option-edit-row{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:start;padding:10px;border:1px solid #e4ebf2;border-radius:14px;background:#fbfdff}
.poll-option-edit-main{display:flex;flex-direction:column;gap:8px;min-width:0}.poll-option-image-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.poll-file-label{display:inline-flex;align-items:center;justify-content:center;height:30px;padding:0 10px;border:1px solid #dbeafe;border-radius:999px;background:#eef6ff;color:#2563eb;font-size:11px;font-weight:900;cursor:pointer}.poll-file-label input{display:none}
.poll-image-preview{display:none;width:88px;height:58px;object-fit:contain;object-position:center;padding:4px;box-sizing:border-box;background:#f8fafc;border-radius:9px;border:1px solid #e4ebf2}.poll-image-preview.visible{display:block}.poll-image-name{max-width:150px;color:#64748b;font-size:11px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.poll-add-option{width:30px;height:30px;border:1px solid #dbeafe;border-radius:999px;background:#eef6ff;color:#2563eb;font-size:18px;font-weight:900;cursor:pointer}
.poll-create-btn{width:100%;height:42px;border:0;border-radius:999px;background:linear-gradient(135deg,#4A90E2,#39CDB5);color:#fff;font-family:inherit;font-size:14px;font-weight:900;cursor:pointer;box-shadow:0 10px 22px rgba(57,205,181,.22)}
.notice-readonly{margin-top:10px;color:#94a3b8;font-size:11px;font-weight:800;line-height:1.5}
@media(max-width:900px){.poll-layout{grid-template-columns:1fr}.poll-option-list{grid-template-columns:1fr}.poll-deadline-grid{grid-template-columns:minmax(0,1.45fr) minmax(82px,.55fr) minmax(82px,.55fr)}}

.poll-option-toolbar{display:flex;align-items:center;gap:6px}
.global-option-type-switch{display:flex;align-items:center;gap:9px;margin-right:2px}
.global-option-type-switch label{display:inline-flex;align-items:center;gap:4px;color:#64748b;font-size:11px;font-weight:900;cursor:pointer}
.global-option-type-switch input{accent-color:#4A90E2}
.poll-remove-last{width:30px;height:30px;border:1px solid #fecdd3;border-radius:999px;background:#fff1f2;color:#e11d48;font-size:18px;font-weight:900;cursor:pointer}
.poll-option-image-block{display:none;align-items:center;gap:8px;flex-wrap:wrap}
.poll-option-edit-row.image-mode .poll-option-text-input{display:none}
.poll-option-edit-row.image-mode .poll-option-image-block{display:flex}
.poll-manage-actions{display:flex;justify-content:flex-end;gap:7px}
.poll-manage-btn{height:30px;padding:0 11px;border:1px solid #dbeafe;border-radius:999px;background:#eef6ff;color:#2563eb;font-family:inherit;font-size:11px;font-weight:900;cursor:pointer}
.poll-manage-btn.delete{border-color:#fecdd3;background:#fff1f2;color:#e11d48}
.poll-form-actions{display:flex;gap:8px}
.poll-form-actions .poll-create-btn{flex:1}
.poll-hero-actions{display:flex;align-items:center;gap:10px}
.poll-open-create-btn{height:38px;padding:0 16px;border:0;border-radius:999px;background:linear-gradient(135deg,#4A90E2,#39CDB5);color:#fff;font-family:inherit;font-size:13px;font-weight:900;cursor:pointer;box-shadow:0 8px 20px rgba(57,205,181,.2)}
.poll-page-content{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(320px,.75fr);gap:18px;align-items:start}
.poll-detail-card{min-width:0;width:100%}
.poll-side-lists{display:flex;flex-direction:column;gap:18px;min-width:0}
.poll-side-lists .poll-card{min-width:0}
.poll-side-lists .poll-history-list{max-height:330px;overflow-y:auto;padding-right:2px}
.poll-list-count{display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:24px;padding:0 7px;border-radius:999px;background:#eef6ff;color:#2563eb;font-size:11px;font-weight:900}
.poll-modal{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}
.poll-modal.open{display:flex}
.poll-modal-backdrop{position:absolute;inset:0;background:rgba(15,23,42,.48);backdrop-filter:blur(3px)}
.poll-modal-dialog{position:relative;z-index:1;width:min(520px,100%);max-height:calc(100vh - 48px);overflow:auto;border:1px solid #e4ebf2;border-radius:24px;background:#fff;box-shadow:0 24px 70px rgba(15,23,42,.22)}
.poll-modal-body{padding:28px}
.poll-modal-header{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px}
.poll-modal-header h3{margin:0;font-size:21px;font-weight:900}
.poll-modal-close{position:static;flex-shrink:0;width:32px;height:32px;border:0;border-radius:999px;background:#f1f5f9;color:#64748b;font-size:22px;font-weight:900;cursor:pointer}
body.poll-modal-open{overflow:hidden}
@media(max-width:980px){.poll-page-content{grid-template-columns:1fr}.poll-side-lists{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:700px){.poll-side-lists{grid-template-columns:1fr}.poll-hero{align-items:flex-start}.poll-hero-actions{flex-wrap:wrap;justify-content:flex-end}}


.poll-option-image-block.has-image .poll-file-label{display:none}
.poll-option-image-frame{position:relative;display:none;width:88px;height:58px}
.poll-option-image-frame.visible{display:block}
.poll-option-image-frame .poll-image-preview{display:block;width:100%;height:100%}
.poll-option-image-remove{position:absolute;top:-7px;right:-7px;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:2px solid #fff;border-radius:999px;background:#ef4444;color:#fff;font-size:15px;font-weight:900;line-height:1;cursor:pointer;box-shadow:0 3px 8px rgba(15,23,42,.2)}
.poll-option-image-block.has-image .poll-image-name{display:none}


.poll-author{display:inline-flex;align-items:center;gap:5px;color:#64748b;font-size:11px;font-weight:900}
.poll-author::before{content:'작성자';color:#94a3b8;font-weight:800}


.poll-selected-state{display:inline-flex;align-items:center;justify-content:center;height:26px;padding:0 10px;border-radius:999px;background:#f8fafc;border:1px solid #e4ebf2;color:#64748b;font-size:11px;font-weight:900;white-space:nowrap}
.poll-selected-state.active{background:#e9fff9;border-color:#a7f3d0;color:#059669}
.poll-selected-state.closed{background:#f8fafc;border-color:#d8e0e8;color:#64748b}


.poll-detail-status-row{display:flex;justify-content:flex-end;margin-bottom:8px}
.poll-detail-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:6px}
.poll-detail-title-row .active-poll-question{margin:0;min-width:0}
.poll-detail-title-actions{display:flex;align-items:center;gap:7px;flex-shrink:0}


.poll-title-with-status{display:flex;align-items:center;gap:8px;min-width:0}
.poll-title-with-status .active-poll-question{margin:0;min-width:0}
.poll-list-title-row{display:flex;align-items:center;gap:7px;min-width:0}
.poll-list-title-row strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

</style>
</head>
<body>
<jsp:include page="/WEB-INF/views/common/header.jsp"/>
<main class="poll-page">
<a class="poll-top-link" id="backLink" href="#">⬅ 돌아가기</a>
<section class="poll-hero">
    <div>
        <h2 id="pageTitle">투표</h2>
        <p id="pageDescription">의사결정을 투표로 정리합니다.</p>
    </div>
    <div class="poll-hero-actions">
<button type="button" class="poll-open-create-btn" onclick="openPollCreateModal()">+ 투표 만들기</button>
    </div>
</section>

<div class="poll-page-content">
    <section class="poll-card poll-detail-card">
<div id="activePollArea" class="poll-empty">투표를 불러오는 중입니다.</div>
    </section>

    <aside class="poll-side-lists">
        <section class="poll-card">
            <div class="poll-card-head">
                <h3>진행 중인 투표</h3>
                <span id="activePollCount" class="poll-list-count">0</span>
            </div>
            <div id="activePollList" class="poll-history-list">
                <div class="poll-empty">진행 중인 투표를 불러오는 중입니다.</div>
            </div>
        </section>

        <section class="poll-card">
            <div class="poll-card-head">
                <h3>지난 투표</h3>
                <span id="pastPollCount" class="poll-list-count">0</span>
            </div>
            <div id="pastPollList" class="poll-history-list">
                <div class="poll-empty">지난 투표를 불러오는 중입니다.</div>
            </div>
        </section>
    </aside>
</div>

<div id="pollFormModal" class="poll-modal" aria-hidden="true">
    <div class="poll-modal-backdrop" onclick="closePollFormModal()"></div>
    <div class="poll-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="pollFormTitle">
        <div class="poll-modal-body">
            <div class="poll-modal-header">
                <h3 id="pollFormTitle">투표 만들기</h3>
                <button type="button" class="poll-modal-close" onclick="closePollFormModal()" aria-label="닫기">×</button>
            </div>
<div class="poll-form-row"><label>질문</label><input id="pollQuestionInput" class="poll-input" placeholder="예: 회의 시간은 언제가 좋을까요?"></div>
<div class="poll-form-row">
    <label>투표 마감</label>
    <div class="poll-deadline-grid">
        <input id="pollEndDateInput" type="date" class="poll-input">
        <div class="time-unit-wrap"><select id="pollEndHourInput" class="poll-input"></select><span class="time-unit">시</span></div>
        <div class="time-unit-wrap"><select id="pollEndMinuteInput" class="poll-input"></select><span class="time-unit">분</span></div>
    </div>
</div>
<div class="poll-form-row">
    <div class="form-label-row">
        <label>선택지</label>
        <div class="poll-option-toolbar">
            <div class="global-option-type-switch">
                <label><input type="radio" name="pollGlobalOptionType" value="TEXT" checked onchange="switchGlobalPollOptionType(this.value)"> 텍스트</label>
                <label><input type="radio" name="pollGlobalOptionType" value="IMAGE" onchange="switchGlobalPollOptionType(this.value)"> 이미지</label>
            </div>
            <button type="button" class="poll-add-option" onclick="addPollOptionRow()" title="선택지 추가">+</button>
            <button type="button" class="poll-remove-last" onclick="removeLastPollOptionRow()" title="마지막 선택지 삭제">−</button>
        </div>
    </div>
    <div id="pollOptionInputs" class="poll-option-input-list"></div>
</div>
<div class="poll-form-actions">
    <button type="button" id="pollSubmitButton" class="poll-create-btn" onclick="savePoll()">투표 생성</button>
</div>
        </div>
    </div>
</div>
</main>
<jsp:include page="/WEB-INF/views/common/footer.jsp"/>

<script>
const params=new URLSearchParams(window.location.search);
const rawScope=String(params.get('scope')||'WORKSPACE').toUpperCase();
const scope=rawScope==='PROJECT'?'PROJECT':'WORKSPACE';
const wsId=params.get('wsId');
const projId=params.get('projId');
const requestedPollId=params.get('pollId');
let allPolls=[];
let selectedPollId=null;
let editingPollId=null;
let editingCanEditOptions=true;
let globalOptionType='TEXT';

document.addEventListener('DOMContentLoaded',function(){
    initializePollPage();
    initializeDeadlineDefaults();
    addPollOptionRow();
    addPollOptionRow();
    loadPollList(requestedPollId);
});

function openPollCreateModal(){
    if(editingPollId){
        resetCreateForm();
    }
    openPollFormModal();
}

function openPollFormModal(){
    const modal=document.getElementById('pollFormModal');
    if(!modal)return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('poll-modal-open');
}

function closePollFormModal(){
    const modal=document.getElementById('pollFormModal');
    if(!modal)return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('poll-modal-open');
}

document.addEventListener('keydown',function(event){
    if(event.key==='Escape')closePollFormModal();
});

function initializePollPage(){
    const isProject=scope==='PROJECT';
    document.getElementById('pageTitle').innerText=isProject?'프로젝트 투표':'워크스페이스 투표';
    document.getElementById('pageDescription').innerText=isProject?'프로젝트 안에서 필요한 의사결정을 투표로 정리합니다.':'워크스페이스 전체 구성원이 참여하는 의사결정을 투표로 정리합니다.';
    const back=document.getElementById('backLink');
    back.href=isProject?'/project/main?wsId='+encodeURIComponent(wsId||'')+'&projId='+encodeURIComponent(projId||''):'/workspace/main?wsId='+encodeURIComponent(wsId||'');
    back.innerText=isProject?'⬅ 프로젝트로 돌아가기':'⬅ 워크스페이스로 돌아가기';
}

function initializeDeadlineDefaults(){
    const date=new Date();
    date.setDate(date.getDate()+1);
    document.getElementById('pollEndDateInput').value=formatDateInput(date);

    const hour=document.getElementById('pollEndHourInput');
    const minute=document.getElementById('pollEndMinuteInput');
    for(let h=0;h<24;h++){const v=String(h).padStart(2,'0');hour.insertAdjacentHTML('beforeend','<option value="'+v+'" '+(v==='18'?'selected':'')+'>'+v+'</option>');}
    for(let m=0;m<60;m+=10){const v=String(m).padStart(2,'0');minute.insertAdjacentHTML('beforeend','<option value="'+v+'" '+(v==='00'?'selected':'')+'>'+v+'</option>');}
}

function buildScopeQuery(){
    let q='scope='+encodeURIComponent(scope)+'&wsId='+encodeURIComponent(wsId||'');
    if(scope==='PROJECT')q+='&projId='+encodeURIComponent(projId||'');
    return q;
}

function addPollOptionRow(initialData){
    const list=document.getElementById('pollOptionInputs');
    const row=document.createElement('div');
    const text=initialData?(initialData.text||initialData.TEXT||''):'';
    const imagePath=initialData?(initialData.imagePath||initialData.IMAGE_PATH||''):'';
    const storedType=initialData
        ? String(initialData.optionType||initialData.OPTION_TYPE||'').toUpperCase()
        : '';

    // 과거 BOTH 데이터도 이미지 선택지로 취급
    if(initialData && (storedType==='IMAGE' || storedType==='BOTH' || imagePath)){
        globalOptionType='IMAGE';
    }

    row.className='poll-option-edit-row'+(globalOptionType==='IMAGE'?' image-mode':'');
    row.dataset.optionId=initialData?(initialData.optionId||initialData.OPTION_ID||''):'';
    row.dataset.existingImagePath=(globalOptionType==='IMAGE' ? (imagePath||'') : '');
    row.innerHTML=
        '<span class="option-number"></span>'+
        '<div class="poll-option-edit-main">'+
            '<input class="poll-input poll-option-text-input" placeholder="선택지 내용" value="'+escapeHtml(globalOptionType==='TEXT'?text:'')+'">'+
            '<div class="poll-option-image-block'+(globalOptionType==='IMAGE'&&imagePath?' has-image':'')+'">'+
                '<label class="poll-file-label"><span>이미지 선택</span><input type="file" class="poll-option-image-input" accept="image/*" onchange="handlePollOptionImageChange(this)"></label>'+
                '<div class="poll-option-image-frame'+(globalOptionType==='IMAGE'&&imagePath?' visible':'')+'">'+
                    '<img class="poll-image-preview" '+(globalOptionType==='IMAGE'&&imagePath?'src="'+escapeHtml(imagePath)+'"':'')+' alt="미리보기">'+
                    '<button type="button" class="poll-option-image-remove" onclick="removePollOptionImage(this)" aria-label="이미지 제거">×</button>'+
                '</div>'+
                '<span class="poll-image-name">이미지 없음</span>'+
            '</div>'+
        '</div>';

    list.appendChild(row);
    updateOptionRows();
}

function switchGlobalPollOptionType(type){
    globalOptionType=type==='IMAGE'?'IMAGE':'TEXT';

    document.querySelectorAll('.poll-option-edit-row').forEach(function(row){
        row.classList.toggle('image-mode',globalOptionType==='IMAGE');

        if(globalOptionType==='TEXT'){
            const fileInput=row.querySelector('.poll-option-image-input');
            if(fileInput)fileInput.value='';
            row.dataset.existingImagePath='';

            removePollOptionImageFromRow(row);
        }else{
            const textInput=row.querySelector('.poll-option-text-input');
            if(textInput)textInput.value='';
        }
    });
}

function setGlobalOptionType(type){
    globalOptionType=type==='IMAGE'?'IMAGE':'TEXT';
    const input=document.querySelector('input[name="pollGlobalOptionType"][value="'+globalOptionType+'"]');
    if(input)input.checked=true;

    document.querySelectorAll('.poll-option-edit-row').forEach(function(row){
        row.classList.toggle('image-mode',globalOptionType==='IMAGE');
    });
}

function removeLastPollOptionRow(){
    const rows=document.querySelectorAll('.poll-option-edit-row');
    if(rows.length<=2){alert('선택지는 최소 2개가 필요합니다.');return;}
    rows[rows.length-1].remove();
    updateOptionRows();
}

function updateOptionRows(){
    const rows=Array.from(document.querySelectorAll('.poll-option-edit-row'));
    rows.forEach(function(row,index){
        row.querySelector('.option-number').innerText=index+1;
    });
    const minus=document.querySelector('.poll-remove-last');
    if(minus)minus.disabled=rows.length<=2;
}

function handlePollOptionImageChange(input){
    const file=input.files&&input.files[0];
    const row=input.closest('.poll-option-edit-row');
    const block=row.querySelector('.poll-option-image-block');
    const frame=row.querySelector('.poll-option-image-frame');
    const preview=row.querySelector('.poll-image-preview');
    const name=row.querySelector('.poll-image-name');

    if(preview.dataset.objectUrl){
        URL.revokeObjectURL(preview.dataset.objectUrl);
        delete preview.dataset.objectUrl;
    }

    if(!file){
        removePollOptionImageFromRow(row);
        return;
    }

    const objectUrl=URL.createObjectURL(file);
    preview.src=objectUrl;
    preview.dataset.objectUrl=objectUrl;
    frame.classList.add('visible');
    block.classList.add('has-image');
    name.innerText='';
    row.dataset.existingImagePath='';
}

function removePollOptionImage(button){
    const row=button.closest('.poll-option-edit-row');
    removePollOptionImageFromRow(row);
}

function removePollOptionImageFromRow(row){
    const block=row.querySelector('.poll-option-image-block');
    const frame=row.querySelector('.poll-option-image-frame');
    const preview=row.querySelector('.poll-image-preview');
    const fileInput=row.querySelector('.poll-option-image-input');
    const name=row.querySelector('.poll-image-name');

    if(preview.dataset.objectUrl){
        URL.revokeObjectURL(preview.dataset.objectUrl);
        delete preview.dataset.objectUrl;
    }

    preview.removeAttribute('src');
    frame.classList.remove('visible');
    block.classList.remove('has-image');
    fileInput.value='';
    name.innerText='이미지 없음';
    row.dataset.existingImagePath='';
}

async function uploadOptionImage(file){
    if(!file)return null;
    const formData=new FormData();formData.append('image',file);
    const res=await fetch('/api/polls/option-image',{method:'POST',body:formData});
    const result=await res.json();
    if(!result||result.success===false)throw new Error(result&&result.message?result.message:'이미지 업로드 실패');
    return result.imagePath;
}

async function savePoll(){
    const question=document.getElementById('pollQuestionInput').value.trim();
    const endDate=document.getElementById('pollEndDateInput').value;
    const endHour=document.getElementById('pollEndHourInput').value;
    const endMinute=document.getElementById('pollEndMinuteInput').value;
    const rows=Array.from(document.querySelectorAll('.poll-option-edit-row'));

    if(!question){alert('질문을 입력해주세요.');return;}
    if(!endDate){alert('투표 마감일을 선택해주세요.');return;}

    try{
        const options=[];

        if(editingCanEditOptions){
            for(const row of rows){
                const type=globalOptionType;
                if(type==='IMAGE'){
                    const file=row.querySelector('.poll-option-image-input').files[0];
                    let imagePath=row.dataset.existingImagePath||'';
                    if(file)imagePath=await uploadOptionImage(file);
                    if(!imagePath)continue;
                    options.push({
                        optionId:row.dataset.optionId||null,
                        optionType:'IMAGE',
                        text:'',
                        imagePath:imagePath
                    });
                }else{
                    const text=row.querySelector('.poll-option-text-input').value.trim();
                    if(!text)continue;
                    options.push({
                        optionId:row.dataset.optionId||null,
                        optionType:'TEXT',
                        text:text,
                        imagePath:null
                    });
                }
            }

            if(options.length<2){alert('선택지는 2개 이상 입력해주세요.');return;}
        }

        const body={
            question:question,
            endDt:endDate+' '+endHour+':'+endMinute
        };

        let url='/api/polls/create';

        if(editingPollId){
            url='/api/polls/update';
            body.pollId=editingPollId;
            if(editingCanEditOptions)body.options=options;
        }else{
            body.scope=scope;
            body.wsId=wsId;
            body.options=options;
            if(scope==='PROJECT')body.projId=projId;
        }

        const res=await fetch(url,{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify(body)
        });
        const result=await res.json();

        if(!result||result.success===false){
            alert(result&&result.message==='LOGIN_REQUIRED'?'로그인이 필요합니다.':(result&&result.message?result.message:(editingPollId?'투표 수정에 실패했습니다.':'투표 생성에 실패했습니다.')));
            return;
        }

        const preferredId=editingPollId||result.pollId;
        resetCreateForm();
        closePollFormModal();
        await loadPollList(preferredId);
    }catch(err){
        console.error(err);
        alert(editingPollId?'투표 수정 중 오류가 발생했습니다.':'투표 생성 중 오류가 발생했습니다.');
    }
}

function resetCreateForm(){
    editingPollId=null;
    editingCanEditOptions=true;
    document.getElementById('pollFormTitle').innerText='투표 만들기';
    document.getElementById('pollSubmitButton').innerText='투표 생성';
    document.getElementById('pollQuestionInput').value='';
    document.getElementById('pollOptionInputs').innerHTML='';
    setGlobalOptionType('TEXT');
    addPollOptionRow();
    addPollOptionRow();
    initializeDeadlineDefaultsReset();
    setOptionInputsDisabled(false);
}

function cancelPollEdit(){
    resetCreateForm();
    closePollFormModal();
}

function setOptionInputsDisabled(disabled){
    document.querySelectorAll('#pollOptionInputs input,#pollOptionInputs button').forEach(function(el){
        el.disabled=disabled;
    });
    document.querySelectorAll('.poll-option-toolbar button,.global-option-type-switch input').forEach(function(el){
        el.disabled=disabled;
    });
}

async function startPollEdit(pollId){
    try{
        const res=await fetch('/api/polls/detail?pollId='+encodeURIComponent(pollId));
        const data=await res.json();

        if(!data||!data.canManage){
            alert('투표 작성자만 수정할 수 있습니다.');
            return;
        }

        editingPollId=data.pollId;
        editingCanEditOptions=!!data.canEditOptions;

        document.getElementById('pollFormTitle').innerText='투표 수정';
        document.getElementById('pollSubmitButton').innerText='수정 저장';
        document.getElementById('pollQuestionInput').value=data.question||'';

        const deadline=new Date(data.endDt);
        if(!Number.isNaN(deadline.getTime())){
            document.getElementById('pollEndDateInput').value=formatDateInput(deadline);
            document.getElementById('pollEndHourInput').value=String(deadline.getHours()).padStart(2,'0');
            document.getElementById('pollEndMinuteInput').value=String(Math.floor(deadline.getMinutes()/10)*10).padStart(2,'0');
        }

        const list=document.getElementById('pollOptionInputs');
        list.innerHTML='';

        const editOptions=Array.isArray(data.options)?data.options:[];
        const firstOption=editOptions.length>0?editOptions[0]:null;
        const firstType=firstOption
            ? String(firstOption.OPTION_TYPE||firstOption.optionType||'').toUpperCase()
            : '';
        const firstImagePath=firstOption
            ? (firstOption.IMAGE_PATH||firstOption.imagePath||'')
            : '';

        // 기존 데이터가 IMAGE/BOTH이거나 이미지 경로가 있으면 이미지 투표로 복원
        setGlobalOptionType(
            firstType==='IMAGE' || firstType==='BOTH' || !!firstImagePath
                ? 'IMAGE'
                : 'TEXT'
        );

        editOptions.forEach(function(option){addPollOptionRow(option);});
        while(list.children.length<2)addPollOptionRow();

        setOptionInputsDisabled(false);
        openPollFormModal();
    }catch(err){
        console.error(err);
        alert('투표 정보를 불러오지 못했습니다.');
    }
}

async function deletePollItem(pollId){
    if(!confirm('이 투표를 삭제할까요?'))return;

    try{
        const res=await fetch('/api/polls/delete',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({pollId:pollId})
        });
        const result=await res.json();

        if(!result||result.success===false){
            alert(result&&result.message==='LOGIN_REQUIRED'?'로그인이 필요합니다.':(result&&result.message?result.message:'투표 삭제에 실패했습니다.'));
            return;
        }

        if(String(editingPollId)===String(pollId))cancelPollEdit();
        selectedPollId=null;
        await loadPollList();
    }catch(err){
        console.error(err);
        alert('투표 삭제 중 오류가 발생했습니다.');
    }
}

function initializeDeadlineDefaultsReset(){
    const date=new Date();
    date.setDate(date.getDate()+1);
    document.getElementById('pollEndDateInput').value=formatDateInput(date);
    document.getElementById('pollEndHourInput').value='18';
    document.getElementById('pollEndMinuteInput').value='00';
}

async function loadPollList(preferredPollId){
    try{
        const res=await fetch('/api/polls/list?'+buildScopeQuery());
        allPolls=await res.json();
        if(!Array.isArray(allPolls))allPolls=[];

        renderPollHistory();
        selectInitialPoll(preferredPollId);
    }catch(err){
        console.error(err);
        document.getElementById('activePollList').innerHTML='<div class="poll-empty">투표 목록을 불러오지 못했습니다.</div>';
        document.getElementById('pastPollList').innerHTML='<div class="poll-empty">투표 목록을 불러오지 못했습니다.</div>';
    }
}

function selectInitialPoll(preferredPollId){
    if(allPolls.length===0){
        selectedPollId=null;
        const target=document.getElementById('activePollArea');
        target.className='poll-empty';
        target.innerHTML='등록된 투표가 없습니다.';
        updateSelectedPollState(null);
        return;
    }

    let selected=allPolls.find(function(p){
        return String(p.POLL_ID||p.pollId)===String(preferredPollId||selectedPollId||'');
    });

    if(!selected){
        selected=allPolls.find(function(p){return !isPollClosed(p);})||allPolls[0];
    }

    const pollId=selected.POLL_ID||selected.pollId;
    selectedPollId=String(pollId);
    updateSelectedPollState(selected);
    loadPollDetail(pollId);
    renderPollHistory();
}

function updateSelectedPollState(poll){
    // 상태 라벨은 상세 제목과 목록 제목 옆에서 직접 렌더링합니다.
}

async function loadPollDetail(pollId){
    const target=document.getElementById('activePollArea');
    target.className='poll-empty';target.innerHTML='투표를 불러오는 중입니다.';
    try{
        const res=await fetch('/api/polls/detail?pollId='+encodeURIComponent(pollId));
        const data=await res.json();
        renderPollDetail(data);
    }catch(err){console.error(err);target.className='poll-empty';target.innerHTML='투표를 불러오지 못했습니다.';}
}

function renderPollDetail(data){
    const target=document.getElementById('activePollArea');
    if(!data||!data.question){target.className='poll-empty';target.innerHTML='투표 정보가 없습니다.';return;}

    const options=Array.isArray(data.options)?data.options:[];
    const showResults=!!data.showResults;
    const isClosed=!!data.isClosed;
    const hasVoted=!!data.hasVoted;
    const myOptionId=data.myOptionId;
    const total=showResults?options.reduce(function(sum,opt){return sum+Number(opt.COUNT||opt.count||0);},0):0;

    let html='';

    html+='<div class="poll-detail-title-row">';
    html+='<div class="poll-title-with-status">';
    html+='<p class="active-poll-question">'+escapeHtml(data.question)+'</p>';
    html+='<em class="poll-status '+(isClosed?'closed':'active')+'">'+(isClosed?'종료':'진행 중')+'</em>';
    html+='</div>';

    if(data.canManage){
        html+='<div class="poll-detail-title-actions">';
        html+='<button type="button" class="poll-manage-btn" onclick="startPollEdit('+data.pollId+')">수정</button>';
        html+='<button type="button" class="poll-manage-btn delete" onclick="deletePollItem('+data.pollId+')">삭제</button>';
        html+='</div>';
    }

    html+='</div>';
    html+='<div class="active-poll-meta">'+formatDeadline(data.endDt,isClosed);
    if(data.creatorName)html+=' · <span class="poll-author">'+escapeHtml(data.creatorName)+'</span>';
    html+=(showResults?' · 총 '+total+'표':' · 투표 전 결과 비공개');
    if(hasVoted&&!isClosed)html+=' · 참여 완료';
    html+='</div>';
    html+='<div class="poll-option-list">';

    options.forEach(function(opt,index){
        const id=opt.OPTION_ID||opt.optionId;
        const text=opt.TEXT||opt.text||'';
        const image=opt.IMAGE_PATH||opt.imagePath||'';
        const count=opt.COUNT||opt.count||0;
        const selected=String(myOptionId||'')===String(id||'');
        const disabled=isClosed||hasVoted;

        html+='<button type="button" class="poll-option-btn'+(selected?' selected':'')+'" onclick="votePoll('+data.pollId+','+id+')" '+(disabled?'disabled':'')+'>';
        if(image)html+='<img class="poll-option-image" src="'+escapeHtml(image)+'" alt="">';
        html+='<span class="poll-option-bottom"><span class="option-number">'+(index+1)+'</span><span class="poll-option-text">'+escapeHtml(text||'이미지 선택지')+'</span>';
        if(showResults)html+='<span class="poll-count">'+count+'표</span>';
        html+='</span></button>';
    });

    html+='</div>';
    target.className='';
    target.innerHTML=html;
}

async function votePoll(pollId,optionId){
    try{
        const res=await fetch('/api/polls/vote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pollId:pollId,optionId:optionId})});
        const result=await res.json();
        if(!result||result.success===false){alert(result&&result.message==='LOGIN_REQUIRED'?'로그인이 필요합니다.':(result&&result.message?result.message:'투표 반영에 실패했습니다.'));return;}
        await loadPollDetail(pollId);
        await loadPollList(pollId);
    }catch(err){console.error(err);alert('투표 반영 중 오류가 발생했습니다.');}
}

function renderPollHistory(){
    const activeTarget=document.getElementById('activePollList');
    const pastTarget=document.getElementById('pastPollList');
    const activePolls=allPolls.filter(function(p){return !isPollClosed(p);});
    const pastPolls=allPolls.filter(function(p){return isPollClosed(p);});

    document.getElementById('activePollCount').innerText=activePolls.length;
    document.getElementById('pastPollCount').innerText=pastPolls.length;

    activeTarget.innerHTML=renderPollListItems(activePolls,'진행 중인 투표가 없습니다.');
    pastTarget.innerHTML=renderPollListItems(pastPolls,'지난 투표가 없습니다.');
}

function renderPollListItems(list,emptyText){
    if(!list.length)return '<div class="poll-empty">'+emptyText+'</div>';

    return list.map(function(p){
        const id=p.POLL_ID||p.pollId;
        const closed=isPollClosed(p);

        return '<div class="poll-history-item '+(String(selectedPollId)===String(id)?'active':'')+'" onclick="selectPollFromList('+id+')">'+
            '<div>'+
                '<div class="poll-list-title-row">'+
                    '<strong>'+escapeHtml(p.QUESTION||p.question||'질문 없음')+'</strong>'+
                    '<em class="poll-status '+(closed?'closed':'active')+'">'+(closed?'종료':'진행 중')+'</em>'+
                '</div>'+
                '<span>'+((p.CREATOR_NAME||p.creatorName)?'작성자 '+escapeHtml(p.CREATOR_NAME||p.creatorName)+' · ':'')+formatDateTime(p.END_DT||p.endDt)+' 마감</span>'+
            '</div>'+
        '</div>';
    }).join('');
}

function selectPollFromList(id){
    const poll=allPolls.find(function(p){return String(p.POLL_ID||p.pollId)===String(id);});
    if(!poll)return;

    selectedPollId=String(id);
    updateSelectedPollState(poll);
    loadPollDetail(id);
    renderPollHistory();
    document.querySelector('.poll-detail-card').scrollIntoView({behavior:'smooth',block:'start'});
}

function isPollClosed(p){return String(p.STATUS||p.status||'').toUpperCase()==='CLOSED'||isPastDeadline(p.END_DT||p.endDt)}
function isPastDeadline(v){if(!v)return false;const d=new Date(v);return !Number.isNaN(d.getTime())&&d.getTime()<Date.now()}
function formatDeadline(v,closed){return closed?'투표 종료':(v?formatDateTime(v)+' 마감':'마감 없음')}
function formatDateInput(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function formatDateTime(v){if(!v)return '';const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v).substring(0,16);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function escapeHtml(v){return String(v||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
</script>
</body>
</html>
