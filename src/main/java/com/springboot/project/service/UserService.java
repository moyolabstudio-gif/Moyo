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
        if (user.getBirthCalendarType() == null || user.getBirthCalendarType().trim().isEmpty()) {
            user.setBirthCalendarType("SOLAR");
        }
        if (user.getBirthPublicYn() == null || user.getBirthPublicYn().trim().isEmpty()) {
            user.setBirthPublicYn("Y");
        }
        if (user.getProfileAvatarType() == null || user.getProfileAvatarType().trim().isEmpty()) {
            user.setProfileAvatarType(user.getProfileImagePath() == null ? "DEFAULT" : "IMAGE");
        }
        usersDao.insertUser(user);
        if ("IMAGE".equals(user.getProfileAvatarType()) && user.getProfileImagePath() != null) {
            usersDao.clearCurrentProfileImages(user.getUserId());
            usersDao.insertProfileImageHistory(user);
        }
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

    public usersDto findById(Long userId) {
        if (userId == null) {
            return null;
        }
        return usersDao.findById(userId);
    }

    public void updateProfile(usersDto user) {
        usersDao.updateUser(user);
        if ("IMAGE".equals(user.getProfileAvatarType()) && user.getProfileImagePath() != null) {
            usersDao.clearCurrentProfileImages(user.getUserId());
            usersDao.insertProfileImageHistory(user);
        }
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
