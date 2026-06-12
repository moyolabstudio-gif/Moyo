package com.springboot.project.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IusersDao;
import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.workspaceDTO;

@Service
public class UserService {
    @Autowired
    private IusersDao usersDao;

    public List<usersDto> getAllUsers() {
        return usersDao.findAll();
    }

    @Transactional
    public void registerUser(usersDto user) {
        if (user.getStatus() == null || user.getStatus().trim().isEmpty()) {
            user.setStatus("ACTIVE");
        }
        if (user.getUserRole() == null || user.getUserRole().trim().isEmpty()) {
            user.setUserRole("USER");
        }
        usersDao.insertUser(user);
    }

    public boolean isEmailDuplicated(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        return usersDao.findByEmail(email.trim()) != null;
    }

    public usersDto login(usersDto user) {
        return usersDao.login(user);
    }

    public void updateProfile(usersDto user) {
        usersDao.updateUser(user);
    }

    public usersDto completeJoinProcess(usersDto user) {
        if (user.getStatus() == null || user.getStatus().trim().isEmpty()) {
            user.setStatus("ACTIVE");
        }
        usersDao.updateUser(user);
        return usersDao.login(user);
    }

    public List<workspaceDTO> getWorkspacesByUserId(Long userId) {
        return usersDao.findWorkspacesByUserId(userId);
    }
}
