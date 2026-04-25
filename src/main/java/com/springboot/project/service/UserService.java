package com.springboot.project.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springboot.project.dao.IusersDao;
import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.workspaceDTO;

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
	
	public List<workspaceDTO> getWorkspacesByUserId(Long userId) {
        // usersDao에도 이 메서드를 만들어야 합니다.
        return usersDao.findWorkspacesByUserId(userId);
    }
}