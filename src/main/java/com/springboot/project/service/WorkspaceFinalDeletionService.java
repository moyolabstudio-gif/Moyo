package com.springboot.project.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.project.dao.IworkspaceDAO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WorkspaceFinalDeletionService {

    private final IworkspaceDAO workspaceDAO;
    private final ProjectFinalDeletionService projectFinalDeletionService;

    /**
     * 그룹 하나를 독립 트랜잭션으로 최종 삭제한다.
     * 어느 단계라도 실패하면 그룹과 소속 프로젝트 정리가 모두 롤백된다.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void deleteExpiredWorkspace(Long wsId) {
        // 그룹 소속 프로젝트를 먼저 정리한다.
        List<Long> projectIds =
                workspaceDAO.selectWorkspaceProjectIdsForFinalDelete(wsId);
        for (Long projId : projectIds) {
            projectFinalDeletionService
                    .deleteProjectForWorkspaceFinalDeletion(projId);
        }

        // 공유된 원본은 유지하고 그룹을 대상으로 한 공유 연결만 제거한다.
        workspaceDAO.deleteWorkspaceTargetShares(wsId);

        // FK가 없는 공통 반응은 원본 콘텐츠 삭제 전에 정리한다.
        workspaceDAO.deleteWorkspaceContentReactions(wsId);

        // 공통 FILE 탐색기 자료. 파일 참조/최근 접근을 먼저 끊고 실제 파일·폴더를 지운다.
        workspaceDAO.deleteWorkspaceContentFileRecentAccess(wsId);
        workspaceDAO.deleteWorkspaceContentRecordFileItems(wsId);
        workspaceDAO.deleteWorkspaceContentFiles(wsId);
        workspaceDAO.deleteWorkspaceContentFileFolders(wsId);

        // 그룹 자체 범위 콘텐츠
        workspaceDAO.deleteWorkspaceNativeNotes(wsId);
        workspaceDAO.deleteWorkspaceNoteFolders(wsId);
        workspaceDAO.deleteWorkspacePhotoPosts(wsId);
        workspaceDAO.deleteWorkspacePhotoAlbums(wsId);
        workspaceDAO.deleteWorkspaceBoardPosts(wsId);
        workspaceDAO.deleteWorkspacePolls(wsId);
        workspaceDAO.deleteWorkspaceEvents(wsId);

        // 가입·초대·프로필·링크·멤버 관계
        workspaceDAO.deleteWorkspaceJoinRequests(wsId);
        workspaceDAO.deleteWorkspaceInvitations(wsId);
        workspaceDAO.deleteWorkspaceMemberProfiles(wsId);
        workspaceDAO.deleteWorkspaceLinksForFinalDelete(wsId);
        workspaceDAO.deleteWorkspaceMembersForFinalDelete(wsId);

        int deleted = workspaceDAO.deleteWorkspaceRow(wsId);
        if (deleted != 1) {
            throw new IllegalStateException(
                    "삭제 기한 상태가 변경되어 그룹 최종 삭제를 중단합니다. wsId="
                            + wsId);
        }
    }
}
