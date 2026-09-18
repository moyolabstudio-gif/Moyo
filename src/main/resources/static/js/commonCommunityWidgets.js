(function (window, document) {
    'use strict';

    var DEFAULT_LIMITS = Object.freeze({ board: 3, schedule: 3, poll: 2, activity: 4 });
    var widgetStates = Object.create(null);
    var BOARD_LABELS = Object.freeze({
        NOTICE: { empty: '아직 공지사항이 없습니다.', description: '새로운 공지가 등록되면 이곳에서 확인할 수 있습니다.' },
        FREE: { empty: '아직 자유 피드가 없습니다.', description: '멤버들과 가볍게 이야기를 시작해보세요.' },
    });

    function text(value) {
        return value === null || value === undefined ? '' : String(value);
    }

    function escapeHtml(value) {
        return text(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function path(config, value) {
        var contextPath = text(config.contextPath).replace(/\/$/, '');
        var normalized = text(value).trim();
        if (!normalized) return contextPath;
        if (/^(?:https?:)?\/\//i.test(normalized) || /^(?:data|blob):/i.test(normalized)) return normalized;
        if (contextPath && (normalized === contextPath || normalized.indexOf(contextPath + '/') === 0)) return normalized;
        return contextPath + (normalized.charAt(0) === '/' ? normalized : '/' + normalized);
    }

    function firstValue(source, keys) {
        source = source || {};
        for (var i = 0; i < keys.length; i += 1) {
            var value = source[keys[i]];
            if (value !== null && value !== undefined && text(value).trim() !== '') return value;
        }
        return '';
    }

    function profileImageOf(source) {
        /*
         * Privacy rule: activity avatars may use only the profile image saved
         * for the current group/project membership. Never fall back to the
         * account profile image or another DOM/header profile image.
         */
        return firstValue(source, [
            'projectMemberProfileImagePath', 'PROJECT_MEMBER_PROFILE_IMAGE_PATH',
            'projMemberProfileImagePath', 'PROJ_MEMBER_PROFILE_IMAGE_PATH',
            'memberProfileImagePath', 'MEMBER_PROFILE_IMAGE_PATH',
            'workspaceProfileImagePath', 'WORKSPACE_PROFILE_IMAGE_PATH',
            'wsProfileImagePath', 'WS_PROFILE_IMAGE_PATH',
            'groupProfileImagePath', 'GROUP_PROFILE_IMAGE_PATH',
            'projectMemberProfileImage', 'PROJECT_MEMBER_PROFILE_IMAGE',
            'projMemberProfileImage', 'PROJ_MEMBER_PROFILE_IMAGE',
            'memberProfileImage', 'MEMBER_PROFILE_IMAGE',
            'workspaceProfileImage', 'WORKSPACE_PROFILE_IMAGE',
            'wsProfileImage', 'WS_PROFILE_IMAGE',
            'groupProfileImage', 'GROUP_PROFILE_IMAGE'
        ]);
    }

    function query(params) {
        return Object.keys(params || {}).filter(function (key) {
            return params[key] !== '' && params[key] !== null && params[key] !== undefined;
        }).map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
        }).join('&');
    }

    function requestJson(url) {
        return fetch(url, { credentials: 'same-origin' }).then(function (response) {
            if (!response.ok) throw new Error('API 응답 오류: ' + response.status);
            return response.json();
        });
    }


    function firstArray(value, keys) {
        if (Array.isArray(value)) return value;
        if (!value || typeof value !== 'object') return [];
        for (var i = 0; i < keys.length; i += 1) {
            if (Array.isArray(value[keys[i]])) return value[keys[i]];
        }
        return [];
    }

    function setListState(targetId, message, stateClass) {
        var target = document.getElementById(targetId);
        if (!target) return;
        target.innerHTML = '<li class="workspace-empty-state moyo-widget-state ' + escapeHtml(stateClass || '') + '">' + escapeHtml(message) + '</li>';
    }

    function hasActivityData(state) {
        if (!state) return false;
        var boards = state.activityBoards || {};
        var hasBoards = Object.keys(boards).some(function (type) {
            return Array.isArray(boards[type]) && boards[type].length > 0;
        });
        return hasBoards
            || (Array.isArray(state.activityFiles) && state.activityFiles.length > 0)
            || (Array.isArray(state.activityPolls) && state.activityPolls.length > 0)
            || (Array.isArray(state.activityNotes) && state.activityNotes.length > 0)
            || (Array.isArray(state.activityPhotos) && state.activityPhotos.length > 0)
            || (Array.isArray(state.activityMembers) && state.activityMembers.length > 0)
            || (Array.isArray(state.activityLeaves) && state.activityLeaves.length > 0);
    }

    function setActivityLoading(config) {
        // 노트/사진/멤버 이벤트가 커뮤니티 위젯보다 먼저 도착할 수 있다.
        // 이미 확보한 활동이 있다면 로딩 UI로 다시 덮지 않아 초기화 순서에 따른 깜박임/누락을 막는다.
        if (config && hasActivityData(config.state)) {
            renderRecentActivity(config);
            return;
        }
        var count = document.getElementById('recentActivityHeaderCount');
        if (count) count.textContent = '최근 3일';
        var target = document.getElementById('recentActivityList');
        if (target) target.innerHTML = '<li class="workspace-compact-empty-state workspace-core-state moyo-widget-state is-loading"><span>최근 활동을 불러오는 중입니다.</span></li>';
    }

    function setPollLoading() {
        var count = document.getElementById('activePollHeaderCount');
        if (count) count.textContent = '0';
        var target = document.getElementById('activePollArea');
        if (target) target.innerHTML = '<div class="workspace-poll-summary-body is-empty"><div class="workspace-compact-empty-state workspace-core-state workspace-poll-summary-loading moyo-widget-state is-loading"><span>투표를 불러오는 중입니다.</span></div></div>';
    }

    function setBoardLoading() {
        setListState('noticeList', '공지사항을 불러오는 중입니다.', 'is-loading');
        setListState('freeList', '자유 피드를 불러오는 중입니다.', 'is-loading');
        setListState('fileList', '자료실을 불러오는 중입니다.', 'is-loading');
    }

    function createWidgetState() {
        return {
            todayItems: [],
            activityBoards: {},
            activityFiles: [],
            activityPolls: [],
            activityNotes: [],
            activityPhotos: [],
            activityMembers: [],
            activityLeaves: [],
            memberProfilesByUserId: Object.create(null),
            requestSeq: { boards: 0, polls: 0 }
        };
    }

    function normalizeConfig(input) {
        var config = Object.assign({}, input || {});
        config.scope = text(config.scope || 'WORKSPACE').toUpperCase();
        config.isProject = config.scope === 'PROJECT';
        config.limits = Object.assign({}, DEFAULT_LIMITS, config.limits || {});
        config.wsId = text(config.wsId);
        config.projId = text(config.projId);
        config.stateKey = config.scope + ':' + (config.isProject ? config.projId : config.wsId);
        if (!widgetStates[config.stateKey]) widgetStates[config.stateKey] = createWidgetState();
        config.state = widgetStates[config.stateKey];
        if (!config.state.requestSeq) config.state.requestSeq = { boards: 0, polls: 0 };
        return config;
    }

    function boardApiUrl(config) {
        return config.isProject
            ? path(config, '/api/workspace/project/' + encodeURIComponent(config.projId) + '/dashboard-widgets')
            : path(config, '/api/workspace/' + encodeURIComponent(config.wsId) + '/dashboard-widgets');
    }

    function pollApiUrl(config) {
        return path(config, '/api/polls/list?' + query({
            scope: config.scope,
            wsId: config.wsId,
            projId: config.isProject ? config.projId : ''
        }));
    }

    function pollDetailApiUrl(config, pollId) {
        return path(config, '/api/polls/detail?' + query({ pollId: pollId }));
    }

    function boardListUrl(config, type) {
        return path(config, '/group/board/list?' + query({
            wsId: config.wsId,
            projId: config.isProject ? config.projId : '',
            type: type
        }));
    }

    function fileListUrl(config, fileId) {
        var params = { wsId: config.wsId };
        if (config.isProject) params.projId = config.projId;
        if (fileId) params.fileId = fileId;
        return config.isProject
            ? path(config, '/project/files?' + query(params))
            : path(config, '/group/files?' + query(params));
    }

    function boardWriteUrl(config, type) {
        return path(config, '/group/board/write?' + query({
            wsId: config.wsId,
            projId: config.isProject ? config.projId : '',
            type: type
        }));
    }

    function boardDetailUrl(config, post) {
        return path(config, '/group/board/detail?' + query({
            postId: post.postId,
            wsId: post.wsId || config.wsId,
            projId: config.isProject ? config.projId : ''
        }));
    }

    function pollListUrl(config, pollId) {
        return path(config, '/poll/list?' + query({
            scope: config.scope,
            wsId: config.wsId,
            projId: config.isProject ? config.projId : '',
            pollId: pollId || ''
        }));
    }

    function normalizeBoardPost(raw) {
        raw = raw || {};
        return {
            postId: raw.postId || raw.POST_ID || '',
            userId: raw.userId || raw.USER_ID || raw.writerId || raw.WRITER_ID || raw.createdBy || raw.CREATED_BY || '',
            wsId: raw.wsId || raw.WS_ID || '',
            title: raw.title || raw.TITLE || '제목 없음',
            regDt: raw.regDt || raw.REG_DT || raw.createdAt || raw.CREATED_AT || '',
            replyCount: Number(raw.replyCount || raw.REPLY_COUNT || 0),
            pinned: text(raw.isPinned || raw.IS_PINNED).toUpperCase() === 'Y',
            writerName: raw.writerName || raw.WRITER_NAME || '멤버',
            writerProfile: profileImageOf(raw),
            boardType: text(raw.boardType || raw.BOARD_TYPE).toUpperCase()
        };
    }

    function normalizeContentFile(raw) {
        raw = raw || {};
        return {
            contentFileId: raw.contentFileId || raw.CONTENT_FILE_ID || '',
            originalName: raw.originalName || raw.ORIGINAL_NAME || '이름 없는 파일',
            createdAt: raw.createdAt || raw.CREATED_AT || '',
            creatorId: raw.creatorId || raw.CREATOR_ID || raw.userId || raw.USER_ID || '',
            creatorName: raw.creatorName || raw.CREATOR_NAME || raw.userName || raw.USER_NAME || '멤버',
            creatorProfile: profileImageOf(raw)
        };
    }

    function normalizePoll(raw, detail) {
        raw = raw || {};
        detail = detail || {};
        return {
            pollId: raw.pollId || raw.POLL_ID || detail.pollId || detail.POLL_ID || '',
            userId: detail.userId || detail.USER_ID || detail.creatorId || detail.CREATOR_ID || raw.userId || raw.USER_ID || raw.creatorId || raw.CREATOR_ID || '',
            question: detail.question || detail.QUESTION || raw.question || raw.QUESTION || '질문 없음',
            creatorName: detail.creatorName || detail.CREATOR_NAME || raw.creatorName || raw.CREATOR_NAME || '작성자 미상',
            endDt: detail.endDt || detail.END_DT || raw.endDt || raw.END_DT || '',
            status: text(raw.status || raw.STATUS || detail.status || detail.STATUS).toUpperCase(),
            hasVoted: detail.hasVoted === true || (detail.myOptionId !== null && detail.myOptionId !== undefined && text(detail.myOptionId) !== ''),
            createdAt: detail.createdAt || detail.CREATED_AT || detail.regDt || detail.REG_DT || raw.createdAt || raw.CREATED_AT || raw.regDt || raw.REG_DT || '',
            creatorProfile: profileImageOf(detail) || profileImageOf(raw)
        };
    }

    function isPollClosed(poll) {
        if (poll.status === 'CLOSED') return true;
        if (!poll.endDt) return false;
        var time = new Date(poll.endDt).getTime();
        return !Number.isNaN(time) && time < Date.now();
    }

    function formatDate(value) {
        if (!value) return '';
        var date = new Date(value);
        if (Number.isNaN(date.getTime())) return text(value).substring(0, 10);
        return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    }

    function formatDeadline(value) {
        if (!value) return '마감 없음';
        var date = new Date(value);
        if (Number.isNaN(date.getTime())) return text(value).substring(0, 16) + ' 마감';
        return formatDate(date) + ' ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0') + ' 마감';
    }

    function setLoading(config) {
        setBoardLoading();
        setActivityLoading(config);
        setPollLoading();
    }

    function renderBoard(config, targetId, rawList, type) {
        var target = document.getElementById(targetId);
        if (!target) return;
        var list = Array.isArray(rawList) ? rawList.map(normalizeBoardPost) : [];
        if (!list.length) {
            var labels = BOARD_LABELS[type] || { empty: '등록된 글이 없습니다.', description: '새로운 글이 등록되면 이곳에서 확인할 수 있습니다.' };
            var canWrite = type !== 'NOTICE' || config.canManageNotice === true;
            var href = canWrite ? boardWriteUrl(config, type) : boardListUrl(config, type);
            var action = canWrite ? (type === 'NOTICE' ? '공지 작성하기' : '첫 글 남기기') : '게시판 보기';
            target.innerHTML = '<li class="workspace-compact-empty-state workspace-board-compact-empty moyo-widget-state is-empty">' +
                '<strong>' + escapeHtml(labels.empty) + '</strong><span>' + escapeHtml(labels.description) + '</span>' +
                '<a href="' + escapeHtml(href) + '">' + action + '</a></li>';
            return;
        }
        target.innerHTML = list.slice(0, config.limits.board).map(function (post) {
            var pin = type === 'NOTICE' && post.pinned ? '<span class="pin-badge">고정</span>' : '';
            var reply = post.replyCount > 0 ? '<span class="reply-badge">' + post.replyCount + '</span>' : '';
            return '<li class="board-item"><a href="' + escapeHtml(boardDetailUrl(config, post)) + '">' + pin +
                '<span>' + escapeHtml(post.title) + '</span>' + reply + '</a>' +
                '<span class="board-date">' + escapeHtml(formatDate(post.regDt)) + '</span></li>';
        }).join('');
    }

    function renderFiles(config, rawList) {
        var target = document.getElementById('fileList');
        if (!target) return;
        var list = Array.isArray(rawList) ? rawList.map(normalizeContentFile) : [];
        if (!list.length) {
            target.innerHTML = '<li class="workspace-compact-empty-state workspace-board-compact-empty moyo-widget-state is-empty">' +
                '<strong>아직 자료가 없습니다.</strong><span>함께 사용할 파일이 등록되면 이곳에서 확인할 수 있습니다.</span>' +
                '<a href="' + escapeHtml(fileListUrl(config)) + '">자료실 보기</a></li>';
            return;
        }
        target.innerHTML = list.slice(0, config.limits.board).map(function (file) {
            return '<li class="board-item"><a href="' + escapeHtml(fileListUrl(config, file.contentFileId)) + '">' +
                '<span>' + escapeHtml(file.originalName) + '</span></a>' +
                '<span class="board-date">' + escapeHtml(formatDate(file.createdAt)) + '</span></li>';
        }).join('');
    }

    function renderBoardError(targetId, retryName) {
        var target = document.getElementById(targetId);
        if (!target) return;
        target.innerHTML = '<li class="workspace-empty-state workspace-board-empty-line moyo-widget-state is-error"><span>내용을 불러오지 못했습니다.</span>' +
            '<button type="button" class="workspace-load-retry" onclick="' + retryName + '()">다시 시도</button></li>';
    }

    function parseActivityDate(value) {
        var raw = text(value).trim();
        if (!raw) return null;
        var now = new Date();
        if (/^\d{2}:\d{2}$/.test(raw)) {
            var timeOnly = raw.split(':');
            return new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(timeOnly[0]), Number(timeOnly[1]), 0, 0);
        }

        // ISO 문자열에 Z 또는 UTC 오프셋이 있으면 실제 시각으로 먼저 해석한다.
        // 이전 코드는 앞부분만 정규식으로 잘라 로컬 시각으로 재생성해 9시간 오차가 났다.
        if (/T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)) {
            var zoned = new Date(raw);
            if (!Number.isNaN(zoned.getTime())) return zoned;
        }

        // Oracle TIMESTAMP처럼 시간대 정보가 없는 값은 화면의 로컬 시간으로 해석한다.
        var match = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/);
        if (match) {
            return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4] || 0), Number(match[5] || 0), Number(match[6] || 0), 0);
        }
        var parsed = new Date(raw);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    function activityTimestamp(value) {
        var parsed = parseActivityDate(value);
        return parsed ? parsed.getTime() : 0;
    }

    function activityDateLabel(value) {
        var date = parseActivityDate(value);
        if (!date) return formatDate(value);
        var now = new Date();
        var diffMs = now.getTime() - date.getTime();
        var diffMinutes = Math.floor(diffMs / 60000);
        var sameDay = now.getFullYear() === date.getFullYear() && now.getMonth() === date.getMonth() && now.getDate() === date.getDate();
        var yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        var isYesterday = yesterday.getFullYear() === date.getFullYear() && yesterday.getMonth() === date.getMonth() && yesterday.getDate() === date.getDate();
        var time = String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');

        if (sameDay && diffMs >= 0 && diffMinutes < 1) return '방금 전';
        if (sameDay && diffMs >= 0 && diffMinutes < 60) return diffMinutes + '분 전';
        if (sameDay) return '오늘 ' + time;
        if (isYesterday) return '어제 ' + time;
        return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    }

    function resolveActivityProfile(config, name, directPath, userId) {
        var key = text(userId).trim();
        var memberProfiles = config && config.state ? config.state.memberProfilesByUserId : null;
        var mappedPath = key && memberProfiles ? text(memberProfiles[key]).trim() : '';
        if (mappedPath) return path(config, mappedPath);

        // 탈퇴 이력처럼 현재 멤버 목록에서 더 이상 찾을 수 없는 경우에만
        // API가 명시적으로 내려준 공간 멤버 프로필 전용 필드를 사용한다.
        var memberProfilePath = text(directPath).trim();
        return memberProfilePath ? path(config, memberProfilePath) : '';
    }

    function normalizeNoteActivity(raw) {
        raw = raw || {};
        return {
            kind: 'NOTE',
            id: raw.noteId || raw.NOTE_ID || '',
            userId: raw.userId || raw.USER_ID || raw.authorId || raw.AUTHOR_ID || raw.writerId || raw.WRITER_ID || raw.createdBy || raw.CREATED_BY || '',
            title: raw.noteTitle || raw.NOTE_TITLE || raw.title || raw.TITLE || '제목 없는 노트',
            writerName: raw.authorName || raw.AUTHOR_NAME || raw.userName || raw.USER_NAME || raw.writerName || raw.WRITER_NAME || '멤버',
            writerProfile: profileImageOf(raw),
            regDt: raw.moyoPublicAt || raw.MOYO_PUBLIC_AT || raw.updDt || raw.UPD_DT || raw.regDt || raw.REG_DT || raw.createdAt || raw.CREATED_AT || ''
        };
    }


    function normalizePhotoActivity(raw) {
        raw = raw || {};
        return {
            kind: 'PHOTO',
            id: raw.postId || raw.POST_ID || raw.id || '',
            userId: raw.userId || raw.USER_ID || raw.creatorId || raw.CREATOR_ID || raw.authorId || raw.AUTHOR_ID || raw.createdBy || raw.CREATED_BY || '',
            title: raw.title || raw.TITLE || raw.postTitle || raw.POST_TITLE || raw.description || raw.DESCRIPTION || '사진 게시물',
            writerName: raw.creatorName || raw.CREATOR_NAME || raw.userName || raw.USER_NAME || raw.authorName || raw.AUTHOR_NAME || '멤버',
            writerProfile: profileImageOf(raw),
            regDt: raw.createdAt || raw.CREATED_AT || raw.regDt || raw.REG_DT || raw.writeDate || raw.WRITE_DATE || ''
        };
    }

    function photoActivityUrl(config, photo) {
        return path(config, '/photo-album?' + query({
            scopeType: config.isProject ? 'PROJECT' : 'WORKSPACE',
            scopeId: config.isProject ? config.projId : config.wsId,
            postId: photo.id
        }));
    }

    function normalizeMemberActivity(raw) {
        raw = raw || {};
        return {
            kind: 'JOIN',
            id: raw.userId || raw.USER_ID || '',
            title: '그룹에 새 멤버가 참여했어요.',
            writerName: raw.name || raw.userName || raw.USER_NAME || '멤버',
            writerProfile: profileImageOf(raw),
            regDt: raw.joinedAt || raw.JOINED_AT || ''
        };
    }

    function noteDetailActivityUrl(config, note) {
        return path(config, '/note/detail?' + query({
            noteId: note.id,
            scope: config.isProject ? 'PROJ' : 'WS',
            wsId: config.wsId,
            projId: config.isProject ? config.projId : ''
        }));
    }

    function renderRecentActivity(config) {
        var target = document.getElementById('recentActivityList');
        var count = document.getElementById('recentActivityHeaderCount');
        if (!target) return;
        var items = [];
        var boards = config.state.activityBoards || {};
        Object.keys(boards).forEach(function (type) {
            (boards[type] || []).forEach(function (raw) {
                var post = normalizeBoardPost(raw);
                post.kind = type;
                post.href = boardDetailUrl(config, post);
                items.push(post);
            });
        });
        (config.state.activityFiles || []).forEach(function (raw) {
            var file = normalizeContentFile(raw);
            items.push({
                kind: 'FILE',
                id: file.contentFileId,
                userId: file.creatorId,
                title: file.originalName,
                writerName: file.creatorName,
                writerProfile: file.creatorProfile,
                regDt: file.createdAt,
                href: fileListUrl(config, file.contentFileId)
            });
        });
        (config.state.activityPolls || []).forEach(function (raw) {
            var poll = normalizePoll(raw);
            items.push({
                kind: 'POLL',
                id: poll.pollId,
                userId: poll.userId,
                title: poll.question,
                writerName: poll.creatorName,
                writerProfile: poll.creatorProfile,
                regDt: poll.createdAt,
                href: pollListUrl(config, poll.pollId)
            });
        });
        (config.state.activityNotes || []).forEach(function (raw) {
            var note = normalizeNoteActivity(raw);
            note.href = noteDetailActivityUrl(config, note);
            items.push(note);
        });
        (config.state.activityPhotos || []).forEach(function (raw) {
            var photo = normalizePhotoActivity(raw);
            photo.href = photoActivityUrl(config, photo);
            items.push(photo);
        });
        // 멤버 가입/탈퇴 활동은 그룹 자체의 활동이다.
        // 그룹 기반 프로젝트의 현재 멤버 목록을 JOIN 활동으로 오인하지 않는다.
        if (!config.isProject) {
            (config.state.activityMembers || []).forEach(function (raw) {
                var member = normalizeMemberActivity(raw);
                member.href = '#';
                items.push(member);
            });
            (config.state.activityLeaves || []).forEach(function (raw) {
                items.push({ kind: 'LEAVE', id: raw.userId || raw.USER_ID || '', title: '그룹에서 탈퇴했어요.', writerName: raw.name || raw.userName || raw.USER_NAME || '멤버', writerProfile: profileImageOf(raw), regDt: raw.regDt || raw.REG_DT || '', href: '#' });
            });
        }
        var meta = {
            NOTICE: '공지사항을 등록했어요.',
            FREE: '자유 피드에 글을 남겼어요.',
            FILE: '자료를 공유했어요.',
            POLL: '새 투표를 등록했어요.',
            NOTE: '노트를 공유했어요.',
            PHOTO: '사진을 공유했어요.',
            JOIN: '그룹에 참여했어요.',
            LEAVE: '그룹에서 탈퇴했어요.'
        };
        var recentActivityNow = Date.now();
        var recentActivityCutoff = recentActivityNow - (3 * 24 * 60 * 60 * 1000);
        items = items.filter(function (item) {
            if (!item.regDt) return false;
            var timestamp = activityTimestamp(item.regDt);
            return timestamp >= recentActivityCutoff && timestamp <= recentActivityNow + 60000;
        });

        // 같은 소스가 중복 전달되거나 재요청 응답이 겹쳐도 같은 활동은 한 번만 표시한다.
        var unique = Object.create(null);
        items = items.filter(function (item) {
            var id = text(item.id).trim();
            var key = text(item.kind) + ':' + (id || [text(item.userId), text(item.regDt), text(item.title)].join('|'));
            if (unique[key]) return false;
            unique[key] = true;
            item._activityKey = key;
            return true;
        });

        // 시간값이 같은 경우에도 순서가 실행 타이밍에 따라 흔들리지 않도록 보조 키를 사용한다.
        items.sort(function (a, b) {
            var timeDiff = activityTimestamp(b.regDt) - activityTimestamp(a.regDt);
            if (timeDiff) return timeDiff;
            return text(a._activityKey).localeCompare(text(b._activityKey));
        });
        if (count) count.textContent = '최근 3일';
        if (!items.length) {
            var emptyActivityCopy = config.isProject
                ? '프로젝트의 글, 노트, 사진과 투표 활동을 알려드려요.'
                : '그룹의 글, 노트, 사진, 투표와 멤버 변화를 알려드려요.';
            target.innerHTML = '<li class="workspace-compact-empty-state workspace-core-state moyo-widget-state is-empty"><strong>아직 새로운 활동이 없습니다.</strong><span>' + escapeHtml(emptyActivityCopy) + '</span></li>';
            return;
        }
        // 최근 3일 활동은 전부 유지한다. 프로젝트 메인에서는 4개 높이만 노출하고
        // 5번째부터 카드 내부 스크롤로 확인한다.
        target.innerHTML = items.map(function (item) {
            var initial = text(item.writerName).trim().substring(0, 1) || 'M';
            var profile = resolveActivityProfile(config, item.writerName, item.writerProfile, item.userId || item.id);
            var avatar = profile
                ? '<span class="workspace-recent-activity-avatar has-image"><img src="' + escapeHtml(profile) + '" alt="" onerror="this.parentNode.classList.remove(\'has-image\');this.remove();"></span>'
                : '<span class="workspace-recent-activity-avatar"><span>' + escapeHtml(initial) + '</span></span>';
            var body = avatar +
                '<span class="workspace-recent-activity-main"><span class="workspace-recent-activity-action"><strong>' + escapeHtml(item.writerName) + '</strong>님이 ' + escapeHtml(meta[item.kind] || '새 활동을 남겼어요.') + '</span><small>' + escapeHtml(item.title) + '</small></span>' +
                '<time>' + escapeHtml(activityDateLabel(item.regDt)) + '</time>';
            var href = text(item.href).trim();
            if (!href || href === '#') {
                return '<li><div class="workspace-recent-activity-item is-static">' + body + '</div></li>';
            }
            var activityAttrs = '';
            if (item.kind === 'NOTE') {
                activityAttrs = ' data-recent-note-id="' + escapeHtml(item.id) + '"' +
                    ' data-recent-scope-type="' + (config.isProject ? 'PROJECT' : 'GROUP') + '"' +
                    ' data-recent-scope-id="' + escapeHtml(config.isProject ? config.projId : config.wsId) + '"' +
                    ' data-recent-ws-id="' + escapeHtml(config.wsId) + '"' +
                    ' data-recent-proj-id="' + escapeHtml(config.isProject ? config.projId : '') + '"';
            } else if (item.kind === 'PHOTO') {
                activityAttrs = ' data-recent-photo-id="' + escapeHtml(item.id) + '"';
            } else if (item.kind === 'JOIN') {
                activityAttrs = ' data-recent-member-id="' + escapeHtml(item.id) + '"';
            }
            return '<li><a class="workspace-recent-activity-item" href="' + escapeHtml(href) + '"' + activityAttrs + '>' + body + '</a></li>';
        }).join('');

        // The shared community stylesheet owns the three-row scroll viewport.
    }

    function renderPolls(config, polls) {
        var target = document.getElementById('activePollArea');
        var count = document.getElementById('activePollHeaderCount');
        if (!target) return;
        var active = (Array.isArray(polls) ? polls : []).filter(function (poll) { return !isPollClosed(poll); });
        active.sort(function (a, b) {
            var aTime = a.endDt ? new Date(a.endDt).getTime() : Number.POSITIVE_INFINITY;
            var bTime = b.endDt ? new Date(b.endDt).getTime() : Number.POSITIVE_INFINITY;
            if (Number.isNaN(aTime)) aTime = Number.POSITIVE_INFINITY;
            if (Number.isNaN(bTime)) bTime = Number.POSITIVE_INFINITY;
            return aTime - bTime;
        });
        if (count) {
            count.textContent = String(active.length);
            count.hidden = active.length === 0;
        }
        if (!active.length) {
            target.innerHTML = '<div class="workspace-poll-summary-body is-empty"><div class="workspace-compact-empty-state workspace-core-state workspace-poll-summary-empty moyo-widget-state is-empty"><strong>등록된 투표가 없습니다.</strong>' +
                '<span>의견을 모아야 할 때 새 투표를 시작해보세요.</span><a href="' + escapeHtml(pollListUrl(config)) + '">투표 만들기</a></div></div>';
            return;
        }
        target.innerHTML = '<div class="workspace-poll-summary-body"><div class="workspace-poll-summary-list">' + active.slice(0, config.limits.poll).map(function (poll) {
            var statusText = poll.hasVoted ? '참여 완료' : '참여 필요';
            var statusClass = poll.hasVoted ? 'is-complete' : 'is-open';
            return '<a class="workspace-poll-summary-item" href="' + escapeHtml(pollListUrl(config, poll.pollId)) + '">' +
                '<span class="workspace-poll-summary-main"><strong>' + escapeHtml(poll.question) + '</strong>' +
                '<small>작성자 ' + escapeHtml(poll.creatorName) + ' · ' + escapeHtml(formatDeadline(poll.endDt)) + '</small></span>' +
                '<span class="workspace-poll-summary-side"><em class="workspace-poll-summary-status ' + statusClass + '">' + statusText + '</em></span></a>';
        }).join('') + '</div></div>';
    }

    function renderPollError(retryName) {
        var target = document.getElementById('activePollArea');
        if (target) target.innerHTML = '<div class="workspace-poll-summary-body is-empty"><div class="workspace-compact-empty-state workspace-core-state workspace-poll-summary-error moyo-widget-state is-error"><strong>투표를 불러오지 못했습니다.</strong>' +
            '<button type="button" class="workspace-load-retry" onclick="' + retryName + '()">다시 시도</button></div></div>';
    }

    function loadBoards(input) {
        var config = normalizeConfig(input);
        var requestSeq = ++config.state.requestSeq.boards;
        setBoardLoading();
        return requestJson(boardApiUrl(config)).then(function (data) {
            if (requestSeq !== config.state.requestSeq.boards) return data;
            data = data || {};
            var notices = firstArray(data, ['notice', 'notices', 'noticeBoards']);
            var freePosts = firstArray(data, ['free', 'freeBoards', 'freePosts']);
            var files = firstArray(data, ['files']);
            renderBoard(config, 'noticeList', notices, 'NOTICE');
            renderBoard(config, 'freeList', freePosts, 'FREE');
            renderFiles(config, files);
            config.state.activityBoards = { NOTICE: notices, FREE: freePosts };
            config.state.activityFiles = files;
            renderRecentActivity(config);
            return data;
        }).catch(function (error) {
            if (requestSeq !== config.state.requestSeq.boards) return null;
            renderBoardError('noticeList', config.retryBoards || 'loadBoardWidgets');
            renderBoardError('freeList', config.retryBoards || 'loadBoardWidgets');
            renderBoardError('fileList', config.retryBoards || 'loadBoardWidgets');

            // 게시판 위젯 실패를 최근 활동 전체 실패로 전파하지 않는다.
            // 최근 활동은 게시판/투표/노트/사진/멤버 등 여러 소스를 합치는 영역이므로
            // 실패한 게시판 데이터만 비우고, 현재까지 확보된 다른 활동으로 다시 렌더링한다.
            config.state.activityBoards = {};
            config.state.activityFiles = [];
            renderRecentActivity(config);
            throw error;
        });
    }

    function loadPolls(input) {
        var config = normalizeConfig(input);
        var requestSeq = ++config.state.requestSeq.polls;
        setPollLoading();
        return requestJson(pollApiUrl(config)).then(function (data) {
            if (requestSeq !== config.state.requestSeq.polls) return [];
            var list = firstArray(data, ['items', 'polls', 'list']);
            var allPolls = list.map(function (raw) { return normalizePoll(raw); });
            var activeRaw = allPolls.filter(function (poll) { return !isPollClosed(poll); });

            // 최근활동은 '현재 진행 중인가'가 아니라 '투표가 생성되었는가'를 보여주는 영역이다.
            // 종료된 투표도 생성 시각이 최신이면 최근활동 후보에 남긴다.
            config.state.activityPolls = allPolls;
            if (!activeRaw.length) {
                renderPolls(config, []);
                renderRecentActivity(config);
                return [];
            }
            return Promise.all(activeRaw.slice(0, config.limits.poll).map(function (poll) {
                if (!poll.pollId) return Promise.resolve(poll);
                return requestJson(pollDetailApiUrl(config, poll.pollId)).then(function (detail) {
                    return normalizePoll(poll, detail);
                }).catch(function () { return poll; });
            })).then(function (preview) {
                if (requestSeq !== config.state.requestSeq.polls) return [];
                var previewMap = {};
                preview.forEach(function (poll) { previewMap[text(poll.pollId)] = poll; });
                var normalized = activeRaw.map(function (poll) { return previewMap[text(poll.pollId)] || poll; });
                // 진행 중 투표는 상세 응답으로 보강하되, 최근활동 후보는 종료된 투표까지 유지한다.
                var activityMap = Object.create(null);
                allPolls.forEach(function (poll) { activityMap[text(poll.pollId)] = poll; });
                normalized.forEach(function (poll) { activityMap[text(poll.pollId)] = poll; });
                config.state.activityPolls = Object.keys(activityMap).map(function (pollId) { return activityMap[pollId]; });
                renderPolls(config, normalized);
                renderRecentActivity(config);
                return normalized;
            });
        }).catch(function (error) {
            if (requestSeq !== config.state.requestSeq.polls) return [];
            renderPollError(config.retryPolls || 'loadActivePoll');

            // 투표 실패 역시 최근 활동 전체를 막지 않는다.
            // 이전 성공 데이터가 남아 잘못 노출되지 않도록 투표 활동만 초기화한다.
            config.state.activityPolls = [];
            renderRecentActivity(config);
            throw error;
        });
    }

    function load(input) {
        var config = normalizeConfig(input);
        setLoading(config);
        return Promise.allSettled([loadBoards(config), loadPolls(config)]);
    }


    // 최근활동의 노트/사진은 목록 페이지를 경유하지 않고 현재 공통 상세 UI를 직접 연다.
    document.addEventListener('click', function (event) {
        var noteLink = event.target.closest && event.target.closest('[data-recent-note-id]');
        if (noteLink) {
            var noteId = Number(noteLink.getAttribute('data-recent-note-id') || 0);
            if (noteId && window.MoyoNoteModal && typeof window.MoyoNoteModal.open === 'function') {
                event.preventDefault();
                window.MoyoNoteModal.open({
                    noteId: noteId,
                    scopeType: noteLink.getAttribute('data-recent-scope-type') || 'GROUP',
                    scopeId: noteLink.getAttribute('data-recent-scope-id') || null,
                    wsId: noteLink.getAttribute('data-recent-ws-id') || null,
                    projId: noteLink.getAttribute('data-recent-proj-id') || null
                });
            }
            return;
        }

        var memberLink = event.target.closest && event.target.closest('[data-recent-member-id]');
        if (memberLink) {
            var memberId = Number(memberLink.getAttribute('data-recent-member-id') || 0);
            if (memberId && typeof window.openWorkspaceMemberActivityProfile === 'function') {
                event.preventDefault();
                window.openWorkspaceMemberActivityProfile(memberId);
            } else if (memberId && typeof window.openWorkspaceMemberProfile === 'function') {
                event.preventDefault();
                window.openWorkspaceMemberProfile(memberId);
            }
            return;
        }

        var photoLink = event.target.closest && event.target.closest('[data-recent-photo-id]');
        if (photoLink) {
            var postId = Number(photoLink.getAttribute('data-recent-photo-id') || 0);
            if (postId && window.MoyoPhotoPostDetail && typeof window.MoyoPhotoPostDetail.open === 'function') {
                event.preventDefault();
                window.MoyoPhotoPostDetail.open(postId);
            }
        }
    });

    document.addEventListener('moyo:content-activity', function (event) {
        var detail = event && event.detail ? event.detail : {};
        var scope = text(detail.scope || 'WORKSPACE').toUpperCase();
        var id = text(detail.scopeId || detail.wsId || '');
        if (!id) return;
        var key = scope + ':' + id;

        // content/member 위젯은 네트워크 상황에 따라 커뮤니티 위젯보다 먼저 완료될 수 있다.
        // 기존에는 이 시점에 state가 없으면 이벤트를 버려 최근활동이 새로고침마다 달라질 수 있었다.
        if (!widgetStates[key]) widgetStates[key] = createWidgetState();
        var state = widgetStates[key];
        if (Array.isArray(detail.notes)) state.activityNotes = detail.notes;
        if (Array.isArray(detail.photos)) state.activityPhotos = detail.photos;
        if (Array.isArray(detail.members)) {
            if (scope === 'WORKSPACE') state.activityMembers = detail.members;
            state.memberProfilesByUserId = Object.create(null);
            detail.members.forEach(function (member) {
                var memberId = text(firstValue(member, ['userId', 'USER_ID', 'memberId', 'MEMBER_ID'])).trim();
                if (!memberId) return;
                var memberProfile = text(firstValue(member, [
                    'profileImage', 'PROFILE_IMAGE',
                    'profileImagePath', 'PROFILE_IMAGE_PATH',
                    'memberProfileImagePath', 'MEMBER_PROFILE_IMAGE_PATH',
                    'projectMemberProfileImagePath', 'PROJECT_MEMBER_PROFILE_IMAGE_PATH',
                    'workspaceProfileImagePath', 'WORKSPACE_PROFILE_IMAGE_PATH'
                ])).trim();
                state.memberProfilesByUserId[memberId] = memberProfile;
            });
        }
        if (scope === 'WORKSPACE' && Array.isArray(detail.leaves)) state.activityLeaves = detail.leaves;
        renderRecentActivity(normalizeConfig({ scope: scope, wsId: detail.wsId || id, projId: detail.projId || id, contextPath: detail.contextPath || '' }));
    });

    window.MoyoCommunityWidgets = Object.freeze({
        load: load,
        loadBoards: loadBoards,
        loadPolls: loadPolls,
        renderBoard: renderBoard,
        renderPolls: renderPolls,
        normalizeBoardPost: normalizeBoardPost,
        normalizePoll: normalizePoll
    });
})(window, document);
