package com.springboot.project.service;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.springboot.project.dto.csInquiryDTO;


public interface IcsService {
    List<csInquiryDTO> getCategoryList();
    
    void registerInquiry(csInquiryDTO inquiry);
    
    List<csInquiryDTO> getMessagesByUserId(Long userId);
}