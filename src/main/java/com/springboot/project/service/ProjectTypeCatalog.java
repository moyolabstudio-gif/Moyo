package com.springboot.project.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Canonical project type/icon catalog.
 *
 * <p>The persisted project type and icon are intentionally separate:
 * project type describes what the project is, while project icon is a visual
 * identity that the user may change in create/settings.</p>
 *
 * <p>Icon keys are Font Awesome icon suffixes without the {@code fa-} prefix.
 * Example: {@code plane} is rendered as {@code fa-solid fa-plane}.</p>
 */
public final class ProjectTypeCatalog {

    public static final String GROUP_WORK = "WORK";
    public static final String GROUP_LEARNING = "LEARNING";
    public static final String GROUP_SOCIAL = "SOCIAL";
    public static final String GROUP_PERSONAL = "PERSONAL";
    public static final String GROUP_ETC = "ETC";

    public record TypeDefinition(
            String code,
            String label,
            String groupCode,
            String groupLabel,
            String description,
            String defaultIcon,
            List<String> recommendedIcons,
            int sortOrder
    ) {
        public TypeDefinition {
            recommendedIcons = List.copyOf(recommendedIcons);
        }
    }

    public record IconDefinition(String key, String label) {}

    private static final List<TypeDefinition> TYPES = List.of(
            type("WORK", "업무", GROUP_WORK, "업무", "일반 업무와 협업 프로젝트", "briefcase",
                    List.of("briefcase", "building", "chart-line", "list-check", "bullseye"), 10),
            type("DEVELOPMENT", "개발", GROUP_WORK, "업무", "개발·기술·시스템 프로젝트", "code",
                    List.of("code", "laptop-code", "terminal", "database", "diagram-project"), 20),
            type("PLANNING", "기획", GROUP_WORK, "업무", "기획·전략·아이디어 구체화", "clipboard-list",
                    List.of("clipboard-list", "lightbulb", "bullseye", "list-check", "diagram-project"), 30),
            type("DESIGN", "디자인", GROUP_WORK, "업무", "디자인·콘텐츠·창작 작업", "palette",
                    List.of("palette", "pen-ruler", "brush", "image", "wand-magic-sparkles"), 40),

            type("STUDY", "스터디", GROUP_LEARNING, "학습", "학습·연구·스터디 프로젝트", "book-open",
                    List.of("book-open", "book", "flask", "microscope", "language"), 50),
            type("EXAM", "시험", GROUP_LEARNING, "학습", "시험·자격증·목표 학습", "graduation-cap",
                    List.of("graduation-cap", "pen-to-square", "certificate", "check-double", "calendar-check"), 60),

            type("TRAVEL", "여행", GROUP_SOCIAL, "활동", "여행 준비와 일정 공유", "plane",
                    List.of("plane", "suitcase-rolling", "map-location-dot", "location-dot", "camera"), 70),
            type("MEETING", "회의", GROUP_SOCIAL, "활동", "회의·논의·정기 미팅", "comments",
                    List.of("comments", "users", "user-group", "video", "clipboard"), 80),
            type("GATHERING", "모임", GROUP_SOCIAL, "활동", "친구·동료와 함께하는 모임", "user-group",
                    List.of("user-group", "people-group", "users", "mug-hot", "utensils"), 90),
            type("EVENT", "행사", GROUP_SOCIAL, "활동", "행사·공연·기념일·이벤트", "calendar-days",
                    List.of("calendar-days", "ticket", "gift", "flag", "star"), 100),

            type("EXERCISE", "운동", GROUP_PERSONAL, "개인", "운동·건강·훈련 목표", "dumbbell",
                    List.of("dumbbell", "person-running", "heart-pulse", "bicycle", "stopwatch"), 110),
            type("HOBBY", "취미", GROUP_PERSONAL, "개인", "취미·여가·개인 창작", "puzzle-piece",
                    List.of("puzzle-piece", "palette", "gamepad", "camera", "star"), 120),
            type("MUSIC", "음악", GROUP_PERSONAL, "개인", "음악·연주·작곡·플레이리스트", "music",
                    List.of("music", "headphones", "compact-disc", "microphone", "guitar"), 125),
            type("LIFE", "생활", GROUP_PERSONAL, "개인", "생활·가정·일상 관리", "house",
                    List.of("house", "basket-shopping", "seedling", "paw", "heart"), 130),
            type("RECORD", "기록", GROUP_PERSONAL, "개인", "기록·아카이빙·회고 프로젝트", "note-sticky",
                    List.of("note-sticky", "book", "bookmark", "camera-retro", "box-archive"), 140),

            type("ETC", "기타", GROUP_ETC, "기타", "다른 유형에 속하지 않는 프로젝트", "shapes",
                    List.of("shapes", "folder-open", "star", "circle-dot", "layer-group"), 150)
    );

    private static final Map<String, TypeDefinition> TYPE_BY_CODE;
    private static final Map<String, String> TYPE_ALIASES;
    private static final List<IconDefinition> ICONS;
    private static final Set<String> ICON_KEYS;

    static {
        Map<String, TypeDefinition> byCode = new LinkedHashMap<>();
        for (TypeDefinition type : TYPES) {
            byCode.put(type.code(), type);
        }
        TYPE_BY_CODE = Collections.unmodifiableMap(byCode);

        Map<String, String> aliases = new LinkedHashMap<>();
        aliases.put("업무", "WORK");
        aliases.put("일", "WORK");
        aliases.put("개발", "DEVELOPMENT");
        aliases.put("기술", "DEVELOPMENT");
        aliases.put("기획", "PLANNING");
        aliases.put("계획", "PLANNING");
        aliases.put("디자인", "DESIGN");
        aliases.put("창작", "DESIGN");
        aliases.put("공부", "STUDY");
        aliases.put("학습", "STUDY");
        aliases.put("연구", "STUDY");
        aliases.put("스터디", "STUDY");
        aliases.put("시험", "EXAM");
        aliases.put("자격증", "EXAM");
        aliases.put("여행", "TRAVEL");
        aliases.put("회의", "MEETING");
        aliases.put("미팅", "MEETING");
        aliases.put("모임", "GATHERING");
        aliases.put("친목", "GATHERING");
        aliases.put("행사", "EVENT");
        aliases.put("이벤트", "EVENT");
        aliases.put("운동", "EXERCISE");
        aliases.put("헬스", "EXERCISE");
        aliases.put("취미", "HOBBY");
        aliases.put("음악", "MUSIC");
        aliases.put("연주", "MUSIC");
        aliases.put("작곡", "MUSIC");
        aliases.put("생활", "LIFE");
        aliases.put("가정", "LIFE");
        aliases.put("기록", "RECORD");
        aliases.put("아카이브", "RECORD");
        aliases.put("기타", "ETC");
        TYPE_ALIASES = Collections.unmodifiableMap(aliases);

        LinkedHashMap<String, String> iconLabels = new LinkedHashMap<>();
        addIcon(iconLabels, "briefcase", "업무");
        addIcon(iconLabels, "building", "조직");
        addIcon(iconLabels, "chart-line", "성과");
        addIcon(iconLabels, "list-check", "체크리스트");
        addIcon(iconLabels, "bullseye", "목표");
        addIcon(iconLabels, "code", "코드");
        addIcon(iconLabels, "laptop-code", "개발");
        addIcon(iconLabels, "terminal", "터미널");
        addIcon(iconLabels, "database", "데이터");
        addIcon(iconLabels, "diagram-project", "구조");
        addIcon(iconLabels, "clipboard-list", "기획");
        addIcon(iconLabels, "lightbulb", "아이디어");
        addIcon(iconLabels, "palette", "디자인");
        addIcon(iconLabels, "pen-ruler", "설계");
        addIcon(iconLabels, "brush", "브러시");
        addIcon(iconLabels, "image", "이미지");
        addIcon(iconLabels, "wand-magic-sparkles", "창작");
        addIcon(iconLabels, "book-open", "학습");
        addIcon(iconLabels, "book", "책");
        addIcon(iconLabels, "flask", "연구");
        addIcon(iconLabels, "microscope", "탐구");
        addIcon(iconLabels, "language", "언어");
        addIcon(iconLabels, "graduation-cap", "시험");
        addIcon(iconLabels, "pen-to-square", "작성");
        addIcon(iconLabels, "certificate", "자격");
        addIcon(iconLabels, "check-double", "완료");
        addIcon(iconLabels, "calendar-check", "일정");
        addIcon(iconLabels, "plane", "여행");
        addIcon(iconLabels, "suitcase-rolling", "짐");
        addIcon(iconLabels, "map-location-dot", "지도");
        addIcon(iconLabels, "location-dot", "장소");
        addIcon(iconLabels, "camera", "사진");
        addIcon(iconLabels, "comments", "회의");
        addIcon(iconLabels, "users", "사람들");
        addIcon(iconLabels, "user-group", "모임");
        addIcon(iconLabels, "people-group", "그룹");
        addIcon(iconLabels, "video", "화상회의");
        addIcon(iconLabels, "clipboard", "안건");
        addIcon(iconLabels, "mug-hot", "카페");
        addIcon(iconLabels, "utensils", "식사");
        addIcon(iconLabels, "calendar-days", "행사");
        addIcon(iconLabels, "ticket", "티켓");
        addIcon(iconLabels, "gift", "기념");
        addIcon(iconLabels, "flag", "이벤트");
        addIcon(iconLabels, "star", "별");
        addIcon(iconLabels, "dumbbell", "운동");
        addIcon(iconLabels, "person-running", "러닝");
        addIcon(iconLabels, "heart-pulse", "건강");
        addIcon(iconLabels, "bicycle", "자전거");
        addIcon(iconLabels, "stopwatch", "훈련");
        addIcon(iconLabels, "puzzle-piece", "취미");
        addIcon(iconLabels, "music", "음악");
        addIcon(iconLabels, "headphones", "헤드폰");
        addIcon(iconLabels, "compact-disc", "앨범");
        addIcon(iconLabels, "microphone", "보컬");
        addIcon(iconLabels, "guitar", "기타 연주");
        addIcon(iconLabels, "gamepad", "게임");
        addIcon(iconLabels, "house", "생활");
        addIcon(iconLabels, "basket-shopping", "쇼핑");
        addIcon(iconLabels, "seedling", "성장");
        addIcon(iconLabels, "paw", "반려생활");
        addIcon(iconLabels, "heart", "마음");
        addIcon(iconLabels, "note-sticky", "기록");
        addIcon(iconLabels, "bookmark", "보관");
        addIcon(iconLabels, "camera-retro", "추억");
        addIcon(iconLabels, "box-archive", "아카이브");
        addIcon(iconLabels, "shapes", "기타");
        addIcon(iconLabels, "folder-open", "폴더");
        addIcon(iconLabels, "circle-dot", "포인트");
        addIcon(iconLabels, "layer-group", "묶음");

        List<IconDefinition> icons = new ArrayList<>();
        iconLabels.forEach((key, label) -> icons.add(new IconDefinition(key, label)));
        ICONS = List.copyOf(icons);
        ICON_KEYS = Collections.unmodifiableSet(new LinkedHashSet<>(iconLabels.keySet()));
    }

    private ProjectTypeCatalog() {}

    private static TypeDefinition type(String code, String label, String groupCode, String groupLabel,
                                       String description, String defaultIcon, List<String> icons, int sortOrder) {
        return new TypeDefinition(code, label, groupCode, groupLabel, description, defaultIcon, icons, sortOrder);
    }

    private static void addIcon(Map<String, String> target, String key, String label) {
        target.putIfAbsent(key, label);
    }

    public static List<TypeDefinition> types() {
        return TYPES;
    }

    public static Map<String, TypeDefinition> typeMap() {
        return TYPE_BY_CODE;
    }

    public static List<IconDefinition> icons() {
        return ICONS;
    }

    public static Set<String> iconKeys() {
        return ICON_KEYS;
    }

    public static TypeDefinition definition(String value) {
        return TYPE_BY_CODE.get(normalizeType(value));
    }

    public static String normalizeType(String value) {
        if (value == null || value.isBlank()) return "ETC";

        String raw = value.trim();
        String alias = TYPE_ALIASES.get(raw);
        if (alias != null) return alias;

        String code = raw.toUpperCase(Locale.ROOT);
        return TYPE_BY_CODE.containsKey(code) ? code : "ETC";
    }

    public static String labelOf(String value) {
        return definition(value).label();
    }

    public static String defaultIconOf(String value) {
        return definition(value).defaultIcon();
    }

    public static List<String> recommendedIconsOf(String value) {
        return definition(value).recommendedIcons();
    }

    public static boolean isKnownIcon(String value) {
        if (value == null || value.isBlank()) return false;
        return ICON_KEYS.contains(value.trim().toLowerCase(Locale.ROOT));
    }
}
