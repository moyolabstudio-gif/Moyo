package com.springboot.project.service.impl;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.springboot.project.dao.IcontentRecordItemDAO;
import com.springboot.project.dto.contentRecordItemDTO;
import com.springboot.project.dto.contentRecordTargetDTO;
import com.springboot.project.service.IcontentRecordItemService;
import com.springboot.project.service.IcontentRecordService;
import com.springboot.project.service.InoteService;

@Service
public class contentRecordItemServiceImpl implements IcontentRecordItemService {
    private static final Set<String> CONTENT_TYPES=Set.of("NOTE","PHOTO","FILE");
    private final IcontentRecordItemDAO itemDAO;
    private final IcontentRecordService recordService;
    private final InoteService noteService;
    public contentRecordItemServiceImpl(IcontentRecordItemDAO itemDAO,IcontentRecordService recordService,InoteService noteService){this.itemDAO=itemDAO;this.recordService=recordService;this.noteService=noteService;}
    @Override @Transactional
    public contentRecordItemDTO connectContent(Long targetId,String type,Long contentId,String title,Long userId){
        requireEditableTarget(targetId,userId); String t=normalize(type); if(!CONTENT_TYPES.contains(t)||contentId==null) throw new IllegalArgumentException("연결할 콘텐츠 정보가 올바르지 않습니다.");
        contentRecordItemDTO item=base(targetId,t,title,userId); item.setContentId(contentId); itemDAO.insertItem(item); return item;
    }
    @Override @Transactional
    public contentRecordItemDTO createNote(Long targetId,contentRecordItemDTO input,Long userId){
        requireEditableTarget(targetId,userId);
        if(input==null||(blank(input.getTitle())&&blank(input.getPreviewContent()))) throw new IllegalArgumentException("노트 제목 또는 내용을 입력하세요.");
        String title=blank(input.getTitle())?autoTitle(input.getPreviewContent()):input.getTitle().trim();
        if(input.getPreviewContent()==null) input.setPreviewContent("");
        recordService.ensureNoteFolder(targetId,userId);
        contentRecordItemDTO saved=base(targetId,"NOTE",title,userId);
        saved.setPreviewContent(input.getPreviewContent());
        itemDAO.insertNoteContent(saved);
        itemDAO.insertItem(saved);
        noteService.recordCurrentNoteVersion(saved.getContentId(), userId, "CREATE", null);
        return itemDAO.selectItem(targetId,saved.getRecordItemId(),userId);
    }
    @Override @Transactional
    public contentRecordItemDTO updateNote(Long targetId,Long recordItemId,contentRecordItemDTO input,Long userId){
        requireEditableTarget(targetId,userId);
        if(recordItemId==null||input==null||(blank(input.getTitle())&&blank(input.getPreviewContent()))) throw new IllegalArgumentException("노트 제목 또는 내용을 입력하세요.");
        String title=blank(input.getTitle())?autoTitle(input.getPreviewContent()):input.getTitle().trim();
        if(input.getPreviewContent()==null) input.setPreviewContent("");
        contentRecordItemDTO current=itemDAO.selectItem(targetId,recordItemId,userId);
        if(current==null||current.getContentId()==null) throw new IllegalArgumentException("수정할 노트를 찾을 수 없습니다.");
        if(same(current.getTitle(),title)&&same(current.getPreviewContent(),input.getPreviewContent())) return current;
        if(itemDAO.updateNoteContent(targetId,recordItemId,title,input.getPreviewContent(),userId)<=0) throw new IllegalArgumentException("수정할 노트를 찾을 수 없습니다.");
        itemDAO.updateItemTitle(targetId,recordItemId,title);
        noteService.recordCurrentNoteVersion(current.getContentId(),userId,"UPDATE",null);
        return itemDAO.selectItem(targetId,recordItemId,userId);
    }

    @Override @Transactional
    public void deletePhoto(Long targetId,Long recordItemId,Long userId){
        requireEditableTarget(targetId,userId);
        if(recordItemId==null) throw new IllegalArgumentException("삭제할 사진이 필요합니다.");
        if(itemDAO.softDeletePhotoItem(targetId,recordItemId)<=0) throw new IllegalArgumentException("삭제할 사진을 찾을 수 없습니다.");
    }
    @Override @Transactional
    public void deleteNote(Long targetId,Long recordItemId,Long userId){
        requireEditableTarget(targetId,userId);
        if(recordItemId==null) throw new IllegalArgumentException("삭제할 노트가 필요합니다.");
        itemDAO.softDeleteNoteContent(targetId,recordItemId,userId);
        if(itemDAO.softDeleteNoteItem(targetId,recordItemId)<=0) throw new IllegalArgumentException("삭제할 노트를 찾을 수 없습니다.");
    }
    @Override @Transactional
    public void reorderNotes(Long targetId,List<Long> recordItemIds,Long userId){
        requireEditableTarget(targetId,userId);
        if(recordItemIds==null||recordItemIds.isEmpty()) throw new IllegalArgumentException("정렬할 노트가 필요합니다.");
        if(recordItemIds.stream().anyMatch(java.util.Objects::isNull)||recordItemIds.stream().distinct().count()!=recordItemIds.size())
            throw new IllegalArgumentException("노트 순서 정보가 올바르지 않습니다.");
        if(itemDAO.countByType(targetId,"NOTE")!=recordItemIds.size())
            throw new IllegalArgumentException("노트 목록이 변경되었습니다. 다시 시도하세요.");
        for(int index=0;index<recordItemIds.size();index++){
            if(itemDAO.updateNoteSortOrder(targetId,recordItemIds.get(index),index+1)!=1)
                throw new IllegalArgumentException("노트 순서를 저장하지 못했습니다.");
        }
    }
    @Override @Transactional
    public contentRecordItemDTO createLink(Long targetId,contentRecordItemDTO item,Long userId){
        requireEditableTarget(targetId,userId);
        LinkValue value=validateLink(item);
        if(itemDAO.countActiveLinkByUrl(targetId,value.url,null)>0) throw new IllegalArgumentException("이미 추가된 링크입니다.");
        contentRecordItemDTO saved=base(targetId,"LINK",value.title,userId);
        saved.setLinkUrl(value.url);
        saved.setDescription(value.description);
        itemDAO.insertItem(saved);
        itemDAO.insertLink(saved);
        return itemDAO.selectItem(targetId,saved.getRecordItemId(),userId);
    }
    @Override @Transactional
    public contentRecordItemDTO updateLink(Long targetId,Long recordItemId,contentRecordItemDTO item,Long userId){
        requireEditableTarget(targetId,userId);
        if(recordItemId==null) throw new IllegalArgumentException("수정할 링크가 필요합니다.");
        contentRecordItemDTO current=itemDAO.selectItem(targetId,recordItemId,userId);
        if(current==null||!"LINK".equals(normalize(current.getRecordType()))) throw new IllegalArgumentException("수정할 링크를 찾을 수 없습니다.");
        LinkValue value=validateLink(item);
        if(itemDAO.countActiveLinkByUrl(targetId,value.url,recordItemId)>0) throw new IllegalArgumentException("이미 추가된 링크입니다.");
        if(itemDAO.updateLink(targetId,recordItemId,value.title,value.url,value.description)<=0) throw new IllegalArgumentException("수정할 링크를 찾을 수 없습니다.");
        itemDAO.updateLinkItemMetadata(targetId,recordItemId,value.title);
        return itemDAO.selectItem(targetId,recordItemId,userId);
    }
    @Override @Transactional
    public void deleteLink(Long targetId,Long recordItemId,Long userId){
        requireDeletableTarget(targetId,userId);
        if(recordItemId==null||itemDAO.softDeleteLinkItem(targetId,recordItemId)<=0) throw new IllegalArgumentException("삭제할 링크를 찾을 수 없습니다.");
    }
    @Override @Transactional
    public contentRecordItemDTO createLocation(Long targetId,contentRecordItemDTO item,Long userId){
        requireEditableTarget(targetId,userId); validateLocation(item);
        boolean first=itemDAO.countActiveLocations(targetId)==0;
        String title=clean(item.getLocationText(),300);
        contentRecordItemDTO saved=base(targetId,"LOCATION",title,userId);
        copyLocation(saved,item);
        saved.setPrimaryYn(first||"Y".equalsIgnoreCase(item.getPrimaryYn())?"Y":"N");
        if("Y".equals(saved.getPrimaryYn())) itemDAO.clearPrimaryLocation(targetId);
        itemDAO.insertItem(saved); itemDAO.insertLocation(saved);
        return itemDAO.selectItem(targetId,saved.getRecordItemId(),userId);
    }
    @Override @Transactional
    public contentRecordItemDTO updateLocation(Long targetId,Long recordItemId,contentRecordItemDTO item,Long userId){
        requireEditableTarget(targetId,userId); validateLocation(item);
        if(recordItemId==null) throw new IllegalArgumentException("수정할 장소가 필요합니다.");
        contentRecordItemDTO current=itemDAO.selectItem(targetId,recordItemId,userId);
        if(current==null||!"LOCATION".equals(normalize(current.getRecordType()))) throw new IllegalArgumentException("수정할 장소를 찾을 수 없습니다.");
        String title=clean(item.getLocationText(),300);
        if(itemDAO.updateLocation(targetId,recordItemId,title,clean(item.getLocationAddress(),500),item.getLocationLat(),item.getLocationLng(),clean(item.getLocationPlaceId(),300),clean(item.getMemo(),1000),clean(item.getLocationDescription(),1000))<=0) throw new IllegalArgumentException("수정할 장소를 찾을 수 없습니다.");
        itemDAO.updateLocationItemMetadata(targetId,recordItemId,title);
        return itemDAO.selectItem(targetId,recordItemId,userId);
    }
    @Override @Transactional
    public void deleteLocation(Long targetId,Long recordItemId,Long userId){
        requireDeletableTarget(targetId,userId);
        boolean wasPrimary=recordItemId!=null&&itemDAO.countPrimaryLocation(targetId,recordItemId)>0;
        if(recordItemId==null||itemDAO.softDeleteLocationItem(targetId,recordItemId)<=0) throw new IllegalArgumentException("삭제할 장소를 찾을 수 없습니다.");
        if(wasPrimary){
            Long next=itemDAO.selectFirstActiveLocationId(targetId);
            if(next!=null){ itemDAO.clearPrimaryLocation(targetId); itemDAO.setPrimaryLocation(targetId,next); }
        }
    }
    @Override @Transactional
    public contentRecordItemDTO setPrimaryLocation(Long targetId,Long recordItemId,Long userId){
        requireEditableTarget(targetId,userId);
        if(recordItemId==null) throw new IllegalArgumentException("대표 장소가 필요합니다.");
        contentRecordItemDTO current=itemDAO.selectItem(targetId,recordItemId,userId);
        if(current==null||!"LOCATION".equals(normalize(current.getRecordType()))) throw new IllegalArgumentException("대표로 지정할 장소를 찾을 수 없습니다.");
        itemDAO.clearPrimaryLocation(targetId);
        if(itemDAO.setPrimaryLocation(targetId,recordItemId)<=0) throw new IllegalArgumentException("대표 장소를 지정하지 못했습니다.");
        return itemDAO.selectItem(targetId,recordItemId,userId);
    }
    private void validateLocation(contentRecordItemDTO item){
        if(item==null||blank(item.getLocationText())) throw new IllegalArgumentException("장소명 또는 주소를 입력하세요.");
        if(item.getLocationText().trim().length()>300) throw new IllegalArgumentException("장소는 300자 이내로 입력하세요.");
        if(!blank(item.getLocationAddress())&&item.getLocationAddress().trim().length()>500) throw new IllegalArgumentException("주소는 500자 이내로 입력하세요.");
        if(!blank(item.getMemo())&&item.getMemo().trim().length()>1000) throw new IllegalArgumentException("상세 위치는 1000자 이내로 입력하세요.");
        if(!blank(item.getLocationDescription())&&item.getLocationDescription().trim().length()>1000) throw new IllegalArgumentException("장소 설명은 1000자 이내로 입력하세요.");
    }
    private void copyLocation(contentRecordItemDTO saved,contentRecordItemDTO item){
        saved.setLocationText(clean(item.getLocationText(),300)); saved.setLocationAddress(clean(item.getLocationAddress(),500));
        saved.setLocationLat(item.getLocationLat()); saved.setLocationLng(item.getLocationLng());
        saved.setLocationPlaceId(clean(item.getLocationPlaceId(),300)); saved.setMemo(clean(item.getMemo(),1000));
        saved.setLocationDescription(clean(item.getLocationDescription(),1000));
    }
    @Override public List<contentRecordItemDTO> getItems(Long targetId,Long userId){recordService.getViewableTarget(targetId,userId); return itemDAO.selectItems(targetId,userId);}
    private LinkValue validateLink(contentRecordItemDTO item){
        if(item==null||blank(item.getLinkUrl())) throw new IllegalArgumentException("링크 주소가 필요합니다.");
        String url=normalizeLinkUrl(item.getLinkUrl());
        String title=clean(item.getTitle(),500);
        String description=clean(item.getDescription(),1000);
        return new LinkValue(title,url,description);
    }
    private String normalizeLinkUrl(String raw){
        String value=raw==null?"":raw.trim();
        if(!value.matches("(?i)^https?://.*")) value="https://"+value;
        try{
            URI uri=new URI(value);
            String scheme=uri.getScheme()==null?"":uri.getScheme().toLowerCase(Locale.ROOT);
            if(!Set.of("http","https").contains(scheme)||blank(uri.getHost())) throw new IllegalArgumentException("올바른 웹 주소를 입력하세요.");
            String host=uri.getHost().toLowerCase(Locale.ROOT);
            int port=uri.getPort();
            if(("http".equals(scheme)&&port==80)||("https".equals(scheme)&&port==443)) port=-1;
            URI normalized=new URI(scheme,uri.getUserInfo(),host,port,blank(uri.getPath())?null:uri.getPath(),uri.getQuery(),uri.getFragment());
            String result=normalized.toASCIIString();
            if(result.length()>2000) throw new IllegalArgumentException("링크 주소는 2000자 이내로 입력하세요.");
            return result;
        }catch(URISyntaxException ex){
            throw new IllegalArgumentException("올바른 웹 주소를 입력하세요.");
        }
    }
    private String hostTitle(String url){
        try{
            String host=new URI(url).getHost();
            if(host==null) return "링크";
            return host.replaceFirst("(?i)^www\\.","");
        }catch(URISyntaxException ex){ return "링크"; }
    }
    private String clean(String value,int max){
        if(value==null) return null;
        String cleaned=value.trim();
        if(cleaned.isEmpty()) return null;
        if(cleaned.length()>max) throw new IllegalArgumentException("입력값은 "+max+"자 이내로 입력하세요.");
        return cleaned;
    }
    private static final class LinkValue{
        private final String title; private final String url; private final String description;
        private LinkValue(String title,String url,String description){this.title=title;this.url=url;this.description=description;}
    }
    private contentRecordTargetDTO requireDeletableTarget(Long id,Long userId){
        if(id==null||userId==null) throw new IllegalArgumentException("기록 대상이 필요합니다.");
        return recordService.getDeletableTarget(id,userId);
    }
    private contentRecordTargetDTO requireEditableTarget(Long id,Long userId){if(id==null||userId==null) throw new IllegalArgumentException("기록 대상이 필요합니다."); contentRecordTargetDTO t=recordService.getEditableTarget(id,userId); if(!Set.of("DRAFT","ACTIVE").contains(t.getTargetStatus())) throw new IllegalStateException("기록을 추가할 수 없는 상태입니다."); return t;}
    private contentRecordItemDTO base(Long id,String type,String title,Long userId){contentRecordItemDTO i=new contentRecordItemDTO();i.setRecordTargetId(id);i.setRecordType(type);i.setTitle(title);i.setSortOrder(itemDAO.countByType(id,type)+1);i.setCreatedBy(userId);return i;}
    private String autoTitle(String content){String v=content==null?"":content.replaceAll("\\s+"," ").trim(); return v.isEmpty()?"새 노트":v.substring(0,Math.min(v.length(),30));}
    private boolean same(String a,String b){return String.valueOf(a==null?"":a).equals(String.valueOf(b==null?"":b));}
    private String normalize(String v){return v==null?"":v.trim().toUpperCase(Locale.ROOT);} private boolean blank(String v){return v==null||v.isBlank();}
}
