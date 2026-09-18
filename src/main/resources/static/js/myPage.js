(() => {
    const shell = document.querySelector('.profile-shell');
    const contextPath = shell?.dataset.contextPath || '';

    const openFriendProfileModal = async () => {
        const ownerId = shell?.dataset.profileOwnerId || '';
        if (!ownerId) return;
        if (!window.CommonFriendAdapter) {
            alert('친구 목록 모달을 불러오지 못했습니다.');
            return;
        }

        window.CommonFriendAdapter.open({
            title: '친구 목록',
            description: '',
            friends: [],
            loading: true,
            profileList: true,
            emptyText: '표시할 친구가 없습니다.',
            emptySubText: '친구가 생기면 이곳에 표시됩니다.',
            onProfile: friend => {
                const id = friend?.id || friend?.userId || '';
                if (id) location.href = `${contextPath}/users/profile?userId=${encodeURIComponent(id)}`;
            },
            onRelationAction: async (friend, action, button) => {
                await handleFriendModalAction(friend, action, button);
            }
        });

        try {
            const friends = await window.CommonFriendAdapter.fetchProfileFriends(contextPath, ownerId);
            window.CommonFriendAdapter.open({
                title: '친구 목록',
                description: '',
                friends,
                profileList: true,
                emptyText: '표시할 친구가 없습니다.',
                emptySubText: '친구가 생기면 이곳에 표시됩니다.',
                onProfile: friend => {
                    const id = friend?.id || friend?.userId || '';
                    if (id) location.href = `${contextPath}/users/profile?userId=${encodeURIComponent(id)}`;
                },
                onRelationAction: async (friend, action, button) => {
                    await handleFriendModalAction(friend, action, button);
                }
            });
        } catch (error) {
            console.error(error);
            window.CommonFriendAdapter.open({
                title: '친구 목록',
                description: '친구 목록을 불러오지 못했습니다.',
                friends: [],
                profileList: true,
                emptyText: '친구 목록을 불러오지 못했습니다.',
                emptySubText: '잠시 후 다시 시도해주세요.'
            });
        }
    };


    const handleFriendModalAction = async (friend, action, button) => {
        if (!friend || !action || !button) return;
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = '처리 중';

        try {
            let result;
            if (action === 'request') {
                result = await window.CommonFriendAdapter.requestFriend(contextPath, friend.id || friend.userId || '');
                if (result.success) {
                    button.dataset.friendActionButton = 'sent';
                    button.className = 'common-people-modal-action is-muted';
                    button.textContent = '요청 보냄';
                    button.disabled = true;
                    return;
                }
            } else if (action === 'accept') {
                result = await window.CommonFriendAdapter.acceptFriend(contextPath, friend.friendId || friend.FRIEND_ID || '');
                if (result.success) {
                    await openFriendProfileModal();
                    return;
                }
            } else if (action === 'reject') {
                if (!confirm(`${friend.name || '선택한 사용자'}님의 친구 요청을 거절할까요?`)) {
                    button.disabled = false;
                    button.textContent = originalText;
                    return;
                }
                result = await window.CommonFriendAdapter.rejectFriend(contextPath, friend.friendId || friend.FRIEND_ID || '');
                if (result.success) {
                    await openFriendProfileModal();
                    return;
                }
            } else if (action === 'cancel') {
                if (!confirm(`${friend.name || '선택한 사용자'}님에게 보낸 친구 요청을 취소할까요?`)) {
                    button.disabled = false;
                    button.textContent = originalText;
                    return;
                }
                result = await window.CommonFriendAdapter.cancelFriend(contextPath, friend.friendId || friend.FRIEND_ID || '');
                if (result.success) {
                    await openFriendProfileModal();
                    return;
                }
            } else if (action === 'delete') {
                if (!confirm(`${friend.name || '선택한 친구'}님과 친구 관계를 해제할까요?`)) {
                    button.disabled = false;
                    button.textContent = originalText;
                    return;
                }
                result = await window.CommonFriendAdapter.deleteFriend(contextPath, friend.friendId || friend.FRIEND_ID || '');
                if (result.success) {
                    await openFriendProfileModal();
                    return;
                }
            }
            alert(result?.message || '요청을 처리하지 못했습니다.');
            button.disabled = false;
            button.textContent = originalText;
        } catch (error) {
            console.error(error);
            alert('요청을 처리하지 못했습니다.');
            button.disabled = false;
            button.textContent = originalText;
        }
    };

    document.querySelectorAll('[data-profile-friends]').forEach(button => {
        button.addEventListener('click', openFriendProfileModal);
    });

    document.querySelectorAll('[data-profile-friends-locked]').forEach(button => {
        button.addEventListener('click', () => {
            alert('친구 목록을 비공개로 설정한 사용자입니다.');
        });
    });

    const postForm = async (url, params) => {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body: new URLSearchParams(params).toString()
        });
        return response.json();
    };

    const relationToggle = document.querySelector('[data-relation-menu-toggle]');
    const relationMenu = document.querySelector('[data-relation-menu]');
    const relationWrap = relationToggle?.closest('.profile-relation-wrap');

    const closeRelationMenu = () => {
        if (!relationToggle || !relationMenu) return;
        relationMenu.hidden = true;
        relationToggle.setAttribute('aria-expanded', 'false');
        relationWrap?.classList.remove('is-open');
    };

    relationToggle?.addEventListener('click', event => {
        event.stopPropagation();
        if (!relationMenu) return;
        const willOpen = relationMenu.hidden;
        relationMenu.hidden = !willOpen;
        relationToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        relationWrap?.classList.toggle('is-open', willOpen);
    });

    document.addEventListener('click', event => {
        if (!relationMenu || relationMenu.hidden) return;
        if (event.target.closest('.profile-relation-wrap')) return;
        closeRelationMenu();
    });

    document.querySelectorAll('[data-friend-action]').forEach(button => {
        button.addEventListener('click', async () => {
            const action = button.dataset.friendAction;
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = '처리 중';

            try {
                let result;
                if (action === 'request') {
                    result = await postForm(`${contextPath}/friends/api/request`, { targetUserId: button.dataset.targetUserId || '' });
                    if (result.success) {
                        location.reload();
                        return;
                    }
                } else if (action === 'accept') {
                    result = await postForm(`${contextPath}/friends/api/accept`, { friendId: button.dataset.friendId || '' });
                    if (result.success) {
                        location.reload();
                        return;
                    }
                } else if (action === 'reject') {
                    if (!confirm('친구 요청을 거절할까요?')) {
                        button.disabled = false;
                        button.textContent = originalText;
                        return;
                    }
                    result = await postForm(`${contextPath}/friends/api/reject`, { friendId: button.dataset.friendId || '' });
                    if (result.success) {
                        location.reload();
                        return;
                    }
                } else if (action === 'cancel') {
                    if (!confirm('보낸 친구 요청을 취소할까요?')) {
                        button.disabled = false;
                        button.textContent = originalText;
                        return;
                    }
                    result = await postForm(`${contextPath}/friends/api/cancel`, { friendId: button.dataset.friendId || '' });
                    if (result.success) {
                        location.reload();
                        return;
                    }
                } else if (action === 'delete') {
                    if (!confirm('친구를 해제할까요?')) {
                        button.disabled = false;
                        button.textContent = originalText;
                        return;
                    }
                    result = await postForm(`${contextPath}/friends/api/delete`, { friendId: button.dataset.friendId || '' });
                    if (result.success) {
                        location.reload();
                        return;
                    }
                }

                alert(result?.message || '요청을 처리하지 못했습니다.');
                button.disabled = false;
                button.textContent = originalText;
            } catch (error) {
                console.error(error);
                alert('요청을 처리하지 못했습니다.');
                button.disabled = false;
                button.textContent = originalText;
            }
        });
    });

})();
