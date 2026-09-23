package com.springboot.project.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.project.dto.usersDto;
import com.springboot.project.service.BoardAuthorizationService;
import com.springboot.project.service.CollaborationActivityService;
import com.springboot.project.service.IprojectAuthorizationService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/collaboration-activity")
public class CollaborationActivityController {

    private static final Logger log = LoggerFactory.getLogger(CollaborationActivityController.class);
    private final CollaborationActivityService activityService;
    private final BoardAuthorizationService boardAuthorizationService;
    private final IprojectAuthorizationService projectAuthorizationService;

    public CollaborationActivityController(
            CollaborationActivityService activityService,
            BoardAuthorizationService boardAuthorizationService,
            IprojectAuthorizationService projectAuthorizationService) {
        this.activityService = activityService;
        this.boardAuthorizationService = boardAuthorizationService;
        this.projectAuthorizationService = projectAuthorizationService;
    }

    @GetMapping("/recent")
    public ResponseEntity<Map<String, Object>> recent(
            @RequestParam("scope") String scope,
            @RequestParam(value = "wsId", required = false) Long wsId,
            @RequestParam(value = "projId", required = false) Long projId,
            @RequestParam(value = "limit", defaultValue = "80") int limit,
            HttpSession session) {

        usersDto loginUser = (usersDto) session.getAttribute("user");
        if (loginUser == null || loginUser.getUserId() == null) {
            return ResponseEntity.status(401).body(Map.of("activities", List.of()));
        }

        boolean projectScope = "PROJECT".equalsIgnoreCase(scope);
        Long effectiveProjId = projectScope ? projId : null;
        Long effectiveWsId = projectScope ? null : wsId;
        if ((projectScope && effectiveProjId == null) || (!projectScope && effectiveWsId == null)) {
            return ResponseEntity.badRequest().body(Map.of("activities", List.of()));
        }

        boolean canReadActivity = projectScope
                ? projectAuthorizationService.canAccessProject(effectiveProjId, null, loginUser.getUserId())
                : boardAuthorizationService.canAccessBoard(effectiveWsId, null, loginUser.getUserId());
        if (!canReadActivity) {
            return ResponseEntity.status(403).body(Map.of("activities", List.of()));
        }

        try {
            List<Map<String, Object>> activities = activityService.recent(
                    projectScope ? "PROJECT" : "WORKSPACE",
                    effectiveWsId,
                    effectiveProjId,
                    limit);
            return ResponseEntity.ok(Map.of("activities", activities));
        } catch (Exception e) {
            // 협업 로그 장애가 메인 화면의 다른 위젯까지 번지지 않게 빈 결과로 격리하되,
            // 실제 원인은 서버 로그에서 추적할 수 있게 남긴다.
            log.error("[최근활동] 조회 실패 scope={} wsId={} projId={}",
                    projectScope ? "PROJECT" : "WORKSPACE", effectiveWsId, effectiveProjId, e);
            return ResponseEntity.ok(Map.of("activities", List.of()));
        }
    }
}
