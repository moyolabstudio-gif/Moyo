package com.springboot.project.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface IpollDAO {
    Map<String, Object> selectActiveWorkspacePoll(@Param("wsId") Long wsId);

    Map<String, Object> selectActiveProjectPoll(@Param("wsId") Long wsId,
                                                @Param("projId") Long projId);

    List<Map<String, Object>> selectPollOptions(@Param("pollId") Long pollId);

    Map<String, Object> selectPollById(@Param("pollId") Long pollId);

    Long selectUserVoteOption(@Param("pollId") Long pollId,
                              @Param("userId") Long userId);

    List<Map<String, Object>> selectWorkspacePollList(@Param("wsId") Long wsId);

    List<Map<String, Object>> selectProjectPollList(@Param("wsId") Long wsId,
                                                    @Param("projId") Long projId);

    int countUserVote(@Param("pollId") Long pollId,
                      @Param("userId") Long userId);

    int countPollVotes(@Param("pollId") Long pollId);

    void insertVote(Map<String, Object> params);

    void insertPoll(Map<String, Object> params);

    void updatePoll(Map<String, Object> params);

    void updatePollOption(Map<String, Object> params);

    void deleteVotesByOptionId(@Param("optionId") Long optionId);

    void deletePollOption(@Param("optionId") Long optionId);

    void deletePollVotes(@Param("pollId") Long pollId);

    void deletePollOptions(@Param("pollId") Long pollId);

    void deletePoll(@Param("pollId") Long pollId);

    void insertPollOption(Map<String, Object> params);
}
