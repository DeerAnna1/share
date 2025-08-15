// 全局变量
let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || [];
let posts = JSON.parse(localStorage.getItem('posts')) || [];
let circles = JSON.parse(localStorage.getItem('circles')) || [];
let currentCircle = 'all';
let selectedMedia = [];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否有用户已登录
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
        currentUser = JSON.parse(loggedInUser);
        showMainPage();
        loadUserData();
        const bottomNav = document.getElementById('bottomNav');
        if (bottomNav) bottomNav.style.display = 'flex';
    }
    
    // 初始化事件监听器
    initializeEventListeners();
});

// 初始化事件监听器
function initializeEventListeners() {
    // 媒体文件上传监听
    const mediaInput = document.getElementById('mediaInput');
    if (mediaInput) {
        mediaInput.addEventListener('change', handleMediaUpload);
    }
}

// 显示登录页面
function showLogin() {
    hideAllPages();
    document.getElementById('loginPage').classList.add('active');
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) bottomNav.style.display = 'none';
}

// 显示注册页面
function showRegister() {
    hideAllPages();
    document.getElementById('registerPage').classList.add('active');
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) bottomNav.style.display = 'none';
}

// 显示主页面
function showMainPage() {
    hideAllPages();
    document.getElementById('mainPage').classList.add('active');
    loadUserData();
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) bottomNav.style.display = 'flex';
}

// 显示朋友页面
function showFriendsPage() {
    hideAllPages();
    document.getElementById('friendsPage').classList.add('active');
    loadFriendsList();
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) bottomNav.style.display = 'flex';
}

// 显示个人资料页面
function showProfilePage() {
    hideAllPages();
    document.getElementById('profilePage').classList.add('active');
    loadProfileData();
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) bottomNav.style.display = 'flex';
}

// 隐藏所有页面
function hideAllPages() {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
}

// 用户注册
function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!username || !password || !confirmPassword) {
        alert('请填写所有字段');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }
    
    // 检查用户名是否已存在
    if (users.find(user => user.username === username)) {
        alert('用户名已存在，请选择其他用户名');
        return;
    }
    
    // 创建新用户
    const newUser = {
        id: Date.now().toString(),
        username: username,
        password: password,
        registerTime: new Date().toLocaleString(),
        friends: [],
        circles: []
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('注册成功！请登录');
    showLogin();
}

// 用户登录
function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        alert('请填写用户名和密码');
        return;
    }
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMainPage();
        loadUserData();
    } else {
        alert('用户名或密码错误');
    }
}

// 加载用户数据
function loadUserData() {
    if (!currentUser) return;
    
    // 更新圈子标签
    updateCirclesTabs();
    
    // 加载朋友圈内容
    loadPosts();
    
    // 更新圈子选择器
    updateCircleSelectors();
}

// 更新圈子标签
function updateCirclesTabs() {
    const tabsContainer = document.querySelector('.circles-tabs');
    const allTab = tabsContainer.querySelector('.tab');
    
    // 清除现有标签（保留"全部"标签）
    const existingTabs = tabsContainer.querySelectorAll('.tab:not(:first-child)');
    existingTabs.forEach(tab => tab.remove());
    
    // 添加用户参与的圈子标签
    const userCircles = circles.filter(circle => 
        circle.members.includes(currentUser.id)
    );
    
    userCircles.forEach(circle => {
        const tab = document.createElement('div');
        tab.className = 'tab';
        
        // 只有圈子的创建者才能删除圈子
        const canDelete = circle.creatorId === currentUser.id;
        
        tab.innerHTML = `
            <span onclick="switchCircle('${circle.id}')">${circle.name}</span>
            ${canDelete ? `<button class="delete-circle-btn" onclick="deleteCircle('${circle.id}')" title="删除圈子">
                <i class="fas fa-times"></i>
            </button>` : ''}
        `;
        tabsContainer.appendChild(tab);
    });
}

// 切换圈子
function switchCircle(circleId) {
    currentCircle = circleId;
    
    // 更新标签状态
    const tabs = document.querySelectorAll('.circles-tabs .tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    if (circleId === 'all') {
        tabs[0].classList.add('active');
        document.getElementById('currentCircle').textContent = '我的朋友圈';
    } else {
        const circle = circles.find(c => c.id === circleId);
        if (circle) {
            const tab = Array.from(tabs).find(t => t.textContent === circle.name);
            if (tab) tab.classList.add('active');
            document.getElementById('currentCircle').textContent = circle.name;
        }
    }
    
    // 重新加载内容
    loadPosts();
}

// 加载朋友圈内容
function loadPosts() {
    const container = document.getElementById('postsContainer');
    container.innerHTML = '';
    
    let filteredPosts = posts;
    
    // 根据当前圈子筛选内容
    if (currentCircle !== 'all') {
        filteredPosts = posts.filter(post => 
            post.circleId === currentCircle && 
            circles.find(c => c.id === currentCircle)?.members.includes(post.userId)
        );
    } else {
        // 显示用户参与的所有圈子的内容
        const userCircles = circles.filter(circle => 
            circle.members.includes(currentUser.id)
        );
        const userCircleIds = userCircles.map(c => c.id);
        filteredPosts = posts.filter(post => 
            userCircleIds.includes(post.circleId) && 
            circles.find(c => c.id === post.circleId)?.members.includes(post.userId)
        );
    }
    
    // 按时间排序
    filteredPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // 渲染内容
    filteredPosts.forEach(post => {
        const postElement = createPostElement(post);
        container.appendChild(postElement);
    });
    
    if (filteredPosts.length === 0) {
        container.innerHTML = '<div class="empty-state">还没有内容，快来发布第一条朋友圈吧！</div>';
    }
}

// 创建朋友圈元素
function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post';
    
    const user = users.find(u => u.id === post.userId);
    const circle = circles.find(c => c.id === post.circleId);
    
    postDiv.innerHTML = `
        <div class="post-header">
            <div class="post-avatar">${user ? user.username.charAt(0).toUpperCase() : 'U'}</div>
            <div class="post-info">
                <h4>${user ? user.username : '未知用户'}</h4>
                <small>${new Date(post.timestamp).toLocaleString()} · ${circle ? circle.name : '未知圈子'}</small>
            </div>
        </div>
        <div class="post-content">${post.content}</div>
        ${post.media && post.media.length > 0 ? `
            <div class="post-media">
                ${post.media.map(item => {
                    if (item.type.startsWith('image/')) {
                        return `<img src="${item.url}" alt="图片" onclick="previewMedia('${item.url}')">`;
                    } else if (item.type.startsWith('video/')) {
                        return `<video controls><source src="${item.url}" type="${item.type}"></video>`;
                    }
                    return '';
                }).join('')}
            </div>
        ` : ''}
        <div class="post-actions">
            <button class="action-btn ${post.likes && post.likes.includes(currentUser.id) ? 'liked' : ''}" 
                    onclick="toggleLike('${post.id}')">
                <i class="fas fa-heart"></i>
                <span>${post.likes ? post.likes.length : 0}</span>
            </button>
            <button class="action-btn" onclick="showComments('${post.id}')">
                <i class="fas fa-comment"></i>
                <span>${post.comments ? post.comments.length : 0}</span>
            </button>
        </div>
        ${post.comments && post.comments.length > 0 ? `
            <div class="comments-section">
                ${post.comments.map(comment => {
                    const commentUser = users.find(u => u.id === comment.userId);
                    return `
                        <div class="comment">
                            <strong>${commentUser ? commentUser.username : '未知用户'}</strong>: ${comment.content}
                        </div>
                    `;
                }).join('')}
            </div>
        ` : ''}
    `;
    
    return postDiv;
}

// 切换点赞状态
function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    if (!post.likes) post.likes = [];
    
    const userIndex = post.likes.indexOf(currentUser.id);
    if (userIndex > -1) {
        post.likes.splice(userIndex, 1);
    } else {
        post.likes.push(currentUser.id);
    }
    
    localStorage.setItem('posts', JSON.stringify(posts));
    loadPosts(); // 重新加载以更新显示
}

// 显示评论
function showComments(postId) {
    const comment = prompt('请输入你的评论：');
    if (comment && comment.trim()) {
        const post = posts.find(p => p.id === postId);
        if (post) {
            if (!post.comments) post.comments = [];
            
            post.comments.push({
                id: Date.now().toString(),
                userId: currentUser.id,
                content: comment.trim(),
                timestamp: new Date().toISOString()
            });
            
            localStorage.setItem('posts', JSON.stringify(posts));
            loadPosts(); // 重新加载以更新显示
        }
    }
}

// 显示添加选项
function showAddOptions() {
    document.getElementById('addOptionsModal').style.display = 'block';
}

// 显示发布朋友圈模态框
function showPostModal() {
    closeModal('addOptionsModal');
    document.getElementById('postModal').style.display = 'block';
    selectedMedia = [];
    document.getElementById('mediaPreview').innerHTML = '';
    document.getElementById('postContent').value = '';
}

// 显示创建圈子模态框
function showCircleModal() {
    closeModal('addOptionsModal');
    document.getElementById('circleModal').style.display = 'block';
    loadFriendsForCircle();
}

// 关闭模态框
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// 处理媒体文件上传
function handleMediaUpload(event) {
    const files = event.target.files;
    selectedMedia = [];
    
    Array.from(files).forEach(file => {
        // 检查文件大小限制（5MB）
        if (file.size > 5 * 1024 * 1024) {
            alert(`文件 ${file.name} 过大，请选择小于5MB的文件`);
            return;
        }
        
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                // 压缩图片文件
                if (file.type.startsWith('image/')) {
                    compressImage(e.target.result, file.type, (compressedUrl) => {
                        selectedMedia.push({
                            file: file,
                            type: file.type,
                            url: compressedUrl
                        });
                        updateMediaPreview();
                    });
                } else {
                    // 视频文件直接添加
                    selectedMedia.push({
                        file: file,
                        type: file.type,
                        url: e.target.result
                    });
                    updateMediaPreview();
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

// 压缩图片
function compressImage(dataUrl, type, callback) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 计算压缩后的尺寸
        let { width, height } = img;
        const maxSize = 800; // 最大尺寸800px
        
        if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
        } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为压缩后的dataURL
        const compressedUrl = canvas.toDataURL(type, 0.7); // 质量0.7
        callback(compressedUrl);
    };
    img.src = dataUrl;
}

// 更新媒体预览
function updateMediaPreview() {
    const preview = document.getElementById('mediaPreview');
    preview.innerHTML = '';
    
    selectedMedia.forEach((media, index) => {
        const mediaElement = document.createElement('div');
        mediaElement.className = 'media-item';
        
        if (media.type.startsWith('image/')) {
            mediaElement.innerHTML = `
                <img src="${media.url}" alt="图片">
                <button onclick="removeMedia(${index})" class="remove-media">&times;</button>
            `;
        } else if (media.type.startsWith('video/')) {
            mediaElement.innerHTML = `
                <video src="${media.url}" controls></video>
                <button onclick="removeMedia(${index})" class="remove-media">&times;</button>
            `;
        }
        
        preview.appendChild(mediaElement);
    });
}

// 移除媒体文件
function removeMedia(index) {
    selectedMedia.splice(index, 1);
    updateMediaPreview();
}

// 发布朋友圈
function publishPost() {
    const content = document.getElementById('postContent').value.trim();
    const circleId = document.getElementById('postCircle').value;
    
    if (!content && selectedMedia.length === 0) {
        alert('请输入内容或上传媒体文件');
        return;
    }
    
    if (!circleId) {
        alert('请选择圈子');
        return;
    }
    
    try {
        const newPost = {
            id: Date.now().toString(),
            userId: currentUser.id,
            content: content,
            media: selectedMedia.map(media => ({
                type: media.type,
                url: media.url
            })),
            circleId: circleId,
            timestamp: new Date().toISOString(),
            likes: [],
            comments: []
        };
        
        posts.push(newPost);
        localStorage.setItem('posts', JSON.stringify(posts));
        
        closeModal('postModal');
        loadPosts();
        
        alert('发布成功！');
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            alert('存储空间不足，请清理一些旧的朋友圈内容或减少媒体文件大小');
            // 尝试清理一些旧数据
            cleanupOldPosts();
        } else {
            alert('发布失败：' + error.message);
        }
    }
}

// 清理旧的朋友圈内容以释放存储空间
function cleanupOldPosts() {
    if (posts.length > 20) { // 如果超过20条，删除最旧的10条
        posts.splice(0, 10);
        try {
            localStorage.setItem('posts', JSON.stringify(posts));
            alert('已清理旧内容，请重新尝试发布');
        } catch (e) {
            alert('清理失败，请手动删除一些朋友圈内容');
        }
    }
}

// 创建新圈子
function createCircle() {
    const circleName = document.getElementById('circleName').value.trim();
    const selectedFriends = Array.from(document.querySelectorAll('#friendsList input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    
    if (!circleName) {
        alert('请输入圈子名称');
        return;
    }
    
    if (selectedFriends.length === 0) {
        alert('请至少选择一个朋友');
        return;
    }
    
    const newCircle = {
        id: Date.now().toString(),
        name: circleName,
        creatorId: currentUser.id,
        members: [currentUser.id, ...selectedFriends],
        createTime: new Date().toISOString()
    };
    
    circles.push(newCircle);
    localStorage.setItem('circles', JSON.stringify(circles));
    
    // 更新用户的圈子列表
    currentUser.circles.push(newCircle.id);
    selectedFriends.forEach(friendId => {
        const friend = users.find(u => u.id === friendId);
        if (friend) {
            if (!friend.circles) friend.circles = [];
            friend.circles.push(newCircle.id);
        }
    });
    
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    closeModal('circleModal');
    loadUserData();
    
    alert('圈子创建成功！');
}

// 加载朋友列表（用于创建圈子）
function loadFriendsForCircle() {
    const friendsList = document.getElementById('friendsList');
    friendsList.innerHTML = '';
    
    if (!currentUser.friends || currentUser.friends.length === 0) {
        friendsList.innerHTML = '<p>你还没有朋友，无法创建圈子</p>';
        return;
    }
    
    currentUser.friends.forEach(friendId => {
        const friend = users.find(u => u.id === friendId);
        if (friend) {
            const friendItem = document.createElement('div');
            friendItem.className = 'friend-item';
            friendItem.innerHTML = `
                <input type="checkbox" value="${friend.id}">
                <span>${friend.username}</span>
            `;
            friendsList.appendChild(friendItem);
        }
    });
}

// 更新圈子选择器
function updateCircleSelectors() {
    const selectors = document.querySelectorAll('#postCircle');
    
    selectors.forEach(selector => {
        selector.innerHTML = '';
        
        const userCircles = circles.filter(circle => 
            circle.members.includes(currentUser.id)
        );
        
        userCircles.forEach(circle => {
            const option = document.createElement('option');
            option.value = circle.id;
            option.textContent = circle.name;
            selector.appendChild(option);
        });
    });
}

// 加载朋友列表页面
function loadFriendsList() {
    const container = document.getElementById('friendsListContainer');
    const addableContainer = document.getElementById('addFriendsListContainer');
    container.innerHTML = '';
    if (addableContainer) addableContainer.innerHTML = '';
    
    if (!currentUser.friends || currentUser.friends.length === 0) {
        container.innerHTML = '<div class="empty-state">你还没有朋友</div>';
    }
    
    if (currentUser.friends && currentUser.friends.length > 0) {
        currentUser.friends.forEach(friendId => {
            const friend = users.find(u => u.id === friendId);
            if (friend) {
                const friendCard = document.createElement('div');
                friendCard.className = 'friend-card';
                friendCard.innerHTML = `
                    <div class="friend-avatar">${friend.username.charAt(0).toUpperCase()}</div>
                    <div class="friend-info">
                        <h4>${friend.username}</h4>
                        <p>注册时间：${friend.registerTime}</p>
                    </div>
                    <button class="remove-friend-btn" onclick="removeFriend('${friend.id}')" title="删除好友">
                        <i class="fas fa-user-times"></i>
                    </button>
                `;
                container.appendChild(friendCard);
            }
        });
    }

    // 可添加的朋友列表：所有已注册用户中，排除自己和已是朋友的
    if (addableContainer) {
        const addableUsers = users.filter(u => u.id !== currentUser.id && !(currentUser.friends || []).includes(u.id));
        if (addableUsers.length === 0) {
            addableContainer.innerHTML = '<div class="empty-state">暂无可添加的用户</div>';
        } else {
            addableUsers.forEach(u => {
                const userCard = document.createElement('div');
                userCard.className = 'friend-card';
                userCard.innerHTML = `
                    <div class="friend-avatar">${u.username.charAt(0).toUpperCase()}</div>
                    <div class="friend-info">
                        <h4>${u.username}</h4>
                        <p>注册时间：${u.registerTime}</p>
                    </div>
                    <button class="add-friend-btn" onclick="addFriend('${u.id}')">添加</button>
                `;
                addableContainer.appendChild(userCard);
            });
        }
    }
}

// 添加朋友（无需对方同意，自动双向添加）
function addFriend(friendId) {
    if (!currentUser.friends) currentUser.friends = [];
    if (!currentUser.friends.includes(friendId)) {
        // 将朋友添加到当前用户的好友列表
        currentUser.friends.push(friendId);
        
        // 将当前用户添加到朋友的好友列表（双向好友）
        const friend = users.find(u => u.id === friendId);
        if (friend) {
            if (!friend.friends) friend.friends = [];
            if (!friend.friends.includes(currentUser.id)) {
                friend.friends.push(currentUser.id);
            }
        }
        
        // 持久化保存两个用户
        const currentUserIdx = users.findIndex(u => u.id === currentUser.id);
        if (currentUserIdx !== -1) {
            users[currentUserIdx] = currentUser;
        }
        
        const friendIdx = users.findIndex(u => u.id === friendId);
        if (friendIdx !== -1) {
            users[friendIdx] = friend;
        }
        
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        loadFriendsList();
        alert(`已成功添加 ${friend.username} 为朋友！你们现在是双向好友关系。`);
    }
}

// 删除朋友（双向删除，检查相关圈子）
function removeFriend(friendId) {
    const friend = users.find(u => u.id === friendId);
    if (!friend) return;
    
    // 检查是否有与这个朋友相关的圈子
    const relatedCircles = circles.filter(circle => 
        circle.members.includes(friendId) && circle.members.includes(currentUser.id)
    );
    
    let confirmMessage = `确定要删除好友 ${friend.username} 吗？`;
    let shouldDeleteCircles = false;
    
    if (relatedCircles.length > 0) {
        const circleNames = relatedCircles.map(c => c.name).join('、');
        confirmMessage = `删除好友 ${friend.username} 将会影响你们共同参与的圈子：${circleNames}\n\n是否要同时删除这些圈子？`;
        
        if (confirm(confirmMessage)) {
            shouldDeleteCircles = true;
        } else {
            // 用户选择不删除圈子，只删除好友关系
            confirmMessage = `确定要删除好友 ${friend.username} 吗？\n注意：你们共同参与的圈子将保留，但 ${friend.username} 将无法访问这些圈子的内容。`;
            if (!confirm(confirmMessage)) {
                return;
            }
        }
    } else {
        if (!confirm(confirmMessage)) {
            return;
        }
    }
    
    // 执行删除操作
    if (shouldDeleteCircles) {
        // 删除相关圈子及其内容
        relatedCircles.forEach(circle => {
            // 删除圈子相关的所有朋友圈内容
            const postsToRemove = posts.filter(post => post.circleId === circle.id);
            postsToRemove.forEach(post => {
                const postIndex = posts.indexOf(post);
                if (postIndex > -1) {
                    posts.splice(postIndex, 1);
                }
            });
            
            // 从所有用户的圈子列表中移除该圈子
            users.forEach(user => {
                if (user.circles && user.circles.includes(circle.id)) {
                    const circleIndex = user.circles.indexOf(circle.id);
                    if (circleIndex > -1) {
                        user.circles.splice(circleIndex, 1);
                    }
                }
            });
            
            // 删除圈子本身
            const circleIndex = circles.indexOf(circle);
            if (circleIndex > -1) {
                circles.splice(circleIndex, 1);
            }
        });
        
        // 持久化保存圈子相关数据
        localStorage.setItem('posts', JSON.stringify(posts));
        localStorage.setItem('circles', JSON.stringify(circles));
    }
    
    // 删除好友关系
    // 从当前用户的好友列表中删除
    const currentUserFriendIndex = currentUser.friends.indexOf(friendId);
    if (currentUserFriendIndex > -1) {
        currentUser.friends.splice(currentUserFriendIndex, 1);
    }
    
    // 从朋友的好友列表中删除当前用户
    const friendUserIndex = friend.friends.indexOf(currentUser.id);
    if (friendUserIndex > -1) {
        friend.friends.splice(friendUserIndex, 1);
    }
    
    // 持久化保存用户数据
    const currentUserIdx = users.findIndex(u => u.id === currentUser.id);
    if (currentUserIdx !== -1) {
        users[currentUserIdx] = currentUser;
    }
    
    const friendIdx = users.findIndex(u => u.id === friendId);
    if (friendIdx !== -1) {
        users[friendIdx] = friend;
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // 重新加载数据
    loadFriendsList();
    loadUserData(); // 重新加载用户数据以更新圈子标签
    
    if (shouldDeleteCircles) {
        alert(`已删除好友 ${friend.username} 及相关圈子`);
    } else {
        alert(`已删除好友 ${friend.username}`);
    }
}

// 删除圈子
function deleteCircle(circleId) {
    const circle = circles.find(c => c.id === circleId);
    if (!circle) return;
    
    if (confirm(`确定要删除圈子"${circle.name}"吗？删除后圈子内的所有内容将无法访问。`)) {
        // 删除圈子相关的所有朋友圈内容
        const postsToRemove = posts.filter(post => post.circleId === circleId);
        postsToRemove.forEach(post => {
            const postIndex = posts.indexOf(post);
            if (postIndex > -1) {
                posts.splice(postIndex, 1);
            }
        });
        
        // 从所有用户的圈子列表中移除该圈子
        users.forEach(user => {
            if (user.circles && user.circles.includes(circleId)) {
                const circleIndex = user.circles.indexOf(circleId);
                if (circleIndex > -1) {
                    user.circles.splice(circleIndex, 1);
                }
            }
        });
        
        // 删除圈子本身
        const circleIndex = circles.indexOf(circle);
        if (circleIndex > -1) {
            circles.splice(circleIndex, 1);
        }
        
        // 如果当前选中的是被删除的圈子，切换到"全部"
        if (currentCircle === circleId) {
            currentCircle = 'all';
        }
        
        // 持久化保存数据
        localStorage.setItem('posts', JSON.stringify(posts));
        localStorage.setItem('circles', JSON.stringify(circles));
        localStorage.setItem('users', JSON.stringify(users));
        
        // 更新当前用户数据
        const currentUserIdx = users.findIndex(u => u.id === currentUser.id);
        if (currentUserIdx !== -1) {
            currentUser = users[currentUserIdx];
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        // 重新加载数据
        loadUserData();
        alert(`圈子"${circle.name}"已删除`);
    }
}

// 加载个人资料
function loadProfileData() {
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileRegisterTime').textContent = currentUser.registerTime;
    
    const userCircles = circles.filter(circle => 
        circle.members.includes(currentUser.id)
    );
    document.getElementById('profileCircles').textContent = userCircles.length;
    
    // 显示用户的朋友圈数量
    const userPosts = posts.filter(post => post.userId === currentUser.id);
    document.getElementById('profilePosts').textContent = userPosts.length;
}

// 清理存储空间
function cleanupStorage() {
    if (confirm('确定要清理存储空间吗？这将删除一些旧的朋友圈内容。')) {
        try {
            // 删除超过30天的旧内容
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const oldPosts = posts.filter(post => new Date(post.timestamp) < thirtyDaysAgo);
            if (oldPosts.length > 0) {
                posts = posts.filter(post => new Date(post.timestamp) >= thirtyDaysAgo);
                localStorage.setItem('posts', JSON.stringify(posts));
                alert(`已清理 ${oldPosts.length} 条旧内容`);
                loadProfileData(); // 刷新显示
            } else {
                alert('没有需要清理的旧内容');
            }
        } catch (error) {
            alert('清理失败：' + error.message);
        }
    }
}

// 切换底部标签
function switchTab(tab) {
    // 更新底部导航状态
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    const targetNavItem = Array.from(navItems).find(item => {
        const span = item.querySelector('span');
        return span && (
            (tab === 'moments' && span.textContent === '朋友圈') ||
            (tab === 'friends' && span.textContent === '我的朋友') ||
            (tab === 'profile' && span.textContent === '我的')
        );
    });
    
    if (targetNavItem) {
        targetNavItem.classList.add('active');
    }
    
    // 显示对应页面
    switch (tab) {
        case 'moments':
            showMainPage();
            break;
        case 'friends':
            showFriendsPage();
            break;
        case 'profile':
            showProfilePage();
            break;
    }
}

// 退出登录
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showLogin();
}

// 预览媒体文件
function previewMedia(url) {
    // 这里可以实现媒体文件的全屏预览功能
    window.open(url, '_blank');
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 添加一些示例数据（首次使用时）
if (users.length === 0) {
    // 创建示例用户
    const demoUser1 = {
        id: '1',
        username: '小明',
        password: '123456',
        registerTime: new Date().toLocaleString(),
        friends: ['2'],
        circles: []
    };
    
    const demoUser2 = {
        id: '2',
        username: '小红',
        password: '123456',
        registerTime: new Date().toLocaleString(),
        friends: ['1'],
        circles: []
    };
    
    users = [demoUser1, demoUser2];
    localStorage.setItem('users', JSON.stringify(users));
    
    // 创建示例圈子
    const demoCircle = {
        id: '1',
        name: '同学圈',
        creatorId: '1',
        members: ['1', '2'],
        createTime: new Date().toISOString()
    };
    
    circles = [demoCircle];
    localStorage.setItem('circles', JSON.stringify(circles));
    
    // 创建示例朋友圈内容
    const demoPost = {
        id: '1',
        userId: '1',
        content: '今天天气真好，适合出去玩！',
        media: [],
        circleId: '1',
        timestamp: new Date().toISOString(),
        likes: [],
        comments: []
    };
    
    posts = [demoPost];
    localStorage.setItem('posts', JSON.stringify(posts));
}
