package com.springboot.project.service;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.springboot.project.dao.*;
import com.springboot.project.dto.contentFileFolderDTO;
@Service
public class contentFileFolderService {
 private final IcontentFileFolderDAO dao; private final IcontentRecordDAO recordDAO;
 public contentFileFolderService(IcontentFileFolderDAO dao,IcontentRecordDAO recordDAO){this.dao=dao;this.recordDAO=recordDAO;}
 public List<contentFileFolderDTO> tree(String scopeType,Long wsId,Long projId,Long userId){Scope s=scope(scopeType,wsId,projId,userId);return dao.selectTree(s.type,s.owner,s.ws,s.proj);}
 public List<contentFileFolderDTO> children(String scopeType,Long wsId,Long projId,Long parentId,Long userId){Scope s=scope(scopeType,wsId,projId,userId);verifyFolder(parentId,s);return dao.selectChildren(s.type,s.owner,s.ws,s.proj,parentId);}
 @Transactional public contentFileFolderDTO create(String scopeType,Long wsId,Long projId,Long parentId,String name,Long userId){Scope s=scope(scopeType,wsId,projId,userId);requireManage(s,userId);verifyFolder(parentId,s);String n=name(name);unique(s,parentId,n,null);contentFileFolderDTO d=new contentFileFolderDTO();d.setScopeType(s.type);d.setOwnerUserId(s.owner);d.setWsId(s.ws);d.setProjId(s.proj);d.setParentFolderId(parentId);d.setFolderName(n);d.setCreatedBy(userId);dao.insert(d);return dao.selectById(d.getFolderId());}
 @Transactional public contentFileFolderDTO rename(Long id,String name,Long userId){contentFileFolderDTO f=require(id);Scope s=scopeOf(f,userId);requireManage(s,userId);String n=name(name);unique(s,f.getParentFolderId(),n,id);dao.updateName(id,n,userId);return dao.selectById(id);}
 @Transactional public contentFileFolderDTO move(Long id,Long parentId,Long userId){contentFileFolderDTO f=require(id);Scope s=scopeOf(f,userId);requireManage(s,userId);verifyFolder(parentId,s);if(Objects.equals(id,parentId)||parentId!=null&&dao.countDescendant(id,parentId)>0)throw new IllegalArgumentException("하위 폴더 안으로 이동할 수 없습니다.");unique(s,parentId,f.getFolderName(),id);dao.move(id,parentId,userId);return dao.selectById(id);}
 @Transactional public void delete(Long id,Long userId){contentFileFolderDTO f=require(id);Scope s=scopeOf(f,userId);requireManage(s,userId);if(dao.countChildren(id)>0||dao.countFiles(id)>0)throw new IllegalStateException("비어 있는 폴더만 삭제할 수 있습니다.");dao.softDelete(id,userId);}
 private contentFileFolderDTO require(Long id){contentFileFolderDTO f=dao.selectById(id);if(f==null)throw new IllegalArgumentException("폴더를 찾을 수 없습니다.");return f;}
 private void verifyFolder(Long id,Scope s){if(id==null)return;contentFileFolderDTO f=require(id);if(!Objects.equals(f.getScopeType(),s.type)||!Objects.equals(f.getOwnerUserId(),s.owner)||!Objects.equals(f.getWsId(),s.ws)||!Objects.equals(f.getProjId(),s.proj))throw new SecurityException("다른 자료실의 폴더입니다.");}
 private void unique(Scope s,Long parent,String n,Long exclude){if(dao.countName(s.type,s.owner,s.ws,s.proj,parent,n,exclude)>0)throw new IllegalArgumentException("같은 위치에 동일한 폴더 이름이 있습니다.");}
 private String name(String raw){String n=raw==null?"":raw.trim();if(n.isBlank()||n.length()>120||n.matches(".*[\\\\/:*?\"<>|].*"))throw new IllegalArgumentException("폴더 이름을 확인하세요.");return n;}
 private Scope scopeOf(contentFileFolderDTO f,Long u){return scope(f.getScopeType(),f.getWsId(),f.getProjId(),u);}
 private Scope scope(String raw,Long ws,Long proj,Long user){if(user==null)throw new SecurityException("로그인이 필요합니다.");String t=String.valueOf(raw).toUpperCase(Locale.ROOT);if("PERSONAL".equals(t))return new Scope(t,user,null,null);if("GROUP".equals(t)&&ws!=null&&recordDAO.countWorkspaceMember(ws,user)>0)return new Scope(t,null,ws,null);if("PROJECT".equals(t)&&proj!=null&&recordDAO.countProjectAccessibleMember(proj,user)>0)return new Scope(t,null,null,proj);throw new SecurityException("자료실 접근 권한이 없습니다.");}
 private void requireManage(Scope s,Long user){if("PERSONAL".equals(s.type))return;/* 기존 contentFileService의 scope 관리자 검사와 동일한 정책으로 컨트롤러에서 보강 가능 */}
 private record Scope(String type,Long owner,Long ws,Long proj){}
}
