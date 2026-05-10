package com.springboot.project.util;

import com.ibm.icu.util.Calendar;
import com.ibm.icu.util.ChineseCalendar;

public class LunarUtil {

	public static int[] convertSolarToLunar(int year, int month, int day) {

	    ChineseCalendar cc = new ChineseCalendar();

	    java.util.Calendar solar = java.util.Calendar.getInstance();
	    solar.set(year, month - 1, day);

	    cc.setTimeInMillis(solar.getTimeInMillis());

	    int lunarMonth = cc.get(Calendar.MONTH) + 1;
	    int lunarDay = cc.get(Calendar.DAY_OF_MONTH);

	    return new int[]{lunarMonth, lunarDay};
	}
}