package com.springboot.project.config;

import org.apache.ibatis.plugin.Interceptor;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MyBatisConfig {

    @Bean
    public Interceptor dbAccessLogInterceptor(
        DbAccessLogWriter logWriter
    ) {
        return new DbAccessLogInterceptor(logWriter);
    }
}