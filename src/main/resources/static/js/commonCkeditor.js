(function (global) {
    'use strict';

    const DEFAULT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const DEFAULT_MAX_IMAGE_SIZE = 5 * 1024 * 1024;

    function createUploadAdapterPlugin(options) {
        const uploadUrl = options.uploadUrl;
        const imageTypes = options.imageTypes || DEFAULT_IMAGE_TYPES;
        const maxImageSize = options.maxImageSize || DEFAULT_MAX_IMAGE_SIZE;
        const resolveUploadedUrl = typeof options.resolveUploadedUrl === 'function'
            ? options.resolveUploadedUrl
            : function (url) { return url; };

        return function MoyoUploadAdapterPlugin(editor) {
            editor._moyoActiveUploads = 0;
            editor._moyoUploadWaiters = [];

            function finishOneUpload() {
                editor._moyoActiveUploads = Math.max(0, editor._moyoActiveUploads - 1);
                if (editor._moyoActiveUploads !== 0) return;
                editor._moyoUploadWaiters.splice(0).forEach(function (resolve) { resolve(); });
            }

            editor.plugins.get('FileRepository').createUploadAdapter = function (loader) {
                let controller = null;
                let active = false;

                return {
                    upload: function () {
                        if (!active) {
                            active = true;
                            editor._moyoActiveUploads += 1;
                        }

                        return loader.file.then(function (file) {
                            if (!imageTypes.includes(file.type)) {
                                throw new Error('본문 이미지는 jpg, png, gif, webp 형식만 업로드할 수 있습니다.');
                            }
                            if (file.size > maxImageSize) {
                                throw new Error('본문 이미지는 5MB 이하만 업로드할 수 있습니다.');
                            }

                            const formData = new FormData();
                            formData.append('upload', file);
                            controller = new AbortController();

                            return fetch(uploadUrl, {
                                method: 'POST',
                                body: formData,
                                signal: controller.signal
                            }).then(function (response) {
                                return response.json().catch(function () { return {}; }).then(function (data) {
                                    if (!response.ok || !data.uploaded || !data.url) {
                                        const message = data && data.error && data.error.message
                                            ? data.error.message
                                            : '이미지 업로드에 실패했습니다.';
                                        throw new Error(message);
                                    }
                                    return { default: resolveUploadedUrl(data.url) };
                                });
                            });
                        }).finally(function () {
                            if (active) {
                                active = false;
                                finishOneUpload();
                            }
                        });
                    },
                    abort: function () {
                        if (controller) controller.abort();
                    }
                };
            };
        };
    }



    async function uploadEmbeddedDataImages(editor, options) {
        if (!editor || !options || !options.uploadUrl) return;

        const html = editor.getData();
        if (!/src\s*=\s*["']data:image\//i.test(html)) return;

        const doc = new DOMParser().parseFromString(html, 'text/html');
        const images = Array.from(doc.querySelectorAll('img[src^="data:image/"]'));
        if (!images.length) return;

        const imageTypes = options.imageTypes || DEFAULT_IMAGE_TYPES;
        const maxImageSize = options.maxImageSize || DEFAULT_MAX_IMAGE_SIZE;
        const resolveUploadedUrl = typeof options.resolveUploadedUrl === 'function'
            ? options.resolveUploadedUrl
            : function (url) { return url; };

        editor._moyoActiveUploads += images.length;

        try {
            for (let i = 0; i < images.length; i += 1) {
                const image = images[i];
                const dataUrl = image.getAttribute('src');
                const commaIndex = dataUrl ? dataUrl.indexOf(',') : -1;
                if (!dataUrl || commaIndex < 0) {
                    throw new Error('본문 이미지 데이터를 읽을 수 없습니다.');
                }

                const header = dataUrl.substring(0, commaIndex);
                const payload = dataUrl.substring(commaIndex + 1);
                const mimeMatch = /^data:([^;,]+)(;base64)?$/i.exec(header);
                if (!mimeMatch) {
                    throw new Error('본문 이미지 형식을 확인할 수 없습니다.');
                }

                const mimeType = String(mimeMatch[1] || '').toLowerCase();
                const isBase64 = !!mimeMatch[2];
                let bytes;
                if (isBase64) {
                    const binary = atob(payload);
                    bytes = new Uint8Array(binary.length);
                    for (let j = 0; j < binary.length; j += 1) bytes[j] = binary.charCodeAt(j);
                } else {
                    const decoded = decodeURIComponent(payload);
                    bytes = new TextEncoder().encode(decoded);
                }
                const blob = new Blob([bytes], { type: mimeType });

                if (!imageTypes.includes(blob.type)) {
                    throw new Error('본문 이미지는 jpg, png, gif, webp 형식만 업로드할 수 있습니다.');
                }
                if (blob.size > maxImageSize) {
                    throw new Error('본문 이미지는 5MB 이하만 업로드할 수 있습니다.');
                }

                const extensionMap = {
                    'image/jpeg': 'jpg',
                    'image/png': 'png',
                    'image/gif': 'gif',
                    'image/webp': 'webp'
                };
                const extension = extensionMap[blob.type] || 'bin';
                const fileName = 'editor-' + Date.now() + '-' + i + '.' + extension;
                const file = new File([blob], fileName, { type: blob.type });
                const formData = new FormData();
                formData.append('upload', file);

                const response = await fetch(options.uploadUrl, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json().catch(function () { return {}; });
                if (!response.ok || !data.uploaded || !data.url) {
                    const message = data && data.error && data.error.message
                        ? data.error.message
                        : '이미지 업로드에 실패했습니다.';
                    throw new Error(message);
                }

                image.setAttribute('src', resolveUploadedUrl(data.url));
            }

            editor.setData(doc.body.innerHTML);
        } finally {
            editor._moyoActiveUploads = Math.max(0, editor._moyoActiveUploads - images.length);
            if (editor._moyoActiveUploads === 0) {
                editor._moyoUploadWaiters.splice(0).forEach(function (resolve) { resolve(); });
            }
        }
    }

    function collectSelectedSoftBreaks(editor) {
        const selection = editor.model.document.selection;
        if (selection.isCollapsed) return [];

        const softBreaks = [];
        for (const range of selection.getRanges()) {
            for (const item of range.getItems()) {
                if (item && item.is && item.is('element', 'softBreak')) {
                    softBreaks.push(item);
                }
            }
        }
        return softBreaks;
    }

    function splitSelectedSoftBreaksIntoParagraphs(editor) {
        const model = editor.model;
        const selection = model.document.selection;
        const softBreaks = collectSelectedSoftBreaks(editor);
        if (!softBreaks.length) return false;

        model.change(function (writer) {
            const selectedBlocks = Array.from(selection.getSelectedBlocks());
            if (!selectedBlocks.length) return;

            const firstBlock = selectedBlocks[0];
            let lastBlock = selectedBlocks[selectedBlocks.length - 1];

            /*
             * 뒤쪽 줄바꿈부터 나눠야 앞쪽 offset이 변하지 않는다.
             * softBreak 자체는 제거하고 그 위치에서 block을 분리한다.
             */
            softBreaks.reverse().forEach(function (softBreak) {
                const block = softBreak.parent;
                const blockParent = block && block.parent;
                if (!block || !blockParent) return;

                const splitOffset = softBreak.startOffset;
                writer.remove(softBreak);
                const splitResult = writer.split(
                    writer.createPositionAt(block, splitOffset),
                    blockParent
                );

                const rightBlock = splitResult && splitResult.position
                    ? splitResult.position.nodeAfter
                    : null;
                if (block === selectedBlocks[selectedBlocks.length - 1] && rightBlock) {
                    lastBlock = rightBlock;
                }
            });

            writer.setSelection(
                writer.createPositionAt(firstBlock, 0),
                writer.createPositionAt(lastBlock, 'end')
            );
        });

        return true;
    }

    function bindCommonListLineNormalization(editor) {
        if (!editor || editor._moyoListLineNormalizationBound) return;
        editor._moyoListLineNormalizationBound = true;

        const originalExecute = editor.execute.bind(editor);
        editor.execute = function (commandName) {
            const args = Array.prototype.slice.call(arguments, 1);
            if (commandName === 'numberedList' || commandName === 'bulletedList') {
                splitSelectedSoftBreaksIntoParagraphs(editor);
            }
            return originalExecute.apply(null, [commandName].concat(args));
        };
    }

    const MOYO_EDITOR_COLORS = [
        { color: 'hsl(0, 0%, 0%)', label: 'Black' },
        { color: 'hsl(0, 0%, 30%)', label: 'Dim gray' },
        { color: 'hsl(0, 0%, 60%)', label: 'Gray' },
        { color: 'hsl(0, 0%, 90%)', label: 'Light gray' },
        { color: 'hsl(0, 75%, 60%)', label: 'Red' },
        { color: 'hsl(25, 90%, 55%)', label: 'Orange' },
        { color: 'hsl(45, 95%, 55%)', label: 'Yellow' },
        { color: 'hsl(145, 65%, 42%)', label: 'Green' },
        { color: 'hsl(200, 85%, 50%)', label: 'Sky blue' },
        { color: 'hsl(221, 83%, 53%)', label: 'Blue' },
        { color: 'hsl(260, 85%, 62%)', label: 'Purple' },
        { color: 'hsl(330, 80%, 60%)', label: 'Pink' }
    ];

    const PROFILE_TOOLBARS = {
        BOARD: [
            'heading', '|', 'bold', 'italic', 'underline', '|',
            'fontColor', 'fontBackgroundColor', '|', 'alignment', '|',
            'numberedList', 'bulletedList', 'outdent', 'indent', '|',
            'link', 'uploadImage', 'mediaEmbed', 'insertTable', 'blockQuote', '|',
            'removeFormat', 'undo', 'redo'
        ],
        NOTE: [
            'heading', '|', 'bold', 'italic', 'underline', '|',
            'fontColor', 'fontBackgroundColor', '|', 'alignment', '|',
            'numberedList', 'bulletedList', 'outdent', 'indent', '|',
            'link', 'uploadImage', 'mediaEmbed', 'insertTable', 'blockQuote', '|',
            'removeFormat', 'undo', 'redo'
        ],
        RECORD: [
            'heading', '|', 'bold', 'italic', 'underline', '|',
            'numberedList', 'bulletedList', 'outdent', 'indent', '|', 'alignment', '|',
            'fontColor', 'fontBackgroundColor', '|',
            'insertTable', 'uploadImage', '|', 'undo', 'redo'
        ],
        LEGACY: [
            'heading', '|', 'bold', 'italic', 'underline', '|',
            'fontColor', 'fontBackgroundColor', '|', 'alignment', '|',
            'numberedList', 'bulletedList', '|',
            'link', 'uploadImage', 'mediaEmbed', 'insertTable', 'blockQuote', '|',
            'removeFormat', 'undo', 'redo'
        ]
    };

    function buildConfig(options) {
        const profile = String(options.profile || 'LEGACY').toUpperCase();
        const toolbarItems = PROFILE_TOOLBARS[profile] || PROFILE_TOOLBARS.LEGACY;
        const config = {
            language: 'ko',
            placeholder: options.placeholder || '내용을 입력하세요.',
            toolbar: {
                items: toolbarItems.slice(),
                shouldNotGroupWhenFull: profile === 'RECORD' || profile === 'NOTE'
            },
            fontColor: { columns: 6, colors: MOYO_EDITOR_COLORS, documentColors: 0, colorPicker: false },
            fontBackgroundColor: { columns: 6, colors: MOYO_EDITOR_COLORS, documentColors: 0, colorPicker: false },
            image: {
                upload: { types: ['jpeg', 'jpg', 'png', 'gif', 'webp'] },
                resizeUnit: '%',
                styles: ['inline', 'alignLeft', 'alignCenter', 'alignRight', 'side'],
                toolbar: [
                    'imageTextAlternative', 'toggleImageCaption', '|',
                    'imageStyle:inline', 'imageStyle:alignLeft', 'imageStyle:alignCenter',
                    'imageStyle:alignRight', 'imageStyle:side', '|', 'resizeImage'
                ]
            },
            table: {
                contentToolbar: [
                    'tableColumn', 'tableRow', 'mergeTableCells', '|',
                    'tableProperties', 'tableCellProperties'
                ],
                defaultHeadings: { rows: 0, columns: 0 }
            },
            link: { addTargetToExternalLinks: true, defaultProtocol: 'https://' },
            mediaEmbed: { previewsInData: true },
            removePlugins: [
                'CKBox', 'CKFinder', 'EasyImage', 'RealTimeCollaborativeComments',
                'RealTimeCollaborativeTrackChanges', 'RealTimeCollaborativeRevisionHistory',
                'PresenceList', 'Comments', 'TrackChanges', 'TrackChangesData',
                'RevisionHistory', 'Pagination', 'WProofreader', 'MathType',
                'SlashCommand', 'Template', 'DocumentOutline', 'FormatPainter',
                'TableOfContents', 'PasteFromOfficeEnhanced',
                'AIAssistant', 'AIAdapter', 'OpenAITextAdapter', 'AzureOpenAITextAdapter',
                'CKBoxImageEdit', 'ExportPdf', 'ExportWord', 'ImportWord', 'ImportFromWord',
                'MultiLevelList', 'CaseChange', 'ListProperties', 'TodoList',
                'TableColumnResize', 'TableCaption'
            ]
        };
        if (options.uploadUrl) config.extraPlugins = [createUploadAdapterPlugin(options)];
        return config;
    }

    function validateImageSources(html) {
        const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
        const invalidImage = Array.from(doc.querySelectorAll('img')).find(function (image) {
            const source = String(image.getAttribute('src') || '').trim();
            return !source || /^data:image\//i.test(source);
        });
        if (invalidImage) {
            throw new Error('본문 이미지 업로드가 완료되지 않았습니다. 이미지를 다시 확인한 뒤 저장해주세요.');
        }
    }

    function waitForUploads(editor) {
        if (!editor) return Promise.resolve();

        const flushEmbedded = editor._moyoUploadOptions && editor._moyoUploadOptions.uploadUrl
            ? uploadEmbeddedDataImages(editor, editor._moyoUploadOptions)
            : Promise.resolve();

        return Promise.resolve(flushEmbedded).then(function () {
            if (!editor._moyoActiveUploads) {
                validateImageSources(editor.getData());
                return;
            }
            return new Promise(function (resolve) {
                editor._moyoUploadWaiters.push(resolve);
            }).then(function () {
                validateImageSources(editor.getData());
            });
        });
    }

    function bindFormSubmitAfterUploads(editor, sourceElement) {
        const form = sourceElement && sourceElement.closest ? sourceElement.closest('form') : null;
        if (!form || form.dataset.moyoCkeditorUploadGuard === 'true') return;

        form.dataset.moyoCkeditorUploadGuard = 'true';
        form.addEventListener('submit', function (event) {
            sourceElement.value = editor.getData();

            if (form.dataset.moyoCkeditorUploadSubmitting === 'true') {
                delete form.dataset.moyoCkeditorUploadSubmitting;
                return;
            }

            const currentHtml = editor.getData();
            const hasEmbeddedDataImage = /src\s*=\s*["']data:image\//i.test(currentHtml);
            try {
                if (!editor._moyoActiveUploads && !hasEmbeddedDataImage) {
                    validateImageSources(currentHtml);
                    return;
                }
            } catch (error) {
                event.preventDefault();
                console.error('[MOYO CKEditor] 본문 이미지 검증 실패:', error);
                alert(error && error.message ? error.message : '본문 이미지를 확인해주세요.');
                return;
            }

            event.preventDefault();
            const submitter = event.submitter || null;

            waitForUploads(editor).then(function () {
                sourceElement.value = editor.getData();
                form.dataset.moyoCkeditorUploadSubmitting = 'true';
                if (typeof form.requestSubmit === 'function') {
                    submitter ? form.requestSubmit(submitter) : form.requestSubmit();
                } else {
                    form.submit();
                }
            }).catch(function (error) {
                console.error('[MOYO CKEditor] 본문 이미지 업로드 실패:', error);
                alert(error && error.message ? error.message : '본문 이미지 업로드에 실패했습니다.');
            });
        }, true);
    }

    function stabilizeNoteEditorUi(editor) {
        if (!editor || !editor.ui || !editor.ui.view) return;

        const root = editor.ui.view.element;
        if (!root) return;

        function hidePoweredBy() {
            document.querySelectorAll('.ck-powered-by, .ck-powered-by-balloon, [class*="ck-powered-by"]').forEach(function (node) {
                node.style.setProperty('display', 'none', 'important');
                node.style.setProperty('visibility', 'hidden', 'important');
            });

            document.querySelectorAll('a, span, div').forEach(function (node) {
                const text = String(node.textContent || '').trim().toLowerCase();
                if (text === 'powered by ckeditor' || text === 'powered by ckeditor 5') {
                    const target = node.closest('.ck-balloon-panel') || node;
                    target.style.setProperty('display', 'none', 'important');
                    target.style.setProperty('visibility', 'hidden', 'important');
                }
            });
        }

        function normalizeToolbar() {
            const toolbar = root.querySelector('.ck.ck-toolbar');
            const items = toolbar && toolbar.querySelector('.ck-toolbar__items');
            if (toolbar) {
                toolbar.style.setProperty('display', 'flex', 'important');
                toolbar.style.setProperty('align-items', 'center', 'important');
                toolbar.style.setProperty('flex-wrap', 'nowrap', 'important');
                toolbar.style.setProperty('overflow', 'hidden', 'important');
                toolbar.style.setProperty('min-height', '42px', 'important');
            }
            if (items) {
                items.style.setProperty('display', 'flex', 'important');
                items.style.setProperty('align-items', 'center', 'important');
                items.style.setProperty('flex-wrap', 'nowrap', 'important');
                items.style.setProperty('min-width', 'max-content', 'important');
                items.style.setProperty('width', 'max-content', 'important');
                items.style.setProperty('overflow', 'visible', 'important');
            }
        }

        function refresh() {
            normalizeToolbar();
            hidePoweredBy();
        }

        refresh();
        requestAnimationFrame(refresh);
        setTimeout(refresh, 100);
        setTimeout(refresh, 500);

        const observer = new MutationObserver(refresh);
        observer.observe(document.body, { childList: true, subtree: true });
        editor.once('destroy', function () {
            observer.disconnect();
        });
    }


    // NOTE / RECORD: 툴바는 한 줄로 유지하되 폭을 넘는 항목은 오른쪽부터 '항목 단위'로 숨긴다.
    // CKEditor 기본 더보기 그룹은 사용하지 않는다. 버튼이 반쯤 잘리거나 떠 보이는 현상 방지.
    function bindToolbarItemFit(editor) {
        if (!editor || !editor.ui || !editor.ui.view) return;
        const root = editor.ui.view.element;
        if (!root) return;

        const toolbar = root.querySelector('.ck.ck-toolbar');
        const items = toolbar && toolbar.querySelector('.ck-toolbar__items');
        if (!toolbar || !items) return;

        let rafId = 0;

        function setVisible(node, visible) {
            if (!node) return;
            if (visible) {
                node.style.removeProperty('display');
                node.removeAttribute('data-moyo-toolbar-hidden');
            } else {
                node.style.setProperty('display', 'none', 'important');
                node.setAttribute('data-moyo-toolbar-hidden', 'true');
            }
        }

        function isSeparator(node) {
            return !!(node && node.classList && node.classList.contains('ck-toolbar__separator'));
        }

        function fitNow() {
            rafId = 0;
            const children = Array.from(items.children);
            if (!children.length) return;

            toolbar.style.setProperty('display', 'flex', 'important');
            toolbar.style.setProperty('align-items', 'center', 'important');
            toolbar.style.setProperty('flex-wrap', 'nowrap', 'important');
            toolbar.style.setProperty('overflow', 'hidden', 'important');
            toolbar.style.setProperty('max-width', '100%', 'important');

            items.style.setProperty('display', 'flex', 'important');
            items.style.setProperty('align-items', 'center', 'important');
            items.style.setProperty('flex-wrap', 'nowrap', 'important');
            items.style.setProperty('flex', '0 0 auto', 'important');
            items.style.setProperty('min-width', 'max-content', 'important');
            items.style.setProperty('width', 'max-content', 'important');
            items.style.setProperty('max-width', 'none', 'important');
            items.style.setProperty('overflow', 'visible', 'important');

            // 먼저 전부 복구한 뒤 현재 폭 기준으로 다시 계산한다.
            children.forEach(function (node) { setVisible(node, true); });

            const available = toolbar.clientWidth;
            if (!available) return;

            for (let i = children.length - 1; i >= 0 && items.scrollWidth > available; i--) {
                setVisible(children[i], false);
                // 끝에 구분선만 남으면 함께 숨긴다.
                let lastVisible = null;
                for (let j = i - 1; j >= 0; j--) {
                    if (!children[j].hasAttribute('data-moyo-toolbar-hidden')) {
                        lastVisible = children[j];
                        break;
                    }
                }
                if (isSeparator(lastVisible)) setVisible(lastVisible, false);
            }
        }

        function scheduleFit() {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(fitNow);
        }

        scheduleFit();
        setTimeout(scheduleFit, 80);
        setTimeout(scheduleFit, 250);

        const resizeObserver = typeof ResizeObserver === 'function'
            ? new ResizeObserver(scheduleFit)
            : null;
        if (resizeObserver) resizeObserver.observe(toolbar);
        else window.addEventListener('resize', scheduleFit);

        editor.once('destroy', function () {
            if (rafId) cancelAnimationFrame(rafId);
            if (resizeObserver) resizeObserver.disconnect();
            else window.removeEventListener('resize', scheduleFit);
        });
    }

    function create(elementOrSelector, options) {
        options = options || {};
        const element = typeof elementOrSelector === 'string'
            ? document.querySelector(elementOrSelector)
            : elementOrSelector;
        const EditorClass = global.CKEDITOR && global.CKEDITOR.ClassicEditor
            ? global.CKEDITOR.ClassicEditor
            : global.ClassicEditor;

        if (!element) return Promise.reject(new Error('CKEditor 대상 요소를 찾을 수 없습니다.'));
        if (!EditorClass) return Promise.reject(new Error('CKEditor 스크립트가 로드되지 않았습니다.'));

        return EditorClass.create(element, buildConfig(options)).then(function (editor) {
            const profile = String(options.profile || 'LEGACY').toUpperCase();
            const editorElement = editor.ui && editor.ui.view && editor.ui.view.element
                ? editor.ui.view.element
                : null;
            if (editorElement) {
                editorElement.classList.add('moyo-ckeditor');
                editorElement.classList.add('moyo-ckeditor--' + profile.toLowerCase());
            }
            editor._moyoUploadOptions = options;
            editor.flushEmbeddedDataImages = function () {
                return uploadEmbeddedDataImages(editor, options);
            };
            if (profile === 'NOTE') {
                stabilizeNoteEditorUi(editor);
            }
            if (profile === 'NOTE' || profile === 'RECORD') {
                bindToolbarItemFit(editor);
            }
            if (String(options.profile || '').toUpperCase() === 'BOARD') {
                Object.defineProperty(editor, '_boardUploadCount', {
                    configurable: true,
                    get: function () { return editor._moyoActiveUploads || 0; }
                });
                editor.waitForBoardUploads = function () { return waitForUploads(editor); };
                editor.flushBoardDataImages = function () {
                    return uploadEmbeddedDataImages(editor, options);
                };
            }
            if (typeof options.initialData === 'string') editor.setData(options.initialData);
            bindCommonListLineNormalization(editor);
            bindFormSubmitAfterUploads(editor, element);
            if (typeof options.onReady === 'function') options.onReady(editor);
            return editor;
        });
    }

    global.MoyoCkeditor = {
        create: create,
        buildConfig: buildConfig,
        waitForUploads: waitForUploads
    };
})(window);
