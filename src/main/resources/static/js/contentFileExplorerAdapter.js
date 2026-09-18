(() => {
    'use strict';

    window.MoyoContentExplorerAdapter = {
        type: 'FILE',
        sortOptions: [
            { value: 'NAME_ASC', label: '이름순' },
            { value: 'LATEST', label: '최신순' },
            { value: 'OLDEST', label: '오래된순' },
            { value: 'SIZE_DESC', label: '용량 큰순' },
            { value: 'SIZE_ASC', label: '용량 작은순' }
        ],
        sortItems(rows, sort, { compareText, compareDate }) {
            const nameOf = row => row.displayName || row.originalName || '';
            const dateOf = row => row.updatedAt || row.createdAt || '';
            const sizeOf = row => Number(row.fileSize || 0);
            if (sort === 'LATEST') return rows.sort((a, b) => compareDate(dateOf(b), dateOf(a)) || compareText(nameOf(a), nameOf(b)));
            if (sort === 'OLDEST') return rows.sort((a, b) => compareDate(dateOf(a), dateOf(b)) || compareText(nameOf(a), nameOf(b)));
            if (sort === 'SIZE_DESC') return rows.sort((a, b) => sizeOf(b) - sizeOf(a) || compareText(nameOf(a), nameOf(b)));
            if (sort === 'SIZE_ASC') return rows.sort((a, b) => sizeOf(a) - sizeOf(b) || compareText(nameOf(a), nameOf(b)));
            return rows.sort((a, b) => compareText(nameOf(a), nameOf(b)));
        },
        labels: {
            container: '폴더',
            item: '파일',
            recent: '최근 파일',
            personalRoot: '내 폴더',
            groupRoot: '그룹 폴더',
            createContainer: '새 폴더',
            createItem: '파일 올리기'
        },
        endpoints: {
            containerTree: '/api/file-folders/tree',
            containers: '/api/file-folders',
            items: '/api/files/items',
            recentItems: '/api/files/recent',
            friendShareOwners: '/share/api/friend-owners?contentType=FILE',
            friendShareItems: '/api/files/friend-shares/files',
            trashItems: '/api/file-trash',
            moveItems: '/api/files/move',
            trashMove: '/api/file-trash/move',
            trashRestore: '/api/file-trash/restore',
            trashPermanent: '/api/file-trash/permanent',
            createContainer: '/api/file-folders',
            renameContainer: id => `/api/file-folders/${id}/name`,
            renameItem: id => `/api/files/${id}/name`,
            accessItem: id => `/api/files/${id}/access`,
            downloadItem: id => `/api/files/${id}/download`,
            uploadItems: '/api/files/batch',
            downloadBatch: '/api/files/download-batch'
        },
        mapContainers(folders) {
            return (folders || []).map(folder => ({
                kind: 'folder',
                id: folder.folderId,
                name: folder.folderName,
                count: `${(folder.childFolderCount || 0) + (folder.fileCount || 0)}개 항목`,
                raw: folder
            }));
        },
        mapItems(files, helpers) {
            return (files || []).map(file => ({
                kind: 'file',
                id: file.contentFileId,
                name: file.displayName || file.originalName || '파일',
                uploader: file.creatorName || '알 수 없음',
                uploadedAt: helpers.formatDate(file.createdAt || file.updatedAt),
                fileSize: helpers.formatSize(file.fileSize),
                raw: file
            }));
        },
        afterRender({ grid }) {
            grid?.querySelector(':scope > .file-list-header')?.remove();
        }
    };
})();
