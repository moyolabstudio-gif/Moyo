package com.springboot.project.service;

import com.springboot.project.dto.projectRequestDTO;

public interface IprojectAuthorizationService {

    projectRequestDTO getAccessibleProject(Long projId, Long requestedWsId, Long userId);

    boolean canAccessProject(Long projId, Long requestedWsId, Long userId);

    boolean isProjectReadOnly(Long projId, Long userId);

    /**
     * 프로젝트 콘텐츠를 변경할 수 있는지 확인한다.
     * WORKSPACE_READ로 진입한 비참여 그룹 멤버(READ_ONLY)는 항상 false다.
     */
    boolean canModifyProjectContent(Long projId, Long userId);

    boolean isWorkspaceMember(Long wsId, Long userId);

    boolean isProjectMemberOrLeader(projectRequestDTO project, Long userId);

    boolean isProjectLeader(Long projId, Long userId);

    boolean canManageProject(Long projId, Long userId);

    /** 기존 호출 호환용. 신규 코드는 canManageProject를 사용한다. */
    boolean isProjectAdmin(Long projId, Long userId);

    boolean canCreateGroupProject(Long wsId, Long userId);

    boolean canAssignUserToProject(Long projId, Long targetUserId);

    boolean isDeletePending(projectRequestDTO project);

    boolean canManageAssignedItem(Long projId, Long assignedUserId, Long userId);
}
