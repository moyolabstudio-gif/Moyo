package com.springboot.project.dao;

import org.apache.ibatis.annotations.Mapper; 
import com.springboot.project.dto.chatMessageDTO;
import java.util.List;

@Mapper 
public interface IchatMessageDAO {
    int insertMessage(chatMessageDTO message);
    List<chatMessageDTO> selectMessageList(Long roomId);
}