(function () {
    'use strict';

    const parseJson = async function (response, fallbackMessage) {
        let result;
        try {
            result = await response.json();
        } catch (error) {
            throw new Error(fallbackMessage);
        }

        if (!response.ok || !result || !result.success) {
            throw new Error((result && result.message) || fallbackMessage);
        }
        return result;
    };

    const toParams = function (context, extra) {
        const params = Object.assign({}, extra || {});
        if (!params.scope) params.scope = (context && context.scope) || 'PRIVATE';
        if (context && context.wsId) params.wsId = context.wsId;
        if (context && context.projId) params.projId = context.projId;
        return params;
    };

    const post = async function (url, params, fallbackMessage) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: new URLSearchParams(params)
        });
        return parseJson(response, fallbackMessage);
    };

    window.NoteFolderAdapter = {
        async create(context, data) {
            const result = await post(
                '/note/api/folder/create',
                toParams(context, { folderName: data.folderName }),
                '폴더를 만들지 못했습니다.'
            );
            return {
                folderId: result.folderId,
                folderName: data.folderName,
                depth: 0
            };
        },

        async rename(context, folder) {
            await post(
                '/note/api/folder/rename',
                { folderId: folder.folderId, folderName: folder.folderName },
                '폴더 이름을 수정하지 못했습니다.'
            );
            return folder;
        },

        async remove(context, folder) {
            await post(
                '/note/api/folder/delete',
                { folderId: folder.folderId },
                '폴더를 삭제하지 못했습니다.'
            );
        }
    };
})();
