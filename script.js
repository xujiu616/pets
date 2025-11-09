// DOM 元素
const categorySelect = document.getElementById('category');
const petSelect = document.getElementById('pet');
const petSection = document.getElementById('pet-section');
const petNameElement = document.getElementById('pet-name');
const petImage = document.getElementById('pet-image');
const skillsContainer = document.getElementById('skills-container');
const loadingIndicator = document.getElementById('loading-indicator');

const modal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-img');
const modalCaption = document.getElementById('modal-caption');
const closeModal = document.getElementById('close-modal');

// 全局变量
let petCategories = {};
let currentSkills = [];
let imageCache = new Map(); // 图片缓存
let connectionSpeed = 'unknown'; // 网络连接速度

// 获取基础路径
function getBasePath() {
    if (window.location.hostname.includes('github.io')) {
        const pathSegments = window.location.pathname.split('/').filter(segment => segment);
        if (pathSegments.length > 0) {
            return '/' + pathSegments[0] + '/';
        }
    }
    return './';
}

const basePath = getBasePath();

// 检测网络连接速度
function detectConnectionSpeed() {
    return new Promise((resolve) => {
        const image = new Image();
        const startTime = Date.now();
        
        // 使用一个小图片来测试速度
        image.src = `${basePath}images/connection-test.png?t=${startTime}`;
        
        image.onload = function() {
            const endTime = Date.now();
            const duration = endTime - startTime;
            const speed = duration < 200 ? 'fast' : duration < 1000 ? 'medium' : 'slow';
            
            if (speed === 'slow') {
                document.body.classList.add('slow-connection');
            }
            
            connectionSpeed = speed;
            console.log(`📶 网络连接速度: ${speed} (${duration}ms)`);
            resolve(speed);
        };
        
        image.onerror = function() {
            console.log('📶 网络速度检测失败，使用默认设置');
            resolve('unknown');
        };
        
        // 超时设置
        setTimeout(() => {
            resolve('slow');
        }, 2000);
    });
}

// 显示错误信息
function showError(message) {
    skillsContainer.innerHTML = `<div class="error">❌ ${message}</div>`;
}

// 显示加载状态
function showLoading() {
    skillsContainer.innerHTML = '<div class="loading">🔄 加载中...</div>';
}

// 显示加载指示器
function showLoadingIndicator() {
    loadingIndicator.style.display = 'block';
}

// 隐藏加载指示器
function hideLoadingIndicator() {
    loadingIndicator.style.display = 'none';
}

// 图片预加载和缓存
function loadImageWithCache(url, alt) {
    return new Promise((resolve, reject) => {
        // 检查缓存
        if (imageCache.has(url)) {
            resolve(imageCache.get(url));
            return;
        }

        const img = new Image();
        
        img.onload = function() {
            // 添加到缓存
            imageCache.set(url, img);
            resolve(img);
        };
        
        img.onerror = function() {
            reject(new Error(`图片加载失败: ${url}`));
        };
        
        // 根据网络速度设置超时
        const timeout = connectionSpeed === 'slow' ? 10000 : 
                        connectionSpeed === 'medium' ? 5000 : 3000;
        
        const timeoutId = setTimeout(() => {
            reject(new Error(`图片加载超时: ${url}`));
        }, timeout);
        
        img.onload = function() {
            clearTimeout(timeoutId);
            imageCache.set(url, img);
            resolve(img);
        };
        
        img.src = url;
    });
}

// 初始化
async function init() {
    console.log('🚀 开始初始化宠物技能图鉴...');
    
    // 检测网络速度
    await detectConnectionSpeed();
    
    try {
        console.log('📁 正在加载 data/file_index.json...');
        showLoadingIndicator();

        const fileUrl = `${basePath}data/file_index.json`;
        console.log('📄 请求URL:', fileUrl);

        const response = await fetch(fileUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }

        const text = await response.text();
        
        if (!text.trim()) {
            throw new Error('文件为空');
        }

        // 解析JSON数据
        let parsedData;
        try {
            parsedData = JSON.parse(text);
        } catch (parseError) {
            throw new Error(`JSON解析失败: ${parseError.message}`);
        }

        if (typeof parsedData !== 'object' || parsedData === null) {
            throw new Error('数据格式错误：应为对象');
        }

        petCategories = parsedData;
        console.log('✅ JSON解析成功，分类数量:', Object.keys(petCategories).length);

        // 填充分类下拉框
        populateCategories();
        hideLoadingIndicator();

        console.log('🎉 初始化完成');

    } catch (error) {
        console.error("❌ 初始化失败：", error);
        hideLoadingIndicator();

        let errorDetails = `
            <strong>加载宠物分类数据失败</strong><br><br>
            <strong>错误详情:</strong> ${error.message}<br><br>
            <strong>当前基础路径:</strong> ${basePath}
        `;

        showError(errorDetails);
        categorySelect.innerHTML = '<option value="">加载失败</option>';
    }
}

// 填充分类下拉框
function populateCategories() {
    console.log('📝 开始填充分类下拉框...');

    categorySelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '请选择分类';
    categorySelect.appendChild(defaultOption);

    const categories = Object.keys(petCategories);
    console.log('📋 找到分类:', categories);

    if (categories.length === 0) {
        categorySelect.innerHTML = '<option value="">暂无分类</option>';
        return;
    }

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });

    console.log(`✅ 分类下拉框填充完成，共 ${categories.length} 个分类`);
}

// 分类选择事件
categorySelect.addEventListener('change', function() {
    const category = this.value;
    console.log('选中分类:', category);

    petSelect.innerHTML = '<option value="">请选择宠物</option>';

    if (category && petCategories[category]) {
        const pets = petCategories[category];
        console.log('该分类下的宠物:', pets);

        pets.forEach(pet => {
            const option = document.createElement('option');
            option.value = pet;
            option.textContent = pet;
            petSelect.appendChild(option);
        });
    }

    clearDisplay();
});

// 宠物选择事件
petSelect.addEventListener('change', function() {
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
    
    showLoadingIndicator();
    showLoading();
    petNameElement.textContent = petName;

    // 重置图片状态
    petImage.style.display = 'block';
    petImage.classList.remove('loaded');
    removeAltText();

    // 显示图片占位符
    const placeholder = document.querySelector('.image-placeholder');
    if (placeholder) placeholder.style.display = 'block';

    // 加载宠物图片
    await loadPetImage(petName);
    
    // 加载技能数据
    try {
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
            await renderSkills(skillData, petName);
        } else {
            throw new Error('未找到技能文件');
        }
    } catch (error) {
        console.error(`加载 ${petName} 技能数据失败：`, error);
        showError(`加载 ${petName} 的技能数据失败<br>请检查技能文件是否存在`);
    } finally {
        hideLoadingIndicator();
    }
}

// 加载宠物图片（优化版）
async function loadPetImage(petName) {
    const cacheBuster = `?v=${Date.now()}`;
    
    // 根据网络速度选择图片质量
    const qualitySuffix = connectionSpeed === 'slow' ? '_mobile' : '';
    
    const imageSources = [
        `${basePath}images/pets/${petName}${qualitySuffix}.png${cacheBuster}`,
        `${basePath}images/pets/${petName}.png${cacheBuster}`,
        `${basePath}images/pets/${petName}${qualitySuffix}.jpg${cacheBuster}`,
        `${basePath}images/pets/${petName}.jpg${cacheBuster}`,
        `${basePath}images/pets/${petName}.jpeg${cacheBuster}`,
        `${basePath}images/pets/${petName}_no_bg.png${cacheBuster}`
    ];

    console.log('尝试加载的图片路径:', imageSources);

    let imageLoaded = false;

    for (const src of imageSources) {
        try {
            console.log(`尝试加载图片: ${src}`);
            await loadImageWithCache(src, petName);
            
            // 设置图片源
            petImage.src = src;
            petImage.onload = function() {
                console.log(`✅ 宠物图片加载成功: ${this.src}`);
                this.classList.add('loaded');
                imageLoaded = true;
                removeAltText();
                // 隐藏占位符
                const placeholder = document.querySelector('.image-placeholder');
                if (placeholder) placeholder.style.display = 'none';
            };
            
            break; // 找到可用的图片后停止尝试
        } catch (error) {
            console.warn(`图片加载失败: ${src}`, error);
            continue; // 继续尝试下一个源
        }
    }

    if (!imageLoaded) {
        console.warn('所有图片格式尝试失败，显示替代文字');
        petImage.style.display = 'none';
        showAltText(petName);
        const placeholder = document.querySelector('.image-placeholder');
        if (placeholder) placeholder.style.display = 'none';
    }
    
    petSection.style.display = 'block';
}

// 显示替代文字
function showAltText(petName) {
    const altText = document.createElement('div');
    altText.className = 'pet-image-alt';
    altText.innerHTML = `🦊 ${petName}<br><small>图片加载失败</small>`;

    altText.onclick = function() {
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
async function renderSkills(text, petName) {
    console.log(`🎨 渲染技能数据，字符数: ${text.length}`);

    skillsContainer.innerHTML = '';
    currentSkills = [];

    const skillBlocks = text.split(/\n\n+/).filter(block => block.trim().length > 0);
    console.log(`找到技能块: ${skillBlocks.length}`);

    let validSkills = 0;
    
    // 分批加载技能图片，避免同时发起太多请求
    const batchSize = connectionSpeed === 'slow' ? 2 : 4;
    
    for (let i = 0; i < skillBlocks.length; i += batchSize) {
        const batch = skillBlocks.slice(i, i + batchSize);
        const promises = batch.map((block, index) => {
            return processSkillBlock(block, i + index, petName);
        });
        
        const results = await Promise.allSettled(promises);
        
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                validSkills++;
                createSkillCard(result.value.skillName, result.value.desc, petName, result.value.cleanSkillName);
            }
        });
        
        // 慢速网络下添加延迟
        if (connectionSpeed === 'slow' && i + batchSize < skillBlocks.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log(`成功创建 ${validSkills} 个技能卡片`);

    if (validSkills === 0) {
        skillsContainer.innerHTML = '<div class="no-skills">暂无技能数据</div>';
        return;
    }

    setupImageModal();
}

// 处理技能块
async function processSkillBlock(block, index, petName) {
    const lines = block.trim().split('\n');
    let skillName = lines[0].trim();

    // 跳过标题行
    if (skillName.includes('技能体系') || skillName === petName) {
        return null;
    }

    const desc = lines.slice(1).join('\n').trim();

    if (!skillName || !desc) {
        console.warn(`跳过无效技能块 ${index}:`, block);
        return null;
    }

    const cleanSkillName = skillName.replace(/[：:·・\s]/g, '').trim();
    
    // 预加载技能图片
    const skillImagePath = `${basePath}images/skills/${petName}/${cleanSkillName}.png`;
    try {
        await loadImageWithCache(skillImagePath, skillName);
    } catch (error) {
        console.warn(`技能图片预加载失败: ${skillImagePath}`);
    }

    return { skillName, desc, cleanSkillName };
}

// 创建技能卡片
function createSkillCard(skillName, desc, petName, cleanSkillName) {
    const card = document.createElement('div');
    card.className = 'skill-card';

    const skillImagePath = `${basePath}images/skills/${petName}/${cleanSkillName}.png`;

    card.innerHTML = `
        <div class="skill-left">
        <div class="skill-header">
            <img src="${skillImagePath}"
                 class="skill-icon lazy"
                 data-img="${skillImagePath}"
                 data-name="${skillName}"
                 alt="${skillName}图标"
                 loading="lazy">
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

    // 设置图片懒加载
    const skillIcon = card.querySelector('.skill-icon');
    lazyLoadImage(skillIcon);
}

// 图片懒加载
function lazyLoadImage(img) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const lazyImage = entry.target;
                lazyImage.src = lazyImage.dataset.img;
                lazyImage.classList.remove('lazy');
                
                lazyImage.onload = function() {
                    this.classList.add('loaded');
                };
                
                observer.unobserve(lazyImage);
            }
        });
    });
    
    observer.observe(img);
}

// 设置图片模态框
function setupImageModal() {
    // 为宠物图片添加点击事件
    petImage.onclick = function() {
        showImageModal(this.src, petNameElement.textContent);
    };

    // 为技能图标添加点击事件
    document.querySelectorAll('.skill-icon').forEach(img => {
        img.addEventListener('click', function(e) {
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

    modalImg.onerror = function() {
        console.warn(`模态框图片加载失败: ${imgSrc}`);
        this.style.display = 'none';
        modalCaption.textContent += ' (图片加载失败)';
    };

    modalImg.onload = function() {
        console.log(`模态框图片加载成功: ${imgSrc}`);
        this.style.display = 'block';
        this.style.background = 'transparent';
    };
}

// 模态框关闭功能
closeModal.onclick = function() {
    modal.style.display = "none";
    modalImg.src = '';
    modalCaption.textContent = '';
};

modal.onclick = function(e) {
    if (e.target === modal) {
        modal.style.display = "none";
        modalImg.src = '';
        modalCaption.textContent = '';
    }
};

// ESC键关闭模态框
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.style.display === 'block') {
        modal.style.display = "none";
        modalImg.src = '';
        modalCaption.textContent = '';
    }
});

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    init();
});

// 服务 Worker 注册（可选，用于高级缓存）
if ('serviceWorker' in navigator && connectionSpeed === 'slow') {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register(`${basePath}sw.js`)
        .then(function(registration) {
            console.log('ServiceWorker 注册成功: ', registration.scope);
        })
        .catch(function(error) {
            console.log('ServiceWorker 注册失败: ', error);
        });
    });
}
