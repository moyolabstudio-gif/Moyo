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
        return !!(state && Array.isArray(state.activityCollab) && state.activityCollab.length > 0);
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
            activityCollab: [],
            memberProfilesByUserId: Object.create(null),
            requestSeq: { boards: 0, polls: 0, collab: 0 }
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
        if (!config.state.requestSeq) config.state.requestSeq = { boards: 0, polls: 0, collab: 0 };
        if (config.state.requestSeq.collab === undefined) config.state.requestSeq.collab = 0;
        return config;
    }

    function boardApiUrl(config) {
        return config.isProject
            ? path(config, '/api/workspace/project/' + encodeURIComponent(config.projId) + '/dashboard-widgets')
            : path(config, '/api/workspace/' + encodeURIComponent(config.wsId) + '/dashboard-widgets');
    }

    function projectBoardFallbackApiUrl(config, type) {
        return path(config, '/api/workspace/api/board-list?' + query({
            projId: config.projId,
            boardType: type
        }));
    }

    function projectFilesFallbackApiUrl(config) {
        return path(config, '/api/files/recent?' + query({
            scopeType: 'PROJECT',
            projId: config.projId
        }));
    }

    function pollApiUrl(config) {
        return path(config, '/api/polls/list?' + query({
            scope: config.scope,
            wsId: config.wsId,
            projId: config.isProject ? config.projId : ''
        }));
    }

    function collaborationActivityApiUrl(config) {
        return path(config, '/api/collaboration-activity/recent?' + query({
            scope: config.scope,
            wsId: config.isProject ? '' : config.wsId,
            projId: config.isProject ? config.projId : '',
            limit: 80
        }));
    }

    function pollDetailApiUrl(config, pollId) {
        return path(config, '/api/polls/detail?' + query({ pollId: pollId }));
    }

    function boardListUrl(config, type) {
        var params = {
            wsId: config.wsId,
            type: type
        };
        if (config.isProject) params.projId = config.projId;

        return config.isProject
            ? path(config, '/project/board/list?' + query(params))
            : path(config, '/group/board/list?' + query(params));
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
            regDt: raw.moyoPublicAt || raw.MOYO_PUBLIC_AT || raw.regDt || raw.REG_DT || raw.createdAt || raw.CREATED_AT || '',
            targetType: 'NOTE',
            activityType: 'NOTE_CREATE'
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
            regDt: raw.createdAt || raw.CREATED_AT || raw.regDt || raw.REG_DT || raw.writeDate || raw.WRITE_DATE || '',
            targetType: 'PHOTO',
            activityType: 'PHOTO_CREATE'
        };
    }

    function photoActivityUrl(config, photo) {
        return path(config, '/photo-album?' + query({
            scopeType: config.isProject ? 'PROJECT' : 'WORKSPACE',
            scopeId: config.isProject ? config.projId : config.wsId,
            postId: photo.id
        }));
    }


    function normalizeCollaborationActivity(raw) {
        raw = raw || {};
        var targetType = text(raw.targetType || raw.TARGET_TYPE).toUpperCase();
        var targetId = raw.targetId || raw.TARGET_ID || '';
        var activityType = text(raw.activityType || raw.ACTIVITY_TYPE).toUpperCase();
        var detail = raw.detail || raw.DETAIL || '변경사항을 반영했어요.';
        return {
            kind: 'COLLAB',
            id: raw.activityId || raw.ACTIVITY_ID || [activityType, targetType, targetId, raw.regDt || raw.REG_DT || ''].join(':'),
            userId: raw.userId || raw.USER_ID || '',
            title: raw.title || raw.TITLE || targetLabel(targetType),
            writerName: raw.writerName || raw.WRITER_NAME || '멤버',
            writerProfile: raw.writerProfile || raw.WRITER_PROFILE || '',
            regDt: raw.regDt || raw.REG_DT || '',
            activityType: activityType,
            targetType: targetType,
            targetId: targetId,
            detail: detail
        };
    }

    function targetLabel(type) {
        switch (text(type).toUpperCase()) {
            case 'TASK': return '업무';
            case 'MEMBER': return '멤버';
            case 'NOTE': return '노트';
            case 'PHOTO': return '사진';
            case 'FILE': return '자료';
            case 'POLL': return '투표';
            case 'BOARD': return '게시글';
            case 'PLAN': return '계획';
            case 'SCHEDULE': return '일정';
            case 'PROJECT': return '프로젝트';
            case 'GROUP': return '그룹';
            default: return '협업 변경사항';
        }
    }

    function normalizeMemberActivity(raw) {
        raw = raw || {};
        return {
            kind: 'JOIN',
            targetType: 'MEMBER',
            activityType: 'MEMBER_CREATE',
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

        /*
         * 최근활동의 기준 데이터는 COLLAB_ACTIVITY_LOG 하나다.
         * 공지/자유/자료실/투표/노트/사진/멤버 목록을 다시 합성하지 않는다.
         */
        var items = (config.state.activityCollab || []).map(normalizeCollaborationActivity);

        var recentActivityNow = Date.now();
        var recentActivityCutoff = recentActivityNow - (3 * 24 * 60 * 60 * 1000);
        items = items.filter(function (item) {
            if (!item.regDt) return false;
            var timestamp = activityTimestamp(item.regDt);
            return timestamp >= recentActivityCutoff && timestamp <= recentActivityNow + 60000;
        });

        // 단일 로그 소스이므로 ACTIVITY_ID 기준으로만 중복 방어한다.
        var seen = Object.create(null);
        items = items.filter(function (item) {
            var key = text(item.id).trim();
            if (!key) {
                key = [
                    text(item.activityType),
                    text(item.targetType),
                    text(item.targetId),
                    text(item.userId),
                    text(item.regDt)
                ].join('|');
            }
            if (seen[key]) return false;
            seen[key] = true;
            item._activityKey = key;
            return true;
        });

        items.sort(function (a, b) {
            var timeDiff = activityTimestamp(b.regDt) - activityTimestamp(a.regDt);
            if (timeDiff) return timeDiff;

            var aId = Number(a.id || 0);
            var bId = Number(b.id || 0);
            if (aId && bId && aId !== bId) return bId - aId;

            return text(a._activityKey).localeCompare(text(b._activityKey));
        });

        if (count) count.textContent = '최근 3일';

        if (!items.length) {
            var emptyActivityCopy = config.isProject
                ? '프로젝트의 업무, 계획, 일정, 멤버, 글, 노트, 사진 등 협업 변경사항을 알려드려요.'
                : '그룹의 멤버, 일정, 글, 노트, 사진, 자료 등 협업 변경사항을 알려드려요.';
            target.innerHTML = '<li class="workspace-compact-empty-state workspace-core-state moyo-widget-state is-empty"><strong>아직 새로운 활동이 없습니다.</strong><span>' + escapeHtml(emptyActivityCopy) + '</span></li>';
            return;
        }

        target.innerHTML = items.map(function (item) {
            var initial = text(item.writerName).trim().substring(0, 1) || 'M';
            var profile = resolveActivityProfile(config, item.writerName, item.writerProfile, item.userId || item.id);
            var avatar = profile
                ? '<span class="workspace-recent-activity-avatar has-image"><img src="' + escapeHtml(profile) + '" alt="" onerror="this.parentNode.classList.remove(\'has-image\');this.remove();"></span>'
                : '<span class="workspace-recent-activity-avatar"><span>' + escapeHtml(initial) + '</span></span>';

            var actionCopy = text(item.detail) || '변경사항을 반영했어요.';
            var body = avatar +
                '<span class="workspace-recent-activity-main"><span class="workspace-recent-activity-action"><strong>' + escapeHtml(item.writerName) + '</strong>님이 ' + escapeHtml(actionCopy) + '</span><small>' + escapeHtml(item.title || targetLabel(item.targetType)) + '</small></span>' +
                '<time>' + escapeHtml(activityDateLabel(item.regDt)) + '</time>';

            var href = '#recentActivityList';
            var activityAttrs = ' data-recent-target-type="' + escapeHtml(item.targetType) + '"';

            if (item.targetType === 'TASK' && item.targetId) {
                href = '#projectTaskSection';
                activityAttrs += ' data-recent-task-id="' + escapeHtml(item.targetId) + '"';
            } else if (item.targetType === 'MEMBER' && item.targetId) {
                href = '#projectMemberList';
                activityAttrs += ' data-recent-member-id="' + escapeHtml(item.targetId) + '"';
            } else if (item.targetType === 'NOTE' && item.targetId) {
                href = '#recentActivityList';
                activityAttrs += ' data-recent-note-id="' + escapeHtml(item.targetId) + '"' +
                    ' data-recent-scope-type="' + (config.isProject ? 'PROJECT' : 'GROUP') + '"' +
                    ' data-recent-scope-id="' + escapeHtml(config.isProject ? config.projId : config.wsId) + '"' +
                    ' data-recent-ws-id="' + escapeHtml(config.wsId) + '"' +
                    ' data-recent-proj-id="' + escapeHtml(config.isProject ? config.projId : '') + '"';
            } else if (item.targetType === 'PHOTO' && item.targetId) {
                href = '#recentActivityList';
                activityAttrs += ' data-recent-photo-id="' + escapeHtml(item.targetId) + '"';
            }

            return '<li><a class="workspace-recent-activity-item" href="' + escapeHtml(href) + '"' + activityAttrs + '>' + body + '</a></li>';
        }).join('');

        // 공통 CSS가 3개 카드 높이 + 4번째부터 내부 스크롤을 담당한다.
    }


    function updateCollaborationBadges(activities) {
        var list = Array.isArray(activities) ? activities : [];
        var taskCount = 0;
        var memberCount = 0;
        list.forEach(function (raw) {
            var type = text(raw.targetType || raw.TARGET_TYPE).toUpperCase();
            if (type === 'TASK') taskCount += 1;
            if (type === 'MEMBER') memberCount += 1;
        });
        var taskBadge = document.getElementById('projectTaskActivityBadge');
        var memberBadge = document.getElementById('projectMemberActivityBadge');
        if (taskBadge) {
            // 업무 변경은 진행보드 제목의 총건수 대신 각 업무 카드에서 표시한다.
            taskBadge.hidden = true;
            taskBadge.textContent = '';
        }
        if (memberBadge) {
            // 프로젝트 멤버 제목 옆의 '변경 N' 칩은 사용하지 않는다.
            // 멤버 변경 이력 자체는 최근활동에 계속 남긴다.
            memberBadge.hidden = true;
            memberBadge.textContent = '';
        }
    }

    function focusActivity(targetType) {
        var list = document.getElementById('recentActivityList');
        if (!list) return;
        var type = text(targetType).toUpperCase();
        var matched = Array.prototype.slice.call(list.querySelectorAll('[data-recent-target-type="' + type + '"]'));
        var card = list.closest('.moyo-widget-card') || list;
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        matched.forEach(function (item) { item.classList.add('is-collab-focus'); });
        window.setTimeout(function () {
            matched.forEach(function (item) { item.classList.remove('is-collab-focus'); });
        }, 2600);
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
            var emptyAction = config.readOnly
                ? ''
                : '<a href="' + escapeHtml(pollListUrl(config)) + '">투표 만들기</a>';
            target.innerHTML = '<div class="workspace-poll-summary-body is-empty"><div class="workspace-compact-empty-state workspace-core-state workspace-poll-summary-empty moyo-widget-state is-empty"><strong>등록된 투표가 없습니다.</strong>' +
                '<span>' + (config.readOnly ? '읽기 전용 프로젝트에서는 투표를 조회만 할 수 있습니다.' : '의견을 모아야 할 때 새 투표를 시작해보세요.') + '</span>' + emptyAction + '</div></div>';
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

    function loadProjectBoardsFallback(config) {
        return Promise.all([
            requestJson(projectBoardFallbackApiUrl(config, 'NOTICE')),
            requestJson(projectBoardFallbackApiUrl(config, 'FREE')),
            requestJson(projectFilesFallbackApiUrl(config))
        ]).then(function (results) {
            var notices = firstArray(results[0], ['items', 'notices', 'list']);
            var freePosts = firstArray(results[1], ['items', 'free', 'freeBoards', 'freePosts', 'list']);
            var files = firstArray(results[2], ['items', 'files', 'list']).slice(0, config.limits.board);
            return { notices: notices, freeBoards: freePosts, files: files };
        });
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

            // 프로젝트 메인의 통합 위젯 API가 일시적으로 실패해도 기존 개별 API로 한 번 더 복구한다.
            // 게시판/자료실 자체 데이터가 정상인데 통합 endpoint 또는 배포 캐시만 어긋난 경우
            // 공지·자유피드·자료실 세 영역이 동시에 오류 상태가 되는 것을 막는다.
            if (config.isProject) {
                return loadProjectBoardsFallback(config).then(function (fallbackData) {
                    if (requestSeq !== config.state.requestSeq.boards) return fallbackData;
                    var notices = firstArray(fallbackData, ['notices']);
                    var freePosts = firstArray(fallbackData, ['freeBoards']);
                    var files = firstArray(fallbackData, ['files']);
                    renderBoard(config, 'noticeList', notices, 'NOTICE');
                    renderBoard(config, 'freeList', freePosts, 'FREE');
                    renderFiles(config, files);
                    config.state.activityBoards = { NOTICE: notices, FREE: freePosts };
                    config.state.activityFiles = files;
                    renderRecentActivity(config);
                    return fallbackData;
                }).catch(function (fallbackError) {
                    console.warn('[게시판] 프로젝트 위젯 fallback 조회 실패:', fallbackError);
                    if (requestSeq !== config.state.requestSeq.boards) return null;
                    renderBoardError('noticeList', config.retryBoards || 'loadBoardWidgets');
                    renderBoardError('freeList', config.retryBoards || 'loadBoardWidgets');
                    renderBoardError('fileList', config.retryBoards || 'loadBoardWidgets');
                    config.state.activityBoards = {};
                    config.state.activityFiles = [];
                    renderRecentActivity(config);
                    throw fallbackError;
                });
            }

            renderBoardError('noticeList', config.retryBoards || 'loadBoardWidgets');
            renderBoardError('freeList', config.retryBoards || 'loadBoardWidgets');
            renderBoardError('fileList', config.retryBoards || 'loadBoardWidgets');
            config.state.activityBoards = {};
            config.state.activityFiles = [];
            renderRecentActivity(config);
            throw error;
        });
    }

    function loadCollaborationActivities(input) {
        var config = normalizeConfig(input);
        var requestSeq = ++config.state.requestSeq.collab;
        return requestJson(collaborationActivityApiUrl(config)).then(function (data) {
            if (requestSeq !== config.state.requestSeq.collab) return [];
            var activities = firstArray(data, ['activities', 'activity', 'recentActivities', 'items', 'list']);
            config.state.activityCollab = activities;
            renderRecentActivity(config);
            updateCollaborationBadges(activities);
            document.dispatchEvent(new CustomEvent('moyo:recent-activity-updated', { detail: { scope: config.scope, wsId: config.wsId, projId: config.projId, activities: activities } }));
            return activities;
        }).catch(function (error) {
            console.warn('[최근활동] 협업 로그 조회 실패:', error);
            if (requestSeq !== config.state.requestSeq.collab) return [];
            // 협업 로그 조회 실패는 공지/자유피드/자료실/투표 위젯을 절대 실패시키지 않는다.
            config.state.activityCollab = [];
            renderRecentActivity(config);
            updateCollaborationBadges([]);
            return [];
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
        return Promise.allSettled([loadBoards(config), loadPolls(config), loadCollaborationActivities(config)]);
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

        var taskLink = event.target.closest && event.target.closest('[data-recent-task-id]');
        if (taskLink) {
            var taskId = Number(taskLink.getAttribute('data-recent-task-id') || 0);
            if (taskId && typeof window.openProjectTaskDetail === 'function') {
                event.preventDefault();
                window.openProjectTaskDetail(taskId);
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
        var id = text(detail.scopeId || detail.wsId || '').trim();
        if (!id) return;

        var key = scope + ':' + id;
        if (!widgetStates[key]) widgetStates[key] = createWidgetState();
        var state = widgetStates[key];

        // 프로필 해석용 캐시는 유지하되, notes/photos/members 자체를 최근활동 데이터로 사용하지 않는다.
        if (Array.isArray(detail.members)) {
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

        // 화면의 최근활동도 반드시 COLLAB_ACTIVITY_LOG를 다시 읽어 갱신한다.
        loadCollaborationActivities(normalizeConfig({
            scope: scope,
            wsId: detail.wsId || (scope === 'WORKSPACE' ? id : ''),
            projId: detail.projId || (scope === 'PROJECT' ? id : ''),
            contextPath: detail.contextPath || ''
        }));
    });

    // 협업 중 다른 멤버의 변경도 새로고침 없이 최근 활동에 들어오도록
    // 현재 열려 있는 그룹/프로젝트 위젯 상태만 가볍게 다시 조회한다.
    function refreshVisibleCollaborationActivities() {
        if (document.hidden) return;
        Object.keys(widgetStates).forEach(function (key) {
            var parts = key.split(':');
            var scope = text(parts[0]).toUpperCase();
            var id = text(parts.slice(1).join(':')).trim();
            if (!id || (scope !== 'PROJECT' && scope !== 'WORKSPACE')) return;
            var state = widgetStates[key];
            var cfg = scope === 'PROJECT'
                ? { scope: 'PROJECT', projId: id, wsId: state && state.wsId ? state.wsId : '', contextPath: '' }
                : { scope: 'WORKSPACE', wsId: id, contextPath: '' };
            loadCollaborationActivities(cfg);
        });
    }

    window.addEventListener('focus', refreshVisibleCollaborationActivities);
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) refreshVisibleCollaborationActivities();
    });
    window.setInterval(refreshVisibleCollaborationActivities, 30000);


    window.MoyoCommunityWidgets = Object.freeze({
        load: load,
        loadBoards: loadBoards,
        loadCollaborationActivities: loadCollaborationActivities,
        loadPolls: loadPolls,
        renderBoard: renderBoard,
        renderPolls: renderPolls,
        normalizeBoardPost: normalizeBoardPost,
        normalizePoll: normalizePoll,
        focusActivity: focusActivity
    });
})(window, document);
