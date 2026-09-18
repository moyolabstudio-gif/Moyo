package com.springboot.project.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IusersDao;

@Service
public class LoginFailureService {

    private final IusersDao usersDao;

    public LoginFailureService(IusersDao usersDao) {
        this.usersDao = usersDao;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void clearExpiredLoginLock(Long userId) {
        usersDao.clearExpiredLoginLock(userId);
    }

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public int countActiveLoginLock(Long userId) {
        return usersDao.countActiveLoginLock(userId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLoginFailure(Long userId, int maxFailures, int lockMinutes) {
        usersDao.recordLoginFailure(userId, maxFailures, lockMinutes);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void resetLoginFailures(Long userId) {
        usersDao.resetLoginFailures(userId);
    }
}
