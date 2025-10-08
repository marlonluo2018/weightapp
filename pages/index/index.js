// index.js - 首页
const app = getApp();

Page({
  data: {
    todayExercise: [],
    todayDiet: [],
    todayWeight: [],
    goalProgress: {
      daysLeft: 0,
      weightToLose: 0,
      percentage: 0,
      exerciseDays: 0,
      dietDays: 0,
      missedDays: 0
    }
  },

  onLoad() {
    console.log('首页 onLoad');
    // 清理开发环境头像路径
    this.cleanupDevAvatarPaths();
    this.loadTodayRecords();
    
    // 监听用户信息更新事件
    this.setupUserInfoListener();
  },

  onShow() {
    console.log('首页 onShow');
    // 清理开发环境头像路径
    this.cleanupDevAvatarPaths();
    this.loadTodayRecords();
    this.calculateGoalProgress();
    
    // 检查是否有用户信息更新
    this.checkUserInfoUpdate();
  },

  onUnload() {
    // 清理事件监听器
    this.cleanupUserInfoListener();
  },

  loadTodayRecords() {
    try {
      const userData = app.getUserData();
      const records = userData.records || {};
      const today = app.formatDate(new Date());

      const todayExercise = (records.exercise && records.exercise.filter(record => record.date === today)) || [];
      const todayDiet = (records.diet && records.diet.filter(record => record.date === today)) || [];
      const todayWeight = (records.weight && records.weight.filter(record => record.date === today)) || [];

      // 为运动记录添加时间格式化
      const formattedExercise = todayExercise.map(item => {
        item.time = item.time || this.formatTime(item.timestamp);
        return item;
      });

      // 为饮食记录添加时间格式化
      const formattedDiet = todayDiet.map(item => {
        item.time = item.time || this.formatTime(item.timestamp);
        return item;
      });

      // 为体重记录添加时间格式化和变化计算
      const formattedWeight = todayWeight.map(item => {
        item.time = item.time || this.formatTime(item.timestamp);
        item.bmi = this.calculateBMI(item.weight, (userData.profile && userData.profile.height));
        item.change = this.calculateWeightChange(item.weight, records.weight, today);
        return item;
      });

      this.setData({
        todayExercise: formattedExercise,
        todayDiet: formattedDiet,
        todayWeight: formattedWeight
      });
    } catch (e) {
      console.error('加载今日记录失败', e);
    }
  },

  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  },

  calculateBMI(weight, height) {
    if (!weight || !height) return '';
    const heightInMeters = height / 100;
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
    return bmi;
  },

  calculateWeightChange(currentWeight, weightRecords, today) {
    if (!weightRecords || weightRecords.length < 2) return 0;

    const todayRecords = weightRecords.filter(record => record.date === today);
    if (todayRecords.length <= 1) return 0;

    const sortedRecords = todayRecords.sort((a, b) => a.timestamp - b.timestamp);
    const firstWeight = sortedRecords[0].weight;
    return (currentWeight - firstWeight).toFixed(1);
  },

  // 设置用户信息更新监听器
  setupUserInfoListener: function() {
    try {
      // 监听用户信息更新事件
      app.on('userProfileUpdated', (profile) => {
        console.log('收到用户信息更新事件，刷新用户进度组件');
        this.refreshUserProgressComponent();
        this.calculateGoalProgress();
      });
    } catch (e) {
      console.error('设置用户信息监听器失败', e);
    }
  },

  // 刷新用户进度组件
  refreshUserProgressComponent: function() {
    try {
      const userProgressComponent = this.selectComponent('.user-progress');
      if (userProgressComponent && userProgressComponent.calculateProgress) {
        userProgressComponent.calculateProgress();
        console.log('用户进度组件已刷新');
      } else {
        console.warn('未找到用户进度组件或组件方法不存在');
      }
    } catch (e) {
      console.error('刷新用户进度组件失败', e);
    }
  },

  // 计算减肥目标进度
  calculateGoalProgress: function() {
    try {
      var userData = app.getUserData();
      var userInfo = userData.profile || {};

      // 如果没有设置当前体重，尝试从最新的体重记录中获取
      if (!userInfo.currentWeight && userData.records && userData.records.weight && userData.records.weight.length > 0) {
        var sortedWeightRecords = userData.records.weight.slice().sort(function(a, b) {
          return b.timestamp - a.timestamp;
        });
        userInfo.currentWeight = sortedWeightRecords[0].weight;
      }

      var currentWeight = parseFloat(userInfo.currentWeight) || 0;
      var targetWeight = parseFloat(userInfo.targetWeight) || 0;
      var initialWeight = parseFloat(userInfo.initialWeight) || currentWeight || 0;

      console.log('计算进度 - 当前体重:', currentWeight, '目标体重:', targetWeight, '初始体重:', initialWeight);

      var lostWeight = Math.max(0, initialWeight - currentWeight);
      var targetLoss = initialWeight - targetWeight;
      var percentage = targetLoss > 0 ? Math.min(100, Math.round((lostWeight / targetLoss) * 100)) : 0;
      var weightToLose = Math.max(0, currentWeight - targetWeight);

      // 计算距离目标日期的天数
      var targetDate = userInfo.targetDate;
      var daysLeft = 0;
      if (targetDate) {
        var today = new Date();
        var target = new Date(targetDate);
        var timeDiff = target.getTime() - today.getTime();
        daysLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24))); // 转换为天数
      }

      // 计算运动打卡天数和饮食打卡天数
      var exerciseDays = 0;
      var dietDays = 0;
      var missedDays = 0;
      
      if (userData.records) {
        // 计算运动打卡天数
        if (userData.records.exercise) {
          var exerciseDates = new Set();
          userData.records.exercise.forEach(function(record) {
            if (record.date) exerciseDates.add(record.date);
          });
          exerciseDays = exerciseDates.size;
        }
        
        // 计算饮食打卡天数
        if (userData.records.diet) {
          var dietDates = new Set();
          userData.records.diet.forEach(function(record) {
            if (record.date) dietDates.add(record.date);
          });
          dietDays = dietDates.size;
        }
        
        // 计算减肥计划开始天数（使用计划开始日期）
        var planStartDate = userInfo.planStartDate || app.formatDate(new Date());
        var startDate = new Date(planStartDate);
        var today = new Date();
        
        // 设置时间为同一天的开始时间，避免时间差影响天数计算
        startDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        // 计算天数差（包括开始当天）
        var timeDiff = today.getTime() - startDate.getTime();
        var persistenceDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
        
        // 计算未打卡天数（基于运动或饮食打卡）
        var totalCheckinDays = Math.max(exerciseDays, dietDays);
        missedDays = Math.max(0, persistenceDays - totalCheckinDays);
      }

      var progressData = {
        'goalProgress.weightToLose': weightToLose.toFixed(1),
        'goalProgress.percentage': percentage,
        'goalProgress.daysLeft': daysLeft,
        'goalProgress.exerciseDays': exerciseDays,
        'goalProgress.dietDays': dietDays,
        'goalProgress.missedDays': missedDays
      };

      console.log('进度数据:', progressData);

      this.setData(progressData);
    } catch (e) {
      console.error('计算进度失败', e);
      // 设置默认进度数据
      this.setData({
        'goalProgress.weightToLose': '0.0',
        'goalProgress.percentage': 0,
        'goalProgress.daysLeft': 0,
        'goalProgress.exerciseDays': 0,
        'goalProgress.missedDays': 0
      });
    }
  },

  // 检查用户信息更新并刷新组件
  checkUserInfoUpdate: function() {
    try {
      if (app.globalData && app.globalData.userInfoUpdated) {
        console.log('检测到用户信息更新，刷新用户进度组件');
        
        // 重置更新标志
        app.globalData.userInfoUpdated = false;
        
        this.refreshUserProgressComponent();
        this.calculateGoalProgress();
      }
    } catch (e) {
      console.error('检查用户信息更新失败', e);
    }
  },

  // 清理用户信息更新监听器
  cleanupUserInfoListener: function() {
    try {
      // 移除事件监听器
      app.off('userProfileUpdated');
      console.log('用户信息监听器已清理');
    } catch (e) {
      console.error('清理用户信息监听器失败', e);
    }
  },

  // 彻底清理开发环境头像路径
  cleanupDevAvatarPaths: function() {
    try {
      var userData = app.getUserData();
      if (userData && userData.profile && userData.profile.avatar) {
        var avatarPath = userData.profile.avatar;
        // 清理所有可能导致网络错误的路径
        if (avatarPath.includes('127.0.0.1') ||
            avatarPath.includes('__tmp__') ||
            avatarPath.includes('dev_mock_avatar_selected')) {
          console.log('首页：彻底清理开发环境的头像路径:', avatarPath);
          userData.profile.avatar = '';
          app.saveUserData(userData);
          console.log('首页：开发环境头像路径已清理');
        }
      }
    } catch (e) {
      console.error('首页：清理开发环境头像路径失败', e);
    }
  }
});