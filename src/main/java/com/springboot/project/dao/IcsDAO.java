package com.springboot.project.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.springboot.project.dto.csDTO;
import com.springboot.project.dto.csInquiryDTO;
import com.springboot.project.dto.csInquiryAttachmentDTO;

@Mapper
public interface IcsDAO {
    List<csDTO> findAllCsLogs();
    List<csDTO> findCsByUserId(Long userId);
    void insertCsLog(csDTO log);
    void insertCsMessage(csInquiryDTO msg);
    List<csInquiryDTO> findMessagesByCsId(Long csId);
    List<csInquiryDTO> getCategoryList();
    Long getLastInsertedCsId();
    csDTO findActiveLogByUserId(Long userId);

    List<csDTO> findInquiryListByUserId(Long userId);
    csDTO findCsByIdAndUserId(@Param("csId") Long csId, @Param("userId") Long userId);
    List<csDTO> findAdminInquiryList();

    csDTO findCsById(Long csId);

    int updateCsStatus(@Param("csId") Long csId, @Param("status") String status);

    void insertAttachment(csInquiryAttachmentDTO attachment);
    List<csInquiryAttachmentDTO> findAttachmentsByMsgId(Long msgId);
    csInquiryAttachmentDTO findAttachmentById(Long attachmentId);
    csInquiryAttachmentDTO findAttachmentByIdAndUserId(@Param("attachmentId") Long attachmentId,
                                                        @Param("userId") Long userId);

}

