// DOM 元素
const categorySelect = document.getElementById('category');
const petSelect = document.getElementById('pet');
const petSection = document.getElementById('pet-section');
const petNameElement = document.getElementById('pet-name');
const petImage = document.getElementById('pet-image');
const skillsContainer = document.getElementById('skills-container');

const modal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-img');
const modalCaption = document.getElementById('modal-caption');
const closeModal = document.getElementById('close-modal');

// 全局变量
let petCategories = {};
let currentSkills = [];

// 获取基础路径 - 修复GitHub Pages路径问题
function getBasePath() {
    // 如果是GitHub Pages环境
    if (window.location.hostname.includes('github.io')) {
        const pathSegments = window.location.pathname.split('/').filter(segment => segment);
        // 如果有仓库名，返回仓库路径
        if (pathSegments.length > 0) {
            return '/' + pathSegments[0] + '/';
        }
    }
    // 本地开发环境使用相对路径
    return './';
}

const basePath = getBasePath();
console.log('📍 基础路径:', basePath);

// 显示错误信息
function showError(message) {
    skillsContainer.innerHTML = `<div class="error">❌ ${message}</div>`;
}

// 显示加载状态
function showLoading() {
    skillsContainer.innerHTML = '<div class="loading">🔄 加载中...</div>';
}

// 初始化
async function init() {
    console.log('🚀 开始初始化宠物技能图鉴...');
    console.log('📍 当前环境:', window.location.hostname);
    console.log('📁 基础路径:', basePath);

    try {
        console.log('📁 正在加载 data/file_index.json...');

        // 设置加载状态
        categorySelect.innerHTML = '<option value="">加载中...</option>';

        // 使用正确的基础路径
        const fileUrl = `${basePath}data/file_index.json`;
        console.log('📄 请求URL:', fileUrl);

        const response = await fetch(fileUrl);
        console.log('📊 响应状态:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }

        const text = await response.text();
        console.log('📄 获取到的文件内容长度:', text.length);

        if (!text.trim()) {
            throw new Error('文件为空');
        }

        // 解析JSON数据
        let parsedData;
        try {
            parsedData = JSON.parse(text);
        } catch (parseError) {
            console.error('JSON解析错误详情:', parseError);
            throw new Error(`JSON解析失败: ${parseError.message}`);
        }

        if (typeof parsedData !== 'object' || parsedData === null) {
            throw new Error('数据格式错误：应为对象');
        }

        petCategories = parsedData;
        console.log('✅ JSON解析成功，分类数量:', Object.keys(petCategories).length);

        // 填充分类下拉框
        populateCategories();

        console.log('🎉 初始化完成');

    } catch (error) {
        console.error("❌ 初始化失败：", error);

        let errorDetails = `
            <strong>加载宠物分类数据失败</strong><br><br>
            <strong>错误详情:</strong> ${error.message}<br><br>
            <strong>排查步骤:</strong><br>
            1. 检查 data/file_index.json 文件是否存在<br>
            2. 检查 JSON 格式是否正确<br>
            3. 确认通过正确的URL访问<br>
            4. 查看浏览器控制台获取更多信息<br>
            <strong>当前基础路径:</strong> ${basePath}
        `;

        showError(errorDetails);

        categorySelect.innerHTML = '<option value="">加载失败</option>';
    }
}

// 填充分类下拉框
function populateCategories() {
    console.log('📝 开始填充分类下拉框...');

    // 清空现有选项
    categorySelect.innerHTML = '';

    // 添加默认选项
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '请选择分类';
    categorySelect.appendChild(defaultOption);

    // 获取分类列表
    const categories = Object.keys(petCategories);
    console.log('📋 找到分类:', categories);

    if (categories.length === 0) {
        console.warn('⚠️ 没有找到任何分类');
        categorySelect.innerHTML = '<option value="">暂无分类</option>';
        return;
    }

    // 添加分类选项
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });

    console.log(`✅ 分类下拉框填充完成，共 ${categories.length} 个分类`);
}

// 分类选择事件
categorySelect.addEventListener('change', function () {
    const category = this.value;
    console.log('选中分类:', category);

    // 清空宠物选择框
    petSelect.innerHTML = '<option value="">请选择宠物</option>';

    if (category && petCategories[category]) {
        const pets = petCategories[category];
        console.log('该分类下的宠物:', pets);

        // 填充宠物选择框
        pets.forEach(pet => {
            const option = document.createElement('option');
            option.value = pet;
            option.textContent = pet;
            petSelect.appendChild(option);
        });
    }

    // 清空显示
    clearDisplay();
});

// 宠物选择事件
petSelect.addEventListener('change', function () {
    const pet = this.value;
    console.log('选中宠物:', pet);

    if (pet) {
        loadPet(pet);
    } else {
        clearDisplay();
    }
});

// 清空显示
function clearDisplay() {
    petSection.style.display = 'none';
    skillsContainer.innerHTML = `
        <div class="welcome-message">
        <p>👆 请先选择宠物分类和具体宠物</p>
        <p>🖱️ 点击技能图标可以放大查看</p>
        </div>
    `;
    currentSkills = [];
}

// 加载宠物数据
async function loadPet(petName) {
    console.log(`🔄 加载宠物: ${petName}`);

    showLoading();
    petNameElement.textContent = petName;

    // 重置图片状态
    petImage.style.display = 'block';
    removeAltText();

    // 生成缓存破坏参数
    const cacheBuster = `?v=${Date.now()}`;

    // 尝试多种可能的图片文件名格式 - 使用正确的基础路径
    const imageSources = [
        `${basePath}images/pets/${petName}.png${cacheBuster}`,
        `${basePath}images/pets/${petName}.jpg${cacheBuster}`,
        `${basePath}images/pets/${petName}.jpeg${cacheBuster}`,
        `${basePath}images/pets/${petName}_no_bg.png${cacheBuster}`
    ];

    console.log('尝试加载的图片路径:', imageSources);

    let currentIndex = 0;
    let imageLoaded = false;

    function tryNextImage() {
        if (currentIndex < imageSources.length) {
            const currentSrc = imageSources[currentIndex];
            console.log(`尝试加载图片 [${currentIndex + 1}/${imageSources.length}]: ${currentSrc}`);
            petImage.src = currentSrc;
            currentIndex++;
        } else {
            // 所有图片都尝试失败
            console.warn('所有图片格式尝试失败，显示替代文字');
            petImage.style.display = 'none';
            showAltText(petName);
        }
    }

    petImage.onerror = function () {
        console.warn(`图片加载失败: ${this.src}`);
        if (!imageLoaded) {
            tryNextImage();
        }
    };

    petImage.onload = function () {
        console.log(`✅ 宠物图片加载成功: ${this.src}`);
        this.style.display = 'block';
        imageLoaded = true;
        removeAltText();
        this.style.background = 'transparent';
    };

    // 开始尝试加载图片
    tryNextImage();
    petSection.style.display = 'block';

    // 加载技能数据
    try {
        // 生成缓存破坏参数
        const cacheBuster = `?v=${Date.now()}`;

        const filenameVariants = [
            `${basePath}data/${petName}技能体系.txt${cacheBuster}`,
            `${basePath}data/${petName} 技能体系.txt${cacheBuster}`,
            `${basePath}data/${petName}_技能体系.txt${cacheBuster}`
        ];

        console.log('尝试加载的技能文件:', filenameVariants);

        let skillData = null;

        for (const filename of filenameVariants) {
            console.log(`尝试加载技能文件: ${filename}`);
            const response = await fetch(filename);
            console.log(`技能文件响应状态: ${response.status}`);

            if (response.ok) {
                skillData = await response.text();
                console.log(`✅ 技能文件加载成功: ${filename}`);
                break;
            }
        }

        if (skillData) {
            renderSkills(skillData, petName);
        } else {
            throw new Error('未找到技能文件');
        }
    } catch (error) {
        console.error(`加载 ${petName} 技能数据失败：`, error);
        showError(`加载 ${petName} 的技能数据失败<br>请检查技能文件是否存在`);
    }
}

// 显示替代文字
function showAltText(petName) {
    const altText = document.createElement('div');
    altText.className = 'pet-image-alt';
    altText.innerHTML = `🦊 ${petName}<br><small>图片加载失败</small>`;

    altText.onclick = function () {
        showImageModal(`${basePath}images/pets/${petName}.png`, `${petName} (图片未找到)`);
    };

    petSection.appendChild(altText);
}

// 移除替代文字
function removeAltText() {
    const altText = petSection.querySelector('.pet-image-alt');
    if (altText) {
        altText.remove();
    }
}

// 渲染技能卡片
function renderSkills(text, petName) {
    console.log(`🎨 渲染技能数据，字符数: ${text.length}`);

    skillsContainer.innerHTML = '';
    currentSkills = [];

    const skillBlocks = text.split(/\n\n+/).filter(block => block.trim().length > 0);
    console.log(`找到技能块: ${skillBlocks.length}`);

    let validSkills = 0;

    skillBlocks.forEach((block, index) => {
        const lines = block.trim().split('\n');
        let skillName = lines[0].trim();

        // 跳过标题行
        if (skillName.includes('技能体系') || skillName === petName) {
            return;
        }

        const desc = lines.slice(1).join('\n').trim();

        if (!skillName || !desc) {
            console.warn(`跳过无效技能块 ${index}:`, block);
            return;
        }

        validSkills++;
        createSkillCard(skillName, desc, petName);
    });

    console.log(`成功创建 ${validSkills} 个技能卡片`);

    if (validSkills === 0) {
        skillsContainer.innerHTML = '<div class="no-skills">暂无技能数据</div>';
        return;
    }

    setupImageModal();
}

// 创建技能卡片
function createSkillCard(skillName, desc, petName) {
    const card = document.createElement('div');
    card.className = 'skill-card';

    // 清理技能名称用于文件名
    const cleanSkillName = skillName.replace(/[：:·・\s]/g, '').trim();

    // 使用正确的基础路径
    const skillImagePath = `${basePath}images/skills/${petName}/${cleanSkillName}.png`;

    console.log(`创建技能卡片: ${skillName}, 图片路径: ${skillImagePath}`);

    card.innerHTML = `
        <div class="skill-left">
        <div class="skill-header">
            <img src="${skillImagePath}"
                 class="skill-icon"
                 data-img="${skillImagePath}"
                 data-name="${skillName}"
                 alt="${skillName}图标">
            <div class="skill-name">${skillName}</div>
        </div>
        </div>
        <div class="skill-right">
        <div class="skill-desc">${desc}</div>
        </div>
    `;

    skillsContainer.appendChild(card);

    currentSkills.push({
        name: skillName,
        desc: desc,
        element: card
    });

    // 设置图片加载失败处理
    const skillIcon = card.querySelector('.skill-icon');
    skillIcon.onerror = function () {
        console.warn(`技能图标加载失败: ${skillImagePath}`);
        this.style.display = 'none';
    };
}

// 设置图片模态框
function setupImageModal() {
    // 为宠物图片添加点击事件
    petImage.onclick = function () {
        showImageModal(this.src, petNameElement.textContent);
    };

    // 为技能图标添加点击事件
    document.querySelectorAll('.skill-icon').forEach(img => {
        img.addEventListener('click', function (e) {
            const imgSrc = this.getAttribute('data-img');
            const skillName = this.getAttribute('data-name');
            showImageModal(imgSrc, skillName);
        });
    });
}

// 显示图片模态框
function showImageModal(imgSrc, caption) {
    modal.style.display = "block";
    modalImg.src = imgSrc;
    modalCaption.textContent = caption || '图片';

    modalImg.onerror = function () {
        console.warn(`模态框图片加载失败: ${imgSrc}`);
        this.style.display = 'none';
        modalCaption.textContent += ' (图片加载失败)';
    };

    modalImg.onload = function () {
        console.log(`模态框图片加载成功: ${imgSrc}`);
        this.style.display = 'block';
        this.style.background = 'transparent';
    };
}

// 模态框关闭功能
closeModal.onclick = function () {
    modal.style.display = "none";
    modalImg.src = '';
    modalCaption.textContent = '';
};

modal.onclick = function (e) {
    if (e.target === modal) {
        modal.style.display = "none";
        modalImg.src = '';
        modalCaption.textContent = '';
    }
};

// ESC键关闭模态框
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.style.display === 'block') {
        modal.style.display = "none";
        modalImg.src = '';
        modalCaption.textContent = '';
    }
});

// 初始化应用
document.addEventListener('DOMContentLoaded', function () {
    init();
});
