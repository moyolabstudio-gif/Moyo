package com.springboot.project.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.springboot.project.dto.usersDto;
import com.springboot.project.dto.noteDTO;
import com.springboot.project.dto.workspaceDTO;
import com.springboot.project.dto.friendDTO;
import com.springboot.project.dao.IworkspaceDAO;
import com.springboot.project.service.UserService;
import com.springboot.project.service.IfriendService;
import com.springboot.project.service.AccountProfileImageService;
import com.springboot.project.service.IcalendarResponseService;
import com.springboot.project.service.IphotoAlbumService;
import com.springboot.project.service.InoteService;

import jakarta.servlet.http.HttpSession;

@Controller
public class usersController {	
	@Autowired
	private UserService userService;

	@Autowired
	private IfriendService friendService;

	@Autowired
	private AccountProfileImageService accountProfileImageService;

	@Autowired
	private IcalendarResponseService calendarResponseService;

	@Autowired
	private IphotoAlbumService photoAlbumService;

	@Autowired
	private InoteService noteService;

	@Autowired
	private IworkspaceDAO workspaceDAO;

	@RequestMapping("/")
	public String root() {
		return "home";
	}
	
	@RequestMapping("/users/joinForm")
	public String join() {
		return "users/joinForm";
	}
	

	@GetMapping("/users/check-email")
	@ResponseBody
	public Map<String, Object> checkEmail(@RequestParam("email") String email) {
		Map<String, Object> result = new HashMap<>();

		String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
		boolean duplicated = !normalizedEmail.isEmpty()
				&& userService.isEmailDuplicated(normalizedEmail);

		result.put("duplicated", duplicated);
		result.put("available", !normalizedEmail.isEmpty() && !duplicated);
		return result;
	}

	@PostMapping("/users/join")
	public String join(usersDto user, HttpSession session) {
		String email = user.getEmail() == null ? "" : user.getEmail().trim().toLowerCase();
		String password = user.getPwdHash() == null ? "" : user.getPwdHash().trim();

		if (email.isEmpty() || password.isEmpty()) {
			return "redirect:/users/joinForm?error=required";
		}
		if (userService.isEmailDuplicated(email)) {
			return "redirect:/users/joinForm?error=duplicate";
		}

		user.setEmail(email);
		user.setPwdHash(password);
		session.setAttribute("pendingJoinUser", user);
		return "redirect:/users/step2";
	}

	@GetMapping("/users/step2")
	public String step2(HttpSession session) {
		if (session.getAttribute("pendingJoinUser") == null) {
			return "redirect:/users/joinForm";
		}
		return "users/joinForm2";
	}

	@PostMapping("/users/completeJoin")
	public String completeJoin(
			@org.springframework.web.bind.annotation.RequestParam("userName") String userName,
			@org.springframework.web.bind.annotation.RequestParam(value = "birthDate", required = false) String birthDate,
			@org.springframework.web.bind.annotation.RequestParam(value = "birthCalendarType", required = false) String birthCalendarType,
			@org.springframework.web.bind.annotation.RequestParam(value = "profileImageData", required = false) String profileImageData,
			@org.springframework.web.bind.annotation.RequestParam(value = "profileOriginalImageData", required = false) String profileOriginalImageData,
			@org.springframework.web.bind.annotation.RequestParam(value = "profileCropScale", required = false) String profileCropScale,
			@org.springframework.web.bind.annotation.RequestParam(value = "profileCropX", required = false) String profileCropX,
			@org.springframework.web.bind.annotation.RequestParam(value = "profileCropY", required = false) String profileCropY,
			@org.springframework.web.bind.annotation.RequestParam(value = "profileAvatarType", required = false) String profileAvatarType,
			HttpSession session) {
		usersDto pendingUser = (usersDto) session.getAttribute("pendingJoinUser");
		if (pendingUser == null) {
			return "redirect:/users/joinForm";
		}

		String trimmedName = userName == null ? "" : userName.trim();
		if (trimmedName.isEmpty()) {
			return "redirect:/users/step2?error=name";
		}

		String normalizedBirthDate = normalizeBirthDate(birthDate);
		String normalizedBirthCalendarType = normalizeBirthCalendarType(birthCalendarType);
		String normalizedAvatarType = normalizeProfileAvatarType(profileAvatarType, profileImageData);

		try {
			pendingUser.setUserName(trimmedName);
			pendingUser.setStatus("ACTIVE");
			pendingUser.setUserRole("USER");
			pendingUser.setBirthDate(normalizedBirthDate);
			pendingUser.setBirthCalendarType(normalizedBirthCalendarType);
			pendingUser.setBirthPublicYn("Y");
			pendingUser.setProfileAvatarType(normalizedAvatarType);
			pendingUser.setProfileCropScale(normalizeDouble(profileCropScale));
			pendingUser.setProfileCropX(normalizeDouble(profileCropX));
			pendingUser.setProfileCropY(normalizeDouble(profileCropY));

			if ("IMAGE".equals(normalizedAvatarType)) {
				String originalImageData = hasText(profileOriginalImageData) ? profileOriginalImageData : profileImageData;
				pendingUser.setProfileOriginalImagePath(accountProfileImageService.saveOriginalImage(originalImageData));
				pendingUser.setProfileImagePath(accountProfileImageService.saveCroppedImage(profileImageData));
			} else {
				pendingUser.setProfileOriginalImagePath(null);
				pendingUser.setProfileImagePath(null);
				pendingUser.setProfileCropScale(null);
				pendingUser.setProfileCropX(null);
				pendingUser.setProfileCropY(null);
			}

			userService.registerUser(pendingUser);

			usersDto fullUserInfo = userService.findById(pendingUser.getUserId());
			if (fullUserInfo == null) {
				fullUserInfo = userService.login(pendingUser);
			}
			session.removeAttribute("pendingJoinUser");
			session.setAttribute("user", fullUserInfo);
			return "redirect:/calendar";
		} catch (IllegalArgumentException e) {
			return "redirect:/users/step2?error=image";
		} catch (java.io.IOException e) {
			return "redirect:/users/step2?error=save";
		}
	}

	@GetMapping("/users/loginForm")
	public String loginForm() {
		return "users/loginForm";
	}
	
	
	@PostMapping("/users/login")
	public String login(usersDto user, HttpSession session) {
		usersDto loginUser = userService.login(user);
		
		if (loginUser != null) {
			session.setAttribute("user", loginUser);
			return "redirect:/calendar";
		}
		return "redirect:/users/loginForm?error";
	}
	
	@GetMapping("/users/logout")
	public String logout(HttpSession session) {
		session.invalidate();
		return "redirect:/";
	}
	
	@GetMapping("/users/mypage")
	public String myPage(HttpSession session, Model model) {
	    usersDto sessionUser = (usersDto) session.getAttribute("user");
	    if (sessionUser == null) return "redirect:/users/loginForm";

	    usersDto freshUser = userService.findById(sessionUser.getUserId());
	    if (freshUser == null) freshUser = sessionUser;
	    session.setAttribute("user", freshUser);

	    applyProfileModel(model, freshUser, freshUser, true);
	    return "users/myPage";
	}

	@GetMapping("/users/profile")
	public String profile(@RequestParam(value = "userId", required = false) Long userId, HttpSession session, Model model) {
	    usersDto sessionUser = (usersDto) session.getAttribute("user");
	    if (sessionUser == null) return "redirect:/users/loginForm";

	    Long targetUserId = userId == null ? sessionUser.getUserId() : userId;
	    usersDto freshSessionUser = userService.findById(sessionUser.getUserId());
	    if (freshSessionUser == null) freshSessionUser = sessionUser;
	    session.setAttribute("user", freshSessionUser);

	    usersDto profileUser = userService.findById(targetUserId);
	    if (profileUser == null || "QUIT".equals(profileUser.getStatus())) {
	        return "redirect:/users/mypage";
	    }

	    boolean isOwnProfile = freshSessionUser.getUserId() != null && freshSessionUser.getUserId().equals(profileUser.getUserId());
	    applyProfileModel(model, freshSessionUser, profileUser, isOwnProfile);
	    return "users/myPage";
	}

	private void applyProfileModel(Model model, usersDto loginUser, usersDto profileUser, boolean isOwnProfile) {
	    String photosPublicYn = profileUser.getProfilePhotosPublicYn() == null ? "Y" : profileUser.getProfilePhotosPublicYn();
	    String groupsPublicYn = profileUser.getProfileGroupsPublicYn() == null ? "Y" : profileUser.getProfileGroupsPublicYn();
	    String calendarPublicYn = profileUser.getProfileCalendarPublicYn() == null ? "Y" : profileUser.getProfileCalendarPublicYn();
	    String notesPublicYn = profileUser.getProfileNotesPublicYn() == null ? "Y" : profileUser.getProfileNotesPublicYn();
	    boolean photosVisible = !"N".equals(photosPublicYn);
	    boolean groupsVisible = isOwnProfile || !"N".equals(groupsPublicYn);
	    boolean calendarVisible = !"N".equals(calendarPublicYn);
	    boolean notesVisible = !"N".equals(notesPublicYn);
	    Long viewerUserId = loginUser == null ? null : loginUser.getUserId();
	    List<friendDTO> profileFriends = friendService.getFriends(profileUser.getUserId(), null);
	    List<Map<String, Object>> profilePublicPhotos = photosVisible
	            ? photoAlbumService.getProfilePublicPosts(profileUser.getUserId(), viewerUserId)
	            : java.util.Collections.emptyList();
	    int profilePhotoCount = photosVisible
	            ? photoAlbumService.countProfilePublicPosts(profileUser.getUserId())
	            : 0;
	    List<com.springboot.project.dto.calendarResponseDTO> profilePublicSchedules = calendarVisible
	            ? calendarResponseService.getProfilePublicEvents(profileUser.getUserId(), 0)
	            : java.util.Collections.emptyList();
	    int profileCalendarCount = calendarVisible
	            ? calendarResponseService.countProfilePublicEvents(profileUser.getUserId())
	            : 0;
	    List<noteDTO> profilePublicNotes = notesVisible
	            ? noteService.getProfilePublicNotes(profileUser.getUserId(), viewerUserId, 6)
	            : java.util.Collections.emptyList();
	    int profileNoteCount = notesVisible
	            ? noteService.countProfilePublicNotes(profileUser.getUserId())
	            : 0;

	    model.addAttribute("mypageUser", profileUser);
	    model.addAttribute("isOwnProfile", isOwnProfile);
	    model.addAttribute("profileOwnerId", profileUser.getUserId());
	    model.addAttribute("groupsVisible", groupsVisible);
	    model.addAttribute("calendarVisible", calendarVisible);
	    model.addAttribute("notesVisible", notesVisible);
	    model.addAttribute("profileFriendCount", profileFriends == null ? 0 : profileFriends.size());
	    model.addAttribute("profilePublicPhotos", profilePublicPhotos);
	    model.addAttribute("profilePhotoCount", profilePhotoCount);
	    model.addAttribute("profilePublicSchedules", profilePublicSchedules);
	    model.addAttribute("profileCalendarCount", profileCalendarCount);
	    model.addAttribute("profilePublicNotes", profilePublicNotes);
	    model.addAttribute("profileNoteCount", profileNoteCount);
	    model.addAttribute("profileLinks", userService.getProfileLinks(profileUser.getUserId()));
	    List<workspaceDTO> visibleWorkspaces = java.util.Collections.emptyList();
	    if (groupsVisible) {
	        List<workspaceDTO> profileWorkspaces = userService.getWorkspacesByUserId(profileUser.getUserId());
	        visibleWorkspaces = new java.util.ArrayList<>();

	        if (profileWorkspaces != null) {
	            for (workspaceDTO workspace : profileWorkspaces) {
	                if (workspace == null) continue;

	                // 프로필 사용자가 현재 참여 중인 그룹은 조회자의 과거 탈퇴 여부와 관계없이 표시합니다.
	                // 입장·참여 가능 여부는 그룹 미리보기의 가입 유형 및 membership API에서 판정합니다.
	                visibleWorkspaces.add(workspace);
	            }
	        }
	    }
	    model.addAttribute("wsList", visibleWorkspaces);

	    if (!isOwnProfile && loginUser != null && loginUser.getUserId() != null && profileUser.getUserId() != null) {
	        friendDTO relation = friendService.getRelation(loginUser.getUserId(), profileUser.getUserId());
	        model.addAttribute("friendRelation", relation);
	        model.addAttribute("friendRelationStatus", relation == null ? "NONE" : relation.getStatus());
	        model.addAttribute("friendRelationDirection", relation == null ? "NONE" : relation.getDirection());
	        model.addAttribute("friendRelationId", relation == null ? null : relation.getFriendId());
	    } else {
	        model.addAttribute("friendRelationStatus", "SELF");
	        model.addAttribute("friendRelationDirection", "SELF");
	    }
	}
	
	@GetMapping("/users/profile/friends")
	@ResponseBody
	public Map<String, Object> profileFriends(@RequestParam("userId") Long userId, HttpSession session) {
	    Map<String, Object> result = new HashMap<>();
	    usersDto sessionUser = (usersDto) session.getAttribute("user");
	    if (sessionUser == null) {
	        result.put("success", false);
	        result.put("message", "로그인이 필요합니다.");
	        return result;
	    }

	    usersDto profileUser = userService.findById(userId);
	    if (profileUser == null || "QUIT".equals(profileUser.getStatus())) {
	        result.put("success", false);
	        result.put("message", "프로필을 찾을 수 없습니다.");
	        return result;
	    }

	    List<friendDTO> friends = friendService.getFriends(userId, null);
	    decorateFriendRelations(sessionUser.getUserId(), friends);

	    result.put("success", true);
	    result.put("friends", friends);
	    return result;
	}

	private void decorateFriendRelations(Long loginUserId, List<friendDTO> friends) {
	    if (loginUserId == null || friends == null) return;
	    for (friendDTO item : friends) {
	        if (item == null || item.getUserId() == null) continue;
	        if (loginUserId.equals(item.getUserId())) {
	            item.setRelationStatus("SELF");
	            item.setDirection("SELF");
	            continue;
	        }
	        friendDTO relation = friendService.getRelation(loginUserId, item.getUserId());
	        if (relation == null) {
	            item.setRelationStatus("NONE");
	            item.setDirection("NONE");
	            item.setFriendId(null);
	        } else {
	            item.setRelationStatus(relation.getStatus());
	            item.setDirection(relation.getDirection());
	            item.setFriendId(relation.getFriendId());
	        }
	    }
	}
	

	@GetMapping("/users/profile/images")
	@ResponseBody
	public Map<String, Object> getProfileImageHistory(HttpSession session) {
	    Map<String, Object> map = new HashMap<>();
	    usersDto currentUser = (usersDto) session.getAttribute("user");
	    if (currentUser == null) {
	        map.put("status", "fail");
	        map.put("message", "로그인이 필요합니다.");
	        return map;
	    }
	    map.put("status", "success");
	    map.put("images", userService.getProfileImageHistory(currentUser.getUserId()));
	    return map;
	}

	@PostMapping("/users/updateProfile")
	@ResponseBody
	public Map<String, Object> updateProfile(@RequestBody Map<String, Object> payload, HttpSession session) {
	    Map<String, Object> map = new HashMap<>();
	    usersDto currentUser = (usersDto) session.getAttribute("user");

	    if (currentUser == null) {
	        map.put("status", "fail");
	        map.put("message", "로그인이 필요합니다.");
	        return map;
	    }

	    usersDto updateDto = new usersDto();
    updateDto.setUserId(currentUser.getUserId());

    if (payload.containsKey("userName")) {
        String userName = asString(payload.get("userName"));
        if (userName == null || userName.trim().isEmpty()) {
            map.put("status", "fail");
            map.put("message", "이름을 입력해주세요.");
            return map;
        }
        updateDto.setUserName(userName.trim());
    }

    if (payload.containsKey("profileIntro")) {
        String profileIntro = trimToEmpty(asString(payload.get("profileIntro")));
        if (profileIntro.length() > 100) {
            map.put("status", "fail");
            map.put("message", "자기소개는 100자 이내로 입력해주세요.");
            return map;
        }
        updateDto.setProfileIntro(profileIntro);
    }

    if (payload.containsKey("birthDate")) {
        updateDto.setBirthDate(trimToEmpty(asString(payload.get("birthDate"))));
    }
    if (payload.containsKey("birthCalendarType")) {
        updateDto.setBirthCalendarType("LUNAR".equals(asString(payload.get("birthCalendarType"))) ? "LUNAR" : "SOLAR");
    }
    if (payload.containsKey("birthPublicYn")) {
        updateDto.setBirthPublicYn("N".equals(asString(payload.get("birthPublicYn"))) ? "N" : "Y");
    }
    if (payload.containsKey("profilePhotosPublicYn")) {
        updateDto.setProfilePhotosPublicYn("N".equals(asString(payload.get("profilePhotosPublicYn"))) ? "N" : "Y");
    }
    if (payload.containsKey("profileNotesPublicYn")) {
        updateDto.setProfileNotesPublicYn("N".equals(asString(payload.get("profileNotesPublicYn"))) ? "N" : "Y");
    }
    if (payload.containsKey("profileCalendarPublicYn")) {
        updateDto.setProfileCalendarPublicYn("N".equals(asString(payload.get("profileCalendarPublicYn"))) ? "N" : "Y");
    }
    if (payload.containsKey("profileGroupsPublicYn")) {
        updateDto.setProfileGroupsPublicYn("N".equals(asString(payload.get("profileGroupsPublicYn"))) ? "N" : "Y");
    }
    if (payload.containsKey("notifyScheduleYn")) {
        updateDto.setNotifyScheduleYn("N".equals(asString(payload.get("notifyScheduleYn"))) ? "N" : "Y");
    }
    if (payload.containsKey("notifyShareYn")) {
        updateDto.setNotifyShareYn("N".equals(asString(payload.get("notifyShareYn"))) ? "N" : "Y");
    }
    if (payload.containsKey("notifyRequestYn")) {
        updateDto.setNotifyRequestYn("N".equals(asString(payload.get("notifyRequestYn"))) ? "N" : "Y");
    }
    if (payload.containsKey("notifyCommentYn")) {
        updateDto.setNotifyCommentYn("N".equals(asString(payload.get("notifyCommentYn"))) ? "N" : "Y");
    }
    if (payload.containsKey("notifyLikeYn")) {
        updateDto.setNotifyLikeYn("N".equals(asString(payload.get("notifyLikeYn"))) ? "N" : "Y");
    }

    List<Map<String, Object>> profileLinks = null;
    if (payload.containsKey("profileLinks")) {
        try {
            profileLinks = normalizeProfileLinks(payload.get("profileLinks"));
        } catch (IllegalArgumentException e) {
            map.put("status", "fail");
            map.put("message", e.getMessage());
            return map;
        }
    }

    try {
        boolean restoreHistoryImage = false;
        Long restoreProfileImageId = null;
        if (payload.containsKey("profileAvatarType")) {
            String avatarType = "IMAGE".equals(asString(payload.get("profileAvatarType"))) ? "IMAGE" : "DEFAULT";
            updateDto.setProfileAvatarType(avatarType);

            if ("IMAGE".equals(avatarType)) {
                restoreProfileImageId = normalizeLong(asString(payload.get("profileImageHistoryId")));
                if (restoreProfileImageId != null) {
                    restoreHistoryImage = true;
                } else {
                    String profileImageData = asString(payload.get("profileImageData"));
                    String profileOriginalImageData = asString(payload.get("profileOriginalImageData"));
                    if (profileImageData != null && profileImageData.startsWith("data:image/")) {
                        updateDto.setProfileImagePath(accountProfileImageService.saveCroppedImage(profileImageData));
                        updateDto.setProfileOriginalImagePath(
                                profileOriginalImageData != null && profileOriginalImageData.startsWith("data:image/")
                                        ? accountProfileImageService.saveOriginalImage(profileOriginalImageData)
                                        : updateDto.getProfileImagePath());
                        updateDto.setProfileCropScale(normalizeDouble(asString(payload.get("profileCropScale"))));
                        updateDto.setProfileCropX(normalizeDouble(asString(payload.get("profileCropX"))));
                        updateDto.setProfileCropY(normalizeDouble(asString(payload.get("profileCropY"))));
                    } else {
                        updateDto.setProfileAvatarType(null);
                    }
                }
            }
        }

        if (restoreHistoryImage) {
            userService.restoreProfileImage(updateDto, restoreProfileImageId);
        } else {
            userService.updateProfile(updateDto);
        }
        if (profileLinks != null) {
            userService.replaceProfileLinks(currentUser.getUserId(), profileLinks);
        }
	        usersDto refreshedUser = userService.findById(currentUser.getUserId());
	        if (refreshedUser != null) {
	            session.setAttribute("user", refreshedUser);
	        }
	        map.put("status", "success");
	    } catch (IllegalArgumentException e) {
	        map.put("status", "fail");
	        map.put("message", e.getMessage());
	    } catch (java.io.IOException e) {
	        map.put("status", "fail");
	        map.put("message", "프로필 이미지를 저장하지 못했습니다.");
	    }
	    return map;
	}

	private String asString(Object value) {
	    return value == null ? null : String.valueOf(value);
	}

	private String trimToEmpty(String value) {
	    return value == null ? "" : value.trim();
	}


	@PostMapping("/users/profile/password")
	@ResponseBody
	public Map<String, Object> changePassword(@RequestBody Map<String, Object> payload, HttpSession session) {
		Map<String, Object> map = new HashMap<>();
		usersDto currentUser = (usersDto) session.getAttribute("user");

		if (currentUser == null) {
			map.put("status", "fail");
			map.put("message", "로그인이 필요합니다.");
			return map;
		}

		try {
			userService.changePassword(
					currentUser.getUserId(),
					asString(payload.get("currentPassword")),
					asString(payload.get("newPassword")),
					asString(payload.get("confirmPassword"))
			);
			map.put("status", "success");
		} catch (IllegalArgumentException e) {
			map.put("status", "fail");
			map.put("message", e.getMessage());
		}
		return map;
	}

	@PostMapping("/users/withdraw")
	@ResponseBody
	public Map<String, Object> withdraw(@RequestBody Map<String, Object> payload, HttpSession session) {
	    Map<String, Object> map = new HashMap<>();
	    usersDto currentUser = (usersDto) session.getAttribute("user");

	    if (currentUser == null) {
	        map.put("status", "fail");
	        map.put("message", "로그인이 필요합니다.");
	        return map;
	    }

	    try {
	        userService.requestWithdrawal(currentUser.getUserId(), asString(payload.get("currentPassword")));
	        session.invalidate();
	        map.put("status", "success");
	        map.put("message", "회원 탈퇴 신청이 완료되었습니다. 30일 안에 다시 로그인하면 복구할 수 있습니다.");
	    } catch (IllegalArgumentException e) {
	        map.put("status", "fail");
	        map.put("message", e.getMessage());
	    }
	    return map;
	}

	@PostMapping("/users/withdraw/cancel")
	@ResponseBody
	public Map<String, Object> cancelWithdrawal(HttpSession session) {
	    Map<String, Object> map = new HashMap<>();
	    usersDto currentUser = (usersDto) session.getAttribute("user");

	    if (currentUser == null) {
	        map.put("status", "fail");
	        map.put("message", "로그인이 필요합니다.");
	        return map;
	    }

	    try {
	        userService.cancelWithdrawal(currentUser.getUserId());
	        usersDto refreshedUser = userService.findById(currentUser.getUserId());
	        if (refreshedUser != null) {
	            session.setAttribute("user", refreshedUser);
	        }
	        map.put("status", "success");
	        map.put("message", "탈퇴 신청이 취소되었습니다.");
	    } catch (IllegalArgumentException e) {
	        map.put("status", "fail");
	        map.put("message", e.getMessage());
	    }
	    return map;
	}
	
	@SuppressWarnings("unchecked")
	private List<Map<String, Object>> normalizeProfileLinks(Object rawLinks) {
	    List<Map<String, Object>> result = new java.util.ArrayList<>();
	    if (rawLinks == null) return result;
	    if (!(rawLinks instanceof List<?>)) {
	        throw new IllegalArgumentException("프로필 링크 형식이 올바르지 않습니다.");
	    }

	    for (Object raw : (List<?>) rawLinks) {
	        if (!(raw instanceof Map<?, ?>)) continue;
	        Map<String, Object> source = (Map<String, Object>) raw;
	        String name = trimToEmpty(asString(source.get("linkName")));
	        String url = trimToEmpty(asString(source.get("linkUrl")));

	        if (name.isEmpty() && url.isEmpty()) continue;
	        if (name.isEmpty() || url.isEmpty()) {
	            throw new IllegalArgumentException("링크 이름과 주소를 모두 입력해주세요.");
	        }
	        if (name.length() > 50) {
	            throw new IllegalArgumentException("링크 이름은 50자 이내로 입력해주세요.");
	        }
	        if (url.length() > 500) {
	            throw new IllegalArgumentException("링크 주소는 500자 이내로 입력해주세요.");
	        }
	        if (!url.matches("(?i)^https?://.+")) {
	            url = "https://" + url;
	        }
	        try {
	            java.net.URI uri = java.net.URI.create(url);
	            String scheme = uri.getScheme();
	            if (uri.getHost() == null || (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme))) {
	                throw new IllegalArgumentException();
	            }
	        } catch (Exception e) {
	            throw new IllegalArgumentException("올바른 링크 주소를 입력해주세요.");
	        }

	        Map<String, Object> link = new HashMap<>();
	        link.put("linkName", name);
	        link.put("linkUrl", url);
	        result.add(link);
	        if (result.size() > 5) {
	            throw new IllegalArgumentException("프로필 링크는 최대 5개까지 추가할 수 있습니다.");
	        }
	    }
	    return result;
	}

	private String normalizeBirthDate(String birthDate) {
		if (birthDate == null) {
			return null;
		}
		String value = birthDate.trim();
		if (value.isEmpty()) {
			return null;
		}
		return value.matches("\\d{4}-\\d{2}-\\d{2}") ? value : null;
	}

	private String normalizeBirthCalendarType(String birthCalendarType) {
		String value = birthCalendarType == null ? "" : birthCalendarType.trim().toUpperCase();
		return "LUNAR".equals(value) ? "LUNAR" : "SOLAR";
	}

	private String normalizeProfileAvatarType(String profileAvatarType, String profileImageData) {
		return hasText(profileImageData) ? "IMAGE" : "DEFAULT";
	}

	private boolean hasText(String value) {
		return value != null && !value.trim().isEmpty();
	}

	private Long normalizeLong(String value) {
	    if (value == null || value.trim().isEmpty()) return null;
	    try {
	        return Long.valueOf(value.trim());
	    } catch (NumberFormatException e) {
	        return null;
	    }
	}

	private Double normalizeDouble(String value) {
		if (value == null || value.trim().isEmpty()) {
			return null;
		}
		try {
			return Double.valueOf(value.trim());
		} catch (NumberFormatException e) {
			return null;
		}
	}

	// 예시: UserController에 추가할 가짜/진짜 유저 API 리스트업
	@GetMapping("/users/api/list")
	@ResponseBody
	public List<usersDto> getUserApiList() {
	    // DB 매퍼를 이용해 내 정보를 제외한(또는 전체) 유저 리스트를 가져와 JSON 배열로 반환합니다.
	    return userService.getAllUsers(); 
	}
}
