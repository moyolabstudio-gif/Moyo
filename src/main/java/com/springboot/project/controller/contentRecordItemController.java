package com.springboot.project.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.project.dto.contentRecordItemDTO;
import com.springboot.project.dto.contentRecordTargetRequest;
import com.springboot.project.service.IcontentRecordItemService;
import com.springboot.project.service.IcontentFileService;
import com.springboot.project.service.IcontentRecordService;
import com.springboot.project.service.CollaborationActivityService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/content-records")
public class contentRecordItemController {
    private final IcontentRecordItemService service;
    private final IcontentRecordService recordService;
    private final IcontentFileService fileService;
    private final CollaborationActivityService collaborationActivityService;

    public contentRecordItemController(IcontentRecordItemService service, IcontentRecordService recordService,
            IcontentFileService fileService, CollaborationActivityService collaborationActivityService) {
        this.service = service;
        this.recordService = recordService;
        this.fileService = fileService;
        this.collaborationActivityService = collaborationActivityService;
    }

    @GetMapping("/target")
    public ResponseEntity<?> target(
            @RequestParam("targetType") String targetType,
            @RequestParam("targetId") Long targetId,
            HttpSession session) {
        return ResponseEntity.ok(recordService.getTarget(targetType, targetId, userId(session)));
    }

    @PostMapping("/target")
    public ResponseEntity<?> ensureTarget(
            @RequestBody contentRecordTargetRequest request,
            HttpSession session) {
        return ResponseEntity.ok(recordService.ensureTarget(request, userId(session)));
    }

    @GetMapping("/{recordTargetId}/permission")
    public ResponseEntity<?> permission(@PathVariable("recordTargetId") Long recordTargetId, HttpSession session) {
        return ResponseEntity.ok(recordService.getPermission(recordTargetId, userId(session)));
    }

    @GetMapping("/{recordTargetId}/items")
    public ResponseEntity<?> list(@PathVariable("recordTargetId") Long recordTargetId, HttpSession session) {
        return ResponseEntity.ok(service.getItems(recordTargetId, userId(session)));
    }

    @PostMapping("/{recordTargetId}/photo-album")
    public ResponseEntity<?> ensurePhotoAlbum(
            @PathVariable("recordTargetId") Long recordTargetId,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        String albumName = body.get("albumName") == null ? null : String.valueOf(body.get("albumName"));
        Long albumId = recordService.ensurePhotoAlbum(recordTargetId, albumName, userId(session));
        return ResponseEntity.ok(Map.of("albumId", albumId));
    }

    @PostMapping("/{recordTargetId}/contents")
    public ResponseEntity<?> content(@PathVariable("recordTargetId") Long recordTargetId, @RequestBody Map<String, Object> body, HttpSession session) {
        Long actorUserId = userId(session);
        String recordType = String.valueOf(body.get("recordType"));
        contentRecordItemDTO connected = service.connectContent(
                recordTargetId,
                recordType,
                Long.valueOf(String.valueOf(body.get("contentId"))),
                body.get("title") == null ? null : String.valueOf(body.get("title")),
                actorUserId);
        String label = "PHOTO".equalsIgnoreCase(recordType) ? "기록 사진을" : "기록 콘텐츠를";
        logRecordChange(recordTargetId, actorUserId, "RECORD_" + recordType.toUpperCase() + "_CREATE", label, "추가했어요.", "/api/content-records/contents");
        return ResponseEntity.ok(connected);
    }

    @PostMapping("/{recordTargetId}/notes")
    public ResponseEntity<?> note(@PathVariable("recordTargetId") Long recordTargetId, @RequestBody Map<String,Object> body, HttpSession session) {
        contentRecordItemDTO item=new contentRecordItemDTO();
        item.setTitle(body.get("title")==null?null:String.valueOf(body.get("title")));
        item.setPreviewContent(body.get("content")==null?null:String.valueOf(body.get("content")));
        Long actorUserId = userId(session);
        contentRecordItemDTO created = service.createNote(recordTargetId,item,actorUserId);
        logRecordChange(recordTargetId, actorUserId, "RECORD_NOTE_CREATE", "기록 노트를", "추가했어요.", "/api/content-records/notes");
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{recordTargetId}/notes/{recordItemId}")
    public ResponseEntity<?> updateNote(@PathVariable("recordTargetId") Long recordTargetId,@PathVariable("recordItemId") Long recordItemId,@RequestBody Map<String,Object> body,HttpSession session){
        contentRecordItemDTO item=new contentRecordItemDTO();
        item.setTitle(body.get("title")==null?null:String.valueOf(body.get("title")));
        item.setPreviewContent(body.get("content")==null?null:String.valueOf(body.get("content")));
        item.setBaseTitle(body.containsKey("baseTitle")?(body.get("baseTitle")==null?null:String.valueOf(body.get("baseTitle"))):null);
        item.setBaseContent(body.containsKey("baseContent")?(body.get("baseContent")==null?null:String.valueOf(body.get("baseContent"))):null);
        Long actorUserId = userId(session);
        contentRecordItemDTO updated = service.updateNote(recordTargetId,recordItemId,item,actorUserId);
        if(updated==null){
            contentRecordItemDTO latest=service.getItems(recordTargetId,actorUserId).stream()
                    .filter(row->recordItemId.equals(row.getRecordItemId()))
                    .findFirst().orElse(null);
            Map<String,Object> conflict=new java.util.LinkedHashMap<>();
            conflict.put("success",false);
            conflict.put("status",409);
            conflict.put("code","NOTE_EDIT_CONFLICT");
            conflict.put("message","다른 사용자가 이 노트를 먼저 수정했습니다. 현재 작성 내용은 임시 저장되었습니다.");
            conflict.put("latest",latest);
            return ResponseEntity.status(org.springframework.http.HttpStatus.CONFLICT).body(conflict);
        }
        logRecordChange(recordTargetId, actorUserId, "RECORD_NOTE_UPDATE", "기록 노트를", "수정했어요.", "/api/content-records/notes");
        return ResponseEntity.ok(updated);
    }


    @DeleteMapping("/{recordTargetId}/photos/{recordItemId}")
    public ResponseEntity<?> deletePhoto(@PathVariable("recordTargetId") Long recordTargetId,@PathVariable("recordItemId") Long recordItemId,HttpSession session){
        Long actorUserId = userId(session);
        service.deletePhoto(recordTargetId,recordItemId,actorUserId);
        logRecordChange(recordTargetId, actorUserId, "RECORD_PHOTO_DELETE", "기록 사진을", "삭제했어요.", "/api/content-records/photos");
        return ResponseEntity.ok(Map.of("deleted",true,"recordItemId",recordItemId));
    }

    @DeleteMapping("/{recordTargetId}/notes/{recordItemId}")
    public ResponseEntity<?> deleteNote(@PathVariable("recordTargetId") Long recordTargetId,@PathVariable("recordItemId") Long recordItemId,HttpSession session){
        Long actorUserId = userId(session);
        service.deleteNote(recordTargetId,recordItemId,actorUserId);
        logRecordChange(recordTargetId, actorUserId, "RECORD_NOTE_DELETE", "기록 노트를", "삭제했어요.", "/api/content-records/notes");
        return ResponseEntity.ok(Map.of("deleted",true,"recordItemId",recordItemId));
    }

    @PutMapping("/{recordTargetId}/notes/order")
    public ResponseEntity<?> reorderNotes(@PathVariable("recordTargetId") Long recordTargetId,@RequestBody Map<String,Object> body,HttpSession session){
        Object raw=body.get("recordItemIds");
        if(!(raw instanceof List<?> values)) throw new IllegalArgumentException("노트 순서 정보가 필요합니다.");
        List<Long> ids=values.stream().map(value->Long.valueOf(String.valueOf(value))).toList();
        Long actorUserId = userId(session);
        service.reorderNotes(recordTargetId,ids,actorUserId);
        logRecordChange(recordTargetId, actorUserId, "RECORD_NOTE_REORDER", "기록 노트 순서를", "변경했어요.", "/api/content-records/notes/order");
        return ResponseEntity.ok(Map.of("updated",true,"recordItemIds",ids));
    }


    @PostMapping(value="/{recordTargetId}/files", consumes="multipart/form-data")
    public ResponseEntity<?> uploadFiles(
            @PathVariable("recordTargetId") Long recordTargetId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value="originalNames", required=false) List<String> originalNames,
            HttpSession session) {
        Long actorUserId = userId(session);
        List<contentRecordItemDTO> uploaded = fileService.uploadToRecord(recordTargetId, files, originalNames, actorUserId);
        logRecordChange(recordTargetId, actorUserId, "RECORD_FILE_CREATE", "기록 파일을", "추가했어요.", "/api/content-records/files");
        return ResponseEntity.ok(uploaded);
    }

    @PostMapping("/{recordTargetId}/files/{contentFileId}")
    public ResponseEntity<?> connectFile(
            @PathVariable("recordTargetId") Long recordTargetId,
            @PathVariable("contentFileId") Long contentFileId,
            HttpSession session) {
        Long actorUserId = userId(session);
        contentRecordItemDTO connected = fileService.connectExisting(recordTargetId, contentFileId, actorUserId);
        logRecordChange(recordTargetId, actorUserId, "RECORD_FILE_CREATE", "기록 파일을", "연결했어요.", "/api/content-records/files");
        return ResponseEntity.ok(connected);
    }

    @DeleteMapping("/{recordTargetId}/files/{recordItemId}")
    public ResponseEntity<?> deleteFile(
            @PathVariable("recordTargetId") Long recordTargetId,
            @PathVariable("recordItemId") Long recordItemId,
            HttpSession session) {
        Long actorUserId = userId(session);
        fileService.removeFromRecord(recordTargetId, recordItemId, actorUserId);
        logRecordChange(recordTargetId, actorUserId, "RECORD_FILE_DELETE", "기록 파일을", "삭제했어요.", "/api/content-records/files");
        return ResponseEntity.ok(Map.of("deleted", true, "recordItemId", recordItemId));
    }

    @PostMapping("/{recordTargetId}/links")
    public ResponseEntity<?> link(@PathVariable("recordTargetId") Long recordTargetId, @RequestBody contentRecordItemDTO body, HttpSession session) {
        Long actorUserId = userId(session);
        contentRecordItemDTO created = service.createLink(recordTargetId, body, actorUserId);
        logRecordChange(recordTargetId, actorUserId, "RECORD_LINK_CREATE", "기록 링크를", "추가했어요.", "/api/content-records/links");
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{recordTargetId}/links/{recordItemId}")
    public ResponseEntity<?> updateLink(
            @PathVariable("recordTargetId") Long recordTargetId,
            @PathVariable("recordItemId") Long recordItemId,
            @RequestBody contentRecordItemDTO body,
            HttpSession session) {
        Long actorUserId = userId(session);
        contentRecordItemDTO updated = service.updateLink(recordTargetId, recordItemId, body, actorUserId);
        logRecordChange(recordTargetId, actorUserId, "RECORD_LINK_UPDATE", "기록 링크를", "수정했어요.", "/api/content-records/links");
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{recordTargetId}/links/{recordItemId}")
    public ResponseEntity<?> deleteLink(
            @PathVariable("recordTargetId") Long recordTargetId,
            @PathVariable("recordItemId") Long recordItemId,
            HttpSession session) {
        Long actorUserId = userId(session);
        service.deleteLink(recordTargetId, recordItemId, actorUserId);
        logRecordChange(recordTargetId, actorUserId, "RECORD_LINK_DELETE", "기록 링크를", "삭제했어요.", "/api/content-records/links");
        return ResponseEntity.ok(Map.of("deleted", true, "recordItemId", recordItemId));
    }

    @PostMapping("/{recordTargetId}/locations")
    public ResponseEntity<?> location(@PathVariable("recordTargetId") Long recordTargetId, @RequestBody contentRecordItemDTO body, HttpSession session) {
        Long actorUserId = userId(session);
        contentRecordItemDTO created = service.createLocation(recordTargetId, body, actorUserId);
        logRecordChange(recordTargetId, actorUserId, "RECORD_LOCATION_CREATE", "기록 장소를", "추가했어요.", "/api/content-records/locations");
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{recordTargetId}/locations/{recordItemId}")
    public ResponseEntity<?> updateLocation(@PathVariable("recordTargetId") Long recordTargetId,
            @PathVariable("recordItemId") Long recordItemId, @RequestBody contentRecordItemDTO body, HttpSession session) {
        Long actorUserId = userId(session);
        contentRecordItemDTO updated = service.updateLocation(recordTargetId, recordItemId, body, actorUserId);
        logRecordChange(recordTargetId, actorUserId, "RECORD_LOCATION_UPDATE", "기록 장소를", "수정했어요.", "/api/content-records/locations");
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{recordTargetId}/locations/{recordItemId}")
    public ResponseEntity<?> deleteLocation(@PathVariable("recordTargetId") Long recordTargetId,
            @PathVariable("recordItemId") Long recordItemId, HttpSession session) {
        Long actorUserId = userId(session);
        service.deleteLocation(recordTargetId, recordItemId, actorUserId);
        logRecordChange(recordTargetId, actorUserId, "RECORD_LOCATION_DELETE", "기록 장소를", "삭제했어요.", "/api/content-records/locations");
        return ResponseEntity.ok(Map.of("deleted", true, "recordItemId", recordItemId));
    }

    @PutMapping("/{recordTargetId}/locations/{recordItemId}/primary")
    public ResponseEntity<?> setPrimaryLocation(@PathVariable("recordTargetId") Long recordTargetId,
            @PathVariable("recordItemId") Long recordItemId, HttpSession session) {
        Long actorUserId = userId(session);
        contentRecordItemDTO updated = service.setPrimaryLocation(recordTargetId, recordItemId, actorUserId);
        logRecordChange(recordTargetId, actorUserId, "RECORD_LOCATION_PRIMARY", "대표 장소를", "변경했어요.", "/api/content-records/locations/primary");
        return ResponseEntity.ok(updated);
    }

    private void logRecordChange(Long recordTargetId, Long actorUserId, String activityType,
            String recordLabel, String actionLabel, String requestUri) {
        collaborationActivityService.recordContentRecordChange(
                recordTargetId, actorUserId, activityType, recordLabel, actionLabel, requestUri);
    }

    private Long userId(HttpSession session) {
        Object userId = session.getAttribute("loginUserId");
        if (userId == null) userId = session.getAttribute("userId");
        if (userId == null && session.getAttribute("user") instanceof com.springboot.project.dto.usersDto user) {
            userId = user.getUserId();
        }
        if (userId == null) throw new SecurityException("로그인이 필요합니다.");
        return Long.valueOf(String.valueOf(userId));
    }
}
