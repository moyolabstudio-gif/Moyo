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

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/content-records")
public class contentRecordItemController {
    private final IcontentRecordItemService service;
    private final IcontentRecordService recordService;
    private final IcontentFileService fileService;

    public contentRecordItemController(IcontentRecordItemService service, IcontentRecordService recordService, IcontentFileService fileService) {
        this.service = service;
        this.recordService = recordService;
        this.fileService = fileService;
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
        return ResponseEntity.ok(service.connectContent(
                recordTargetId,
                String.valueOf(body.get("recordType")),
                Long.valueOf(String.valueOf(body.get("contentId"))),
                body.get("title") == null ? null : String.valueOf(body.get("title")),
                userId(session)));
    }

    @PostMapping("/{recordTargetId}/notes")
    public ResponseEntity<?> note(@PathVariable("recordTargetId") Long recordTargetId, @RequestBody Map<String,Object> body, HttpSession session) {
        contentRecordItemDTO item=new contentRecordItemDTO();
        item.setTitle(body.get("title")==null?null:String.valueOf(body.get("title")));
        item.setPreviewContent(body.get("content")==null?null:String.valueOf(body.get("content")));
        return ResponseEntity.ok(service.createNote(recordTargetId,item,userId(session)));
    }

    @PutMapping("/{recordTargetId}/notes/{recordItemId}")
    public ResponseEntity<?> updateNote(@PathVariable("recordTargetId") Long recordTargetId,@PathVariable("recordItemId") Long recordItemId,@RequestBody Map<String,Object> body,HttpSession session){
        contentRecordItemDTO item=new contentRecordItemDTO();
        item.setTitle(body.get("title")==null?null:String.valueOf(body.get("title")));
        item.setPreviewContent(body.get("content")==null?null:String.valueOf(body.get("content")));
        return ResponseEntity.ok(service.updateNote(recordTargetId,recordItemId,item,userId(session)));
    }


    @DeleteMapping("/{recordTargetId}/photos/{recordItemId}")
    public ResponseEntity<?> deletePhoto(@PathVariable("recordTargetId") Long recordTargetId,@PathVariable("recordItemId") Long recordItemId,HttpSession session){
        service.deletePhoto(recordTargetId,recordItemId,userId(session));
        return ResponseEntity.ok(Map.of("deleted",true,"recordItemId",recordItemId));
    }

    @DeleteMapping("/{recordTargetId}/notes/{recordItemId}")
    public ResponseEntity<?> deleteNote(@PathVariable("recordTargetId") Long recordTargetId,@PathVariable("recordItemId") Long recordItemId,HttpSession session){
        service.deleteNote(recordTargetId,recordItemId,userId(session));
        return ResponseEntity.ok(Map.of("deleted",true,"recordItemId",recordItemId));
    }

    @PutMapping("/{recordTargetId}/notes/order")
    public ResponseEntity<?> reorderNotes(@PathVariable("recordTargetId") Long recordTargetId,@RequestBody Map<String,Object> body,HttpSession session){
        Object raw=body.get("recordItemIds");
        if(!(raw instanceof List<?> values)) throw new IllegalArgumentException("노트 순서 정보가 필요합니다.");
        List<Long> ids=values.stream().map(value->Long.valueOf(String.valueOf(value))).toList();
        service.reorderNotes(recordTargetId,ids,userId(session));
        return ResponseEntity.ok(Map.of("updated",true,"recordItemIds",ids));
    }


    @PostMapping(value="/{recordTargetId}/files", consumes="multipart/form-data")
    public ResponseEntity<?> uploadFiles(
            @PathVariable("recordTargetId") Long recordTargetId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value="originalNames", required=false) List<String> originalNames,
            HttpSession session) {
        return ResponseEntity.ok(fileService.uploadToRecord(recordTargetId, files, originalNames, userId(session)));
    }

    @PostMapping("/{recordTargetId}/files/{contentFileId}")
    public ResponseEntity<?> connectFile(
            @PathVariable("recordTargetId") Long recordTargetId,
            @PathVariable("contentFileId") Long contentFileId,
            HttpSession session) {
        return ResponseEntity.ok(fileService.connectExisting(recordTargetId, contentFileId, userId(session)));
    }

    @DeleteMapping("/{recordTargetId}/files/{recordItemId}")
    public ResponseEntity<?> deleteFile(
            @PathVariable("recordTargetId") Long recordTargetId,
            @PathVariable("recordItemId") Long recordItemId,
            HttpSession session) {
        fileService.removeFromRecord(recordTargetId, recordItemId, userId(session));
        return ResponseEntity.ok(Map.of("deleted", true, "recordItemId", recordItemId));
    }

    @PostMapping("/{recordTargetId}/links")
    public ResponseEntity<?> link(@PathVariable("recordTargetId") Long recordTargetId, @RequestBody contentRecordItemDTO body, HttpSession session) {
        return ResponseEntity.ok(service.createLink(recordTargetId, body, userId(session)));
    }

    @PutMapping("/{recordTargetId}/links/{recordItemId}")
    public ResponseEntity<?> updateLink(
            @PathVariable("recordTargetId") Long recordTargetId,
            @PathVariable("recordItemId") Long recordItemId,
            @RequestBody contentRecordItemDTO body,
            HttpSession session) {
        return ResponseEntity.ok(service.updateLink(recordTargetId, recordItemId, body, userId(session)));
    }

    @DeleteMapping("/{recordTargetId}/links/{recordItemId}")
    public ResponseEntity<?> deleteLink(
            @PathVariable("recordTargetId") Long recordTargetId,
            @PathVariable("recordItemId") Long recordItemId,
            HttpSession session) {
        service.deleteLink(recordTargetId, recordItemId, userId(session));
        return ResponseEntity.ok(Map.of("deleted", true, "recordItemId", recordItemId));
    }

    @PostMapping("/{recordTargetId}/locations")
    public ResponseEntity<?> location(@PathVariable("recordTargetId") Long recordTargetId, @RequestBody contentRecordItemDTO body, HttpSession session) {
        return ResponseEntity.ok(service.createLocation(recordTargetId, body, userId(session)));
    }

    @PutMapping("/{recordTargetId}/locations/{recordItemId}")
    public ResponseEntity<?> updateLocation(@PathVariable("recordTargetId") Long recordTargetId,
            @PathVariable("recordItemId") Long recordItemId, @RequestBody contentRecordItemDTO body, HttpSession session) {
        return ResponseEntity.ok(service.updateLocation(recordTargetId, recordItemId, body, userId(session)));
    }

    @DeleteMapping("/{recordTargetId}/locations/{recordItemId}")
    public ResponseEntity<?> deleteLocation(@PathVariable("recordTargetId") Long recordTargetId,
            @PathVariable("recordItemId") Long recordItemId, HttpSession session) {
        service.deleteLocation(recordTargetId, recordItemId, userId(session));
        return ResponseEntity.ok(Map.of("deleted", true, "recordItemId", recordItemId));
    }

    @PutMapping("/{recordTargetId}/locations/{recordItemId}/primary")
    public ResponseEntity<?> setPrimaryLocation(@PathVariable("recordTargetId") Long recordTargetId,
            @PathVariable("recordItemId") Long recordItemId, HttpSession session) {
        return ResponseEntity.ok(service.setPrimaryLocation(recordTargetId, recordItemId, userId(session)));
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
