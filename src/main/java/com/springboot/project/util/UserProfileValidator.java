package com.springboot.project.util;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

public final class UserProfileValidator {

    public static final int MAX_USER_NAME_LENGTH = 30;

    private UserProfileValidator() {
    }

    public static String normalizeRequiredName(String userName) {
        String value = userName == null ? "" : userName.trim();
        if (value.isEmpty()) {
            throw new IllegalArgumentException("이름을 입력해주세요.");
        }
        if (value.length() > MAX_USER_NAME_LENGTH) {
            throw new IllegalArgumentException("이름은 30자 이내로 입력해주세요.");
        }
        return value;
    }

    public static String normalizeOptionalBirthDate(String birthDate) {
        if (birthDate == null) {
            return null;
        }

        String value = birthDate.trim();
        if (value.isEmpty()) {
            return null;
        }
        if (!value.matches("\\d{4}-\\d{2}-\\d{2}")) {
            throw new IllegalArgumentException("생일은 올바른 날짜로 입력해주세요.");
        }

        final LocalDate parsedDate;
        try {
            parsedDate = LocalDate.parse(value);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("생일은 올바른 날짜로 입력해주세요.");
        }

        if (parsedDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("생일은 오늘 이후 날짜로 설정할 수 없습니다.");
        }
        return value;
    }

    public static String normalizeBirthCalendarType(String birthCalendarType) {
        String value = birthCalendarType == null ? "" : birthCalendarType.trim().toUpperCase();
        if (value.isEmpty()) {
            return "SOLAR";
        }
        if (!"SOLAR".equals(value) && !"LUNAR".equals(value)) {
            throw new IllegalArgumentException("생일의 양력/음력 구분을 확인해주세요.");
        }
        return value;
    }
}
