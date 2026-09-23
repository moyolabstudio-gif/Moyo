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
import com.springboot.project.service.AccountStatusLoginException;
import com.springboot.project.service.LoginTemporarilyBlockedException;
import com.springboot.project.service.EmailVerificationService;
import com.springboot.project.service.IfriendService;
import com.springboot.project.service.AccountProfileImageService;
import com.springboot.project.service.IcalendarResponseService;
import com.springboot.project.service.IphotoAlbumService;
import com.springboot.project.service.InoteService;
import com.springboot.project.config.security.MoyoAuthenticationService;
import com.springboot.project.config.security.LoginAttemptGuard;
import com.springboot.project.config.security.SecurityAuditLogger;
import com.springboot.project.util.UserProfileValidator;

import jakarta.servlet.http.HttpServletRequest;
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

	@Autowired
	private MoyoAuthenticationService moyoAuthenticationService;

	@Autowired
	private LoginAttemptGuard loginAttemptGuard;

	@Autowired
	private EmailVerificationService emailVerificationService;

	@Autowired
	private SecurityAuditLogger securityAuditLogger;

	@RequestMapping("/")
	public String root() {
		return "home";
	}
	
	@RequestMapping("/users/joinForm")
	public String join(HttpSession session, Model model) {
		String verifiedEmail = emailVerificationService.getVerifiedEmail(session);
		if (verifiedEmail != null) {
			model.addAttribute("resumeVerifiedEmail", verifiedEmail);
		} else {
			Object pending = session.getAttribute("pendingJoinUser");
			if (pending != null) {
				session.removeAttribute("pendingJoinUser");
				session.removeAttribute(EmailVerificationService.PENDING_VERIFIED_EMAIL_KEY);
			}
		}
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
		try {
			userService.validatePasswordPolicy(password);
		} catch (IllegalArgumentException e) {
			return "redirect:/users/joinForm?error=passwordPolicy";
		}
		if (userService.isEmailDuplicated(email)) {
			return "redirect:/users/joinForm?error=duplicate";
		}
		if (!emailVerificationService.isVerified(email, session)) {
			return "redirect:/users/joinForm?error=emailVerification";
		}

		user.setEmail(email);
		user.setPwdHash(password);
		session.setAttribute("pendingJoinUser", user);
		session.setAttribute(EmailVerificationService.PENDING_VERIFIED_EMAIL_KEY, email);
		return "redirect:/users/step2";
	}

	@GetMapping("/users/step2")
	public String step2(HttpSession session) {
		usersDto pendingUser = (usersDto) session.getAttribute("pendingJoinUser");
		String verifiedEmail = (String) session.getAttribute(EmailVerificationService.PENDING_VERIFIED_EMAIL_KEY);
		if (pendingUser == null || pendingUser.getEmail() == null || verifiedEmail == null
				|| !verifiedEmail.equalsIgnoreCase(pendingUser.getEmail().trim())
				|| !emailVerificationService.isVerified(pendingUser.getEmail(), session)) {
			session.removeAttribute("pendingJoinUser");
			session.removeAttribute(EmailVerificationService.PENDING_VERIFIED_EMAIL_KEY);
			return "redirect:/users/joinForm?error=emailVerification";
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
			HttpServletRequest request,
			HttpSession session) {
		usersDto pendingUser = (usersDto) session.getAttribute("pendingJoinUser");
		if (pendingUser == null) {
			return "redirect:/users/joinForm";
		}
		String verifiedEmail = (String) session.getAttribute(EmailVerificationService.PENDING_VERIFIED_EMAIL_KEY);
		if (verifiedEmail == null || pendingUser.getEmail() == null
				|| !verifiedEmail.equalsIgnoreCase(pendingUser.getEmail().trim())
				|| !emailVerificationService.isVerified(pendingUser.getEmail(), session)) {
			session.removeAttribute("pendingJoinUser");
			session.removeAttribute(EmailVerificationService.PENDING_VERIFIED_EMAIL_KEY);
			emailVerificationService.clear(session);
			return "redirect:/users/joinForm?error=emailVerification";
		}

		final String trimmedName;
		try {
			trimmedName = UserProfileValidator.normalizeRequiredName(userName);
		} catch (IllegalArgumentException e) {
			return "redirect:/users/step2?error=name";
		}

		final String normalizedBirthDate;
		final String normalizedBirthCalendarType;
		try {
			normalizedBirthDate = UserProfileValidator.normalizeOptionalBirthDate(birthDate);
			normalizedBirthCalendarType = UserProfileValidator.normalizeBirthCalendarType(birthCalendarType);
		} catch (IllegalArgumentException e) {
			return "redirect:/users/step2?error=birth";
		}
		String normalizedAvatarType = normalizeProfileAvatarType(profileAvatarType, profileImageData);

		try {
			pendingUser.setUserName(trimmedName);
			pendingUser.setStatus("ACTIVE");
			pendingUser.setUserRole("USER");
			pendingUser.setBirthDate(normalizedBirthDate);
			pendingUser.setBirthCalendarType(normalizedBirthCalendarType);
			pendingUser.setBirthPublicYn("N");
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
			session.removeAttribute(EmailVerificationService.PENDING_VERIFIED_EMAIL_KEY);
			emailVerificationService.clear(session);
			moyoAuthenticationService.establishFreshAuthentication(fullUserInfo, request);
			return "redirect:/calendar";
		} catch (IllegalArgumentException e) {
			return "redirect:/users/step2?error=image";
		} catch (java.io.IOException e) {
			return "redirect:/users/step2?error=save";
		}
	}

	@GetMapping("/users/loginForm")
	public String loginForm(HttpSession session, Model model) {
		Object attemptedEmail = session.getAttribute("loginAttemptEmail");
		if (attemptedEmail instanceof String email && !email.isBlank()) {
			model.addAttribute("loginAttemptEmail", email);
		}
		session.removeAttribute("loginAttemptEmail");
		return "users/loginForm";
	}

	@GetMapping("/login")
	public String loginAlias() {
		return "redirect:/users/loginForm";
	}
	
	
	@PostMapping("/users/login")
	public String login(usersDto user, HttpServletRequest request, HttpSession session) {
		String attemptedEmail = user == null || user.getEmail() == null ? "" : user.getEmail().trim();
		if (!attemptedEmail.isBlank()) {
			session.setAttribute("loginAttemptEmail", attemptedEmail);
		}

		if (loginAttemptGuard.isBlocked(request)) {
			securityAuditLogger.denied("LOGIN_IP_RATE_LIMIT", null, request, "rate_limited");
			return "redirect:/users/loginForm?status=loginLimited";
		}

		try {
			usersDto loginUser = userService.login(user);

			if (loginUser != null) {
				session.removeAttribute("loginAttemptEmail");
				loginAttemptGuard.recordSuccess(request);
				clearWithdrawPendingSession(session);
				moyoAuthenticationService.establishFreshAuthentication(loginUser, request);
				securityAuditLogger.success("LOGIN", loginUser.getUserId(), request);
				return "redirect:/calendar";
			}

			if (loginAttemptGuard.recordFailure(request)) {
				securityAuditLogger.denied("LOGIN_IP_RATE_LIMIT", null, request, "failure_threshold");
				return "redirect:/users/loginForm?status=loginLimited";
			}
			securityAuditLogger.failure("LOGIN", null, request, "invalid_credentials");
			return "redirect:/users/loginForm?error=1";
		} catch (LoginTemporarilyBlockedException e) {
			securityAuditLogger.denied("LOGIN_ACCOUNT_TEMP_LOCK", null, request, "temporarily_locked");
			return "redirect:/users/loginForm?status=loginLimited";
		} catch (AccountStatusLoginException e) {
			securityAuditLogger.denied("LOGIN_ACCOUNT_STATUS", e.getUserId(), request, e.getStatus());
			// 비밀번호 자체는 확인된 계정이므로 IP 실패 기록을 제거한다.
			loginAttemptGuard.recordSuccess(request);

			// 혹시 남아 있는 기존 로그인 상태는 제거하되 복구용 세션 자체는 유지한다.
			moyoAuthenticationService.clearAuthenticationKeepingSession(session);

			// 비밀번호까지 확인된 탈퇴 대기 계정만 복구용 임시 세션을 발급한다.
			if ("WITHDRAW_PENDING".equals(e.getStatus())) {
				clearWithdrawPendingSession(session);
				session.setAttribute("withdrawPendingUserId", e.getUserId());

				usersDto pendingUser = userService.findById(e.getUserId());
				if (pendingUser != null && pendingUser.getWithdrawDeadlineAt() != null) {
					session.setAttribute("withdrawPendingDeadline", pendingUser.getWithdrawDeadlineAt());
				}

				return "redirect:/users/loginForm?status=withdrawPending";
			}

			clearWithdrawPendingSession(session);
			return switch (e.getStatus()) {
				case "LOCKED" -> "redirect:/users/loginForm?status=locked";
				case "SUSPENDED" -> "redirect:/users/loginForm?status=suspended";
				case "WITHDRAW_EXPIRED", "QUIT" -> "redirect:/users/loginForm?status=unavailable";
				default -> "redirect:/users/loginForm?status=unavailable";
			};
		}
	}

	@PostMapping("/users/logout")
	public String logout(HttpServletRequest request, HttpSession session) {
		usersDto currentUser = (usersDto) session.getAttribute("user");
		securityAuditLogger.success("LOGOUT",
				currentUser == null ? null : currentUser.getUserId(), request);
		moyoAuthenticationService.clearAuthentication(session);
		return "redirect:/";
	}
	
	@GetMapping("/users/mypage")
	public String myPage(HttpSession session, Model model) {
	    usersDto sessionUser = (usersDto) session.getAttribute("user");
	    if (sessionUser == null) return "redirect:/users/loginForm";

	    usersDto freshUser = userService.findById(sessionUser.getUserId());
	    if (freshUser == null) freshUser = sessionUser;
	    moyoAuthenticationService.establishAuthentication(freshUser, session);

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
	    moyoAuthenticationService.establishAuthentication(freshSessionUser, session);

	    usersDto profileUser = userService.findById(targetUserId);
	    if (!isProfileAvailable(profileUser, freshSessionUser.getUserId())) {
	        return "redirect:/users/mypage";
	    }

	    boolean isOwnProfile = freshSessionUser.getUserId() != null && freshSessionUser.getUserId().equals(profileUser.getUserId());
	    applyProfileModel(model, freshSessionUser, profileUser, isOwnProfile);
	    return "users/myPage";
	}

	private void applyProfileModel(Model model, usersDto loginUser, usersDto profileUser, boolean isOwnProfile) {
	    String photosPublicYn = profileUser.getProfilePhotosPublicYn() == null ? "Y" : profileUser.getProfilePhotosPublicYn();
	    String groupsPublicYn = profileUser.getProfileGroupsPublicYn() == null ? "Y" : profileUser.getProfileGroupsPublicYn();
    String friendsPublicYn = profileUser.getProfileFriendsPublicYn() == null ? "Y" : profileUser.getProfileFriendsPublicYn();
	    String calendarPublicYn = profileUser.getProfileCalendarPublicYn() == null ? "Y" : profileUser.getProfileCalendarPublicYn();
	    String notesPublicYn = profileUser.getProfileNotesPublicYn() == null ? "Y" : profileUser.getProfileNotesPublicYn();
	    Long viewerUserId = loginUser == null ? null : loginUser.getUserId();

	    friendDTO profileRelation = null;
	    boolean acceptedFriend = false;
	    if (!isOwnProfile && viewerUserId != null && profileUser.getUserId() != null) {
	        profileRelation = friendService.getRelation(viewerUserId, profileUser.getUserId());
	        acceptedFriend = profileRelation != null
	                && "ACCEPTED".equalsIgnoreCase(profileRelation.getStatus());
	    }

	    // MOYO 공개는 로그인 회원 전체 공개가 아니라 ACCEPTED 친구 전체 공개다.
	    // 프로필 사진/노트/일정은 (본인 또는 친구) + 프로필 영역 공개 설정 + 개별 콘텐츠 MOYO 공개를 모두 만족해야 한다.
	    // 특정 사용자 직접 공유(일정 참석자, CONTENT_SHARES 등)는 MOYO 공개와 별도 권한으로 유지한다.
	    boolean moyoProfileAudience = isOwnProfile || acceptedFriend;
	    boolean photosVisible = moyoProfileAudience && !"N".equals(photosPublicYn);
	    boolean groupsVisible = isOwnProfile || (acceptedFriend && !"N".equals(groupsPublicYn));
	    boolean calendarVisible = moyoProfileAudience && !"N".equals(calendarPublicYn);
	    boolean notesVisible = moyoProfileAudience && !"N".equals(notesPublicYn);
	    boolean friendsVisible = isOwnProfile || !"N".equals(friendsPublicYn);
	    List<friendDTO> profileFriends = friendsVisible
	            ? friendService.getFriends(profileUser.getUserId(), null)
	            : java.util.Collections.emptyList();
	    List<Map<String, Object>> profilePublicPhotos = photosVisible
	            ? photoAlbumService.getProfilePublicPosts(profileUser.getUserId(), viewerUserId)
	            : java.util.Collections.emptyList();

	    // 프로필의 MOYO 공개 사진 썸네일도 사진 권한 컨트롤러를 통해 제공한다.
	    // DB의 물리 저장 경로(/uploads/photos/...)를 그대로 노출하면 WebConfig 정적 매핑이
	    // 없는 환경에서 404가 발생하고, 정적 매핑을 추가하면 비공개 사진까지 우회 노출될 수 있다.
	    if (profilePublicPhotos != null) {
	        for (Map<String, Object> post : profilePublicPhotos) {
	            if (post == null) continue;
	            Object coverPhotoIdValue = post.get("COVER_PHOTO_ID");
	            if (coverPhotoIdValue == null) coverPhotoIdValue = post.get("coverPhotoId");
	            if (coverPhotoIdValue instanceof Number) {
	                String secureCoverPath = "/photo/media/" + ((Number) coverPhotoIdValue).longValue();
	                post.put("COVER_PATH", secureCoverPath);
	                post.put("coverPath", secureCoverPath);
	            } else if (coverPhotoIdValue != null) {
	                try {
	                    String secureCoverPath = "/photo/media/" + Long.parseLong(String.valueOf(coverPhotoIdValue));
	                    post.put("COVER_PATH", secureCoverPath);
	                    post.put("coverPath", secureCoverPath);
	                } catch (NumberFormatException ignored) {
	                    // 잘못된 ID라면 기존 경로를 유지해 빈 썸네일 처리에 맡긴다.
	                }
	            }
	        }
	    }

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
	    // 프로필 연락/생일 정보는 본인과 ACCEPTED 친구에게만 공개한다.
	    // 비친구에게는 JSP에서 해당 메타 영역 자체를 렌더링하지 않는다.
	    model.addAttribute("showProfileEmail", isOwnProfile || acceptedFriend);
	    model.addAttribute("showProfileBirth", isOwnProfile || acceptedFriend);
	    model.addAttribute("profileOwnerId", profileUser.getUserId());
	    model.addAttribute("photosVisible", photosVisible);
	    model.addAttribute("groupsVisible", groupsVisible);
	    model.addAttribute("profileAcceptedFriend", acceptedFriend);
	    model.addAttribute("calendarVisible", calendarVisible);
	    model.addAttribute("notesVisible", notesVisible);
	    model.addAttribute("friendsVisible", friendsVisible);
	    model.addAttribute("profileFriendCount", friendsVisible && profileFriends != null ? profileFriends.size() : 0);
	    model.addAttribute("profilePublicPhotos", profilePublicPhotos);
	    model.addAttribute("profilePhotoCount", profilePhotoCount);
	    model.addAttribute("profilePublicSchedules", profilePublicSchedules);
	    model.addAttribute("profileCalendarCount", profileCalendarCount);
	    model.addAttribute("profilePublicNotes", profilePublicNotes);
	    model.addAttribute("profileNoteCount", profileNoteCount);
	    model.addAttribute("profileLinks", userService.getProfileLinks(profileUser.getUserId()));
	    List<workspaceDTO> visibleWorkspaces = java.util.Collections.emptyList();
	    boolean hiddenInviteOnlyGroups = false;
	    if (groupsVisible) {
	        List<workspaceDTO> profileWorkspaces = userService.getWorkspacesByUserId(profileUser.getUserId());
	        visibleWorkspaces = new java.util.ArrayList<>();

	        if (profileWorkspaces != null) {
	            for (workspaceDTO workspace : profileWorkspaces) {
	                if (workspace == null) continue;

	                // 초대 전용 그룹은 존재 자체가 초대 대상에게만 노출되는 성격이므로
	                // 프로필 소유자 본인을 제외한 다른 사용자에게는 프로필 목록에서 숨긴다.
	                if (!isOwnProfile && "INVITE_ONLY".equalsIgnoreCase(workspace.getJoinType())) {
	                    hiddenInviteOnlyGroups = true;
	                    continue;
	                }

	                // OPEN/APPROVAL 그룹은 기존 그룹 공개 정책에 따라 프로필에 표시한다.
	                // 실제 참여 가능 여부는 그룹 미리보기와 membership API에서 다시 판정한다.
	                visibleWorkspaces.add(workspace);
	            }
	        }
	    }
	    model.addAttribute("wsList", visibleWorkspaces);
	    model.addAttribute("hiddenInviteOnlyGroups", hiddenInviteOnlyGroups);

	    if (!isOwnProfile && loginUser != null && loginUser.getUserId() != null && profileUser.getUserId() != null) {
	        model.addAttribute("friendRelation", profileRelation);
	        model.addAttribute("friendRelationStatus", profileRelation == null ? "NONE" : profileRelation.getStatus());
	        model.addAttribute("friendRelationDirection", profileRelation == null ? "NONE" : profileRelation.getDirection());
	        model.addAttribute("friendRelationId", profileRelation == null ? null : profileRelation.getFriendId());
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
	    if (!isProfileAvailable(profileUser, sessionUser.getUserId())) {
	        result.put("success", false);
	        result.put("message", "프로필을 찾을 수 없습니다.");
	        return result;
	    }

	    boolean isOwnProfile = sessionUser.getUserId() != null && sessionUser.getUserId().equals(userId);
	    boolean friendsPublic = !"N".equalsIgnoreCase(
	            profileUser.getProfileFriendsPublicYn() == null ? "Y" : profileUser.getProfileFriendsPublicYn());

	    if (!isOwnProfile && !friendsPublic) {
	        result.put("success", false);
	        result.put("message", "친구 목록을 비공개로 설정한 사용자입니다.");
	        return result;
	    }

	    List<friendDTO> friends = friendService.getFriends(userId, null);
	    decorateFriendRelations(sessionUser.getUserId(), friends);

	    // Hide account emails when viewing another user's friend list.
	    // The profile itself does not expose email to other users, so the friend list must not re-expose it.
	    if (!isOwnProfile && friends != null) {
	        for (friendDTO friend : friends) {
	            if (friend != null) friend.setEmail(null);
	        }
	    }

	    result.put("success", true);
	    result.put("friends", friends);
	    return result;
	}

	private boolean isProfileAvailable(usersDto profileUser, Long viewerUserId) {
	    if (profileUser == null || profileUser.getUserId() == null) return false;
	    if (viewerUserId != null && viewerUserId.equals(profileUser.getUserId())) return true;

	    String status = profileUser.getStatus();
	    // 타인 프로필은 로그인 정책과 동일하게 ACTIVE 계정만 노출한다.
	    // 신규/알 수 없는 상태가 추가돼도 기본적으로 프로필이 공개되지 않도록 fail-closed 처리한다.
	    return status != null && "ACTIVE".equalsIgnoreCase(status.trim());
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
        try {
            updateDto.setUserName(UserProfileValidator.normalizeRequiredName(asString(payload.get("userName"))));
        } catch (IllegalArgumentException e) {
            map.put("status", "fail");
            map.put("message", e.getMessage());
            return map;
        }
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
        try {
            String normalizedBirthDate = UserProfileValidator.normalizeOptionalBirthDate(asString(payload.get("birthDate")));
            updateDto.setBirthDate(normalizedBirthDate == null ? "" : normalizedBirthDate);
        } catch (IllegalArgumentException e) {
            map.put("status", "fail");
            map.put("message", e.getMessage());
            return map;
        }
    }
    if (payload.containsKey("birthCalendarType")) {
        try {
            updateDto.setBirthCalendarType(UserProfileValidator.normalizeBirthCalendarType(asString(payload.get("birthCalendarType"))));
        } catch (IllegalArgumentException e) {
            map.put("status", "fail");
            map.put("message", e.getMessage());
            return map;
        }
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
    if (payload.containsKey("profileFriendsPublicYn")) {
        updateDto.setProfileFriendsPublicYn("N".equals(asString(payload.get("profileFriendsPublicYn"))) ? "N" : "Y");
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
	            moyoAuthenticationService.establishAuthentication(refreshedUser, session);
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
	public Map<String, Object> changePassword(
			@RequestBody Map<String, Object> payload,
			HttpServletRequest request,
			HttpSession session) {
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
			securityAuditLogger.success("PASSWORD_CHANGE", currentUser.getUserId(), request);
		} catch (IllegalArgumentException e) {
			securityAuditLogger.failure("PASSWORD_CHANGE", currentUser.getUserId(), request, "validation_failed");
			map.put("status", "fail");
			map.put("message", e.getMessage());
		}
		return map;
	}

	@PostMapping("/users/withdraw")
	@ResponseBody
	public Map<String, Object> withdraw(
			@RequestBody Map<String, Object> payload,
			HttpServletRequest request,
			HttpSession session) {
	    Map<String, Object> map = new HashMap<>();
	    usersDto currentUser = (usersDto) session.getAttribute("user");

	    if (currentUser == null) {
	        map.put("status", "fail");
	        map.put("message", "로그인이 필요합니다.");
	        return map;
	    }

	    try {
	        userService.requestWithdrawal(currentUser.getUserId(), asString(payload.get("currentPassword")));
	        securityAuditLogger.success("WITHDRAW_REQUEST", currentUser.getUserId(), request);
	        moyoAuthenticationService.clearAuthentication(session);
	        map.put("status", "success");
	        map.put("message", "회원 탈퇴 신청이 완료되었습니다. 30일 안에 다시 로그인하면 복구할 수 있습니다.");
	    } catch (IllegalArgumentException e) {
	        securityAuditLogger.failure("WITHDRAW_REQUEST", currentUser.getUserId(), request, "validation_failed");
	        map.put("status", "fail");
	        map.put("message", e.getMessage());
	    }
	    return map;
	}

	@PostMapping("/users/withdraw/cancel")
	@ResponseBody
	public Map<String, Object> cancelWithdrawal(HttpServletRequest request, HttpSession session) {
	    Map<String, Object> map = new HashMap<>();
	    usersDto currentUser = (usersDto) session.getAttribute("user");
	    Long pendingUserId = (Long) session.getAttribute("withdrawPendingUserId");
	    Long userId = currentUser != null ? currentUser.getUserId() : pendingUserId;

	    if (userId == null) {
	        map.put("status", "fail");
	        map.put("message", "탈퇴 대기 계정 확인이 필요합니다. 다시 로그인해주세요.");
	        return map;
	    }

	    try {
	        userService.cancelWithdrawal(userId);
	        usersDto refreshedUser = userService.findById(userId);
	        clearWithdrawPendingSession(session);
	        if (refreshedUser != null && "ACTIVE".equals(refreshedUser.getStatus())) {
	            moyoAuthenticationService.establishFreshAuthentication(refreshedUser, request);
	        }
	        securityAuditLogger.success("WITHDRAW_CANCEL", userId, request);
	        map.put("status", "success");
	        map.put("message", "탈퇴 신청이 취소되었습니다.");
	    } catch (IllegalArgumentException e) {
	        securityAuditLogger.failure("WITHDRAW_CANCEL", userId, request, "validation_failed");
	        clearWithdrawPendingSession(session);
	        map.put("status", "fail");
	        map.put("message", e.getMessage());
	    }
	    return map;
	}
	
	private void clearWithdrawPendingSession(HttpSession session) {
		if (session != null) {
			session.removeAttribute("withdrawPendingUserId");
			session.removeAttribute("withdrawPendingDeadline");
		}
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
