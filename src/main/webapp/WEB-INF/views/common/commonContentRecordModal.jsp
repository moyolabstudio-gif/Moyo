<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<link rel="stylesheet" href="${pageContext.request.contextPath}/css/common/commonNoteHistoryModal.css">
<script src="${pageContext.request.contextPath}/js/common/commonNoteHistoryModal.js"></script>

<div id="commonContentRecordModal" class="moyo-record-modal" hidden aria-hidden="true">
    <div class="moyo-record-modal__backdrop" data-record-modal-close></div>
    <section class="moyo-record-modal__panel" role="dialog" aria-modal="true" aria-labelledby="commonContentRecordTitle">
        <header class="moyo-record-modal__header">
            <div>
                <h3 id="commonContentRecordTitle">기록</h3>
                <p data-record-target-label>일정과 관련된 내용을 한곳에 남깁니다.</p>
            </div>
            <button type="button" class="moyo-record-modal__close" data-record-modal-close aria-label="닫기">
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
        </header>

        <div class="moyo-record-modal__permission" data-record-permission-note hidden></div>

        <nav class="moyo-record-modal__tabs" role="tablist" aria-label="기록 자료 유형">
            <button type="button" role="tab" class="is-active" data-record-tab="NOTE" aria-selected="true"><i class="fa-regular fa-note-sticky"></i>노트 <b data-record-count="NOTE">0</b></button>
            <button type="button" role="tab" data-record-tab="PHOTO" aria-selected="false"><i class="fa-regular fa-image"></i>사진 <b data-record-count="PHOTO">0</b></button>
            <button type="button" role="tab" data-record-tab="FILE" aria-selected="false"><i class="fa-solid fa-paperclip"></i>파일 <b data-record-count="FILE">0</b></button>
            <button type="button" role="tab" data-record-tab="LINK" aria-selected="false"><i class="fa-solid fa-link"></i>링크 <b data-record-count="LINK">0</b></button>
            <button type="button" role="tab" data-record-tab="LOCATION" aria-selected="false"><i class="fa-solid fa-location-dot"></i>장소 <b data-record-count="LOCATION">0</b></button>
        </nav>

        <div class="moyo-record-modal__body">
            <div class="moyo-record-modal__loading" data-record-loading hidden><i class="fa-solid fa-spinner fa-spin"></i> 기록을 불러오는 중입니다.</div>

            <section class="moyo-record-section is-active" data-record-section="NOTE">
                <div class="moyo-record-note-tabs" data-record-note-tabs></div>
                <div class="moyo-record-note-editor" data-record-note-editor></div>
            </section>

            <section class="moyo-record-section moyo-record-content-section" data-record-section="PHOTO" hidden>
                <form class="moyo-record-photo-upload" data-record-form="PHOTO" enctype="multipart/form-data">
                    <input type="file" name="files" accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,.heic,.heif" multiple hidden data-record-photo-input>
                    <button type="button" class="moyo-record-photo-dropzone" data-record-photo-dropzone>
                        <i class="fa-regular fa-images"></i>
                        <strong>사진을 선택하거나 끌어다 놓으세요</strong>
                        <span>사진당 최대 10MB · 한 번에 최대 10장 선택</span>
                    </button>
                </form>
                <div class="moyo-record-photo-list-wrap moyo-record-content-list-wrap" data-record-photo-list-wrap>
                    <div class="moyo-record-photo-grid" data-record-photo-list></div>
                    <div class="moyo-record-section__empty" data-record-empty="PHOTO" hidden><i class="fa-regular fa-image"></i><strong>사진이 없습니다.</strong><span>위 영역에서 이 기록과 관련된 사진을 추가하세요.</span></div>
                </div>
                <div class="moyo-record-content-footer">
                    <span><i class="fa-solid fa-circle-info" aria-hidden="true"></i> 사진당 최대 10MB · 한 번에 최대 10장 선택 · 기록당 총 100MB</span>
                </div>
            </section>

            <section class="moyo-record-section moyo-record-content-section" data-record-section="FILE" hidden>
                <form class="moyo-record-file-upload" data-record-form="FILE" enctype="multipart/form-data">
                    <input type="file" name="files" multiple hidden data-record-file-input>
                    <button type="button" class="moyo-record-file-dropzone" data-record-file-dropzone>
                        <i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i>
                        <strong>파일을 선택하거나 끌어다 놓으세요</strong>
                        <span>파일당 최대 20MB · 한 번에 최대 10개 선택</span>
                    </button>
                </form>
                <div class="moyo-record-file-list-wrap moyo-record-content-list-wrap" data-record-file-list-wrap>
                    <div class="moyo-record-file-list" data-record-file-list></div>
                    <div class="moyo-record-section__empty" data-record-empty="FILE" hidden>
                        <i class="fa-regular fa-file"></i>
                        <strong>파일이 없습니다.</strong>
                        <span>위 영역에서 이 기록과 관련된 파일을 추가하세요.</span>
                    </div>
                </div>
                <div class="moyo-record-content-footer">
                    <span><i class="fa-solid fa-circle-info" aria-hidden="true"></i> 파일당 최대 20MB · 한 번에 최대 10개 선택 · 기록당 총 100MB</span>
                </div>
            </section>

            <section class="moyo-record-section moyo-record-content-section" data-record-section="LINK" hidden>
                <header class="moyo-record-section__header moyo-record-link-header">
                    <div><strong>링크 추가</strong><span>주소와 선택 정보를 입력하세요.</span></div>
                </header>
                <form class="moyo-record-link-form" data-record-form="LINK">
                    <input type="hidden" name="recordItemId">
                    <div class="moyo-record-link-form__url-row">
                        <input type="text" name="linkUrl" maxlength="2000" required inputmode="url" autocomplete="url" placeholder="https://example.com" aria-label="링크 주소">
                        <button type="button" class="moyo-record-link-cancel" data-record-link-cancel><span>취소</span></button>
                        <button type="submit" class="moyo-record-link-submit" aria-label="링크 추가"><i class="fa-solid fa-plus"></i><span data-record-link-submit-label>링크 추가</span></button>
                    </div>
                    <div class="moyo-record-link-form__details">
                        <input type="text" name="title" maxlength="500" placeholder="링크 이름 (선택)" aria-label="링크 이름">
                        <input type="text" name="description" maxlength="1000" placeholder="간단한 설명 (선택)" aria-label="링크 설명">
                    </div>
                </form>
                <div class="moyo-record-content-list-wrap" data-record-link-list-wrap>
                    <div class="moyo-record-link-list" data-record-link-list></div>
                    <div class="moyo-record-section__empty" data-record-empty="LINK" hidden><i class="fa-solid fa-link"></i><strong>링크가 없습니다.</strong><span>위 영역에서 이 기록과 관련된 링크를 추가하세요.</span></div>
                </div>
                <div class="moyo-record-content-footer">
                    <span><i class="fa-solid fa-circle-info" aria-hidden="true"></i> URL만 입력해도 추가할 수 있으며 링크 이름과 설명은 선택 항목입니다.</span>
                </div>
            </section>

            <section class="moyo-record-section moyo-record-content-section" data-record-section="LOCATION" hidden>
                <header class="moyo-record-section__header moyo-record-location-header">
                    <div><strong>장소 추가</strong><span>장소를 직접 입력하거나 주소를 검색하세요.</span></div>
                </header>
                <form class="moyo-record-location-form" data-record-form="LOCATION">
                    <input type="hidden" name="recordItemId">
                    <div class="moyo-record-location-form__primary">
                        <input type="text" name="locationText" required maxlength="500" autocomplete="off" placeholder="장소명 또는 주소" aria-label="장소명 또는 주소">
                        <button type="button" class="moyo-record-location-search" data-record-location-search><i class="fa-solid fa-magnifying-glass"></i><span>검색</span></button>
                        <button type="button" class="moyo-record-location-cancel" data-record-location-cancel><span>취소</span></button>
                        <button type="submit" class="moyo-record-location-submit" data-record-location-submit><i class="fa-solid fa-plus"></i><span>장소 추가</span></button>
                    </div>
                    <input type="hidden" name="locationAddress">
                    <input type="hidden" name="locationLat">
                    <input type="hidden" name="locationLng">
                    <input type="hidden" name="locationPlaceId">
                    <div class="moyo-record-location-detail" data-record-location-detail>
                        <input type="text" name="memo" maxlength="1000" placeholder="상세 위치 (선택)" aria-label="상세 위치">
                        <input type="text" name="locationDescription" maxlength="1000" placeholder="설명 (선택)" aria-label="장소 설명">
                    </div>
                    <div class="moyo-record-location-preview" data-record-location-preview hidden>
                        <div class="moyo-record-location-preview__head">
                            <div><strong>지도 미리보기</strong><span data-record-location-preview-address></span></div>
                            <button type="button" data-record-location-map-open><i class="fa-solid fa-arrow-up-right-from-square"></i><span>지도보기</span></button>
                        </div>
                        <iframe data-record-location-map title="장소 지도 미리보기" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                </form>
                <div class="moyo-record-content-list-wrap" data-record-location-list-wrap>
                    <div class="moyo-record-location-current" data-record-location-current></div>
                    <div class="moyo-record-section__empty" data-record-empty="LOCATION" hidden><i class="fa-solid fa-location-dot"></i><strong>장소가 없습니다.</strong><span>위 영역에서 이 기록과 관련된 장소를 추가하세요.</span></div>
                </div>
                <div class="moyo-record-content-footer">
                    <span><i class="fa-solid fa-circle-info" aria-hidden="true"></i> 장소를 검색하거나 직접 입력할 수 있으며 대표 장소는 목록에서 설정할 수 있습니다.</span>
                </div>
            </section>
        </div>
    </section>
</div>
