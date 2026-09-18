package com.springboot.project.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.view.json.MappingJackson2JsonView;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;

@Controller
public class MoyoErrorController implements ErrorController {

    @RequestMapping("/error")
    public ModelAndView error(HttpServletRequest request) {
        int status = resolveStatus(request);
        HttpStatus httpStatus = HttpStatus.resolve(status);
        if (httpStatus == null) httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;

        ErrorMessage message = safeMessage(httpStatus);

        if (isApiRequest(request)) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("success", false);
            body.put("status", httpStatus.value());
            body.put("code", message.code());
            body.put("message", message.message());

            ModelAndView json = new ModelAndView(new MappingJackson2JsonView(), body);
            json.setStatus(httpStatus);
            return json;
        }

        ModelAndView page = new ModelAndView("error/error");
        page.setStatus(httpStatus);
        page.addObject("statusCode", httpStatus.value());
        page.addObject("errorTitle", message.title());
        page.addObject("errorMessage", message.message());
        return page;
    }

    private int resolveStatus(HttpServletRequest request) {
        Object value = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        if (value instanceof Integer status) return status;
        if (value instanceof Number number) return number.intValue();
        try {
            return value == null ? 500 : Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return 500;
        }
    }

    private boolean isApiRequest(HttpServletRequest request) {
        Object errorUriValue = request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
        String uri = errorUriValue == null ? request.getRequestURI() : String.valueOf(errorUriValue);
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

    private ErrorMessage safeMessage(HttpStatus status) {
        return switch (status.value()) {
            case 400 -> new ErrorMessage("BAD_REQUEST", "요청을 확인해 주세요.", "올바르지 않은 요청입니다.");
            case 401 -> new ErrorMessage("UNAUTHORIZED", "로그인이 필요합니다.", "로그인 후 다시 이용해 주세요.");
            case 403 -> new ErrorMessage("FORBIDDEN", "접근할 수 없습니다.", "이 작업을 수행할 권한이 없습니다.");
            case 404 -> new ErrorMessage("NOT_FOUND", "페이지를 찾을 수 없습니다.", "요청한 페이지가 없거나 이동되었습니다.");
            case 405 -> new ErrorMessage("METHOD_NOT_ALLOWED", "요청 방식을 확인해 주세요.", "이 주소에서는 사용할 수 없는 요청 방식입니다.");
            case 413 -> new ErrorMessage("PAYLOAD_TOO_LARGE", "파일이 너무 큽니다.", "허용된 업로드 크기를 초과했습니다.");
            default -> new ErrorMessage("INTERNAL_ERROR", "잠시 문제가 발생했습니다.", "잠시 후 다시 시도해 주세요.");
        };
    }

    private record ErrorMessage(String code, String title, String message) {}
}
