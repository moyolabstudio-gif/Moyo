package com.springboot.project.service.impl;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashSet;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IpollDAO;
import com.springboot.project.dao.IuserNoticeDAO;
import com.springboot.project.dto.calendarResponseDTO;
import com.springboot.project.service.IcalendarResponseService;
import com.springboot.project.service.IpollService;
import com.springboot.project.service.IprojectAuthorizationService;
import com.springboot.project.service.WorkspaceAuthorizationService;

@Service
public class pollServiceImpl implements IpollService {

    @Autowired
    private IpollDAO pollDao;

    @Autowired
    private IuserNoticeDAO userNoticeDAO;

    @Autowired
    private IcalendarResponseService calendarResponseService;

    @Autowired
    private IprojectAuthorizationService projectAuthorizationService;

    @Autowired
    private WorkspaceAuthorizationService workspaceAuthorizationService;

    @Override
    public Map<String, Object> getActivePoll(String scope, Long wsId, Long projId, Long userId) {
        String normalizedScope = normalizeScope(scope);

        Map<String, Object> poll;

        if ("PROJECT".equals(normalizedScope)) {
            if (projId == null) {
                return new HashMap<>();
            }
            poll = pollDao.selectActiveProjectPoll(wsId, projId);
        } else {
            poll = pollDao.selectActiveWorkspacePoll(wsId);
        }

        return buildPollResult(poll, userId);
    }

    @Override
    public Map<String, Object> getPoll(Long pollId, Long userId) {
        if (pollId == null) {
            return new HashMap<>();
        }

        return buildPollResult(pollDao.selectPollById(pollId), userId);
    }

    private Map<String, Object> buildPollResult(Map<String, Object> poll, Long userId) {
        if (poll == null || poll.isEmpty()) {
            return new HashMap<>();
        }

        Long pollId = toLong(poll.get("POLL_ID"));
        Date endDt = poll.get("END_DT") instanceof Date ? (Date) poll.get("END_DT") : null;
        String status = String.valueOf(poll.get("STATUS") == null ? "ACTIVE" : poll.get("STATUS")).toUpperCase();
        boolean isClosed = "CLOSED".equals(status) || (endDt != null && endDt.before(new Date()));
        String showResultsYn = String.valueOf(poll.get("SHOW_RESULTS_YN") == null ? "N" : poll.get("SHOW_RESULTS_YN")).trim().toUpperCase();
        boolean showResultsDuringVoting = "Y".equals(showResultsYn);
        boolean showResults = isClosed || showResultsDuringVoting;

        Long myOptionId = null;
        if (userId != null && pollId != null) {
            myOptionId = pollDao.selectUserVoteOption(pollId, userId);
        }

        boolean hasVoted = myOptionId != null;

        List<Map<String, Object>> rawOptions = pollDao.selectPollOptions(pollId);
        List<Map<String, Object>> options = new ArrayList<>();

        if (rawOptions != null) {
            for (Map<String, Object> option : rawOptions) {
                Map<String, Object> item = new HashMap<>(option);
                if (!showResults) {
                    item.put("COUNT", 0);
                    item.put("count", 0);
                }

                String textValue = firstNonBlank(item, "TEXT", "text");
                String mediaUrl = firstNonBlank(item,
                        "MEDIA_URL", "mediaUrl",
                        "IMAGE_PATH", "imagePath",
                        "MEDIA_PATH", "mediaPath",
                        "VIDEO_URL", "videoUrl",
                        "URL", "url");

                // 예전 데이터가 URL을 TEXT에 저장한 경우도 영상 주소로 복구합니다.
                if ((mediaUrl == null || mediaUrl.isBlank()) && looksLikeVideoUrl(textValue)) {
                    mediaUrl = textValue;
                }

                String optionType = firstNonBlank(item, "OPTION_TYPE", "optionType");
                if (looksLikeVideoUrl(mediaUrl)) {
                    optionType = "VIDEO";
                }

                if (mediaUrl != null && !mediaUrl.isBlank()) {
                    item.put("MEDIA_URL", mediaUrl);
                    item.put("mediaUrl", mediaUrl);
                    item.put("IMAGE_PATH", mediaUrl);
                    item.put("imagePath", mediaUrl);
                }
                if (optionType != null && !optionType.isBlank()) {
                    item.put("OPTION_TYPE", optionType);
                    item.put("optionType", optionType);
                }

                options.add(item);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("pollId", pollId);
        result.put("question", poll.get("QUESTION"));
        result.put("scope", poll.get("SCOPE"));
        result.put("wsId", poll.get("WS_ID"));
        result.put("projId", poll.get("PROJ_ID"));
        result.put("endDt", endDt);
        result.put("status", status);
        result.put("isClosed", isClosed);
        result.put("hasVoted", hasVoted);
        result.put("myOptionId", myOptionId);
        int totalVoteCount = pollDao.countPollVotes(pollId);
        Long createdBy = toLong(poll.get("USER_ID"));
        boolean isCreator = userId != null && createdBy != null && userId.equals(createdBy);
        boolean canEdit = isCreator && !isClosed;
        boolean canExtend = isCreator && isClosed;
        boolean canDelete = isCreator || isScopeManager(poll, userId);

        result.put("showResults", showResults);
        result.put("showResultsYn", showResultsYn);
        result.put("showResultsDuringVoting", showResultsDuringVoting);
        result.put("createdBy", createdBy);
        result.put("creatorName", poll.get("CREATOR_NAME"));
        result.put("canEdit", canEdit);
        result.put("canManage", canEdit);
        result.put("canExtend", canExtend);
        result.put("canDelete", canDelete);
        result.put("extendCount", poll.get("EXTEND_COUNT"));
        result.put("prevEndDt", poll.get("PREV_END_DT"));
        result.put("totalVoteCount", totalVoteCount);
        result.put("canEditOptions", canEdit);
        result.put("options", options);

        applyScheduleFinalState(result, poll, options, isClosed, isCreator);

        return result;
    }

    @Override
    public List<Map<String, Object>> getPollList(String scope, Long wsId, Long projId) {
        String normalizedScope = normalizeScope(scope);

        if ("PROJECT".equals(normalizedScope)) {
            if (projId == null) {
                return new ArrayList<>();
            }
            return pollDao.selectProjectPollList(wsId, projId);
        }

        return pollDao.selectWorkspacePollList(wsId);
    }

    @Override
    @Transactional
    public void vote(Map<String, Object> params) {
        Long pollId = toLong(params.get("pollId"));
        Long optionId = toLong(params.get("optionId"));
        Long userId = toLong(params.get("userId"));

        if (pollId == null || optionId == null || userId == null) {
            throw new IllegalArgumentException("pollId, optionId, userId는 필수입니다.");
        }

        Map<String, Object> poll = pollDao.selectPollById(pollId);
        if (poll == null || poll.isEmpty()) {
            throw new IllegalArgumentException("존재하지 않는 투표입니다.");
        }

        String status = String.valueOf(poll.get("STATUS") == null ? "ACTIVE" : poll.get("STATUS")).toUpperCase();
        Date endDt = poll.get("END_DT") instanceof Date ? (Date) poll.get("END_DT") : null;

        if ("CLOSED".equals(status) || (endDt != null && endDt.before(new Date()))) {
            throw new IllegalStateException("이미 마감된 투표입니다.");
        }

        Map<String, Object> voteParams = new HashMap<>();
        voteParams.put("pollId", pollId);
        voteParams.put("optionId", optionId);
        voteParams.put("userId", userId);

        // 마감 전에는 기존 선택을 다른 선택지로 변경할 수 있습니다.
        if (pollDao.countUserVote(pollId, userId) > 0) {
            pollDao.updateVote(voteParams);
        } else {
            pollDao.insertVote(voteParams);
        }
    }

    @Override
    @Transactional
    public Long createPoll(Map<String, Object> params) {
        String scope = normalizeScope((String) params.get("scope"));
        params.put("scope", scope);

        if ("PROJECT".equals(scope) && params.get("projId") == null) {
            throw new IllegalArgumentException("프로젝트 투표에는 projId가 필요합니다.");
        }

        params.put("showResultsYn", normalizeYn(params.get("showResultsYn"), "N"));
        pollDao.insertPoll(params);

        Long pollId = toLong(params.get("pollId"));
        Object optionsObj = params.get("options");

        if (optionsObj instanceof List<?>) {
            List<?> options = (List<?>) optionsObj;

            for (Object rawOption : options) {
                Map<String, Object> option = buildOptionParams(pollId, rawOption);
                if (option != null) {
                    pollDao.insertPollOption(option);
                }
            }
        }

        try {
            sendPollCreatedNotifications(pollId, params);
        } catch (Exception e) {
            System.err.println("투표 등록 알림 생성 실패. pollId=" + pollId + ", error=" + e.getMessage());
        }
        return pollId;
    }

    @Override
    @Transactional
    public void updatePoll(Map<String, Object> params) {
        Long pollId = toLong(params.get("pollId"));
        Long userId = toLong(params.get("userId"));

        if (pollId == null || userId == null) {
            throw new IllegalArgumentException("pollId와 userId는 필수입니다.");
        }

        Map<String, Object> poll = pollDao.selectPollById(pollId);
        if (poll == null || poll.isEmpty()) {
            throw new IllegalArgumentException("존재하지 않는 투표입니다.");
        }

        Long createdBy = toLong(poll.get("USER_ID"));
        Date endDt = poll.get("END_DT") instanceof Date ? (Date) poll.get("END_DT") : null;
        String status = String.valueOf(poll.get("STATUS") == null ? "ACTIVE" : poll.get("STATUS")).toUpperCase();

        if (createdBy == null || !createdBy.equals(userId)) {
            throw new IllegalStateException("투표 작성자만 수정할 수 있습니다.");
        }

        if ("CLOSED".equals(status) || (endDt != null && endDt.before(new Date()))) {
            throw new IllegalStateException("마감된 투표는 수정할 수 없습니다.");
        }

        params.put("showResultsYn", normalizeYn(params.get("showResultsYn"), "N"));
        pollDao.updatePoll(params);

        if (!(params.get("options") instanceof List<?>)) {
            return;
        }

        List<Map<String, Object>> currentOptions = pollDao.selectPollOptions(pollId);
        List<Long> incomingOptionIds = new ArrayList<>();

        List<?> options = (List<?>) params.get("options");
        for (Object rawOption : options) {
            Map<String, Object> option = buildOptionParams(pollId, rawOption);
            if (option == null) continue;

            Long optionId = toLong(option.get("optionId"));

            if (optionId != null) {
                incomingOptionIds.add(optionId);
                pollDao.updatePollOption(option);
            } else {
                pollDao.insertPollOption(option);
            }
        }

        if (currentOptions != null) {
            for (Map<String, Object> current : currentOptions) {
                Long currentOptionId = toLong(current.get("OPTION_ID"));

                if (currentOptionId != null && !incomingOptionIds.contains(currentOptionId)) {
                    pollDao.deleteVotesByOptionId(currentOptionId);
                    pollDao.deletePollOption(currentOptionId);
                }
            }
        }
    }

    @Override
    @Transactional
    public void deletePoll(Long pollId, Long userId) {
        if (pollId == null || userId == null) {
            throw new IllegalArgumentException("pollId와 userId는 필수입니다.");
        }

        Map<String, Object> poll = pollDao.selectPollById(pollId);
        if (poll == null || poll.isEmpty()) {
            throw new IllegalArgumentException("존재하지 않는 투표입니다.");
        }

        Long createdBy = toLong(poll.get("USER_ID"));
        boolean isCreator = createdBy != null && createdBy.equals(userId);
        if (!isCreator && !isScopeManager(poll, userId)) {
            throw new IllegalStateException("투표 작성자 또는 관리자만 삭제할 수 있습니다.");
        }

        pollDao.deletePollVotes(pollId);
        pollDao.deletePollOptions(pollId);
        pollDao.deletePoll(pollId);
    }

    @Override
    @Transactional
    public void extendPoll(Map<String, Object> params) {
        Long pollId = toLong(params.get("pollId"));
        Long userId = toLong(params.get("userId"));
        String endDtText = String.valueOf(params.get("endDt") == null ? "" : params.get("endDt")).trim();
        if (pollId == null || userId == null || endDtText.isEmpty()) {
            throw new IllegalArgumentException("pollId, userId, 새 마감일은 필수입니다.");
        }
        Map<String, Object> poll = pollDao.selectPollById(pollId);
        if (poll == null || poll.isEmpty()) throw new IllegalArgumentException("존재하지 않는 투표입니다.");
        Long createdBy = toLong(poll.get("USER_ID"));
        if (createdBy == null || !createdBy.equals(userId)) throw new IllegalStateException("투표 작성자만 연장할 수 있습니다.");
        Date endDt = poll.get("END_DT") instanceof Date ? (Date) poll.get("END_DT") : null;
        String status = String.valueOf(poll.get("STATUS") == null ? "ACTIVE" : poll.get("STATUS")).toUpperCase();
        if (!"CLOSED".equals(status) && (endDt == null || endDt.after(new Date()))) {
            throw new IllegalStateException("종료된 투표만 연장할 수 있습니다.");
        }
        if (pollDao.selectCalendarEventIdByPollId(pollId) != null) {
            throw new IllegalStateException("이미 일정으로 확정된 투표는 연장할 수 없습니다.");
        }
        pollDao.extendPoll(params);
    }

    @Override
    public void finalizeExpiredSchedulePolls() {
        List<Long> pollIds = pollDao.selectExpiredSchedulePollIds();
        if (pollIds == null) return;
        for (Long pollId : pollIds) {
            if (pollId == null) continue;
            try {
                finalizeSchedulePollInternal(pollId, null, false);
            } catch (Exception e) {
                System.err.println("일정 투표 자동 확정 실패. pollId=" + pollId + ", error=" + e.getMessage());
            }
        }
    }

    @Override
    public void finalizeExpiredRegularPolls() {
        List<Long> pollIds = pollDao.selectExpiredRegularPollIds();
        if (pollIds == null) return;
        for (Long pollId : pollIds) {
            if (pollId == null) continue;
            try {
                Map<String, Object> poll = pollDao.selectPollById(pollId);
                if (poll == null || poll.isEmpty()) continue;
                sendClosedPollNotifications(poll, null, false);
                pollDao.closePoll(pollId);
            } catch (Exception e) {
                System.err.println("투표 마감 알림 처리 실패. pollId=" + pollId + ", error=" + e.getMessage());
            }
        }
    }

    @Override
    @Transactional
    public void finalizeScheduleTie(Long pollId, Long optionId, Long userId) {
        if (pollId == null || optionId == null || userId == null) {
            throw new IllegalArgumentException("pollId, optionId, userId는 필수입니다.");
        }
        Map<String, Object> poll = pollDao.selectPollById(pollId);
        if (poll == null || poll.isEmpty()) throw new IllegalArgumentException("존재하지 않는 투표입니다.");
        Long createdBy = toLong(poll.get("USER_ID"));
        if (createdBy == null || !createdBy.equals(userId)) {
            throw new IllegalStateException("동률 일정의 최종 확정은 투표 작성자만 할 수 있습니다.");
        }
        finalizeSchedulePollInternal(pollId, optionId, true);
    }

    private Map<String, Object> buildOptionParams(Long pollId, Object rawOption) {
        Map<String, Object> option = new HashMap<>();
        option.put("pollId", pollId);

        String text = "";
        String imagePath = null;
        String optionType = "TEXT";

        if (rawOption instanceof Map<?, ?>) {
            Map<?, ?> optionMap = (Map<?, ?>) rawOption;
            text = String.valueOf(optionMap.get("text") == null ? "" : optionMap.get("text")).trim();
            imagePath = optionMap.get("imagePath") == null ? null : String.valueOf(optionMap.get("imagePath")).trim();
            optionType = String.valueOf(optionMap.get("optionType") == null ? "TEXT" : optionMap.get("optionType")).trim().toUpperCase();

            Long optionId = toLong(optionMap.get("optionId"));
            if (optionId == null) {
                optionId = toLong(optionMap.get("OPTION_ID"));
            }
            if (optionId != null) {
                option.put("optionId", optionId);
            }
        } else {
            text = String.valueOf(rawOption == null ? "" : rawOption).trim();
        }

        if ("SCHEDULE".equals(optionType)) {
            if (!(rawOption instanceof Map<?, ?>)) return null;
            Map<?, ?> optionMap = (Map<?, ?>) rawOption;
            String scheduleDate = cleanText(optionMap.get("scheduleDate"));
            String startTime = cleanText(optionMap.get("startTime"));
            String endTime = cleanText(optionMap.get("endTime"));
            if (!scheduleDate.matches("\\d{4}-\\d{2}-\\d{2}")
                    || !startTime.matches("(?:[01]\\d|2[0-3]):[0-5]\\d")
                    || !endTime.matches("(?:[01]\\d|2[0-3]):[0-5]\\d")) {
                throw new IllegalArgumentException("일정 선택지의 날짜와 시간을 확인해주세요.");
            }
            if (startTime.compareTo(endTime) >= 0) {
                throw new IllegalArgumentException("일정 선택지의 종료 시간은 시작 시간보다 늦어야 합니다.");
            }
            text = "@MOYO_SCHEDULE@|" + scheduleDate + "|" + startTime + "|" + endTime;
            optionType = "TEXT";
            imagePath = null;
        } else if ("IMAGE".equals(optionType)) {
            if (imagePath == null || imagePath.isEmpty()) return null;
            if (text.isEmpty()) text = "이미지 선택지";
        } else if ("AUDIO".equals(optionType)) {
            if (imagePath == null || imagePath.isEmpty()) return null;
            if (text.isEmpty()) text = "음악 선택지";
            // 기존 DB의 OPTION_TYPE 제약조건(TEXT/IMAGE)과 호환되도록
            // 미디어 경로는 IMAGE 타입으로 저장하고 조회 시 확장자로 AUDIO를 복원합니다.
            optionType = "IMAGE";
        } else if ("VIDEO".equals(optionType)) {
            if (imagePath == null || imagePath.isEmpty()) return null;
            // 기존 DB 제약조건(TEXT/IMAGE)과 호환하면서도 영상 URL이 유실되지 않도록
            // IMAGE_PATH와 TEXT 양쪽에 URL을 저장합니다. 조회 화면에서는 URL 대신 "영상 N"으로 표시합니다.
            text = imagePath;
            optionType = "IMAGE";
        } else {
            optionType = "TEXT";
            imagePath = null;
            if (text.isEmpty()) return null;
        }

        option.put("text", text.isEmpty() ? null : text);
        option.put("imagePath", imagePath);
        option.put("optionType", optionType);
        return option;
    }


    private void applyScheduleFinalState(Map<String, Object> result, Map<String, Object> poll,
                                         List<Map<String, Object>> options, boolean isClosed, boolean isCreator) {
        if (!isScheduleOptions(options)) return;

        result.put("schedulePoll", true);
        Long pollId = toLong(poll.get("POLL_ID"));
        Long eventId = pollId == null ? null : pollDao.selectCalendarEventIdByPollId(pollId);
        if (eventId != null) {
            result.put("scheduleFinalStatus", "REGISTERED");
            result.put("calendarEventId", eventId);
            return;
        }
        if (!isClosed) {
            result.put("scheduleFinalStatus", "OPEN");
            return;
        }

        int max = -1;
        List<Long> winners = new ArrayList<>();
        for (Map<String, Object> option : options) {
            int count = toInt(option.get("COUNT"));
            Long optionId = toLong(option.get("OPTION_ID"));
            if (count > max) {
                max = count;
                winners.clear();
                if (optionId != null) winners.add(optionId);
            } else if (count == max && optionId != null) {
                winners.add(optionId);
            }
        }
        if (max <= 0) {
            result.put("scheduleFinalStatus", "NO_VOTES");
        } else if (winners.size() > 1) {
            result.put("scheduleFinalStatus", "TIE");
            result.put("scheduleTieOptionIds", winners);
            result.put("canResolveScheduleTie", isCreator);
        } else {
            result.put("scheduleFinalStatus", "PENDING");
        }
    }

    private void finalizeSchedulePollInternal(Long pollId, Long selectedOptionId, boolean manualTieResolve) {
        Long existingEventId = pollDao.selectCalendarEventIdByPollId(pollId);
        if (existingEventId != null) {
            Map<String, Object> existingPoll = pollDao.selectPollById(pollId);
            if (existingPoll != null && !existingPoll.isEmpty()) {
                sendScheduleFinalizedNotifications(existingPoll, existingEventId);
            }
            pollDao.closePoll(pollId);
            return;
        }
        Map<String, Object> poll = pollDao.selectPollById(pollId);
        if (poll == null || poll.isEmpty()) return;
        Date endDt = poll.get("END_DT") instanceof Date ? (Date) poll.get("END_DT") : null;
        if (endDt == null || endDt.after(new Date())) {
            if (manualTieResolve) throw new IllegalStateException("마감된 일정 투표만 확정할 수 있습니다.");
            return;
        }

        List<Map<String, Object>> options = pollDao.selectPollOptions(pollId);
        if (!isScheduleOptions(options)) {
            pollDao.closePoll(pollId);
            return;
        }

        int max = -1;
        List<Map<String, Object>> winners = new ArrayList<>();
        for (Map<String, Object> option : options) {
            int count = toInt(option.get("COUNT"));
            if (count > max) {
                max = count;
                winners.clear();
                winners.add(option);
            } else if (count == max) {
                winners.add(option);
            }
        }

        if (max <= 0) {
            sendClosedPollNotifications(poll, null, true);
            pollDao.closePoll(pollId);
            return;
        }

        Map<String, Object> winner = null;
        if (winners.size() == 1) {
            winner = winners.get(0);
        } else if (manualTieResolve) {
            for (Map<String, Object> candidate : winners) {
                if (selectedOptionId.equals(toLong(candidate.get("OPTION_ID")))) {
                    winner = candidate;
                    break;
                }
            }
            if (winner == null) throw new IllegalArgumentException("최다 득표한 일정 중 하나를 선택해주세요.");
        } else {
            sendScheduleTieNotification(poll);
            pollDao.closePoll(pollId);
            return;
        }

        String[] schedule = parseScheduleOption(firstNonBlank(winner, "TEXT", "text"));
        if (schedule == null) throw new IllegalStateException("확정 일정 정보를 읽을 수 없습니다.");

        calendarResponseDTO event = new calendarResponseDTO();
        event.setTitle(String.valueOf(poll.get("QUESTION")));
        event.setStartDt(schedule[0] + "T" + schedule[1]);
        event.setEndDt(schedule[0] + "T" + schedule[2]);
        event.setUserId(toLong(poll.get("USER_ID")));
        event.setWsId(toLong(poll.get("WS_ID")));
        event.setProjId(toLong(poll.get("PROJ_ID")));
        event.setItemType("PROJECT".equalsIgnoreCase(String.valueOf(poll.get("SCOPE"))) ? "PROJ" : "WS");
        event.setEventType("APPOINTMENT");
        event.setAllDay("N");
        event.setIsRecurring("N");
        event.setIsLunar("N");
        event.setReminderYn("N");
        event.setRecordEnabledYn("Y");
        event.setDescriptionText("일정 투표에서 확정된 일정입니다. [MOYO_POLL_ID:" + pollId + "]");
        event.setAttendeeUserIds(pollDao.selectPollVoterUserIds(pollId));
        calendarResponseService.registerEvent(event);
        Long eventId = event.getId();
        if (eventId == null) {
            eventId = pollDao.selectCalendarEventIdByPollId(pollId);
        }
        sendScheduleFinalizedNotifications(poll, eventId);
        pollDao.closePoll(pollId);
    }

    private void sendPollCreatedNotifications(Long pollId, Map<String, Object> params) {
        if (pollId == null || params == null) return;
        Long creatorId = toLong(params.get("userId"));
        Long wsId = toLong(params.get("wsId"));
        Long projId = toLong(params.get("projId"));
        String scope = normalizeScope(String.valueOf(params.get("scope")));
        String question = cleanText(params.get("question"));
        if (question.isBlank()) question = "새 투표";

        List<Long> recipients = "PROJECT".equals(scope)
                ? pollDao.selectProjectPollRecipientUserIds(projId, creatorId)
                : pollDao.selectWorkspacePollRecipientUserIds(wsId, creatorId);
        if (recipients == null || recipients.isEmpty()) return;

        String link = buildPollLink(scope, wsId, projId, pollId);
        for (Long recipientId : recipients) {
            if (recipientId == null || recipientId.equals(creatorId)) continue;
            userNoticeDAO.insertContentSendAlarmIfAbsent(
                    recipientId,
                    "POLL_CREATED",
                    "POLL",
                    pollId,
                    "새 투표가 등록되었습니다.",
                    "‘" + question + "’ 투표에 참여해 주세요.",
                    link
            );
        }
    }

    private void sendClosedPollNotifications(Map<String, Object> poll, Long linkEventId, boolean scheduleNoVotes) {
        if (poll == null || poll.isEmpty()) return;
        Long pollId = toLong(poll.get("POLL_ID"));
        Long creatorId = toLong(poll.get("USER_ID"));
        if (pollId == null || creatorId == null) return;

        Set<Long> recipients = new LinkedHashSet<>();
        recipients.add(creatorId);
        List<Long> voters = pollDao.selectPollVoterUserIds(pollId);
        if (voters != null) recipients.addAll(voters);

        String alertType = "POLL_CLOSED_" + pollRound(poll);
        String question = cleanText(poll.get("QUESTION"));
        if (question.isBlank()) question = "투표";
        String link = linkEventId != null
                ? "/calendar?viewEventId=" + linkEventId
                : buildPollLink(String.valueOf(poll.get("SCOPE")), toLong(poll.get("WS_ID")), toLong(poll.get("PROJ_ID")), pollId);
        String content = scheduleNoVotes
                ? "‘" + question + "’ 일정 투표가 마감되었습니다. 참여 결과를 확인해 주세요."
                : "‘" + question + "’ 투표가 마감되었습니다. 결과를 확인해 주세요.";

        for (Long recipientId : recipients) {
            if (recipientId == null) continue;
            userNoticeDAO.insertContentSendAlarmIfAbsent(
                    recipientId, alertType, "POLL", pollId,
                    "투표가 마감되었습니다.", content, link
            );
        }
    }

    private void sendScheduleTieNotification(Map<String, Object> poll) {
        if (poll == null || poll.isEmpty()) return;
        Long pollId = toLong(poll.get("POLL_ID"));
        Long creatorId = toLong(poll.get("USER_ID"));
        if (pollId == null || creatorId == null) return;
        String question = cleanText(poll.get("QUESTION"));
        if (question.isBlank()) question = "일정 투표";
        userNoticeDAO.insertContentSendAlarmIfAbsent(
                creatorId,
                "POLL_SCHEDULE_TIE_" + pollRound(poll),
                "POLL",
                pollId,
                "일정 투표가 동률입니다.",
                "‘" + question + "’의 최종 일정을 선택해 주세요.",
                buildPollLink(String.valueOf(poll.get("SCOPE")), toLong(poll.get("WS_ID")), toLong(poll.get("PROJ_ID")), pollId)
        );
    }

    private void sendScheduleFinalizedNotifications(Map<String, Object> poll, Long eventId) {
        if (poll == null || poll.isEmpty()) return;
        Long pollId = toLong(poll.get("POLL_ID"));
        Long creatorId = toLong(poll.get("USER_ID"));
        if (pollId == null || creatorId == null) return;

        Set<Long> recipients = new LinkedHashSet<>();
        recipients.add(creatorId);
        List<Long> voters = pollDao.selectPollVoterUserIds(pollId);
        if (voters != null) recipients.addAll(voters);

        String question = cleanText(poll.get("QUESTION"));
        if (question.isBlank()) question = "일정 투표";
        String link = eventId == null
                ? buildPollLink(String.valueOf(poll.get("SCOPE")), toLong(poll.get("WS_ID")), toLong(poll.get("PROJ_ID")), pollId)
                : "/calendar?viewEventId=" + eventId;
        String alertType = "POLL_SCHEDULE_FINALIZED_" + pollRound(poll);

        for (Long recipientId : recipients) {
            if (recipientId == null) continue;
            userNoticeDAO.insertContentSendAlarmIfAbsent(
                    recipientId, alertType, "POLL", pollId,
                    "일정이 확정되었습니다.",
                    "‘" + question + "’ 일정이 확정되었습니다. 캘린더에서 확인해 주세요.",
                    link
            );
        }
    }

    private int pollRound(Map<String, Object> poll) {
        if (poll == null) return 0;
        int count = toInt(poll.get("EXTEND_COUNT"));
        if (count == 0) count = toInt(poll.get("extendCount"));
        return Math.max(0, count);
    }

    private String buildPollLink(String scopeValue, Long wsId, Long projId, Long pollId) {
        String scope = normalizeScope(scopeValue);
        StringBuilder link = new StringBuilder("/poll/list?scope=").append(scope);
        if (wsId != null) link.append("&wsId=").append(wsId);
        if ("PROJECT".equals(scope) && projId != null) link.append("&projId=").append(projId);
        if (pollId != null) link.append("&pollId=").append(pollId);
        return link.toString();
    }

    private boolean isScheduleOptions(List<Map<String, Object>> options) {
        if (options == null || options.isEmpty()) return false;
        String type = firstNonBlank(options.get(0), "OPTION_TYPE", "optionType");
        String text = firstNonBlank(options.get(0), "TEXT", "text");
        return "SCHEDULE".equalsIgnoreCase(type) || (text != null && text.startsWith("@MOYO_SCHEDULE@|"));
    }

    private String[] parseScheduleOption(String text) {
        if (text == null || !text.startsWith("@MOYO_SCHEDULE@|")) return null;
        String[] parts = text.substring("@MOYO_SCHEDULE@|".length()).split("\\|", -1);
        if (parts.length != 3) return null;
        return parts;
    }

    private int toInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Number) return ((Number) value).intValue();
        try { return Integer.parseInt(String.valueOf(value)); } catch (Exception e) { return 0; }
    }

    private boolean isScopeManager(Map<String, Object> poll, Long userId) {
        if (poll == null || poll.isEmpty() || userId == null) return false;
        Long projId = toLong(poll.get("PROJ_ID"));
        Long wsId = toLong(poll.get("WS_ID"));
        String scope = String.valueOf(poll.get("SCOPE") == null ? "" : poll.get("SCOPE")).trim().toUpperCase();
        if ("PROJECT".equals(scope) || projId != null) {
            return projId != null && projectAuthorizationService.canManageProject(projId, userId);
        }
        return wsId != null && workspaceAuthorizationService.canManage(wsId, userId);
    }

    private String cleanText(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private String normalizeYn(Object value, String defaultValue) {
        if (value == null) return defaultValue;
        String text = String.valueOf(value).trim();
        if ("Y".equalsIgnoreCase(text) || "TRUE".equalsIgnoreCase(text) || "1".equals(text)) return "Y";
        if ("N".equalsIgnoreCase(text) || "FALSE".equalsIgnoreCase(text) || "0".equals(text)) return "N";
        return defaultValue;
    }

    private String firstNonBlank(Map<String, Object> map, String... keys) {
        if (map == null || keys == null) return null;
        for (String key : keys) {
            Object value = map.get(key);
            if (value == null) continue;
            String text = String.valueOf(value).trim();
            if (!text.isEmpty() && !"null".equalsIgnoreCase(text)) return text;
        }
        return null;
    }

    private boolean looksLikeVideoUrl(String value) {
        if (value == null) {
            return false;
        }

        String text = value.trim().toLowerCase();

        if (!(text.startsWith("http://") || text.startsWith("https://"))) {
            return false;
        }

        return text.contains("youtube.com/")
                || text.contains("youtu.be/")
                || text.contains("vimeo.com/")
                || text.matches(".*\\.(mp4|webm|ogg|mov|m4v)(\\?[^#]*)?$");
    }

    private String normalizeScope(String scope) {
        String value = String.valueOf(scope == null ? "" : scope)
                .trim()
                .toUpperCase();

        if ("PROJECT".equals(value)) {
            return "PROJECT";
        }

        return "WORKSPACE";
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).longValue();

        String text = String.valueOf(value).trim();
        if (text.isEmpty()) return null;

        return Long.parseLong(text);
    }
}
