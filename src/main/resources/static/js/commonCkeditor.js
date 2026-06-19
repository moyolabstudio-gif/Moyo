(function (global) {
    'use strict';

    const DEFAULT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const DEFAULT_MAX_IMAGE_SIZE = 5 * 1024 * 1024;

    function createUploadAdapterPlugin(options) {
        const uploadUrl = options.uploadUrl;
        const imageTypes = options.imageTypes || DEFAULT_IMAGE_TYPES;
        const maxImageSize = options.maxImageSize || DEFAULT_MAX_IMAGE_SIZE;

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
                                    return { default: data.url };
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

    function buildConfig(options) {
        return {
            language: 'ko',
            placeholder: options.placeholder || '내용을 입력하세요.',
            toolbar: {
                items: [
                    'heading', '|',
                    'bold', 'italic', 'underline', '|',
                    'fontColor', 'fontBackgroundColor', '|',
                    'alignment', '|',
                    'numberedList', 'bulletedList', '|',
                    'link', 'uploadImage', 'mediaEmbed', 'insertTable', 'blockQuote', '|',
                    'removeFormat', 'undo', 'redo'
                ],
                shouldNotGroupWhenFull: true
            },
            fontColor: { columns: 6, documentColors: 12 },
            fontBackgroundColor: { columns: 6, documentColors: 12 },
            image: {
                upload: { types: ['jpeg', 'jpg', 'png', 'gif', 'webp'] },
                resizeUnit: '%',
                styles: ['inline', 'alignLeft', 'alignCenter', 'alignRight', 'side'],
                toolbar: [
                    'imageTextAlternative', 'toggleImageCaption', '|',
                    'imageStyle:inline', 'imageStyle:alignLeft', 'imageStyle:alignCenter',
                    'imageStyle:alignRight', 'imageStyle:side', '|',
                    'resizeImage'
                ]
            },
            table: {
                contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', '|', 'tableProperties', 'tableCellProperties'],
                defaultHeadings: { rows: 0, columns: 0 }
            },
            link: {
                addTargetToExternalLinks: true,
                defaultProtocol: 'https://'
            },
            extraPlugins: [createUploadAdapterPlugin(options)],
            removePlugins: [
                'CKBox', 'CKFinder', 'EasyImage', 'RealTimeCollaborativeComments',
                'RealTimeCollaborativeTrackChanges', 'RealTimeCollaborativeRevisionHistory',
                'PresenceList', 'Comments', 'TrackChanges', 'TrackChangesData',
                'RevisionHistory', 'Pagination', 'WProofreader', 'MathType',
                'SlashCommand', 'Template', 'DocumentOutline', 'FormatPainter',
                'TableOfContents', 'PasteFromOfficeEnhanced',
                'AIAssistant', 'AIAdapter', 'OpenAITextAdapter', 'AzureOpenAITextAdapter',
                'CKBoxImageEdit', 'ExportPdf', 'ExportWord', 'ImportWord', 'ImportFromWord',
                'MultiLevelList', 'CaseChange',
                'ListProperties', 'TodoList',
                'TableColumnResize', 'TableCaption'
            ]
        };
    }

    function waitForUploads(editor) {
        if (!editor || !editor._moyoActiveUploads) return Promise.resolve();
        return new Promise(function (resolve) {
            editor._moyoUploadWaiters.push(resolve);
        });
    }

    function bindFormSubmitAfterUploads(editor, sourceElement) {
        const form = sourceElement && sourceElement.closest ? sourceElement.closest('form') : null;
        if (!form || form.dataset.moyoCkeditorUploadGuard === 'true') return;

        form.dataset.moyoCkeditorUploadGuard = 'true';
        form.addEventListener('submit', function (event) {
            sourceElement.value = editor.getData();
            if (!editor._moyoActiveUploads) return;

            event.preventDefault();
            const submitter = event.submitter || null;

            waitForUploads(editor).then(function () {
                sourceElement.value = editor.getData();
                if (typeof form.requestSubmit === 'function') {
                    submitter ? form.requestSubmit(submitter) : form.requestSubmit();
                } else {
                    form.submit();
                }
            });
        }, true);
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
        if (!options.uploadUrl) return Promise.reject(new Error('이미지 업로드 URL이 필요합니다.'));

        return EditorClass.create(element, buildConfig(options)).then(function (editor) {
            if (typeof options.initialData === 'string') editor.setData(options.initialData);
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
