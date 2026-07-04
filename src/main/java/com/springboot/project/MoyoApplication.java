package com.springboot.project;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MoyoApplication {

	public static void main(String[] args) {
		SpringApplication.run(MoyoApplication.class, args);
	}

}
