import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// تعريف عناصر DOM
const uiElements = {
    balanceDisplay: document.getElementById('balanceAmount'),
    energyBar: document.getElementById('energyBar'),
    energyInfo: document.getElementById('energyInfo'),
    languageBtn: document.getElementById('languageSwitchBtn'),
    boostLevelDisplay: document.getElementById('boostLevel'),
    multiplierDisplay: document.getElementById('clickMultiplier'),
    coinBoostLevelDisplay: document.getElementById('coinBoostLevel'),
    currentLevel: document.getElementById('currentLevel'),  // عنصر يعرض المستوى الحالي
    currentCoins: document.getElementById('currentCoins'),  // عنصر يعرض العملات الحالية
    upgradeCost: document.getElementById('upgradeCost'),    // عنصر يعرض تكلفة الترقية
    purchaseNotification: document.getElementById('purchaseNotification'),
    copyInviteNotification: document.getElementById('copyInviteNotification'),
    clickableImg: document.getElementById('clickableImg'),
    navButtons: document.querySelectorAll('.menu button'),
    contentScreens: document.querySelectorAll('.screen-content'),
    splashScreen: document.querySelector('.splash-screen'),
    mainContainer: document.querySelector('.container'),
    levelFloatingBtn: document.getElementById('levelFloatingBtn'),
    confirmUpgradeBtn: document.getElementById('confirmUpgradeBtn'),
    cancelUpgradeBtn: document.getElementById('cancelUpgradeBtn'),
    upgradeModal: document.getElementById('upgradeConfirmation'),
    closeModal: document.getElementById('closeModal'),
    fillEnergyBtn: document.getElementById('fillEnergyBtn'),
    withdrawBtn: document.getElementById('withdrawBtn'),
    withdrawalForm: document.getElementById('withdrawalForm'),
    confirmWithdrawalBtn: document.getElementById('confirmWithdrawalBtn'),
    maxWithdrawBtn: document.getElementById('maxWithdrawBtn'),
    withdrawAmountInput: document.getElementById('withdrawAmount'),
    userTelegramNameDisplay: document.getElementById('userTelegramName'),
    userTelegramIdDisplay: document.getElementById('userTelegramId'),
   // taskTwoBtn: document.getElementById('taskTwoBtn'),
   // taskThreeBtn: document.getElementById('taskThreeBtn'),
   // taskTwoProgress: document.getElementById('taskTwoProgress'),
   // taskThreeProgress: document.getElementById('taskThreeProgress'),
    levelInfoDisplay: document.getElementById('currentLevelInfo') || { innerText: '' },
    friendsListDisplay: document.getElementById('friendsList') || { innerHTML: '' },
    displayedLevel: document.getElementById('displayedLevel'),
    currentLevelName: document.getElementById('currentLevelName'),
    levelOneProgress: document.getElementById('levelOneProgress'),
    levelTwoProgress: document.getElementById('levelTwoProgress'),
    levelThreeProgress: document.getElementById('levelThreeProgress'),
    levelFourProgress: document.getElementById('levelFourProgress'),
    levelFiveProgress: document.getElementById('levelFiveProgress'),
    levelSixProgress: document.getElementById('levelSixProgress'),
    levelSevenProgress: document.getElementById('levelSevenProgress'),
    levelEightProgress: document.getElementById('levelEightProgress'),
    levelNineProgress: document.getElementById('levelNineProgress'),
    levelTenProgress: document.getElementById('levelTenProgress'),
    boostUpgradeBtn: document.getElementById('boostUpgradeBtn'),
    coinUpgradeBtn: document.getElementById('coinUpgradeBtn'),
    fillEnergyUpgradeBtn: document.getElementById('fillEnergyBtn'),
    inviteFriendsBtn: document.getElementById('inviteFriendsBtn'),
    copyInviteLinkBtn: document.getElementById('copyInviteLinkBtn'),

};

// حالة اللعبة
let gameState = {
    balance: 0,
    energy: 10000,
    maxEnergy: 10000,
    clickMultiplier: 1,
    boostLevel: 1,
    coinBoostLevel: 1,
    energyBoostLevel: 1,
    currentLevel: 1,
    friends: 0,
    fillEnergyCount: 0,
    lastFillTime: Date.now(),
    freeEnergyFillTime: null,
    invites: [],
    claimedRewards: { levels: [], tasks: [] }, 
    tasksProgress: [],
    
};

// استعادة حالة اللعبة من localStorage إذا كانت موجودة
function loadGameState() {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
        gameState = JSON.parse(savedState);
        const currentTime = Date.now();
        const timeDiff = currentTime - gameState.lastFillTime;
        const recoveredEnergy = Math.floor(timeDiff / (4 * 60 * 1000)); // استعادة الطاقة بناءً على الفارق الزمني 4 ساعات
        gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + recoveredEnergy);
        updateUI();
    }
}

// حفظ حالة اللعبة في localStorage
function saveGameState() {
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

// مستويات اللعبة
const levelThresholds = [
    { level: 1, threshold: 100000, name: 'junior' },
    { level: 2, threshold: 300000, name: 'Challenge' },
    { level: 3, threshold: 700000, name: 'Develop' },
    { level: 4, threshold: 1000000, name: 'Intro' },
    { level: 5, threshold: 2000000, name: 'Advanced' },
    { level: 6, threshold: 4000000, name: 'Expert' },
    { level: 7, threshold: 7000000, name: 'Master' },
    { level: 8, threshold: 10000000, name: 'Ultimate' },
];

// التحقق من الترقية إلى مستوى أعلى
function checkForLevelUp() {
    for (let i = 0; i < levelThresholds.length; i++) {
        if (gameState.balance >= levelThresholds[i].threshold && gameState.currentLevel < levelThresholds[i].level && !gameState.claimedRewards.levels.includes(levelThresholds[i].level)) {
            gameState.currentLevel = levelThresholds[i].level;
            gameState.balance += levelThresholds[i].threshold; 
            gameState.claimedRewards.levels.push(levelThresholds[i].level);
            showNotification(uiElements.purchaseNotification, `Upgraded to level ${gameState.currentLevel}! ${formatNumber(levelThresholds[i].threshold)} coins added to your balance.`);
            updateUserData();
            saveGameState();  // حفظ حالة اللعبة والمكافأة
        }
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    loadGameState();
    await initializeApp();
    updateInviteFriendsButton();
});

// دالة تهيئة التطبيق
async function initializeApp() {
    try {
        console.log('Initializing app...');

        // جلب بيانات المستخدم من Telegram وSupabase
        await fetchUserDataFromTelegram();

        // إخفاء شاشة البداية وعرض المحتوى الرئيسي
         setTimeout(() => {
       if (uiElements.splashScreen) uiElements.splashScreen.style.display = 'none';
       if (uiElements.mainContainer) uiElements.mainContainer.style.display = 'flex';
    }, 5000); // 10000 ميلي ثانية تعني 10 ثوانٍ

        
        // استمع إلى التغييرات في البيانات
        listenToRealtimeChanges();

        // إعداد واجهة المستخدم
        updateUI();
        registerEventHandlers();
        startEnergyRecovery();
        
        console.log('App initialized successfully.');
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification(uiElements.purchaseNotification, 'Failed to initialize app.');
        if (uiElements.splashScreen) uiElements.splashScreen.style.display = 'none';
        if (uiElements.mainContainer) uiElements.mainContainer.style.display = 'flex';
    }
}

// جلب بيانات المستخدم من Telegram والتحقق في قاعدة البيانات
async function fetchUserDataFromTelegram() {
    const telegramApp = window.Telegram.WebApp;
    telegramApp.ready();

    const userTelegramId = telegramApp.initDataUnsafe.user?.id;
    const userTelegramName = telegramApp.initDataUnsafe.user?.username;

    if (!userTelegramId || !userTelegramName) {
        throw new Error("Failed to fetch Telegram user data.");
    }

    uiElements.userTelegramIdDisplay.innerText = userTelegramId;
    uiElements.userTelegramNameDisplay.innerText = userTelegramName;

    // تحقق من المستخدم في قاعدة البيانات، سجل إذا لم يكن موجودًا
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', userTelegramId)
        .maybeSingle(); 

    if (error) {
        console.error('Error fetching user data:', error);
        throw new Error('Failed to fetch user data');
    }

    if (data) {
        // المستخدم مسجل مسبقاً
        gameState = { ...gameState, ...data };
        saveGameState();
        loadFriendsList(); // تحميل قائمة الأصدقاء بعد جلب البيانات
       // updateTasksProgress(); // تحديث المهام بناءً على البيانات المسترجعة
    } else {
        // تسجيل مستخدم جديد
        await registerNewUser(userTelegramId, userTelegramName);
    }
}

// تسجيل مستخدم جديد في قاعدة البيانات
async function registerNewUser(userTelegramId, userTelegramName) {
    const { error } = await supabase
        .from('users')
        .insert([{ telegram_id: userTelegramId, username: userTelegramName, balance: gameState.balance }]);
    if (error) {
        console.error('Error inserting new user:', error);
        throw new Error('Failed to register new user');
   
     }
  }

// الاستماع إلى التغييرات في قاعدة البيانات
function listenToRealtimeChanges() {
    const userId = uiElements.userTelegramIdDisplay.innerText;

    supabase
        .channel('public:users')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `telegram_id=eq.${userId}` }, payload => {
            console.log('Change received!', payload);
            gameState = { ...gameState, ...payload.new };
            updateUI();
            saveGameState();
        })
        .subscribe();
}

// تحديث واجهة المستخدم بناءً على حالة اللعبة
function updateUI() {
    if (uiElements.balanceDisplay) {
        uiElements.balanceDisplay.innerText = formatNumber(gameState.balance);
    }

    if (uiElements.diamondBalanceDisplay) {
        uiElements.diamondBalanceDisplay.innerText = formatNumber(gameState.diamonds);
    }

    const energyPercent = (gameState.energy / gameState.maxEnergy) * 100;
    if (uiElements.energyBar) {
        uiElements.energyBar.style.width = `${energyPercent}%`;
    }

    if (uiElements.energyInfo) {
        uiElements.energyInfo.innerText = `${formatNumber(gameState.energy)}/${formatNumber(gameState.maxEnergy)}⚡`;
    }

    if (uiElements.currentLevelName) {
        uiElements.currentLevelName.innerText = levelThresholds[gameState.currentLevel - 1].name;
    }

    if (uiElements.displayedLevel) {
        uiElements.displayedLevel.innerText = `Level ${gameState.currentLevel}`;
    }

    updateBoostsDisplay();
  //  updateTasksProgress();
    updateLevelDisplay();
}

function formatNumber(value) {
    if (value >= 1_000_000_000_000) {
        return `${(value / 1_000_000_000_000).toFixed(2)}T`;
    } else if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(2)}B`; 
    } else {
        return value.toLocaleString(); 
    }
}

// تسجيل الأحداث للمستخدم
function registerEventHandlers() {
    if (uiElements.clickableImg) {
        uiElements.clickableImg.addEventListener('click', handleClick);
        uiElements.clickableImg.addEventListener('touchstart', handleClick);
    }

    if (uiElements.navButtons) {
        uiElements.navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetScreen = button.getAttribute('data-target');
                navigateToScreen(targetScreen);
            });
        });
    }

    if (uiElements.levelFloatingBtn) {
        uiElements.levelFloatingBtn.addEventListener('click', () => {
            navigateToScreen('levelPage');
            if (uiElements.levelInfoDisplay) {
                uiElements.levelInfoDisplay.innerText = `You are currently on level ${gameState.currentLevel}`;
            }
            if (uiElements.displayedLevel) {
                uiElements.displayedLevel.innerText = gameState.currentLevel;
            }
        });
    }

    if (uiElements.confirmUpgradeBtn) {
        uiElements.confirmUpgradeBtn.addEventListener('click', confirmUpgradeAction);
    }

    if (uiElements.cancelUpgradeBtn) {
        uiElements.cancelUpgradeBtn.addEventListener('click', () => {
            if (uiElements.upgradeModal) uiElements.upgradeModal.style.display = 'none';
        });
    }

    if (uiElements.fillEnergyBtn) {
        uiElements.fillEnergyBtn.addEventListener('click', fillEnergyAction);
    }
    
    
    if (uiElements.boostUpgradeBtn) {
        uiElements.boostUpgradeBtn.addEventListener('click', () => {
            showUpgradeModal('boost');
        });
    }

    if (uiElements.coinUpgradeBtn) {
        uiElements.coinUpgradeBtn.addEventListener('click', () => {
            showUpgradeModal('coin');
        });
    }

    if (uiElements.fillEnergyUpgradeBtn) {
        uiElements.fillEnergyUpgradeBtn.addEventListener('click', () => {
            showUpgradeModal('energy');
        });
    }

    if (uiElements.taskTwoBtn) {
        uiElements.taskTwoBtn.addEventListener('click', () => claimTaskReward(3));
    }

    if (uiElements.taskThreeBtn) {
        uiElements.taskThreeBtn.addEventListener('click', () => claimTaskReward(10));
    }

    if (uiElements.withdrawBtn) {
        uiElements.withdrawBtn.addEventListener('click', () => {
            showNotification(uiElements.purchaseNotification, 'Coming Soon!');
        });
    }

    if (uiElements.confirmWithdrawalBtn) {
        uiElements.confirmWithdrawalBtn.addEventListener('click', () => {
            showNotification(uiElements.purchaseNotification, 'Coming Soon!');
        });
    }

    if (uiElements.languageBtn) {
        uiElements.languageBtn.addEventListener('click', () => {
            showNotification(uiElements.purchaseNotification, 'Language switch coming soon!');
        });
    }

    if (uiElements.inviteFriendsBtn) {
        uiElements.inviteFriendsBtn.addEventListener('click', () => {
            openTelegramChat();
        });
    }

    if (uiElements.copyInviteLinkBtn) {
        uiElements.copyInviteLinkBtn.addEventListener('click', copyInviteLink);
    }

    if (uiElements.maxWithdrawBtn) {
        uiElements.maxWithdrawBtn.addEventListener('click', () => {
            if (uiElements.withdrawAmountInput) {
                uiElements.withdrawAmountInput.value = gameState.balance;
            }
        });
    }
}

// عرض الإشعارات للمستخدم
function showNotification(notificationElement, message) {
    if (!notificationElement) return;
    notificationElement.innerText = message;
    notificationElement.classList.add('show');
    setTimeout(() => {
        notificationElement.classList.remove('show');
    }, 4000);
}


// عرض النافذة المنبثقة بناءً على نوع الترقية (النقر أو العملات)
function showUpgradeModal(upgradeType) {
    if (uiElements.upgradeModal) {
        uiElements.upgradeModal.style.display = 'block';
        uiElements.upgradeModal.setAttribute('data-upgrade-type', upgradeType);

        let cost;
        if (upgradeType === 'boost') {
            cost = gameState.boostLevel * 4000 + 500;
            uiElements.upgradeText.innerText = `Are you sure you want to upgrade your click multiplier? It will cost ${cost} coins.`;
            uiElements.currentLevel.innerText = `Current Click Multiplier: ×${gameState.clickMultiplier}`;
        } else if (upgradeType === 'coin') {
            cost = gameState.coinBoostLevel * 4000 + 500;
            uiElements.upgradeText.innerText = `Are you sure you want to upgrade your max coins? It will cost ${cost} coins.`;
            uiElements.currentLevel.innerText = `Current Max Coins: ${formatNumber(gameState.maxEnergy)}`;
        }

        // تحديث العملات المتاحة وتكلفة الترقية
        uiElements.currentCoins.innerText = formatNumber(gameState.balance);
        uiElements.upgradeCost.innerText = cost;
    }
}

// ربط أزرار الترقية بالنافذة المنبثقة
document.getElementById('boostUpgradeBtn').addEventListener('click', function() {
    showUpgradeModal('boost');
});

document.getElementById('coinUpgradeBtn').addEventListener('click', function() {
    showUpgradeModal('coin');
});

// دالة تأكيد الترقية وتحديث حالة اللعبة بعد الترقية
function confirmUpgradeAction() {
    let cost;
    let upgradeType = uiElements.upgradeModal.getAttribute('data-upgrade-type');

    if (upgradeType === 'boost') {
        cost = gameState.boostLevel * 4000 + 500;
    } else if (upgradeType === 'coin') {
        cost = gameState.coinBoostLevel * 4000 + 500;
    }

    // التحقق إذا كان لدى المستخدم ما يكفي من العملات للترقية
    if (gameState.balance >= cost) {
        gameState.balance -= cost;  // خصم تكلفة الترقية

        // زيادة المستوى بعد الترقية
        if (upgradeType === 'boost') {
            gameState.boostLevel += 1;
            gameState.clickMultiplier += 1;
        } else if (upgradeType === 'coin') {
            gameState.coinBoostLevel += 1;
            gameState.maxEnergy += 5000;
        }

        // تحديث واجهة المستخدم والإشعارات بعد الترقية
        updateUI();
        showNotification(uiElements.purchaseNotification, `Successfully upgraded!`);
        updateUserData();
        saveGameState();
    } else {
        showNotification(uiElements.purchaseNotification, `Not enough coins!`);
    }
    uiElements.upgradeModal.style.display = 'none';  // إخفاء النافذة المنبثقة بعد الترقية
}


// ملء الطاقة
function fillEnergyAction() {
    const twelveHours = 12 * 60 * 60 * 1000;
    const currentTime = Date.now();

    if (gameState.fillEnergyCount < 2 && currentTime - gameState.lastFillTime >= twelveHours) {
        gameState.energy = gameState.maxEnergy;
        gameState.fillEnergyCount += 1;
        gameState.lastFillTime = currentTime;
        updateUI();
        showNotification(uiElements.purchaseNotification, 'Energy filled!');
    } else {
        showNotification(uiElements.purchaseNotification, 'You need to wait for the next free energy fill.');
    }
    updateUserData();
    saveGameState();
}

// التعامل مع النقرات لتوليد العملات
function handleClick(event) {
    event.preventDefault(); // منع الأحداث المكررة
    const touchPoints = event.touches || [event];

    for (let i = 0; i < touchPoints.length; i++) {
        const touch = touchPoints[i];
        createDiamondCoinEffect(touch.pageX, touch.pageY);
    }

    if (gameState.energy >= gameState.clickMultiplier * touchPoints.length) {
        gameState.balance += gameState.clickMultiplier * touchPoints.length;
        gameState.energy -= gameState.clickMultiplier * touchPoints.length;
        updateUI();
        saveGameState();  // التأكد من حفظ حالة اللعبة بعد كل نقرة
    } else {
        showNotification(uiElements.purchaseNotification, 'Not enough energy!');
    }
}

// تأثير النقر لعرض عملات الألماس
function createDiamondCoinEffect(x, y) {
    const diamond = document.createElement('div');
    diamond.classList.add('diamond-coin');
    const multiplierText = document.createElement('span');
    multiplierText.textContent = `+${gameState.clickMultiplier}`;
    diamond.appendChild(multiplierText);
    document.body.appendChild(diamond);

    diamond.style.left = `${x - 15}px`; // Adjust for the diamond size
    diamond.style.top = `${y - 15}px`;

    const balanceRect = uiElements.balanceDisplay.getBoundingClientRect();

    setTimeout(() => {
        diamond.style.transform = `translate(${balanceRect.left - x}px, ${balanceRect.top - y}px) scale(1)`;
        setTimeout(() => {
            diamond.remove();
        }, 1000);
    }, 50);
}

// الانتقال بين الشاشات
function navigateToScreen(screenId) {
    if (uiElements.contentScreens) {
        uiElements.contentScreens.forEach(screen => {
            screen.classList.remove('active');
        });
    }
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) targetScreen.classList.add('active');

    if (screenId === 'boostsPage') {
        
        if (uiElements.boostUpgradeBtn) uiElements.boostUpgradeBtn.style.display = 'block';
        if (uiElements.coinUpgradeBtn) uiElements.coinUpgradeBtn.style.display = 'block';
        if (uiElements.fillEnergyUpgradeBtn) uiElements.fillEnergyUpgradeBtn.style.display = 'block';
    }
    
}

// بدء استعادة الطاقة تلقائياً
function startEnergyRecovery() {
    setInterval(() => {
        const currentTime = Date.now();
        const timeDiff = currentTime - gameState.lastFillTime;
        const recoveredEnergy = Math.floor(timeDiff / (4 * 60 * 1000)); // استعادة الطاقة بناءً على الفارق الزمني 4 ساعات
        if (gameState.energy < gameState.maxEnergy) {
            gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + recoveredEnergy);
            updateUI();
            updateUserData();
            saveGameState();
        }
    }, 5000);
}

// التحقق من ملء الطاقة
function checkEnergyFill() {
    const currentTime = Date.now();
    const twelveHours = 12 * 60 * 60 * 1000;
    if (currentTime - gameState.lastFillTime >= twelveHours) {
        gameState.fillEnergyCount = 0;
        updateUI();
        updateUserData();
        saveGameState();
    }
}

// تحديث عرض المستويات
function updateLevelDisplay() {
    checkForLevelUp();
    if (uiElements.levelInfoDisplay) {
        uiElements.levelInfoDisplay.innerText = `You are currently on level ${gameState.currentLevel}`;
    }
    document.querySelectorAll('.level-item').forEach(item => {
        item.classList.remove('current-level');
    });
    const currentLevelElement = document.getElementById(`level${gameState.currentLevel}`);
    if (currentLevelElement) currentLevelElement.classList.add('current-level'); // إضافة حواف فضية للمستوى الحالي

    if (uiElements.levelOneProgress) uiElements.levelOneProgress.style.width = `${(gameState.balance / levelThresholds[0].threshold) * 100}%`;
    if (uiElements.levelTwoProgress) uiElements.levelTwoProgress.style.width = `${(gameState.balance / levelThresholds[1].threshold) * 100}%`;
    if (uiElements.levelThreeProgress) uiElements.levelThreeProgress.style.width = `${(gameState.balance / levelThresholds[2].threshold) * 100}%`;
    if (uiElements.levelFourProgress) uiElements.levelFourProgress.style.width = `${(gameState.balance / levelThresholds[3].threshold) * 100}%`;
    if (uiElements.levelFiveProgress) uiElements.levelFiveProgress.style.width = `${(gameState.balance / levelThresholds[4].threshold) * 100}%`;
    if (uiElements.levelSixProgress) uiElements.levelSixProgress.style.width = `${(gameState.balance / levelThresholds[5].threshold) * 100}%`;
    if (uiElements.levelSevenProgress) uiElements.levelSevenProgress.style.width = `${(gameState.balance / levelThresholds[6].threshold) * 100}%`;
    if (uiElements.levelEightProgress) uiElements.levelEightProgress.style.width = `${(gameState.balance / levelThresholds[7].threshold) * 100}%`;
}

// تحديث عرض التحسينات
function updateBoostsDisplay() {
    const boostUpgradeCost = gameState.boostLevel * 2000 + 500;
    const coinUpgradeCost = gameState.coinBoostLevel * 2000 + 500;

    if (uiElements.boostUpgradeBtn) {
        document.getElementById('boostUpgradeCost').innerText = boostUpgradeCost;
    }
    if (uiElements.coinUpgradeBtn) {
        document.getElementById('coinUpgradeCost').innerText = coinUpgradeCost;
    }

    if (uiElements.boostLevelDisplay) {
        uiElements.boostLevelDisplay.innerText = gameState.boostLevel;
    }
    if (uiElements.multiplierDisplay) {
        uiElements.multiplierDisplay.innerText = gameState.clickMultiplier;
    }
    if (uiElements.coinBoostLevelDisplay) {
        uiElements.coinBoostLevelDisplay.innerText = gameState.coinBoostLevel;
    }
}


// تحسين عرض قائمة الأصدقاء
async function loadFriendsList() {
    const userId = uiElements.userTelegramIdDisplay.innerText;

    if (!userId) {
        console.error("User ID is missing.");
        uiElements.friendsListDisplay.innerHTML = `<li>Error: Unable to load friends list. Please try again later.</li>`;
        return;
    }

    try {
        // جلب قائمة الأصدقاء الذين تمت دعوتهم بواسطة المستخدم الحالي فقط
        const { data, error } = await supabase
            .from('users')
            .select('invites')
            .eq('telegram_id', userId)
            .single();

        if (error) {
            console.error('Error fetching friends list:', error.message);
            uiElements.friendsListDisplay.innerHTML = `<li>Error: Unable to fetch friends at the moment.</li>`;
            return;
        }

        // التأكد من أن الدعوات تخص المستخدم الحالي فقط
        if (data && data.invites && data.invites.length > 0) {
            uiElements.friendsListDisplay.innerHTML = ''; // مسح القائمة القديمة
            data.invites.forEach(friend => {
                const li = document.createElement('li');
                li.innerText = friend;
                uiElements.friendsListDisplay.appendChild(li);
            });
        } else {
            uiElements.friendsListDisplay.innerHTML = '<li>No friends invited yet.</li>';
        }
    } catch (err) {
        console.error("Unexpected error loading friends list:", err);
        uiElements.friendsListDisplay.innerHTML = `<li>Error: Unexpected issue occurred while loading friends.</li>`;
    }
}

// تحديث تقدم المهام
function updateTasksProgress() {
    const friendsCount = gameState.friends.length || 0;  // استخدم 0 إذا لم يكن هناك أصدقاء
    if (uiElements.taskTwoProgress) {
        uiElements.taskTwoProgress.innerText = `${friendsCount}/3`;
    }
    if (uiElements.taskThreeProgress) {
        uiElements.taskThreeProgress.innerText = `${friendsCount}/10`;
    }

    updateTaskBtnState(uiElements.taskTwoBtn, friendsCount >= 3);
    updateTaskBtnState(uiElements.taskThreeBtn, friendsCount >= 10);
}

// تحديث حالة زر المهمة
function updateTaskBtnState(button, isActive) {
    if (button) {
        if (isActive) {
            button.classList.remove('inactive');
        } else {
            button.classList.add('inactive');
        }
    }
}

// المطالبة بمكافأة المهمة
function claimTaskReward(friendsRequired) {
    const friendsCount = gameState.friends.length;

    if (friendsCount >= friendsRequired && !gameState.claimedRewards.tasks.includes(friendsRequired)) {
        let reward = 0;
        if (friendsRequired === 3) {
            reward = 300000;
        } else if (friendsRequired === 10) {
            reward = 2000000;
        }

        gameState.balance += reward;
        gameState.claimedRewards.tasks.push(friendsRequired); // تسجيل المكافأة فقط للمرة الأولى
        updateUI();
        showNotification(uiElements.purchaseNotification, `Successfully claimed ${formatNumber(reward)} reward!`);
        updateUserData();
        saveGameState(); // التأكد من حفظ المكافأة
    } else {
        showNotification(uiElements.purchaseNotification, `Invite ${friendsRequired - friendsCount} more friends to claim the reward.`);
    }
}

// نسخ رابط الدعوة
function copyInviteLink() {
    const inviteLink = `https://t.me/SAWCOIN_BOT?start=${uiElements.userTelegramIdDisplay?.innerText || ''}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
        showNotification(uiElements.copyInviteNotification, 'Invite link copied!');
    }).catch(err => {
        showNotification(uiElements.purchaseNotification, 'Failed to copy invite link.');
    });
}

// مشاركة الدعوة عبر Telegram
function openTelegramChat() {
    const inviteLink = `https://t.me/share/url?text=Join Jigsaw's Game and earn 50,000 coins!&url=https://t.me/SAWCOIN_BOT?start=${uiElements.userTelegramIdDisplay?.innerText || ''}`;
    window.open(inviteLink, '_blank');
}

// تحديث بيانات المستخدم في Supabase
async function updateUserData() {
    const userId = uiElements.userTelegramIdDisplay.innerText;

    const { error } = await supabase
        .from('users')
        .update({
            balance: gameState.balance,
            energy: gameState.energy,
            max_energy: gameState.maxEnergy,
            click_multiplier: gameState.clickMultiplier,
            boost_level: gameState.boostLevel,
            coin_boost_level: gameState.coinBoostLevel,
            energy_boost_level: gameState.energyBoostLevel,
            current_level: gameState.currentLevel,
            friends: gameState.friends,
            fill_energy_count: gameState.fillEnergyCount,
            last_fill_time: new Date(gameState.lastFillTime).toISOString(),
            invites: gameState.invites,
            claimed_rewards: gameState.claimedRewards // حفظ المكافآت المحصلة في قاعدة البيانات
        })
        .eq('telegram_id', userId);

    if (error) {
        console.error('Error updating user data:', error);
    }
}




// Loading tasks from JSON file
fetch('tasks.json')
    .then(response => response.json())
    .then(tasks => {
        const taskContainer = document.getElementById('taskcontainer');
        if (!taskContainer) {
            console.error('Task container element not found.');
            return;
        }

        taskContainer.innerHTML = ''; // Clean the content before adding tasks

        tasks.forEach(async task => {
            const taskItem = document.createElement('div');
            taskItem.className = 'task-item';

            // Add the image
            const img = document.createElement('img');
            img.src = task.image;
            img.alt = task.task;
            img.className = 'task-image';
            taskItem.appendChild(img);

            // Add the task text
            const taskText = document.createElement('p');
            taskText.textContent = `${task.task} - Reward: ${task.reward || 5000} coins`;
            taskItem.appendChild(taskText);

            // Add the button
            const button = document.createElement('button');
            button.className = 'task-button';

            const taskId = task.id;
            const userId = uiElements.userTelegramIdDisplay.innerText; // Get Telegram ID

            // Fetch task progress from the database
            const { data: userTaskData, error: taskError } = await supabase
                .from('users')
                .select('tasks_progress')
                .eq('telegram_id', userId)
                .single();

            if (taskError) {
                console.error('Error fetching task progress:', taskError);
                return;
            }

            const tasksProgress = userTaskData?.tasks_progress || [];
            const taskProgressData = tasksProgress.find(t => t.task_id === taskId);
            let taskProgress = taskProgressData ? taskProgressData.progress : 0;

            // Set button text based on task progress
            button.textContent = taskProgress >= 2 ? 'Completed' : taskProgress === 1 ? 'Verify' : 'Go to Task';
            button.disabled = taskProgress >= 2;

            // Button click handling
            button.onclick = async () => {
                if (taskProgress === 0) {
                    window.open(task.link, '_blank');
                    taskProgress = 1;
                    await updateTaskProgress(taskId, userId, taskProgress); // Update progress in the database
                    button.textContent = 'Verify';
                    showNotification('Task opened, verify to claim your reward.');
                } else if (taskProgress === 1) {
                    window.open(task.link, '_blank');
                    taskProgress = 2;
                    await updateTaskProgress(taskId, userId, taskProgress);
                    button.textContent = 'Claim';
                    showNotification('Task verified, claim your reward.');
                } else if (taskProgress === 2) {
                    await claimReward(taskId, task.reward); // Claim reward
                    button.textContent = 'Completed';
                    button.disabled = true;
                    showNotification('Reward claimed successfully!');
                }
            };

            taskItem.appendChild(button);
            taskContainer.appendChild(taskItem);
        });
    })
    .catch(error => console.error('Error loading tasks:', error));

// Function to update task progress in the database
async function updateTaskProgress(taskId, userId, progress) {
    const { data: user, error } = await supabase
        .from('users')
        .select('tasks_progress')
        .eq('telegram_id', userId)
        .single();
    
    if (error) {
        console.error('Error fetching user tasks:', error);
        showNotification('Error updating task progress.', true); // Show error notification
        return;
    }

    const tasksProgress = user.tasks_progress || [];

    const taskIndex = tasksProgress.findIndex(task => task.task_id === taskId);
    if (taskIndex > -1) {
        tasksProgress[taskIndex].progress = progress;
    } else {
        tasksProgress.push({ task_id: taskId, progress: progress, claimed: false });
    }

    const { error: updateError } = await supabase
        .from('users')
        .update({ tasks_progress: tasksProgress })
        .eq('telegram_id', userId);

    if (updateError) {
        console.error('Error updating task progress:', updateError);
        showNotification('Error saving task progress.', true); // Show error notification
    }
}

// Function to claim a reward and update the balance
async function claimReward(taskId, reward) {
    const userId = uiElements.userTelegramIdDisplay.innerText;

    const { data: user, error } = await supabase
        .from('users')
        .select('tasks_progress, balance') // Fetch task progress and balance
        .eq('telegram_id', userId)
        .single();

    if (error) {
        console.error('Error fetching tasks progress or balance:', error);
        showNotification('Error claiming reward.', true); // Show error notification
        return;
    }

    const tasksProgress = user.tasks_progress || [];
    const task = tasksProgress.find(task => task.task_id === taskId);

    if (task && task.claimed) {
        showNotification('You have already claimed this reward.');
        return;
    }

    // Update the user's balance
    const newBalance = user.balance + reward; // Add the reward to the current balance
    await updateBalanceInDatabase(newBalance);

    // Mark the task as claimed
    if (task) {
        task.claimed = true;
    } else {
        tasksProgress.push({ task_id: taskId, progress: 2, claimed: true });
    }

    const { error: updateError } = await supabase
        .from('users')
        .update({ tasks_progress: tasksProgress, balance: newBalance }) // Update balance and task progress
        .eq('telegram_id', userId);

    if (updateError) {
        console.error('Error updating claimed rewards:', updateError);
        showNotification('Error saving claimed reward.', true); // Show error notification
    } else {
        showNotification('Reward claimed!');
    }
}

// Function to update the user's balance in the database
async function updateBalanceInDatabase(newBalance) {
    const userId = uiElements.userTelegramIdDisplay.innerText;

    const { error } = await supabase
        .from('users')
        .update({ balance: newBalance }) // Update the balance directly
        .eq('telegram_id', userId);

    if (error) {
        console.error('Error updating balance:', error);
        showNotification('Error updating balance.', true); // Show error notification
    }
}






//const inviteButton = document.getElementById("inviteFriendsBtn");

//let scale = 1;
//let growing = true;

//setInterval(() => {
   // if (growing) {
      //  scale += 0.05;
      //  if (scale >= 1.2) growing = false; 
  //  } else {
      //  scale -= 0.05;
       // if (scale <= 1) growing = true;
  //  }
//   inviteButton.style.transform = `scale(${scale})`;
// }, 280);


document.querySelectorAll('button[data-target]').forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        document.querySelectorAll('.screen-content').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(targetId).classList.add('active');
    });
});


// إغلاق النافذة المنبثقة
document.getElementById('closeModal').addEventListener('click', function() {
    document.getElementById('upgradeConfirmation').style.display = 'none';
});



let currentLevelIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.level-container');
    const totalLevels = document.querySelectorAll('.level-item').length;
    const leftArrow = document.querySelector('.arrow-btn.left');
    const rightArrow = document.querySelector('.arrow-btn.right');

    // تحديث حالة الأزرار
    function updateArrows() {
        if (currentLevelIndex === 0) {
            leftArrow.classList.add('disabled');
        } else {
            leftArrow.classList.remove('disabled');
        }

        if (currentLevelIndex === totalLevels - 1) {
            rightArrow.classList.add('disabled');
        } else {
            rightArrow.classList.remove('disabled');
        }
    }

    function scrollLeft() {
        const levelWidth = container.clientWidth;
        if (currentLevelIndex > 0) {
            currentLevelIndex--;
            container.scrollTo({
                left: currentLevelIndex * levelWidth,
                behavior: 'smooth'
            });
        }
        updateArrows();
    }

    function scrollRight() {
        const levelWidth = container.clientWidth;
        if (currentLevelIndex < totalLevels - 1) {
            currentLevelIndex++;
            container.scrollTo({
                left: currentLevelIndex * levelWidth,
                behavior: 'smooth'
            });
        }
        updateArrows();
    }

    // إرفاق الأحداث للأزرار
    leftArrow.addEventListener('click', scrollLeft);
    rightArrow.addEventListener('click', scrollRight);

    // تحديث حالة الأزرار عند البدء
    updateArrows();
});



// تهيئة تكامل Telegram
function initializeTelegramIntegration() {
    const telegramApp = window.Telegram.WebApp;

    telegramApp.ready();
    if (uiElements.userTelegramNameDisplay) {
        uiElements.userTelegramNameDisplay.innerText = telegramApp.initDataUnsafe.user?.username || '';
    }
    if (uiElements.userTelegramIdDisplay) {
        uiElements.userTelegramIdDisplay.innerText = telegramApp.initDataUnsafe.user?.id || '';
    }

    if (telegramApp.colorScheme === 'dark') {
        document.documentElement.style.setProperty('--background-color-dark', '#000');
        document.documentElement.style.setProperty('--text-color-dark', '#000');
    }

    telegramApp.onEvent('share', () => {
        gameState.balance += 50000;
        updateUI();
        showNotification(uiElements.purchaseNotification, 'You received 50,000 coins for inviting a friend!');
        updateUserData();
        saveGameState();
    });
}

initializeApp();
