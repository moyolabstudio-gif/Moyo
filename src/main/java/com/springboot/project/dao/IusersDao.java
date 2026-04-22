package com.springboot.project.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.springboot.project.dto.usersDto;

@Mapper
public interface IusersDao {
    List<usersDto> findAll();
    void insertUser(usersDto user);
    usersDto login(usersDto user);
    void updateUser(usersDto user);
    
    List<usersDto> searchUsersByEmail(@Param("email") String email);
    void insertWorkspaceMember(@Param("wsId") Long wsId, @Param("userId") Long userId, @Param("role") String role);
    usersDto findByEmail(String email);
}