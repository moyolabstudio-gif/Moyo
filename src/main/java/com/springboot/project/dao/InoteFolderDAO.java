package com.springboot.project.dao;

import com.springboot.project.dto.noteFolderDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface InoteFolderDAO {

    List<noteFolderDTO> selectFolderList(Map<String, Object> params);

    int insertFolder(noteFolderDTO folder);

    int updateFolderName(
            @Param("folderId") Long folderId,
            @Param("folderName") String folderName,
            @Param("userId") Long userId
    );

    int deleteFolder(
            @Param("folderId") Long folderId,
            @Param("userId") Long userId
    );

    int countChildFolders(@Param("folderId") Long folderId);

    int countFolderNotes(@Param("folderId") Long folderId);

    int moveNote(
            @Param("noteId") Long noteId,
            @Param("folderId") Long folderId,
            @Param("userId") Long userId
    );

    List<Map<String, Object>> selectAccessibleWorkspaces(
            @Param("userId") Long userId
    );

    List<Map<String, Object>> selectAccessibleProjects(
            @Param("userId") Long userId
    );

    List<Map<String, Object>> selectShareWorkspaceMembers(
            @Param("userId") Long userId
    );

    List<Map<String, Object>> selectShareProjectMembers(
            @Param("userId") Long userId
    );
}
