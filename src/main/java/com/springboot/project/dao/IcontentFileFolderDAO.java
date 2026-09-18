package com.springboot.project.dao;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.springboot.project.dto.contentFileFolderDTO;
@Mapper
public interface IcontentFileFolderDAO {
 int insert(contentFileFolderDTO folder);
 contentFileFolderDTO selectById(@Param("folderId") Long folderId);
 List<contentFileFolderDTO> selectTree(@Param("scopeType") String scopeType,@Param("ownerUserId") Long ownerUserId,@Param("wsId") Long wsId,@Param("projId") Long projId);
 List<contentFileFolderDTO> selectChildren(@Param("scopeType") String scopeType,@Param("ownerUserId") Long ownerUserId,@Param("wsId") Long wsId,@Param("projId") Long projId,@Param("parentFolderId") Long parentFolderId);
 int countName(@Param("scopeType") String scopeType,@Param("ownerUserId") Long ownerUserId,@Param("wsId") Long wsId,@Param("projId") Long projId,@Param("parentFolderId") Long parentFolderId,@Param("folderName") String folderName,@Param("excludeFolderId") Long excludeFolderId);
 int updateName(@Param("folderId") Long folderId,@Param("folderName") String folderName,@Param("userId") Long userId);
 int move(@Param("folderId") Long folderId,@Param("parentFolderId") Long parentFolderId,@Param("userId") Long userId);
 int softDelete(@Param("folderId") Long folderId,@Param("userId") Long userId);
 int countDescendant(@Param("folderId") Long folderId,@Param("candidateId") Long candidateId);
 int countChildren(@Param("folderId") Long folderId);
 int countFiles(@Param("folderId") Long folderId);
 int countForeignFilesInTree(@Param("folderId") Long folderId,@Param("userId") Long userId);
}
