package com.springboot.project.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springboot.project.dao.IusersDao;
import com.springboot.project.dto.usersDto;

@Service
public class UserService {
	@Autowired
	private IusersDao usersDao;
	
	public List<usersDto> getAllUsers(){
		return usersDao.findAll();
	}
	
	public void registerUser(usersDto user) {
		usersDao.insertUser(user);
	}
	
	public usersDto login(usersDto user) {
		usersDto loginUser = usersDao.login(user);
		return loginUser;
	}
	
	public void updateProfile(usersDto user) {
		usersDao.updateUser(user);
	}
	
	public usersDto completeJoinProcess(usersDto user) {
		if (user.getStatus() == null || user.getStatus().isEmpty()) {
			user.setStatus("ACTIVE");
		}
		
		usersDao.updateUser(user);
		return usersDao.login(user);
	}
}