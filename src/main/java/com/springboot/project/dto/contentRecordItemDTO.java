package com.springboot.project.dto;

import java.time.LocalDateTime;

public class contentRecordItemDTO {
    private Long recordItemId;
    private Long recordTargetId;
    private String recordType;
    private Long contentId;
    private String title;
    private Integer sortOrder;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 연결된 원본 노트의 작성/수정 이력 (NOTES 기준)
    private Long userId;
    private String userName;
    private LocalDateTime regDt;
    private Long updatedBy;
    private String updatedByName;
    private LocalDateTime updDt;
    private String deletedYn;
    private String linkUrl;
    private String description;
    private String locationText;
    private String locationAddress;
    private Double locationLat;
    private Double locationLng;
    private String locationPlaceId;
    private String memo;
    private String locationDescription;
    private String primaryYn;
    private String previewContent;
    private String thumbnailUrl;
    private String creatorName;
    private Integer likeCount;
    private Integer commentCount;
    private Integer likedByMe;
    private Integer photoCount;
    private String fileOriginalName;
    private String fileContentType;
    private String fileExtension;
    private Long fileSize;
    private String fileDownloadUrl;
    private Integer fileCanRename;
    public Long getRecordItemId(){return recordItemId;} public void setRecordItemId(Long v){recordItemId=v;}
    public Long getRecordTargetId(){return recordTargetId;} public void setRecordTargetId(Long v){recordTargetId=v;}
    public String getRecordType(){return recordType;} public void setRecordType(String v){recordType=v;}
    public Long getContentId(){return contentId;} public void setContentId(Long v){contentId=v;}
    public String getTitle(){return title;} public void setTitle(String v){title=v;}
    public Integer getSortOrder(){return sortOrder;} public void setSortOrder(Integer v){sortOrder=v;}
    public Long getCreatedBy(){return createdBy;} public void setCreatedBy(Long v){createdBy=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
    public LocalDateTime getUpdatedAt(){return updatedAt;} public void setUpdatedAt(LocalDateTime v){updatedAt=v;}
    public Long getUserId(){return userId;} public void setUserId(Long v){userId=v;}
    public String getUserName(){return userName;} public void setUserName(String v){userName=v;}
    public LocalDateTime getRegDt(){return regDt;} public void setRegDt(LocalDateTime v){regDt=v;}
    public Long getUpdatedBy(){return updatedBy;} public void setUpdatedBy(Long v){updatedBy=v;}
    public String getUpdatedByName(){return updatedByName;} public void setUpdatedByName(String v){updatedByName=v;}
    public LocalDateTime getUpdDt(){return updDt;} public void setUpdDt(LocalDateTime v){updDt=v;}
    public String getDeletedYn(){return deletedYn;} public void setDeletedYn(String v){deletedYn=v;}
    public String getLinkUrl(){return linkUrl;} public void setLinkUrl(String v){linkUrl=v;}
    public String getDescription(){return description;} public void setDescription(String v){description=v;}
    public String getLocationText(){return locationText;} public void setLocationText(String v){locationText=v;}
    public String getLocationAddress(){return locationAddress;} public void setLocationAddress(String v){locationAddress=v;}
    public Double getLocationLat(){return locationLat;} public void setLocationLat(Double v){locationLat=v;}
    public Double getLocationLng(){return locationLng;} public void setLocationLng(Double v){locationLng=v;}
    public String getLocationPlaceId(){return locationPlaceId;} public void setLocationPlaceId(String v){locationPlaceId=v;}
    public String getMemo(){return memo;} public void setMemo(String v){memo=v;}
    public String getLocationDescription(){return locationDescription;} public void setLocationDescription(String v){locationDescription=v;}
    public String getPrimaryYn(){return primaryYn;} public void setPrimaryYn(String v){primaryYn=v;}
    public String getPreviewContent(){return previewContent;} public void setPreviewContent(String v){previewContent=v;}
    public String getThumbnailUrl(){return thumbnailUrl;} public void setThumbnailUrl(String v){thumbnailUrl=v;}
    public String getCreatorName(){return creatorName;} public void setCreatorName(String v){creatorName=v;}
    public Integer getLikeCount(){return likeCount;} public void setLikeCount(Integer v){likeCount=v;}
    public Integer getCommentCount(){return commentCount;} public void setCommentCount(Integer v){commentCount=v;}
    public Integer getLikedByMe(){return likedByMe;} public void setLikedByMe(Integer v){likedByMe=v;}
    public Integer getPhotoCount(){return photoCount;} public void setPhotoCount(Integer v){photoCount=v;}
    public String getFileOriginalName(){return fileOriginalName;} public void setFileOriginalName(String v){fileOriginalName=v;}
    public String getFileContentType(){return fileContentType;} public void setFileContentType(String v){fileContentType=v;}
    public String getFileExtension(){return fileExtension;} public void setFileExtension(String v){fileExtension=v;}
    public Long getFileSize(){return fileSize;} public void setFileSize(Long v){fileSize=v;}
    public String getFileDownloadUrl(){return fileDownloadUrl;} public void setFileDownloadUrl(String v){fileDownloadUrl=v;}
    public Integer getFileCanRename(){return fileCanRename;} public void setFileCanRename(Integer v){fileCanRename=v;}
}
