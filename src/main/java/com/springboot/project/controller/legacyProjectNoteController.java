package com.springboot.project.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/project/note")
public class legacyProjectNoteController {

    @GetMapping("/list")
    public String list(@RequestParam("wsId") Long wsId, @RequestParam("projId") Long projId) {
        return "redirect:/note/list?scope=PROJ&wsId=" + wsId + "&projId=" + projId;
    }

    @GetMapping("/write")
    public String write(@RequestParam("wsId") Long wsId, @RequestParam("projId") Long projId) {
        return "redirect:/note/write?scope=PROJ&wsId=" + wsId + "&projId=" + projId;
    }

    @GetMapping("/detail")
    public String detail(@RequestParam("noteId") Long noteId,
                         @RequestParam("wsId") Long wsId,
                         @RequestParam("projId") Long projId) {
        return "redirect:/note/detail?noteId=" + noteId + "&scope=PROJ&wsId=" + wsId + "&projId=" + projId;
    }

    @GetMapping("/edit")
    public String edit(@RequestParam("noteId") Long noteId,
                       @RequestParam("wsId") Long wsId,
                       @RequestParam("projId") Long projId) {
        return "redirect:/note/edit?noteId=" + noteId + "&scope=PROJ&wsId=" + wsId + "&projId=" + projId;
    }

    @GetMapping("/download")
    public String download(@RequestParam("fileId") Long fileId) {
        return "redirect:/note/download?fileId=" + fileId;
    }

    @GetMapping("/view")
    public String view(@RequestParam("fileId") Long fileId) {
        return "redirect:/note/view?fileId=" + fileId;
    }

    @PostMapping({"/add", "/modify", "/delete", "/reply/add", "/reply/delete", "/file/delete", "/api/pin", "/api/unpin"})
    public String postRedirect() {
        return "redirect:/";
    }
}
