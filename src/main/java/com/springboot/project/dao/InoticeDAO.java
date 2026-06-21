package com.springboot.project.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.springboot.project.dto.noticeDTO;

@Mapper
public interface InoticeDAO {
    List<noticeDTO> selectNoticeList();
    noticeDTO selectNoticeById(Long noticeId);
    void insertNotice(noticeDTO dto);
    void updateNotice(noticeDTO dto);
    void deleteNotice(Long noticeId);
}