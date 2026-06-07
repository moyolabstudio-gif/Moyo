package com.springboot.project.service;

import java.util.List;
import java.util.Map;

public interface IpollService {
    Map<String, Object> getActivePoll(String scope, Long wsId, Long projId, Long userId);

    Map<String, Object> getPoll(Long pollId, Long userId);

    List<Map<String, Object>> getPollList(String scope, Long wsId, Long projId);

    void vote(Map<String, Object> params);

    Long createPoll(Map<String, Object> params);

    void updatePoll(Map<String, Object> params);

    void deletePoll(Long pollId, Long userId);
}
