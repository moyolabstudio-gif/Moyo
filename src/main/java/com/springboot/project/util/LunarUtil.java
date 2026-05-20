package com.springboot.project.util;

import com.ibm.icu.util.Calendar;
import com.ibm.icu.util.ChineseCalendar;

public class LunarUtil {

    // [기존] 양력 -> 음력 변환
    public static int[] convertSolarToLunar(int year, int month, int day) {
        ChineseCalendar cc = new ChineseCalendar();
        java.util.Calendar solar = java.util.Calendar.getInstance();
        solar.set(year, month - 1, day);
        cc.setTimeInMillis(solar.getTimeInMillis());

        int lunarMonth = cc.get(Calendar.MONTH) + 1;
        int lunarDay = cc.get(Calendar.DAY_OF_MONTH);

        return new int[]{lunarMonth, lunarDay};
    }

    // [추가] 음력 -> 양력 변환 (올해 음력 생일이 양력으로 언제인지 찾기용)
    public static String convertLunarToSolar(int year, int month, int day) {
        ChineseCalendar cc = new ChineseCalendar();
        
        // ⭐ 핵심: YEAR 대신 EXTENDED_YEAR를 사용해야 서기(AD) 연도로 인식합니다.
        // EXTENDED_YEAR = 서기 연도 + 2637 (내부 수치)
        cc.set(ChineseCalendar.EXTENDED_YEAR, year + 2637); 
        cc.set(ChineseCalendar.MONTH, month - 1);
        cc.set(ChineseCalendar.DAY_OF_MONTH, day);

        java.util.Calendar solar = java.util.Calendar.getInstance();
        solar.setTimeInMillis(cc.getTimeInMillis());

        int sYear = solar.get(java.util.Calendar.YEAR);
        int sMonth = solar.get(java.util.Calendar.MONTH) + 1;
        int sDay = solar.get(java.util.Calendar.DAY_OF_MONTH);

        return String.format("%04d-%02d-%02d", sYear, sMonth, sDay);
    }
}