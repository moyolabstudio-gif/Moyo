package com.springboot.project.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import javax.imageio.ImageIO;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * 업로드 파일의 이름/확장자/MIME/실제 시그니처를 서버에서 검증한다.
 * 브라우저가 보낸 Content-Type 또는 확장자만 신뢰하지 않는다.
 */
@Service
public class UploadSecurityService {

    private static final Set<String> SAFE_ATTACHMENT_EXTENSIONS = Set.of(
            "jpg","jpeg","png","gif","webp","bmp","tif","tiff",
            "pdf","txt","md","csv","json","yml","yaml","properties","gradle","sql","css","scss","sass","less",
            "java","kt","kts","groovy","c","h","cpp","hpp","cs","go","rs","swift",
            "hwp","hwpx","doc","docx","xls","xlsx","ppt","pptx","odt","ods","odp",
            "zip","rar","7z","tar","gz",
            "mp3","wav","flac","m4a","ogg","mp4","mov","avi","mkv","webm");

    private static final Set<String> BLOCKED_EXTENSIONS = Set.of(
            "svg","svgz",
            "html","htm","xhtml","xml","xsl","xslt",
            "js","mjs","cjs","ts","tsx","jsx","vue",
            "jsp","jspx","php","asp","aspx",
            "sh","bash","zsh","bat","cmd","ps1",
            "py","rb","pl","cgi",
            "exe","dll","msi","com","scr","pif","cpl","sys","drv",
            "vbs","vbe","wsf","wsh","hta",
            "jar","war","ear","class",
            "apk","ipa","dmg","iso");

    private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg","jpeg","png","gif","webp");
    private static final Map<String, Set<String>> IMAGE_MIME = Map.of(
            "jpg", Set.of("image/jpeg", "image/jpg"),
            "jpeg", Set.of("image/jpeg", "image/jpg"),
            "png", Set.of("image/png"),
            "gif", Set.of("image/gif"),
            "webp", Set.of("image/webp"));

    public void validateAttachment(MultipartFile file, long maxBytes) {
        requireNonEmpty(file);
        validateSize(file.getSize(), maxBytes);

        String name = safeOriginalName(file.getOriginalFilename());
        String ext = extension(name);
        validateExtension(name, ext);

        try (InputStream input = file.getInputStream()) {
            byte[] header = input.readNBytes(512);
            rejectExecutableMagic(header);

            if (IMAGE_EXTENSIONS.contains(ext)) {
                validateImageHeaderAndMime(header, ext, file.getContentType());
                validateDecodableImage(file, ext);
                return;
            }

            validateKnownSignature(header, ext);
        } catch (IOException e) {
            throw new IllegalArgumentException("파일 내용을 확인할 수 없습니다.");
        }
    }

    public void validateImage(MultipartFile file, long maxBytes, boolean allowGif) {
        requireNonEmpty(file);
        validateSize(file.getSize(), maxBytes);

        String name = safeOriginalName(file.getOriginalFilename());
        String ext = extension(name);
        if (!IMAGE_EXTENSIONS.contains(ext) || (!allowGif && "gif".equals(ext))) {
            throw new IllegalArgumentException(allowGif
                    ? "JPG, PNG, GIF, WEBP 이미지 파일만 업로드할 수 있습니다."
                    : "JPG, PNG, WEBP 이미지 파일만 업로드할 수 있습니다.");
        }

        try (InputStream input = file.getInputStream()) {
            byte[] header = input.readNBytes(64);
            rejectExecutableMagic(header);
            validateImageHeaderAndMime(header, ext, file.getContentType());
            validateDecodableImage(file, ext);
        } catch (IOException e) {
            throw new IllegalArgumentException("이미지 파일을 확인할 수 없습니다.");
        }
    }

    public void validateImageBytes(byte[] bytes, String extension, long maxBytes) {
        if (bytes == null || bytes.length == 0) {
            throw new IllegalArgumentException("빈 이미지 파일은 업로드할 수 없습니다.");
        }
        validateSize(bytes.length, maxBytes);

        String ext = normalizeExtension(extension);
        if (!Set.of("jpg","jpeg","png","webp").contains(ext)) {
            throw new IllegalArgumentException("JPG, PNG, WEBP 이미지만 사용할 수 있습니다.");
        }

        byte[] header = new byte[Math.min(bytes.length, 64)];
        System.arraycopy(bytes, 0, header, 0, header.length);
        rejectExecutableMagic(header);
        validateImageSignature(header, ext);

        if (!"webp".equals(ext)) {
            try {
                BufferedImage image = ImageIO.read(new ByteArrayInputStream(bytes));
                if (image == null || image.getWidth() < 1 || image.getHeight() < 1) {
                    throw new IllegalArgumentException("손상되었거나 읽을 수 없는 이미지입니다.");
                }
            } catch (IOException e) {
                throw new IllegalArgumentException("이미지 파일을 확인할 수 없습니다.");
            }
        }
    }

    public void validateAudioVideo(MultipartFile file, long maxBytes) {
        requireNonEmpty(file);
        validateSize(file.getSize(), maxBytes);
        String name = safeOriginalName(file.getOriginalFilename());
        String ext = extension(name);
        if (!Set.of("mp3","wav","flac","m4a","ogg","mp4","mov","avi","mkv","webm").contains(ext)) {
            throw new IllegalArgumentException("지원하지 않는 음악/영상 파일 형식입니다.");
        }

        try (InputStream input = file.getInputStream()) {
            byte[] header = input.readNBytes(512);
            rejectExecutableMagic(header);
            validateKnownSignature(header, ext);
        } catch (IOException e) {
            throw new IllegalArgumentException("음악/영상 파일을 확인할 수 없습니다.");
        }
    }

    public String safeOriginalName(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("파일 이름을 확인할 수 없습니다.");
        }
        String normalized = raw.replace('\\', '/');
        String name = normalized.substring(normalized.lastIndexOf('/') + 1).trim();
        if (name.isBlank() || ".".equals(name) || "..".equals(name)
                || name.contains("\u0000") || name.chars().anyMatch(Character::isISOControl)) {
            throw new IllegalArgumentException("올바르지 않은 파일 이름입니다.");
        }
        if (name.length() > 255) {
            throw new IllegalArgumentException("파일 이름은 255자 이내여야 합니다.");
        }
        return name;
    }

    public String safeExtension(String rawName) {
        return extension(safeOriginalName(rawName));
    }

    private void requireNonEmpty(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("빈 파일은 업로드할 수 없습니다.");
        }
    }

    private void validateSize(long size, long maxBytes) {
        if (size <= 0) throw new IllegalArgumentException("빈 파일은 업로드할 수 없습니다.");
        if (maxBytes > 0 && size > maxBytes) {
            throw new IllegalArgumentException("파일 크기가 허용 범위를 초과했습니다.");
        }
    }

    private void validateExtension(String originalName, String ext) {
        if (ext.isBlank()) {
            throw new IllegalArgumentException("확장자가 없는 파일은 업로드할 수 없습니다.");
        }
        if (BLOCKED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("보안상 허용되지 않는 파일 형식입니다: ." + ext);
        }
        if (!SAFE_ATTACHMENT_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("지원하지 않는 파일 형식입니다: ." + ext);
        }

        String lower = originalName.toLowerCase(Locale.ROOT);
        String[] parts = lower.split("\\.");
        if (parts.length >= 3) {
            for (int i = 1; i < parts.length - 1; i++) {
                if (BLOCKED_EXTENSIONS.contains(parts[i])) {
                    throw new IllegalArgumentException("위험한 이중 확장자 파일은 업로드할 수 없습니다.");
                }
            }
        }
    }

    private String extension(String name) {
        int dot = name.lastIndexOf('.');
        if (dot <= 0 || dot == name.length() - 1) return "";
        String ext = normalizeExtension(name.substring(dot + 1));
        return ext.matches("[a-z0-9]{1,12}") ? ext : "";
    }

    private String normalizeExtension(String extension) {
        if (extension == null) return "";
        return extension.trim().toLowerCase(Locale.ROOT).replaceFirst("^\\.", "");
    }

    private void validateImageHeaderAndMime(byte[] header, String ext, String contentType) {
        validateImageSignature(header, ext);
        String mime = contentType == null ? "" : contentType.trim().toLowerCase(Locale.ROOT);
        Set<String> allowedMime = IMAGE_MIME.get(ext);
        if (allowedMime == null || !allowedMime.contains(mime)) {
            throw new IllegalArgumentException("파일 확장자와 이미지 MIME 형식이 일치하지 않습니다.");
        }
    }

    private void validateImageSignature(byte[] h, String ext) {
        boolean ok = switch (ext) {
            case "jpg", "jpeg" -> h.length >= 3
                    && (h[0] & 0xff) == 0xff && (h[1] & 0xff) == 0xd8 && (h[2] & 0xff) == 0xff;
            case "png" -> h.length >= 8
                    && (h[0] & 0xff) == 0x89 && h[1] == 0x50 && h[2] == 0x4e && h[3] == 0x47
                    && h[4] == 0x0d && h[5] == 0x0a && h[6] == 0x1a && h[7] == 0x0a;
            case "gif" -> h.length >= 6
                    && h[0] == 'G' && h[1] == 'I' && h[2] == 'F' && h[3] == '8'
                    && (h[4] == '7' || h[4] == '9') && h[5] == 'a';
            case "webp" -> h.length >= 12
                    && h[0] == 'R' && h[1] == 'I' && h[2] == 'F' && h[3] == 'F'
                    && h[8] == 'W' && h[9] == 'E' && h[10] == 'B' && h[11] == 'P';
            default -> false;
        };
        if (!ok) throw new IllegalArgumentException("파일 내용과 이미지 형식이 일치하지 않습니다.");
    }

    private void validateDecodableImage(MultipartFile file, String ext) throws IOException {
        if ("webp".equals(ext)) return; // 표준 JDK ImageIO는 WEBP를 기본 지원하지 않는다.
        try (InputStream input = file.getInputStream()) {
            BufferedImage image = ImageIO.read(input);
            if (image == null || image.getWidth() < 1 || image.getHeight() < 1) {
                throw new IllegalArgumentException("손상되었거나 읽을 수 없는 이미지입니다.");
            }
        }
    }

    private void rejectExecutableMagic(byte[] h) {
        if (h == null || h.length < 2) return;
        boolean pe = h[0] == 'M' && h[1] == 'Z';
        boolean elf = h.length >= 4 && (h[0] & 0xff) == 0x7f && h[1] == 'E' && h[2] == 'L' && h[3] == 'F';
        boolean javaClass = h.length >= 4 && (h[0] & 0xff) == 0xca && (h[1] & 0xff) == 0xfe
                && (h[2] & 0xff) == 0xba && (h[3] & 0xff) == 0xbe;
        boolean script = h.length >= 2 && h[0] == '#' && h[1] == '!';
        boolean macho = h.length >= 4 && (
                match(h, new int[]{0xfe,0xed,0xfa,0xce}) ||
                match(h, new int[]{0xfe,0xed,0xfa,0xcf}) ||
                match(h, new int[]{0xce,0xfa,0xed,0xfe}) ||
                match(h, new int[]{0xcf,0xfa,0xed,0xfe}));
        if (pe || elf || javaClass || script || macho) {
            throw new IllegalArgumentException("실행 가능한 파일 내용은 업로드할 수 없습니다.");
        }
    }

    private void validateKnownSignature(byte[] h, String ext) {
        boolean known = switch (ext) {
            case "pdf" -> startsAscii(h, "%PDF-");
            case "doc","xls","ppt","hwp" -> match(h, new int[]{0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1});
            case "docx","xlsx","pptx","hwpx","odt","ods","odp","zip" ->
                    h.length >= 4 && h[0] == 'P' && h[1] == 'K'
                            && ((h[2] == 3 && h[3] == 4) || (h[2] == 5 && h[3] == 6) || (h[2] == 7 && h[3] == 8));
            case "rar" -> startsAscii(h, "Rar!");
            case "7z" -> match(h, new int[]{0x37,0x7a,0xbc,0xaf,0x27,0x1c});
            case "gz" -> h.length >= 2 && (h[0] & 0xff) == 0x1f && (h[1] & 0xff) == 0x8b;
            case "tar" -> h.length >= 262 && h[257] == 'u' && h[258] == 's' && h[259] == 't'
                    && h[260] == 'a' && h[261] == 'r';
            case "wav" -> startsAscii(h, "RIFF") && asciiAt(h, 8, "WAVE");
            case "avi" -> startsAscii(h, "RIFF") && asciiAt(h, 8, "AVI ");
            case "flac" -> startsAscii(h, "fLaC");
            case "ogg" -> startsAscii(h, "OggS");
            case "webm","mkv" -> match(h, new int[]{0x1a,0x45,0xdf,0xa3});
            case "mp4","mov","m4a" -> asciiAt(h, 4, "ftyp");
            case "mp3" -> startsAscii(h, "ID3") || (h.length >= 2 && (h[0] & 0xff) == 0xff && ((h[1] & 0xe0) == 0xe0));
            case "bmp" -> startsAscii(h, "BM");
            case "tif","tiff" -> (h.length >= 4 && ((h[0]=='I'&&h[1]=='I'&&h[2]==42&&h[3]==0)
                    || (h[0]=='M'&&h[1]=='M'&&h[2]==0&&h[3]==42)));
            case "txt","md","csv","json","yml","yaml","properties","gradle","sql","css","scss","sass","less",
                    "java","kt","kts","groovy","c","h","cpp","hpp","cs","go","rs","swift" -> looksLikeText(h);
            default -> true;
        };
        if (!known) {
            throw new IllegalArgumentException("파일 확장자와 실제 파일 내용이 일치하지 않습니다.");
        }
    }

    private boolean looksLikeText(byte[] h) {
        if (h.length == 0) return true;
        int controls = 0;
        for (byte b : h) {
            int v = b & 0xff;
            if (v == 0) return false;
            if (v < 0x09 || (v > 0x0d && v < 0x20)) controls++;
        }
        return controls <= Math.max(2, h.length / 20);
    }

    private boolean startsAscii(byte[] h, String value) {
        return asciiAt(h, 0, value);
    }

    private boolean asciiAt(byte[] h, int offset, String value) {
        byte[] target = value.getBytes(StandardCharsets.US_ASCII);
        if (h == null || offset < 0 || h.length < offset + target.length) return false;
        for (int i = 0; i < target.length; i++) {
            if (h[offset + i] != target[i]) return false;
        }
        return true;
    }

    private boolean match(byte[] h, int[] bytes) {
        if (h == null || h.length < bytes.length) return false;
        for (int i = 0; i < bytes.length; i++) {
            if ((h[i] & 0xff) != bytes[i]) return false;
        }
        return true;
    }
}
