document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const habitInput = document.getElementById('habitInput');
    const addHabitBtn = document.getElementById('addHabitBtn');
    const habitsContainer = document.getElementById('habitsContainer');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const activeHabitsCount = document.getElementById('activeHabitsCount');
    const totalCompletions = document.getElementById('totalCompletions');
    const bestStreak = document.getElementById('bestStreak');
    const completionRate = document.getElementById('completionRate');
    const currentMonthEl = document.getElementById('currentMonth');
    const calendarGrid = document.getElementById('calendarGrid');
    const achievementModal = document.getElementById('achievementModal');
    const achievementDetails = document.getElementById('achievementDetails');
    const closeButton = document.querySelector('.close-button');
    const currentDateEl = document.getElementById('currentDate');
    
    // Initialize habit data
    let habits = [];
    let currentFilter = 'all';
    let achievementsEarned = JSON.parse(localStorage.getItem('achievements')) || [];
    
    // Initialize calendar dates
    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();
    
    // Achievement definitions
    const achievements = [
        { id: 'first_habit', title: 'Getting Started', description: 'Create your first habit', icon: '🌱' },
        { id: 'first_completion', title: 'First Step', description: 'Complete a habit for the first time', icon: '✅' },
        { id: 'three_day_streak', title: 'On a Roll', description: 'Maintain a 3-day streak', icon: '🔥' },
        { id: 'seven_day_streak', title: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🏆' },
        { id: 'thirty_day_streak', title: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '⭐' },
        { id: 'perfect_week', title: 'Perfect Week', description: 'Complete all habits for 7 consecutive days', icon: '🌟' },
        { id: 'habit_diversity', title: 'Habit Collector', description: 'Track 5 different habits', icon: '📚' }
    ];
    
    // Set current date in header
    function setCurrentDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = today.toLocaleDateString('en-US', options);
    }
    
    // Load habits from localStorage
    function loadHabits() {
        const savedHabits = localStorage.getItem('habits');
        if (savedHabits) {
            habits = JSON.parse(savedHabits);
            updateStats();
            displayHabits();
            renderCalendar();
        }
    }
    
    // Save habits to localStorage
    function saveHabits() {
        localStorage.setItem('habits', JSON.stringify(habits));
        updateStats();
    }
    
    // Save achievements to localStorage
    function saveAchievements() {
        localStorage.setItem('achievements', JSON.stringify(achievementsEarned));
    }
    
    // Add a new habit
    function addHabit() {
        const habitName = habitInput.value.trim();
        
        if (habitName === '') {
            showNotification('Please enter a habit name', 'error');
            return;
        }
        
        // Check if habit already exists
        if (habits.some(habit => habit.name.toLowerCase() === habitName.toLowerCase())) {
            showNotification('This habit already exists', 'error');
            return;
        }
        
        // Create new habit object with enhanced tracking
        const today = new Date().toISOString().split('T')[0];
        const newHabit = {
            id: Date.now(),
            name: habitName,
            streak: 0,
            lastCompleted: null,
            completedToday: false,
            history: {}, // Track completion history by date
            longestStreak: 0,
            totalCompletions: 0,
            createdAt: today,
            color: getRandomColor() // Assign a random color for visual distinction
        };
        
        // Add to habits array
        habits.push(newHabit);
        
        // Save to localStorage
        saveHabits();
        
        // Clear input
        habitInput.value = '';
        
        // Check for "first habit" achievement
        if (habits.length === 1) {
            unlockAchievement('first_habit');
        }
        
        // Check for "habit diversity" achievement
        if (habits.length === 5) {
            unlockAchievement('habit_diversity');
        }
        
        // Display habits
        displayHabits();
        renderCalendar();
        
        showNotification('Habit added successfully', 'success');
    }
    
    // Display habits based on current filter
    function displayHabits() {
        habitsContainer.innerHTML = '';
        
        if (habits.length === 0) {
            habitsContainer.innerHTML = '<p class="no-habits">No habits added yet. Add a habit to get started!</p>';
            return;
        }
        
        // Filter habits based on current selection
        let filteredHabits = [...habits];
        
        if (currentFilter === 'completed') {
            filteredHabits = habits.filter(habit => habit.completedToday);
        } else if (currentFilter === 'pending') {
            filteredHabits = habits.filter(habit => !habit.completedToday);
        } else if (currentFilter === 'streak') {
            filteredHabits.sort((a, b) => b.streak - a.streak);
        }
        
        // Find the habit with the longest active streak
        const longestStreakHabit = habits.reduce((longest, current) => 
            current.streak > (longest?.streak || 0) ? current : longest, null);
        
        filteredHabits.forEach(habit => {
            const habitElement = document.createElement('div');
            habitElement.classList.add('habit-item');
            
            if (habit.completedToday) {
                habitElement.classList.add('completed');
            }
            
            // Calculate streak emoji based on streak length
            let streakEmoji = '';
            if (habit.streak >= 30) streakEmoji = '🔥';
            else if (habit.streak >= 14) streakEmoji = '💪';
            else if (habit.streak >= 7) streakEmoji = '✨';
            
            habitElement.innerHTML = `
                <div class="habit-left">
                    <div class="habit-color" style="background-color: ${habit.color};"></div>
                    <div class="habit-name">${habit.name}</div>
                </div>
                <div class="habit-details">
                    <div class="streak-badge ${habit.streak > 0 ? 'active' : ''}">
                        <i class="fas fa-bolt"></i> ${habit.streak} days ${streakEmoji}
                    </div>
                    <div class="streak-badge best">
                        <i class="fas fa-trophy"></i> Best: ${habit.longestStreak || 0}
                    </div>
                    <div class="action-btns">
                        <button class="btn ${habit.completedToday ? 'btn-primary' : 'btn-success'} check-btn" data-id="${habit.id}">
                            ${habit.completedToday ? '<i class="fas fa-check"></i> Done' : '<i class="fas fa-check"></i> Complete'}
                        </button>
                        <button class="btn btn-danger btn-icon delete-btn" data-id="${habit.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            habitsContainer.appendChild(habitElement);
        });

        // Add event listeners to buttons
        document.querySelectorAll('.check-btn').forEach(button => {
            button.addEventListener('click', markAsComplete);
        });
        
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', deleteHabit);
        });
    }
    
    // Mark habit as complete
    function markAsComplete() {
        const habitId = parseInt(this.getAttribute('data-id'));
        const habitIndex = habits.findIndex(habit => habit.id === habitId);
        
        if (habitIndex === -1) return;
        
        const today = new Date().toISOString().split('T')[0];
        const habit = habits[habitIndex];
        
        // If already completed today, do nothing
        if (habit.completedToday) {
            showNotification('Already completed today', 'info');
            return;
        }
        
        // Check if completed yesterday to maintain streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (habit.lastCompleted === yesterdayStr || habit.lastCompleted === null) {
            // Increase streak if completed yesterday or first time completing
            habit.streak++;
            
            // Check for streak achievements
            if (habit.streak === 3) {
                unlockAchievement('three_day_streak');
            } else if (habit.streak === 7) {
                unlockAchievement('seven_day_streak');
            } else if (habit.streak === 30) {
                unlockAchievement('thirty_day_streak');
            }
        } else if (habit.lastCompleted !== today) {
            // Reset streak if missed a day
            habit.streak = 1;
        }
        
        // Update longest streak if applicable
        if (habit.streak > habit.longestStreak) {
            habit.longestStreak = habit.streak;
        }
        
        // Track completion in history
        habit.history[today] = true;
        
        // Update completion stats
        habit.lastCompleted = today;
        habit.completedToday = true;
        habit.totalCompletions++;
        
        // Check for first completion achievement
        if (habits.reduce((total, h) => total + h.totalCompletions, 0) === 1) {
            unlockAchievement('first_completion');
        }
        
        // Check for perfect week achievement
        checkPerfectWeek();
        
        // Save and redisplay
        saveHabits();
        displayHabits();
        renderCalendar();
        
        showNotification(`${habit.name} completed!`, 'success');
    }
    
    // Delete habit
    function deleteHabit() {
        const habitId = parseInt(this.getAttribute('data-id'));
        const habitName = habits.find(h => h.id === habitId)?.name || 'Habit';
        
        if (!confirm(`Are you sure you want to delete "${habitName}"?`)) {
            return;
        }
        
        habits = habits.filter(habit => habit.id !== habitId);
        
        // Save and redisplay
        saveHabits();
        displayHabits();
        renderCalendar();
        
        showNotification(`${habitName} has been deleted`, 'info');
    }
    
    // Check for perfect week achievement
    function checkPerfectWeek() {
        // Get dates for the past 7 days
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }
        
        // Check if all habits were completed on all 7 days
        const perfectWeek = habits.every(habit => 
            dates.every(date => habit.history && habit.history[date])
        );
        
        if (perfectWeek && habits.length > 0) {
            unlockAchievement('perfect_week');
        }
    }
    
    // Unlock achievement
    function unlockAchievement(achievementId) {
        // Check if achievement was already earned
        if (achievementsEarned.includes(achievementId)) {
            return;
        }
        
        // Find achievement details
        const achievement = achievements.find(a => a.id === achievementId);
        if (!achievement) return;
        
        // Add to earned achievements
        achievementsEarned.push(achievementId);
        saveAchievements();
        
        // Show achievement modal
        achievementDetails.innerHTML = `
            <div class="achievement">
                <div class="achievement-icon">${achievement.icon}</div>
                <h3>${achievement.title}</h3>
                <p>${achievement.description}</p>
            </div>
        `;
        
        achievementModal.style.display = 'flex';
        
        // Play achievement sound
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3');
        audio.play().catch(e => console.log('Audio play prevented:', e));
    }
    
    // Show notification
    function showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let title, icon;
        
        switch(type) {
            case 'success':
                title = 'Success';
                icon = '<i class="fas fa-check-circle"></i>';
                break;
            case 'error':
                title = 'Error';
                icon = '<i class="fas fa-exclamation-circle"></i>';
                break;
            case 'info':
                title = 'Info';
                icon = '<i class="fas fa-info-circle"></i>';
                break;
        }
        
        notification.innerHTML = `
            <div class="notification-icon">
                ${icon}
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }
    
    // Generate random color for habits
    function getRandomColor() {
        const colors = [
            '#4361ee', '#3a0ca3', '#7209b7', '#f72585', 
            '#4cc9f0', '#4895ef', '#560bad', '#f15bb5',
            '#2a9d8f', '#e76f51', '#e9c46a', '#064789'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Calendar functions
    function renderCalendar() {
        // Clear the calendar grid
        calendarGrid.innerHTML = '';
        
        // Set current month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        currentMonthEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        
        // Get first day of month and number of days
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Add empty cells for days before the 1st of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'empty');
            calendarGrid.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.textContent = i;
            
            // Check if any habits were completed on this day
            const checkDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            const anyCompleted = habits.some(habit => habit.history && habit.history[checkDate]);
            
            if (anyCompleted) {
                dayElement.classList.add('completed');
            }
            
            // Highlight today
            const todayDate = new Date();
            if (i === todayDate.getDate() && 
                currentMonth === todayDate.getMonth() && 
                currentYear === todayDate.getFullYear()) {
                dayElement.classList.add('today');
            }
            
            calendarGrid.appendChild(dayElement);
        }
    }
    
    // Update statistics
    function updateStats() {
        // Count active habits
        activeHabitsCount.textContent = habits.length;
        
        // Calculate total completions
        const completions = habits.reduce((total, habit) => total + habit.totalCompletions, 0);
        totalCompletions.textContent = completions;
        
        // Find best streak
        const maxStreak = habits.reduce((max, habit) => 
            Math.max(max, habit.longestStreak), 0);
        bestStreak.textContent = maxStreak;
        
        // Calculate completion rate
        if (habits.length > 0) {
            const todayCompletions = habits.filter(habit => habit.completedToday).length;
            const rate = Math.round((todayCompletions / habits.length) * 100);
            completionRate.textContent = `${rate}%`;
        } else {
            completionRate.textContent = '0%';
        }
    }
    
    // Handle filter button clicks
    function handleFilterClick() {
        // Remove active class from all buttons
        filterBtns.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Set current filter
        currentFilter = this.getAttribute('data-filter');
        
        // Display filtered habits
        displayHabits();
    }
    
    // Check for new day
    function checkForNewDay() {
        const today = new Date().toISOString().split('T')[0];
        const lastChecked = localStorage.getItem('lastChecked');
        
        if (lastChecked !== today) {
            // Reset completedToday for all habits
            habits.forEach(habit => {
                habit.completedToday = false;
            });
            
            localStorage.setItem('lastChecked', today);
            saveHabits();
            displayHabits();
            renderCalendar();
        }
    }
    
    // Export/import functions
    function exportData() {
        const data = {
            habits,
            achievements: achievementsEarned,
            exportDate: new Date().toISOString()
        };
        
        const dataString = JSON.stringify(data);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataString);
        
        const exportLink = document.createElement('a');
        exportLink.setAttribute('href', dataUri);
        exportLink.setAttribute('download', 'habit-tracker-data.json');
        document.body.appendChild(exportLink);
        exportLink.click();
        document.body.removeChild(exportLink);
    }
    
    function importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.habits) {
                habits = data.habits;
                saveHabits();
            }
            
            if (data.achievements) {
                achievementsEarned = data.achievements;
                saveAchievements();
            }
            
            displayHabits();
            renderCalendar();
            updateStats();
            
            showNotification('Data imported successfully!', 'success');
        } catch (e) {
            showNotification('Error importing data. Invalid format.', 'error');
            console.error('Import error:', e);
        }
    }
    
    // Add export/import to window for console access
    window.exportHabitData = exportData;
    window.importHabitData = function(jsonString) {
        importData(jsonString);
    };
    
    // Event Listeners
    addHabitBtn.addEventListener('click', addHabit);
    
    habitInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addHabit();
        }
    });
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });
    
    // Close modal when clicking the × button
    closeButton.addEventListener('click', function() {
        achievementModal.style.display = 'none';
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === achievementModal) {
            achievementModal.style.display = 'none';
        }
    });
    
    // Add methods for navigating between months
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            // Previous month
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        } else if (e.key === 'ArrowRight') {
            // Next month
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        }
    });
    
    // Initialize on load
    setCurrentDate();
    loadHabits();
    renderCalendar();
    checkForNewDay();
    
    // Check for new day every minute
    setInterval(checkForNewDay, 60000);
    
    // Show welcome message
    setTimeout(() => {
        showNotification('Welcome to your Habit Dashboard!', 'info');
    }, 1000);
});