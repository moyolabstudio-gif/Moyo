(() => {
    const shell = document.querySelector('.profile-shell');
    const contextPath = shell?.dataset.contextPath || '';

    const openFriendProfileModal = async () => {
        const ownerId = shell?.dataset.profileOwnerId || '';
        if (!ownerId) return;
        if (!window.CommonFriendPickerModal) {
            alert('친구 목록 모달을 불러오지 못했습니다.');
            return;
        }

        window.CommonFriendPickerModal.open({
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
            const response = await fetch(`${contextPath}/users/profile/friends?userId=${encodeURIComponent(ownerId)}`, {
                credentials: 'same-origin'
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message || '친구 목록을 불러오지 못했습니다.');
            const friends = result.friends || [];
            window.CommonFriendPickerModal.open({
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
            window.CommonFriendPickerModal.open({
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
                result = await postForm(`${contextPath}/friends/api/request`, { targetUserId: friend.id || friend.userId || '' });
                if (result.success) {
                    button.dataset.friendActionButton = 'sent';
                    button.className = 'common-friend-picker-action is-muted';
                    button.textContent = '요청 보냄';
                    button.disabled = true;
                    return;
                }
            } else if (action === 'accept') {
                result = await postForm(`${contextPath}/friends/api/accept`, { friendId: friend.friendId || friend.FRIEND_ID || '' });
                if (result.success) {
                    button.dataset.friendActionButton = 'friend';
                    button.className = 'common-friend-picker-action is-friend';
                    button.textContent = '친구';
                    button.disabled = true;
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
                        button.classList.remove('is-primary');
                        button.classList.add('is-muted');
                        button.textContent = '요청 보냄';
                        return;
                    }
                } else if (action === 'accept') {
                    result = await postForm(`${contextPath}/friends/api/accept`, { friendId: button.dataset.friendId || '' });
                    if (result.success) {
                        button.classList.remove('is-primary');
                        button.classList.add('is-friend');
                        button.textContent = '친구';
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
