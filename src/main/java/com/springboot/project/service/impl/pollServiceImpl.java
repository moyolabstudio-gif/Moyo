package com.springboot.project.service.impl;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IpollDAO;
import com.springboot.project.service.IpollService;

@Service
public class pollServiceImpl implements IpollService {

    @Autowired
    private IpollDAO pollDao;

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
        boolean canManage = userId != null && createdBy != null && userId.equals(createdBy) && !isClosed;

        result.put("showResults", true);
        result.put("createdBy", createdBy);
        result.put("creatorName", poll.get("CREATOR_NAME"));
        result.put("canManage", canManage);
        result.put("canExtend", userId != null && createdBy != null && userId.equals(createdBy) && isClosed);
        result.put("extendCount", poll.get("EXTEND_COUNT"));
        result.put("prevEndDt", poll.get("PREV_END_DT"));
        result.put("totalVoteCount", totalVoteCount);
        result.put("canEditOptions", canManage);
        result.put("options", options);

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
        if (createdBy == null || !createdBy.equals(userId)) {
            throw new IllegalStateException("투표 작성자만 삭제할 수 있습니다.");
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
        pollDao.extendPoll(params);
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

        if ("IMAGE".equals(optionType)) {
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
