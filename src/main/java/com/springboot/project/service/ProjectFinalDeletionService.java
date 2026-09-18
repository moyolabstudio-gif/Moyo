package com.springboot.project.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IprojectDAO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProjectFinalDeletionService {

    private final IprojectDAO projectDAO;

    /**
     * 프로젝트 하나를 독립 트랜잭션으로 최종 삭제한다.
     * 어느 한 단계라도 실패하면 해당 프로젝트 삭제 전체가 롤백된다.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void deleteExpiredProject(Long projId) {
        deleteProjectDependencies(projId);

        int deleted = projectDAO.deleteProjectRow(projId);
        if (deleted != 1) {
            throw new IllegalStateException(
                    "삭제 기한 상태가 변경되어 프로젝트 최종 삭제를 중단합니다. projId=" + projId);
        }
    }

    /**
     * 그룹 최종 삭제 트랜잭션 안에서 그룹 소속 프로젝트를 함께 정리한다.
     * 별도 REQUIRES_NEW를 열지 않고 그룹 삭제 트랜잭션에 참여한다.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void deleteProjectForWorkspaceFinalDeletion(Long projId) {
        deleteProjectDependencies(projId);

        int deleted = projectDAO.deleteProjectRowForWorkspaceFinalDelete(projId);
        if (deleted != 1) {
            throw new IllegalStateException(
                    "그룹 소속 프로젝트 최종 삭제에 실패했습니다. projId=" + projId);
        }
    }

    private void deleteProjectDependencies(Long projId) {
        // 공유받은 노트·사진 등의 원본은 건드리지 않고 프로젝트 공유 연결만 제거한다.
        projectDAO.deleteProjectTargetShares(projId);

        // FK가 없는 공통 반응은 원본 콘텐츠 삭제 전에 명시적으로 정리한다.
        projectDAO.deleteProjectContentReactions(projId);

        // 프로젝트 고유 콘텐츠
        projectDAO.deleteProjectNativeNotes(projId);
        projectDAO.deleteProjectNoteFolders(projId);
        projectDAO.deleteProjectPhotoPosts(projId);
        projectDAO.deleteProjectPhotoAlbums(projId);
        projectDAO.deleteProjectBoardPosts(projId);
        projectDAO.deleteProjectPolls(projId);
        projectDAO.deleteProjectWorkReports(projId);
        projectDAO.deleteProjectEvents(projId);

        // 프로젝트 부가 정보와 멤버 관계
        projectDAO.deleteProjectLinksForFinalDelete(projId);
        projectDAO.deleteProjectMembersForFinalDelete(projId);

    }
}
