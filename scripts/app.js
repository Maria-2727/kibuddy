document.addEventListener('DOMContentLoaded', function () {
    //Most of the code was developed by Maria Kushch.
    const splash = document.getElementById('splash-screen');
setTimeout(() => {
    splash.style.opacity = '0';
    setTimeout(() => splash.style.display = 'none', 500);
}, 1500);

    // 1. Система авторизации
    const authScreen = document.getElementById('auth-screen');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Проверка авторизации при загрузке
    if (localStorage.getItem('currentUser')) {
        authScreen.style.display = 'none';
        appContainer.style.display = 'block';
        initApp();
    }
    
    // Переключение между формами
    document.getElementById('show-register').addEventListener('click', function(e) {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';

    // Ожидаем отрисовку, затем фокус
    setTimeout(() => {
        const nameInput = document.getElementById('register-name');
        nameInput.focus();
    }, 200);
});


    document.getElementById('show-login').addEventListener('click', function(e) {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });
    
    // Вход
    document.getElementById('login-btn').addEventListener('click', function() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            authScreen.style.display = 'none';
            appContainer.style.display = 'block';
            initApp();
        } else {
            showAlert('Неверный email или пароль', 'error');
        }
    });
    
    // Регистрация
    document.getElementById('register-btn').addEventListener('click', function() {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const currency = document.getElementById('register-currency').value;

        if (!name || !email || !password) {
            showAlert('Заполните все поля', 'error');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        if (users.some(u => u.email === email)) {
            showAlert('Пользователь с таким email уже существует', 'error');
            return;
        }
        
        const newUser = {
    id: Date.now(),
    name,
    email,
    password,
    currency, // добавляем валюту сюда
    completedTips: [],
    createdAt: new Date().toISOString()
};

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        
        authScreen.style.display = 'none';
        appContainer.style.display = 'block';
        initApp();
    });
    
    // 2. Инициализация приложения
    function initApp() {
        // App Initialization
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const userDataKey = `userData_${currentUser.id}`;
        
        const app = {
            data: {
                expenses: JSON.parse(localStorage.getItem(`${userDataKey}_expenses`)) || [],
                income: JSON.parse(localStorage.getItem(`${userDataKey}_income`)) || [],
                goals: JSON.parse(localStorage.getItem(`${userDataKey}_goals`)) || {
                    amount: 2000,
                    date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
                },
                limits: JSON.parse(localStorage.getItem(`${userDataKey}_limits`)) || [],
                limitSettings: JSON.parse(localStorage.getItem(`${userDataKey}_limitSettings`)) || {
                    warningThreshold: 80,
                    autoAdjustPercentage: 110,
                    enableNotifications: true
                }
            },
            date: new Date(),
            period: 'day',
            chart: null
        };

        // UI Elements
        const ui = {
            // Main elements
            addExpense: document.getElementById('add-expense'),
            addIncome: document.getElementById('add-income'),
            prevBtn: document.getElementById('prev-period'),
            nextBtn: document.getElementById('next-period'),
            dateInput: document.getElementById('date-selector'),
            dateDisplay: document.getElementById('current-date'),
            budget: document.getElementById('budget-amount'),
            
            // Lists
            expensesList: document.getElementById('expenses-list'),
            incomeList: document.getElementById('income-list'),
            
            // Analytics
            totalIncome: document.getElementById('total-income'),
            totalExpenses: document.getElementById('total-expenses'),
            balance: document.getElementById('balance'),
            chartCtx: document.getElementById('budget-chart').getContext('2d'),
            chartPlaceholder: document.getElementById('chart-placeholder'),
            
            // Goals
            goalAmount: document.getElementById('goal-amount'),
            goalDate: document.getElementById('goal-date'),
            saveGoalBtn: document.getElementById('save-goal'),
            currentSavings: document.getElementById('current-savings'),
            targetAmountDisplay: document.getElementById('target-amount-display'),
            dailyNeeded: document.getElementById('daily-needed'),
            savingsProgress: document.getElementById('savings-progress'),
            savingsText: document.getElementById('savings-text'),
            
            // Limits
            limitsList: document.getElementById('limits-list'),
            addLimitBtn: document.getElementById('add-limit'),
            limitsMenuBtn: document.getElementById('limits-menu-btn'),
            limitsMenu: document.getElementById('limits-menu'),
            limitsStatus: document.getElementById('limits-status'),
            autoLimitBtn: document.getElementById('auto-limit-btn'),
            resetLimitsBtn: document.getElementById('reset-limits-btn'),
            limitsSettingsBtn: document.getElementById('limits-settings-btn'),
            
            // Modals
            limitModal: document.getElementById('limit-modal'),
            limitCategory: document.getElementById('limit-category'),
            limitAmount: document.getElementById('limit-amount'),
            autoAdjustLimit: document.getElementById('auto-adjust-limit'),
            confirmLimit: document.getElementById('confirm-limit'),
            closeModal: document.querySelectorAll('.close-modal'),
            
            // Limit Settings
            limitSettingsModal: document.getElementById('limit-settings-modal'),
            warningThreshold: document.getElementById('limit-warning-threshold'),
            autoAdjustPercentage: document.getElementById('auto-adjust-percentage'),
            enableNotifications: document.getElementById('enable-limit-notifications'),
            saveLimitSettings: document.getElementById('save-limit-settings'),
            
            // Pages
            pages: document.querySelectorAll('.page'),
            navBtns: document.querySelectorAll('.nav-btn'),
            periodBtns: document.querySelectorAll('.period-btn'),
            
            // User info
            userName: document.getElementById('user-name'),
            logoutBtn: document.getElementById('logout-btn')
        };

        // Set user info
        ui.userName.textContent = currentUser.name;
        ui.logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            location.reload();
        });

        // 3. Core Functions

        // Initialize app
        function init() {
            setupEventListeners();
            initChart();
            loadGoals();
            loadLimits();
            loadLimitSettings();
            refreshUI();
            showPage('expenses-page');
            initKiTips();
        }

        // Add transaction
        function addTransaction(type) {
            const isIncome = type === 'income';
            const typeText = isIncome ? 'Income' : 'Expense';
            
            const category = prompt(`Enter ${typeText} category:`);
            if (!category || !category.trim()) {
                alert('Category cannot be empty!');
                return;
            }

            const amount = parseFloat(prompt(`Enter amount ($):`));
            if (isNaN(amount) || amount <= 0) {
                alert('Please enter a valid positive number');
                return;
            }

            const transaction = {
                id: Date.now(),
                type,
                category: category.trim(),
                amount: parseFloat(amount.toFixed(2)),
                date: new Date(app.date).toISOString().split('T')[0]
            };

            if (isIncome) {
                app.data.income.push(transaction);
            } else {
                app.data.expenses.push(transaction);
                checkLimits();
            }
            
            saveData();
            refreshUI();
            showAlert(`${typeText} added successfully!`, 'success');
        }

        // Delete transaction
        function deleteTransaction(id, type) {
            if (confirm(`Delete this ${type}?`)) {
                if (type === 'income') {
                    app.data.income = app.data.income.filter(t => t.id !== id);
                } else {
                    app.data.expenses = app.data.expenses.filter(t => t.id !== id);
                    checkLimits();
                }
                saveData();
                refreshUI();
            }
        }

        // Refresh UI
        function refreshUI() {
            updateDate();
            updateTransactions();
            updateBudget();
            updateChart();
            updateGoalProgress();
            checkLimits();
        }

        // 4. Date and Period Handling
        function updateDate() {
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            ui.dateDisplay.textContent = app.date.toLocaleDateString('en-US', options);
            ui.dateInput.valueAsDate = app.date;
        }

        function changeDate(days) {
            const date = new Date(app.date);
            
            switch(app.period) {
                case 'day': date.setDate(date.getDate() + days); break;
                case 'week': date.setDate(date.getDate() + (7 * days)); break;
                case 'month': date.setMonth(date.getMonth() + days); break;
                case 'year': date.setFullYear(date.getFullYear() + days); break;
            }
            
            app.date = date;
            refreshUI();
        }

        function changePeriod(period) {
            app.period = period;
            refreshUI();
        }

        // 5. Transaction Management
        function updateTransactions() {
            updateTransactionList('expense');
            updateTransactionList('income');
        }

        function updateTransactionList(type) {
            const listElement = type === 'expense' ? ui.expensesList : ui.incomeList;
            listElement.innerHTML = '';

            const transactions = getFilteredTransactions(type);
            
            if (transactions.length === 0) {
                listElement.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-${type === 'income' ? 'coins' : 'receipt'}"></i>
                        <p>No ${type === 'income' ? 'income' : 'expenses'} yet</p>
                    </div>
                `;
                return;
            }

            transactions.forEach(trans => {
                const item = document.createElement('div');
                item.className = 'transaction-item';
                item.innerHTML = `
                    <span class="category">${trans.category}</span>
                    <span class="amount ${type}">
                        ${type === 'income' ? '+' : '-'}${formatMoney(trans.amount)}
                    </span>
                    <button class="delete-btn" data-id="${trans.id}">×</button>
                `;
                
                item.querySelector('.delete-btn').addEventListener('click', () => {
                    deleteTransaction(trans.id, type);
                });
                
                listElement.appendChild(item);
            });
        }

        function getFilteredTransactions(type) {
            const transactions = type === 'income' ? app.data.income : app.data.expenses;
            const currentDate = new Date(app.date);
            const currentDateStr = currentDate.toISOString().split('T')[0];
            
            return transactions.filter(trans => {
                const transDate = new Date(trans.date);
                
                switch(app.period) {
                    case 'day':
                        return trans.date === currentDateStr;
                    case 'week':
                        const weekStart = new Date(currentDate);
                        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekStart.getDate() + 6);
                        return transDate >= weekStart && transDate <= weekEnd;
                    case 'month':
                        return transDate.getMonth() === currentDate.getMonth() && 
                               transDate.getFullYear() === currentDate.getFullYear();
                    case 'year':
                        return transDate.getFullYear() === currentDate.getFullYear();
                    default:
                        return true;
                }
            });
        }

        // 6. Budget and Analytics
        function updateBudget() {
            const expenses = getFilteredTransactions('expense');
            const income = getFilteredTransactions('income');
            
            const totalExp = expenses.reduce((sum, t) => sum + t.amount, 0);
            const totalInc = income.reduce((sum, t) => sum + t.amount, 0);
            const balance = totalInc - totalExp;
            
            ui.totalExpenses.textContent = formatMoney(totalExp);
            ui.totalIncome.textContent = formatMoney(totalInc);
            ui.balance.textContent = formatMoney(balance);
            ui.budget.textContent = formatMoney(balance);
        }

        function initChart() {
    if (ui.chartCtx) {
        app.chart = new Chart(ui.chartCtx, {
            type: 'doughnut',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                cutout: '65%'
            }
        });
    }
}

        function updateChart() {
    if (!app.chart) return;

    const expenses = getFilteredTransactions('expense');

    if (expenses.length === 0) {
        if (ui.chartPlaceholder) {
            ui.chartPlaceholder.style.display = 'flex';
        }
        app.chart.data.labels = [];
        app.chart.data.datasets = [];
    } else {
        if (ui.chartPlaceholder) {
            ui.chartPlaceholder.style.display = 'none';
        }
        const categories = {};
        expenses.forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        });

        app.chart.data.labels = Object.keys(categories);
        app.chart.data.datasets = [{
            data: Object.values(categories),
            backgroundColor: generateChartColors(Object.keys(categories).length)
        }];
    }

    app.chart.update();
}


        function generateChartColors(count) {
            const baseColors = ['#1A5E43', '#217C58', '#2D9D6B', '#FEC760', '#FFD27A'];
            let colors = [];
            for (let i = 0; i < count; i++) {
                colors.push(baseColors[i % baseColors.length]);
            }
            return colors;
        }

        // 7. Goals System
        function loadGoals() {
            ui.goalAmount.value = app.data.goals.amount;
            ui.goalDate.value = app.data.goals.date;
            updateGoalProgress();
        }

        function saveGoals() {
            app.data.goals = {
                amount: parseFloat(ui.goalAmount.value),
                date: ui.goalDate.value
            };
            saveData();
            updateGoalProgress();
            showAlert('Goal saved successfully!', 'success');
        }

        function updateGoalProgress() {
            const totalIncome = app.data.income.reduce((sum, t) => sum + t.amount, 0);
            const totalExpenses = app.data.expenses.reduce((sum, t) => sum + t.amount, 0);
            const currentSavings = totalIncome - totalExpenses;
            const targetAmount = app.data.goals.amount;
            
            const progress = Math.min(Math.max(currentSavings / targetAmount * 100, 0), 100);
            ui.savingsProgress.style.width = `${progress}%`;
            ui.savingsText.textContent = `${progress.toFixed(1)}% to goal (${formatMoney(currentSavings)} / ${formatMoney(targetAmount)})`;
            ui.currentSavings.textContent = formatMoney(currentSavings);
            ui.targetAmountDisplay.textContent = formatMoney(targetAmount);
            
            const daysLeft = Math.ceil((new Date(app.data.goals.date) - new Date()) / (1000 * 60 * 60 * 24));
            const dailyNeed = daysLeft > 0 ? (targetAmount - currentSavings) / daysLeft : 0;
            ui.dailyNeeded.textContent = `${formatMoney(dailyNeed)}/day`;
        }

        // 8. Enhanced Limits System
        function loadLimits() {
            ui.limitsList.innerHTML = '';
            
            if (app.data.limits.length === 0) {
                ui.limitsList.innerHTML = `
                    <div class="no-limits">
                        <i class="fas fa-sliders-h"></i>
                        <p>No spending limits set</p>
                    </div>
                `;
                ui.limitsStatus.textContent = 'No active limits';
                return;
            }
            
            const expensesByCategory = {};
            app.data.expenses.forEach(expense => {
                expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount;
            });
            
            updateLimitsStatus(expensesByCategory);
            
            app.data.limits.forEach((limit, index) => {
                const spent = expensesByCategory[limit.category] || 0;
                const percentage = (spent / limit.amount) * 100;
                
                const limitItem = document.createElement('div');
                limitItem.className = 'limit-item';
                
                if (percentage >= 100) {
                    limitItem.classList.add('danger');
                } else if (percentage >= app.data.limitSettings.warningThreshold) {
                    limitItem.classList.add('warning');
                }
                
                limitItem.innerHTML = `
                    <div class="limit-item-info">
                        <div class="limit-category">${limit.category}</div>
                        <div class="limit-progress">
                            <div class="limit-progress-bar" style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                    </div>
                    <div class="limit-details">
                        <div class="limit-amount">${formatMoney(limit.amount)}</div>
                        <div class="limit-used ${percentage >= 100 ? 'danger' : percentage >= app.data.limitSettings.warningThreshold ? 'warning' : ''}">
                            ${formatMoney(spent)} (${percentage.toFixed(1)}%)
                        </div>
                    </div>
                    <button class="delete-limit" data-index="${index}">×</button>
                `;
                
                limitItem.querySelector('.delete-limit').addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteLimit(index);
                });
                
                ui.limitsList.appendChild(limitItem);
            });
        }
        
        function updateLimitsStatus(expensesByCategory) {
            let totalLimits = 0;
            let totalSpent = 0;
            let exceededLimits = 0;
            let warningLimits = 0;
            
            app.data.limits.forEach(limit => {
                const spent = expensesByCategory[limit.category] || 0;
                const percentage = (spent / limit.amount) * 100;
                
                totalLimits += limit.amount;
                totalSpent += spent;
                
                if (percentage >= 100) {
                    exceededLimits++;
                } else if (percentage >= app.data.limitSettings.warningThreshold) {
                    warningLimits++;
                }
            });
            
            const totalPercentage = totalLimits > 0 ? (totalSpent / totalLimits) * 100 : 0;
            
            if (exceededLimits > 0) {
                ui.limitsStatus.textContent = `${exceededLimits} limit(s) exceeded!`;
                ui.limitsStatus.parentElement.className = 'limits-info-banner danger';
            } else if (warningLimits > 0) {
                ui.limitsStatus.textContent = `${warningLimits} limit(s) near threshold`;
                ui.limitsStatus.parentElement.className = 'limits-info-banner warning';
            } else {
                ui.limitsStatus.textContent = `Total: ${formatMoney(totalSpent)} of ${formatMoney(totalLimits)} (${totalPercentage.toFixed(1)}%)`;
                ui.limitsStatus.parentElement.className = 'limits-info-banner';
            }
        }

        function addLimit() {
            ui.limitModal.style.display = 'block';
        }

        function saveLimit() {
            const category = ui.limitCategory.value.trim();
            const amount = parseFloat(ui.limitAmount.value);
            
            if (!category || isNaN(amount)) {
                alert('Please fill all fields correctly');
                return;
            }
            
            if (ui.autoAdjustLimit.checked) {
                const expenses = app.data.expenses.filter(e => e.category === category);
                const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
                const adjustedAmount = totalSpent * (app.data.limitSettings.autoAdjustPercentage / 100);
                
                if (adjustedAmount > amount) {
                    if (!confirm(`Auto-adjust will set limit to ${formatMoney(adjustedAmount)} based on your spending history. Continue?`)) {
                        return;
                    }
                    ui.limitAmount.value = adjustedAmount.toFixed(2);
                }
            }
            
            app.data.limits.push({
                category,
                amount: parseFloat(ui.limitAmount.value)
            });
            
            saveLimits();
            loadLimits();
            ui.limitModal.style.display = 'none';
            ui.limitCategory.value = '';
            ui.limitAmount.value = '';
            ui.autoAdjustLimit.checked = false;
            
            showAlert('Limit added successfully!', 'success');
        }

        function deleteLimit(index) {
            if (confirm('Delete this limit?')) {
                app.data.limits.splice(index, 1);
                saveLimits();
                loadLimits();
                showAlert('Limit deleted', 'success');
            }
        }

        function saveLimits() {
            localStorage.setItem(`${userDataKey}_limits`, JSON.stringify(app.data.limits));
        }

        function checkLimits() {
            if (!app.data.limitSettings.enableNotifications) return;
            
            const expensesByCategory = {};
            app.data.expenses.forEach(expense => {
                expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount;
            });
            
            app.data.limits.forEach(limit => {
                const spent = expensesByCategory[limit.category] || 0;
                const percentage = (spent / limit.amount) * 100;
                
                if (percentage >= 100) {
                    showAlert(`Limit exceeded! You've spent ${formatMoney(spent)} of ${formatMoney(limit.amount)} in ${limit.category}`, 'error');
                } else if (percentage >= app.data.limitSettings.warningThreshold) {
                    showAlert(`Approaching limit: ${formatMoney(spent)} of ${formatMoney(limit.amount)} in ${limit.category}`, 'warning');
                }
            });
        }

        // 9. Limit Settings
        function loadLimitSettings() {
            ui.warningThreshold.value = app.data.limitSettings.warningThreshold;
            ui.autoAdjustPercentage.value = app.data.limitSettings.autoAdjustPercentage;
            ui.enableNotifications.checked = app.data.limitSettings.enableNotifications;
        }

        function saveLimitSettings() {
            app.data.limitSettings = {
                warningThreshold: parseInt(ui.warningThreshold.value),
                autoAdjustPercentage: parseInt(ui.autoAdjustPercentage.value),
                enableNotifications: ui.enableNotifications.checked
            };
            
            localStorage.setItem(`${userDataKey}_limitSettings`, JSON.stringify(app.data.limitSettings));
            ui.limitSettingsModal.style.display = 'none';
            showAlert('Limit settings saved!', 'success');
            checkLimits();
        }

        // 10. Utility Functions
        function formatMoney(amount) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const currencySymbols = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        UAH: '₴',
        KZT: '₸',
        JPY: '¥'
    };
    const symbol = currencySymbols[currentUser.currency] || '$';
    return symbol + amount.toFixed(2);
}


        function showAlert(message, type) {
            if (!app.data.limitSettings.enableNotifications && type !== 'success') return;
            
            const alert = document.createElement('div');
            alert.className = `alert alert-${type}`;
            alert.textContent = message;
            document.body.appendChild(alert);
            
            setTimeout(() => {
                alert.remove();
            }, 3000);
        }

        function showPage(pageId) {
    ui.pages.forEach(page => {
        page.classList.remove('active');
    });
    ui.navBtns.forEach(btn => {
        btn.classList.remove('active');
    });

    const page = document.getElementById(pageId);
    const navBtn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);

    if (page) {
        page.classList.add('active');
    }
    if (navBtn) {
        navBtn.classList.add('active');
    }

    // Скрывать лимиты, если страница не "limits-page"
    if (pageId !== 'limits-page') {
        if (ui.limitsList) ui.limitsList.parentElement.style.display = 'none';
        if (ui.limitsStatus) ui.limitsStatus.style.display = 'none';
    } else {
        if (ui.limitsList) ui.limitsList.parentElement.style.display = 'block';
        if (ui.limitsStatus) ui.limitsStatus.style.display = 'block';
    }
}


        function saveData() {
            localStorage.setItem(`${userDataKey}_expenses`, JSON.stringify(app.data.expenses));
            localStorage.setItem(`${userDataKey}_income`, JSON.stringify(app.data.income));
            localStorage.setItem(`${userDataKey}_goals`, JSON.stringify(app.data.goals));
            localStorage.setItem(`${userDataKey}_limits`, JSON.stringify(app.data.limits));
            localStorage.setItem(`${userDataKey}_limitSettings`, JSON.stringify(app.data.limitSettings));
        }

        // 11. Event Listeners
        function setupEventListeners() {
    if (ui.addExpense) ui.addExpense.addEventListener('click', () => addTransaction('expense'));
    if (ui.addIncome) ui.addIncome.addEventListener('click', () => addTransaction('income'));
    if (ui.prevBtn) ui.prevBtn.addEventListener('click', () => changeDate(-1));
    if (ui.nextBtn) ui.nextBtn.addEventListener('click', () => changeDate(1));
    if (ui.dateInput) ui.dateInput.addEventListener('change', (e) => {
        app.date = new Date(e.target.value);
        refreshUI();
    });

    if (ui.periodBtns.length > 0) {
        ui.periodBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                ui.periodBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                changePeriod(this.dataset.period);
            });
        });
    }

    if (ui.navBtns.length > 0) {
        ui.navBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                showPage(this.dataset.page);
            });
        });
    }

    if (ui.saveGoalBtn) ui.saveGoalBtn.addEventListener('click', saveGoals);

    if (ui.limitsMenuBtn) ui.limitsMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (ui.limitsMenu) {
            ui.limitsMenu.classList.toggle('show');
        }
    });

    if (ui.autoLimitBtn) ui.autoLimitBtn.addEventListener('click', () => {
        autoAdjustLimits();
        if (ui.limitsMenu) {
            ui.limitsMenu.classList.remove('show');
        }
    });

    if (ui.resetLimitsBtn) ui.resetLimitsBtn.addEventListener('click', () => {
        if (confirm('Reset all spending limits?')) {
            app.data.limits = [];
            saveLimits();
            loadLimits();
            showAlert('All limits reset', 'success');
        }
        if (ui.limitsMenu) {
            ui.limitsMenu.classList.remove('show');
        }
    });

    if (ui.limitsSettingsBtn) ui.limitsSettingsBtn.addEventListener('click', () => {
        if (ui.limitSettingsModal) {
            ui.limitSettingsModal.style.display = 'block';
        }
        if (ui.limitsMenu) {
            ui.limitsMenu.classList.remove('show');
        }
    });

    if (ui.addLimitBtn) ui.addLimitBtn.addEventListener('click', addLimit);
    if (ui.confirmLimit) ui.confirmLimit.addEventListener('click', saveLimit);
    if (ui.saveLimitSettings) ui.saveLimitSettings.addEventListener('click', saveLimitSettings);

    if (ui.closeModal.length > 0) {
        ui.closeModal.forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.modal').style.display = 'none';
            });
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
        if (!e.target.closest('#limits-menu') && !e.target.closest('#limits-menu-btn')) {
            if (ui.limitsMenu) {
                ui.limitsMenu.classList.remove('show');
            }
        }
    });
}

        // 12. Auto-adjust limits based on expenses
        function autoAdjustLimits() {
            if (app.data.limits.length === 0) {
                showAlert('No limits to adjust', 'warning');
                return;
            }
            
            if (!confirm('This will adjust all limits based on your spending history. Continue?')) {
                return;
            }
            
            const expensesByCategory = {};
            app.data.expenses.forEach(expense => {
                expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount;
            });
            
            app.data.limits.forEach(limit => {
                const spent = expensesByCategory[limit.category] || 0;
                const adjustedAmount = spent * (app.data.limitSettings.autoAdjustPercentage / 100);
                
                if (adjustedAmount > limit.amount) {
                    limit.amount = parseFloat(adjustedAmount.toFixed(2));
                }
            });
            
            saveLimits();
            loadLimits();
            showAlert('Limits auto-adjusted successfully!', 'success');
        }

        // 13. KiTips System
        function initKiTips() {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser.completedTips) {
                currentUser.completedTips = [];
            }
            
            function updateTipsProgress() {
                document.querySelectorAll('.tip-card').forEach((card, index) => {
                    const isCompleted = currentUser.completedTips.includes(index);
                    const progressBar = card.querySelector('.progress-bar');
                    const button = card.querySelector('.mark-completed');
                    
                    if (isCompleted) {
                        progressBar.style.width = '100%';
                        button.textContent = '✓ Completed';
                        button.classList.add('completed');
                    } else {
                        progressBar.style.width = '0%';
                        button.textContent = 'Mark as completed';
                        button.classList.remove('completed');
                    }
                });
            }
            
            document.querySelectorAll('.mark-completed').forEach((btn, index) => {
                btn.addEventListener('click', function() {
                    if (!currentUser.completedTips.includes(index)) {
                        currentUser.completedTips.push(index);
                        localStorage.setItem('currentUser', JSON.stringify(currentUser));
                        
                        const users = JSON.parse(localStorage.getItem('users')) || [];
                        const userIndex = users.findIndex(u => u.id === currentUser.id);
                        if (userIndex !== -1) {
                            users[userIndex] = currentUser;
                            localStorage.setItem('users', JSON.stringify(users));
                        }
                        
                        updateTipsProgress();
                        showAlert('+5 points to financial awarenss', 'success');
                    }
                });
            });
            
            updateTipsProgress();
        }

        // Initialize the app
        init();
    }
});
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(function(registration) {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch(function(error) {
      console.log('Service Worker registration failed:', error);
    });
}