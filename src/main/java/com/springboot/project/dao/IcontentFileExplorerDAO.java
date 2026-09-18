package com.springboot.project.dao;
import java.util.List;
import java.util.Map;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.springboot.project.dto.contentFileDTO;
@Mapper
public interface IcontentFileExplorerDAO {
 List<contentFileDTO> selectFiles(@Param("scopeType") String scopeType,@Param("ownerUserId") Long ownerUserId,@Param("wsId") Long wsId,@Param("projId") Long projId,@Param("folderId") Long folderId,@Param("keyword") String keyword,@Param("sort") String sort,@Param("userId") Long userId);
 int updateFolder(@Param("contentFileId") Long contentFileId,@Param("folderId") Long folderId,@Param("userId") Long userId);
 List<contentFileDTO> selectRecentFiles(@Param("userId") Long userId,@Param("scopeType") String scopeType,@Param("ownerUserId") Long ownerUserId,@Param("wsId") Long wsId,@Param("projId") Long projId);
 int touchRecentAccess(@Param("contentFileId") Long contentFileId,@Param("userId") Long userId);
 List<Map<String,Object>> selectFriendShareOwners(@Param("userId") Long userId);
 List<contentFileDTO> selectFriendSharedFiles(@Param("userId") Long userId,@Param("ownerId") Long ownerId);
}
