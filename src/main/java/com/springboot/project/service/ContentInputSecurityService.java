package com.springboot.project.service;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.safety.Cleaner;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Service;

@Service
public class ContentInputSecurityService {

    private static final int MAX_RICH_HTML_LENGTH = 500_000;

    private final Safelist richTextSafelist;

    public ContentInputSecurityService() {
        this.richTextSafelist = Safelist.relaxed()
                .addTags("figure", "figcaption", "oembed", "video", "source", "iframe", "hr")
                .addAttributes(":all", "class", "style")
                .addAttributes("a", "target", "rel")
                .addAttributes("img", "loading")
                .addAttributes("video", "controls", "poster", "width", "height")
                .addAttributes("source", "src", "type")
                .addAttributes("oembed", "url")
                .addAttributes("iframe", "src", "title", "width", "height", "allow", "allowfullscreen", "frameborder")
                .addProtocols("a", "href", "http", "https", "mailto", "tel")
                .addProtocols("img", "src", "http", "https")
                .addProtocols("video", "poster", "http", "https")
                .addProtocols("source", "src", "http", "https")
                .addProtocols("oembed", "url", "http", "https")
                .addProtocols("iframe", "src", "https")
                .preserveRelativeLinks(true);
    }

    public String singleLine(String value, int maxLength, boolean required) {
        String normalized = normalizeControls(value).replace('\n', ' ').replace('\r', ' ').trim();
        normalized = normalized.replaceAll("\\s{2,}", " ");
        validateLength(normalized, maxLength, required);
        return normalized;
    }

    public String multiLine(String value, int maxLength, boolean required) {
        String normalized = normalizeControls(value).trim();
        validateLength(normalized, maxLength, required);
        return normalized;
    }

    public String richHtml(String html) {
        if (html == null || html.isBlank()) return "";
        if (html.length() > MAX_RICH_HTML_LENGTH) {
            throw new IllegalArgumentException("본문이 너무 깁니다.");
        }

        Document dirty = Jsoup.parseBodyFragment(html);
        validateRichImageSources(dirty, true);

        Document clean = new Cleaner(richTextSafelist).clean(dirty);
        clean.outputSettings(new Document.OutputSettings().prettyPrint(false));

        // jsoup Safelist의 protocol 검사에서 앱 내부 상대경로 src가 제거될 수 있다.
        // CKEditor가 실제로 발급하는 두 업로드 경로만 원본에서 안전하게 복원한다.
        restoreTrustedRelativeImageSources(dirty, clean);

        sanitizeAttributes(clean);
        validateRichImageSources(clean, false);
        return clean.body().html().trim();
    }

    /**
     * CKEditor 이미지 src가 보안 정제 과정에서 조용히 사라진 채 저장되는 것을 막는다.
     * data:image 은 브라우저에서 실제 업로드 URL로 치환된 뒤에만 저장되어야 한다.
     */
    private void validateRichImageSources(Document document, boolean rejectEmbeddedDataImage) {
        for (Element image : document.select("img")) {
            String source = image.attr("src").trim();
            if (source.isBlank()) {
                throw new IllegalArgumentException("본문 이미지 업로드가 완료되지 않았습니다. 이미지를 다시 확인해주세요.");
            }
            if (rejectEmbeddedDataImage && source.regionMatches(true, 0, "data:image/", 0, "data:image/".length())) {
                throw new IllegalArgumentException("본문 이미지 업로드가 완료되지 않았습니다. 잠시 후 다시 저장해주세요.");
            }
            if (!isAllowedRichImageSource(source)) {
                throw new IllegalArgumentException("허용되지 않은 본문 이미지 주소입니다.");
            }
        }
    }

    private void restoreTrustedRelativeImageSources(Document dirty, Document clean) {
        List<Element> dirtyImages = dirty.select("img");
        List<Element> cleanImages = clean.select("img");
        int count = Math.min(dirtyImages.size(), cleanImages.size());
        for (int i = 0; i < count; i++) {
            String source = dirtyImages.get(i).attr("src").trim();
            if (isTrustedEditorRelativeImageSource(source)) {
                cleanImages.get(i).attr("src", source);
            }
        }
    }

    private boolean isAllowedRichImageSource(String source) {
        if (isTrustedEditorRelativeImageSource(source)) return true;
        try {
            URI uri = URI.create(source);
            String scheme = uri.getScheme();
            return scheme != null && (scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"));
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isTrustedEditorRelativeImageSource(String source) {
        if (source == null) return false;
        String value = source.trim();
        return value.matches("^/upload/(?:note-editor|editor)/[A-Za-z0-9._-]+$");
    }

    private void sanitizeAttributes(Document document) {
        for (Element element : document.getAllElements()) {
            if (element.hasAttr("style")) {
                String safeStyle = sanitizeStyle(element.attr("style"));
                if (safeStyle.isBlank()) element.removeAttr("style");
                else element.attr("style", safeStyle);
            }
            if (element.hasAttr("class")) {
                List<String> safeClasses = new ArrayList<>();
                for (String token : element.classNames()) {
                    if (token.matches("[A-Za-z0-9_-]{1,64}")) safeClasses.add(token);
                }
                if (safeClasses.isEmpty()) element.removeAttr("class");
                else element.attr("class", String.join(" ", safeClasses));
            }
        }

        for (Element anchor : document.select("a[href]")) {
            anchor.attr("rel", "noopener noreferrer");
            anchor.attr("target", "_blank");
        }

        for (Element iframe : document.select("iframe[src]")) {
            if (!isTrustedEmbed(iframe.attr("src"))) iframe.remove();
        }
    }

    private String sanitizeStyle(String style) {
        if (style == null || style.isBlank()) return "";
        List<String> safeRules = new ArrayList<>();
        for (String rule : style.split(";")) {
            int idx = rule.indexOf(':');
            if (idx <= 0) continue;
            String property = rule.substring(0, idx).trim().toLowerCase(Locale.ROOT);
            String value = rule.substring(idx + 1).trim();
            String lowerValue = value.toLowerCase(Locale.ROOT);

            boolean allowed = switch (property) {
                case "color", "background-color", "text-align", "font-size", "font-weight", "font-style",
                     "text-decoration", "width", "height", "max-width", "border", "border-color",
                     "border-style", "border-width", "vertical-align", "padding", "margin-left",
                     "margin-right", "list-style-type" -> true;
                default -> false;
            };
            if (!allowed) continue;
            if (lowerValue.contains("url(") || lowerValue.contains("expression(") || lowerValue.contains("javascript:")
                    || lowerValue.contains("@import") || lowerValue.contains("behavior:")
                    || lowerValue.contains("-moz-binding")) continue;
            safeRules.add(property + ": " + value.replace("\"", "").replace("'", ""));
        }
        return String.join("; ", safeRules);
    }

    private boolean isTrustedEmbed(String source) {
        try {
            URI uri = URI.create(source);
            String host = uri.getHost();
            if (host == null) return false;
            host = host.toLowerCase(Locale.ROOT);
            return host.equals("youtube.com") || host.endsWith(".youtube.com")
                    || host.equals("youtube-nocookie.com") || host.endsWith(".youtube-nocookie.com")
                    || host.equals("player.vimeo.com") || host.endsWith(".vimeo.com");
        } catch (Exception e) {
            return false;
        }
    }

    private String normalizeControls(String value) {
        if (value == null) return "";
        StringBuilder out = new StringBuilder(value.length());
        for (int i = 0; i < value.length(); i++) {
            char ch = value.charAt(i);
            if (ch == '\t' || ch == '\n' || ch == '\r' || !Character.isISOControl(ch)) out.append(ch);
        }
        return out.toString();
    }

    private void validateLength(String value, int maxLength, boolean required) {
        if (required && value.isBlank()) throw new IllegalArgumentException("필수 입력값을 확인해주세요.");
        if (maxLength > 0 && value.length() > maxLength) throw new IllegalArgumentException("입력값이 허용 길이를 초과했습니다.");
    }
}
