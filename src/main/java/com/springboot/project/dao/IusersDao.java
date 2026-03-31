package com.springboot.project.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.springboot.project.dto.usersDto;

@Mapper
public interface IusersDao {
    List<usersDto> findAll();
    void insertUser(usersDto user);
    usersDto login(usersDto user);
    void updateUser(usersDto user);
}