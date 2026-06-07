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

                if (!hasVoted && !isClosed) {
                    item.remove("COUNT");
                    item.remove("count");
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

        result.put("showResults", hasVoted || isClosed);
        result.put("createdBy", createdBy);
        result.put("creatorName", poll.get("CREATOR_NAME"));
        result.put("canManage", canManage);
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

        if (pollDao.countUserVote(pollId, userId) > 0) {
            throw new IllegalStateException("이미 참여한 투표는 선택을 변경할 수 없습니다.");
        }

        Map<String, Object> voteParams = new HashMap<>();
        voteParams.put("pollId", pollId);
        voteParams.put("optionId", optionId);
        voteParams.put("userId", userId);

        pollDao.insertVote(voteParams);
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
            text = "";
            if (imagePath == null || imagePath.isEmpty()) return null;
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

    private String normalizeScope(String scope) {
        String value = String.valueOf(scope == null ? "" : scope).trim().toUpperCase();
        if ("PROJECT".equals(value)) return "PROJECT";
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
