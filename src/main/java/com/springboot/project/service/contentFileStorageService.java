package com.springboot.project.service;

import java.io.InputStream;
import java.nio.file.*;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class contentFileStorageService {
    public record StoredFile(String originalName,String storedName,String relativePath,String contentType,String extension,long size,String sha256) {}
    private final Path root;
    private final UploadSecurityService uploadSecurityService;
    private final long maxBytes;

    public contentFileStorageService(
            @Value("${moyo.upload.content-file-dir:C:/uploads/content-files/}") String rootDir,
            @Value("${moyo.upload.content-file-max-bytes:20971520}") long maxBytes,
            UploadSecurityService uploadSecurityService) {
        this.root=Paths.get(rootDir).toAbsolutePath().normalize();
        this.maxBytes=maxBytes;
        this.uploadSecurityService=uploadSecurityService;
    }

    public StoredFile store(MultipartFile multipart) {
        return store(multipart,null);
    }

    public StoredFile store(MultipartFile multipart,String requestedOriginalName) {
        uploadSecurityService.validateAttachment(multipart,maxBytes);
        String sourceName=requestedOriginalName==null||requestedOriginalName.isBlank()?multipart.getOriginalFilename():requestedOriginalName;
        String original=uploadSecurityService.safeOriginalName(sourceName);
        String ext="."+uploadSecurityService.safeExtension(original);
        String stored=UUID.randomUUID().toString().replace("-","")+ext;
        LocalDate now=LocalDate.now();
        String relative=now.getYear()+"/"+String.format("%02d",now.getMonthValue())+"/"+stored;
        Path target=resolve(relative);
        try {
            Files.createDirectories(target.getParent());
            MessageDigest digest=MessageDigest.getInstance("SHA-256");
            Path temp=Files.createTempFile(target.getParent(),"moyo-file-",".tmp");
            try(InputStream in=multipart.getInputStream(); var out=Files.newOutputStream(temp,StandardOpenOption.TRUNCATE_EXISTING)) {
                byte[] buffer=new byte[8192]; int read;
                while((read=in.read(buffer))!=-1){ out.write(buffer,0,read); digest.update(buffer,0,read); }
            }
            try { Files.move(temp,target,StandardCopyOption.ATOMIC_MOVE); }
            catch (AtomicMoveNotSupportedException ex) { Files.move(temp,target,StandardCopyOption.REPLACE_EXISTING); }
            String type=multipart.getContentType();
            if(type==null||type.isBlank()) type=Files.probeContentType(target);
            if(type==null||type.isBlank()) type="application/octet-stream";
            return new StoredFile(original,stored,relative.replace('\\','/'),type,ext.isEmpty()?null:ext.substring(1),multipart.getSize(),HexFormat.of().formatHex(digest.digest()));
        } catch(Exception e) {
            try{Files.deleteIfExists(target);}catch(Exception ignored){}
            throw new IllegalStateException("파일을 저장하지 못했습니다.",e);
        }
    }

    public Path resolve(String relativePath){
        if(relativePath==null||relativePath.isBlank()) throw new IllegalArgumentException("파일 경로가 없습니다.");
        String normalized=relativePath.replace('\\','/');
        Path raw=Paths.get(normalized);
        if(raw.isAbsolute()) throw new SecurityException("절대 파일 경로는 허용되지 않습니다.");
        Path path=root.resolve(normalized).normalize();
        if(!path.startsWith(root)) throw new SecurityException("허용되지 않은 파일 경로입니다.");
        return path;
    }
    public void deleteQuietly(String relativePath){ try{Files.deleteIfExists(resolve(relativePath));}catch(Exception ignored){} }
}
