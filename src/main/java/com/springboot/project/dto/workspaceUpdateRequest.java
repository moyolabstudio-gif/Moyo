package com.springboot.project.dto;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

/** 그룹 프로필 수정 요청 전용 DTO. DB 엔티티와 화면 제어값을 분리한다. */
public class workspaceUpdateRequest {
    private Long wsId;
    private String wsName;
    private String wsDescription;
    private String wsType;
    private String joinType;
    /** 홈/목록에 표시할 600x600 크롭 결과 */
    private MultipartFile wsImage;
    /** 사용자가 선택한 원본. 재조정 시 이 파일을 기준으로 사용한다. */
    private MultipartFile wsImageOriginal;
    private Double wsImageCropScale;
    private Double wsImageCropX;
    private Double wsImageCropY;
    private boolean resetWorkspaceImage;
    private List<String> linkNames;
    private List<String> linkUrls;

    public Long getWsId() { return wsId; }
    public void setWsId(Long wsId) { this.wsId = wsId; }
    public String getWsName() { return wsName; }
    public void setWsName(String wsName) { this.wsName = wsName; }
    public String getWsDescription() { return wsDescription; }
    public void setWsDescription(String wsDescription) { this.wsDescription = wsDescription; }
    public String getWsType() { return wsType; }
    public void setWsType(String wsType) { this.wsType = wsType; }
    public String getJoinType() { return joinType; }
    public void setJoinType(String joinType) { this.joinType = joinType; }
    public MultipartFile getWsImage() { return wsImage; }
    public void setWsImage(MultipartFile wsImage) { this.wsImage = wsImage; }
    public MultipartFile getWsImageOriginal() { return wsImageOriginal; }
    public void setWsImageOriginal(MultipartFile wsImageOriginal) { this.wsImageOriginal = wsImageOriginal; }
    public Double getWsImageCropScale() { return wsImageCropScale; }
    public void setWsImageCropScale(Double wsImageCropScale) { this.wsImageCropScale = wsImageCropScale; }
    public Double getWsImageCropX() { return wsImageCropX; }
    public void setWsImageCropX(Double wsImageCropX) { this.wsImageCropX = wsImageCropX; }
    public Double getWsImageCropY() { return wsImageCropY; }
    public void setWsImageCropY(Double wsImageCropY) { this.wsImageCropY = wsImageCropY; }
    public boolean isResetWorkspaceImage() { return resetWorkspaceImage; }
    public void setResetWorkspaceImage(boolean resetWorkspaceImage) { this.resetWorkspaceImage = resetWorkspaceImage; }
    public List<String> getLinkNames() { return linkNames; }
    public void setLinkNames(List<String> linkNames) { this.linkNames = linkNames; }
    public List<String> getLinkUrls() { return linkUrls; }
    public void setLinkUrls(List<String> linkUrls) { this.linkUrls = linkUrls; }
}
