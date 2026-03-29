package com.springboot.project.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springboot.project.dao.IUsersDao;
import com.springboot.project.dto.UsersDto;

@Service
public class UserService {
	@Autowired
	private IUsersDao usersDao;
	
	public List<UsersDto> getAllUsers(){
		return usersDao.findAll();
	}
	
	public void registerUser(UsersDto user) {
		usersDao.insertUser(user);
	}
}