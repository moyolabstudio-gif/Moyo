package com.springboot.project.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.springboot.project.dto.UsersDto;

@Mapper
public interface IUsersDao {
    List<UsersDto> findAll();
    void insertUser(UsersDto user);
}