package com.springboot.project.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

import com.springboot.project.dto.projectRequestDTO;

@Mapper // MyBatis를 사용하는 경우 이 어노테이션이 필수입니다.
public interface IprojectDAO {

    int insertProject(projectRequestDTO dto);
   
    List<projectRequestDTO> selectProjectsByWsId(Long wsId);
    int insertProjectMember(Map<String, Object> params);
}