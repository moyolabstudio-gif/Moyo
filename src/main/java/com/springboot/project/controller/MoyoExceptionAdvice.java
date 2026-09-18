package com.springboot.project.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.servlet.view.json.MappingJackson2JsonView;

import jakarta.servlet.http.HttpServletRequest;

@ControllerAdvice
public class MoyoExceptionAdvice {

    private static final Logger log = LoggerFactory.getLogger(MoyoExceptionAdvice.class);

    @ExceptionHandler({
            IllegalArgumentException.class,
            MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class,
            HttpMessageNotReadableException.class
    })
    public ModelAndView badRequest(Exception exception, HttpServletRequest request) {
        return response(request, HttpStatus.BAD_REQUEST,
                "BAD_REQUEST", "요청을 확인해 주세요.", "올바르지 않은 요청입니다.");
    }

    @ExceptionHandler(SecurityException.class)
    public ModelAndView forbidden(SecurityException exception, HttpServletRequest request) {
        return response(request, HttpStatus.FORBIDDEN,
                "FORBIDDEN", "접근할 수 없습니다.", "이 작업을 수행할 권한이 없습니다.");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ModelAndView uploadTooLarge(MaxUploadSizeExceededException exception, HttpServletRequest request) {
        return response(request, HttpStatus.PAYLOAD_TOO_LARGE,
                "PAYLOAD_TOO_LARGE", "파일이 너무 큽니다.", "허용된 업로드 크기를 초과했습니다.");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ModelAndView methodNotAllowed(
            HttpRequestMethodNotSupportedException exception,
            HttpServletRequest request) {
        return response(request, HttpStatus.METHOD_NOT_ALLOWED,
                "METHOD_NOT_ALLOWED", "요청 방식을 확인해 주세요.",
                "이 주소에서는 사용할 수 없는 요청 방식입니다.");
    }

    @ExceptionHandler(DataAccessException.class)
    public ModelAndView databaseError(DataAccessException exception, HttpServletRequest request) {
        // 상세 SQL/MyBatis 오류는 서버 로그에만 남기고 사용자에게는 공개하지 않는다.
        log.error("Database request failed. method={}, uri={}",
                request.getMethod(), request.getRequestURI(), exception);
        return response(request, HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR", "잠시 문제가 발생했습니다.", "잠시 후 다시 시도해 주세요.");
    }

    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
    public ModelAndView notFound(Exception exception, HttpServletRequest request) {
        return response(request, HttpStatus.NOT_FOUND,
                "NOT_FOUND", "페이지를 찾을 수 없습니다.",
                "요청한 페이지가 없거나 이동되었습니다.");
    }

    @ExceptionHandler(Exception.class)
    public ModelAndView unexpected(Exception exception, HttpServletRequest request) {
        log.error("Unhandled request failed. method={}, uri={}",
                request.getMethod(), request.getRequestURI(), exception);
        return response(request, HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR", "잠시 문제가 발생했습니다.", "잠시 후 다시 시도해 주세요.");
    }

    private ModelAndView response(
            HttpServletRequest request,
            HttpStatus status,
            String code,
            String title,
            String message) {

        if (isApiRequest(request)) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("success", false);
            body.put("status", status.value());
            body.put("code", code);
            body.put("message", message);

            ModelAndView json = new ModelAndView(new MappingJackson2JsonView(), body);
            json.setStatus(status);
            return json;
        }

        ModelAndView page = new ModelAndView("error/error");
        page.setStatus(status);
        page.addObject("statusCode", status.value());
        page.addObject("errorTitle", title);
        page.addObject("errorMessage", message);
        return page;
    }

    private boolean isApiRequest(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String contextPath = request.getContextPath();

        if (uri != null && (uri.startsWith(contextPath + "/api/")
                || uri.startsWith(contextPath + "/note/api/")
                || uri.startsWith(contextPath + "/users/email-verification/")
                || uri.startsWith(contextPath + "/users/password-reset/"))) {
            return true;
        }

        String requestedWith = request.getHeader("X-Requested-With");
        if ("XMLHttpRequest".equalsIgnoreCase(requestedWith)) return true;

        String accept = request.getHeader("Accept");
        return accept != null && accept.toLowerCase().contains("application/json");
    }
}
