// user-progress.js - 用户信息和今日概览组件
const app = getApp();

Component({
  data: {
    userInfo: {},
    todayStats: {
      exerciseMinutes: 0,
      dietRecords: 0
    },
    progress: {
      persistenceDays: 0,        // 减肥计划开始天数
      consecutiveDays: 0,        // 连续打卡天数
      exerciseDays: 0,           // 运动打卡天数
      dietDays: 0,               // 饮食打卡天数
      lostWeight: '0.0',
      targetWeight: '0.0',
      percentage: 0
    },
    todayExerciseRecords: [],
    todayDietRecords: [],
    showMilestone: false,
    milestone: null,
    lastMilestoneDay: 0,
    hasShownFirstDayMilestone: false
  },

  lifetimes: {
    attached() {
      console.log('user-progress组件加载');
      this.calculateProgress();
      
      // 监听用户信息更新事件
      app.on('userProfileUpdated', (profile) => {
        console.log('收到用户信息更新事件，刷新组件数据', profile);
        // 重新计算所有进度数据，确保头像和其他信息都更新
        this.calculateProgress();
      });
    },
    
    detached() {
      // 清理事件监听
      app.off('userProfileUpdated');
    }
  },

  pageLifetimes: {
    show() {
      console.log('user-progress页面显示，刷新数据');
      this.calculateProgress();
    }
  },

  methods: {
    calculateProgress() {
      try {
        const userData = app.getUserData();
        let userInfo = userData.profile || {};
        const records = userData.records || {};

        // 如果没有设置当前体重，尝试从最新的体重记录中获取
        if (!userInfo.currentWeight && records.weight && records.weight.length > 0) {
          const sortedWeightRecords = [...records.weight].sort((a, b) => b.timestamp - a.timestamp);
          userInfo.currentWeight = sortedWeightRecords[0].weight;
        }

        // 检查头像文件是否存在，如果不存在则清除头像路径
        if (userInfo.avatar) {
          // 彻底清理所有开发环境的头像路径
          if (userInfo.avatar.includes('127.0.0.1') ||
              userInfo.avatar.includes('__tmp__') ||
              userInfo.avatar.includes('dev_mock_avatar_selected')) {
            console.log('彻底清理开发环境的头像路径:', userInfo.avatar);
            userInfo.avatar = '';
          } else if (!this.checkAvatarFileExists(userInfo.avatar)) {
            console.log('头像文件不存在，清除头像路径');
            userInfo.avatar = '';
          }
        }

        // 计算各种统计指标
        const persistenceDays = this.calculatePersistenceDays(userInfo); // 减肥计划开始天数
        const consecutiveDays = this.calculateConsecutiveDays(records);  // 连续打卡天数
        const exerciseDays = this.calculateExerciseDays(records);        // 运动打卡天数
        const dietDays = this.calculateDietDays(records);                // 饮食打卡天数

        // 计算减肥进度
        const currentWeight = parseFloat(userInfo.currentWeight) || 0;
        const targetWeight = parseFloat(userInfo.targetWeight) || 0;
        const initialWeight = parseFloat(userInfo.initialWeight) || (currentWeight + 5);
        const lostWeight = Math.max(0, initialWeight - currentWeight);
        const targetLoss = initialWeight - targetWeight;
        const percentage = targetLoss > 0 ? Math.min(100, Math.round((lostWeight / targetLoss) * 100)) : 0;

        // 计算今日统计
        const todayStr = app.formatDate(new Date());
        const todayExercise = (records.exercise && records.exercise.filter(record => record.date === todayStr)) || [];
        const todayDiet = (records.diet && records.diet.filter(record => record.date === todayStr)) || [];
        const totalMinutes = todayExercise.reduce((sum, record) => sum + (record.duration || 0), 0);

        this.setData({
          userInfo,
          todayStats: {
            exerciseMinutes: totalMinutes,
            dietRecords: todayDiet.length
          },
          progress: {
            persistenceDays: persistenceDays,
            consecutiveDays: consecutiveDays,
            exerciseDays: exerciseDays,
            dietDays: dietDays,
            lostWeight: lostWeight.toFixed(1),
            targetWeight: targetWeight.toFixed(1),
            percentage: percentage
          },
          todayExerciseRecords: todayExercise,
          todayDietRecords: todayDiet
        });

        // 检查里程碑
        this.checkMilestones(persistenceDays);
      } catch (e) {
        console.error('计算进度失败', e);
      }
    },

    // 检查头像文件是否存在
    checkAvatarFileExists: function(avatarPath) {
      if (!avatarPath) return false;
      
      // 如果是网络图片，直接返回true
      if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
        return true;
      }
      
      // 如果是临时文件路径，返回true（可能正在上传）
      if (avatarPath.startsWith('wxfile://')) {
        return true;
      }
      
      // 如果是开发服务器路径，返回true（开发环境）
      if (avatarPath.includes('127.0.0.1') || avatarPath.includes('__tmp__')) {
        return true;
      }
      
      // 检查本地文件是否存在
      try {
        const fs = wx.getFileSystemManager();
        fs.accessSync(avatarPath);
        return true;
      } catch (e) {
        console.log('头像文件不存在:', avatarPath);
        return false;
      }
    },

    goToExercise() {
      wx.navigateTo({
        url: '/pages/exercise/exercise'
      });
    },

    goToDiet() {
      wx.navigateTo({
        url: '/pages/diet/diet'
      });
    },

    goToWeight() {
      wx.navigateTo({
        url: '/pages/weight/weight'
      });
    },

    // 计算减肥计划开始天数
    calculatePersistenceDays(userInfo) {
      try {
        // 获取计划开始日期，如果没有则使用今天
        const planStartDate = userInfo.planStartDate || app.formatDate(new Date());
        const startDate = new Date(planStartDate);
        const today = new Date();
        
        // 设置时间为同一天的开始时间，避免时间差影响天数计算
        startDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        // 计算天数差（包括开始当天）
        const timeDiff = today.getTime() - startDate.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
        
        console.log('减肥计划开始天数:', daysDiff, '计划开始日期:', planStartDate);
        return Math.max(1, daysDiff);
      } catch (e) {
        console.error('计算减肥计划天数失败', e);
        return 1;
      }
    },

    // 计算连续打卡天数
    calculateConsecutiveDays(records) {
      try {
        const allDates = new Set();

        // 收集所有有打卡记录的日期
        if (records.exercise) {
          records.exercise.forEach(record => {
            if (record.date) allDates.add(record.date);
          });
        }

        if (records.diet) {
          records.diet.forEach(record => {
            if (record.date) allDates.add(record.date);
          });
        }

        if (records.weight) {
          records.weight.forEach(record => {
            if (record.date) allDates.add(record.date);
          });
        }

        if (allDates.size === 0) {
          return 0;
        }

        // 将日期转换为数组并排序（从晚到早）
        const sortedDates = Array.from(allDates).sort().reverse();
        console.log('所有打卡日期（倒序）:', sortedDates);

        // 计算连续打卡的天数
        let consecutiveDays = 1;
        const today = app.formatDate(new Date());

        // 从今天开始往前计算连续天数
        for (let i = 0; i < sortedDates.length - 1; i++) {
          const currentDate = new Date(sortedDates[i]);
          const nextDate = new Date(sortedDates[i + 1]);

          // 计算两个日期的差值（天）
          const timeDiff = currentDate.getTime() - nextDate.getTime();
          const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

          console.log(`日期比较: ${sortedDates[i]} -> ${sortedDates[i+1]}, 天数差: ${daysDiff}`);

          if (daysDiff === 1) {
            consecutiveDays++;
          } else {
            // 如果日期不连续，停止计算
            break;
          }
        }

        // 检查今天是否有打卡记录
        const hasTodayRecord = allDates.has(today);
        console.log('今天是否有打卡记录:', hasTodayRecord, '连续天数:', consecutiveDays);

        // 如果今天没有打卡记录，且连续天数大于1，说明连续打卡中断了
        if (!hasTodayRecord && consecutiveDays > 1) {
          consecutiveDays--;
        }

        console.log('最终坚持天数:', consecutiveDays);
        return Math.max(1, consecutiveDays);

      } catch (e) {
        console.error('计算连续打卡天数失败', e);
        return 0;
      }
    },

    // 计算运动打卡天数
    calculateExerciseDays(records) {
      try {
        const exerciseDates = new Set();
        
        if (records.exercise) {
          records.exercise.forEach(record => {
            if (record.date) exerciseDates.add(record.date);
          });
        }
        
        console.log('运动打卡天数:', exerciseDates.size);
        return exerciseDates.size;
      } catch (e) {
        console.error('计算运动打卡天数失败', e);
        return 0;
      }
    },

    // 计算饮食打卡天数
    calculateDietDays(records) {
      try {
        const dietDates = new Set();
        
        if (records.diet) {
          records.diet.forEach(record => {
            if (record.date) dietDates.add(record.date);
          });
        }
        
        console.log('饮食打卡天数:', dietDates.size);
        return dietDates.size;
      } catch (e) {
        console.error('计算饮食打卡天数失败', e);
        return 0;
      }
    },


    // 里程碑检测
    checkMilestones(persistenceDays) {
      const milestones = [
        { day: 1, title: '开始之旅', desc: '恭喜你开始了减肥之旅！继续保持！' },
        { day: 7, title: '一周达人', desc: '坚持一周了！你已经养成了好习惯！' },
        { day: 14, title: '双周坚持', desc: '两周的坚持，太棒了！目标就在前方！' },
        { day: 30, title: '月度冠军', desc: '坚持一个月！你已经成为更好的自己！' },
        { day: 60, title: '双月英雄', desc: '60天的坚持！你的毅力令人敬佩！' },
        { day: 100, title: '百日达人', desc: '100天！你创造了属于自己的奇迹！' }
      ];

      for (const milestone of milestones) {
        if (persistenceDays === milestone.day) {
          // 特殊处理第1天的里程碑，只显示一次
          if (milestone.day === 1) {
            if (!this.data.hasShownFirstDayMilestone) {
              // 检查是否是首次使用，如果是则延迟显示"开始之旅"庆祝
              const userData = app.getUserData();
              const isFirstTime = userData && userData.profile && userData.profile.isFirstTime;
              
              if (isFirstTime) {
                console.log('首次使用用户，延迟显示"开始之旅"庆祝');
                // 首次使用用户，让个人资料页的欢迎提示先显示
                setTimeout(() => {
                  this.showMilestoneCelebration(milestone);
                  this.setData({
                    lastMilestoneDay: milestone.day,
                    hasShownFirstDayMilestone: true
                  });
                }, 3000); // 延迟3秒，确保个人资料页的欢迎提示先显示并关闭
              } else {
                this.showMilestoneCelebration(milestone);
                this.setData({
                  lastMilestoneDay: milestone.day,
                  hasShownFirstDayMilestone: true
                });
              }
            }
          } else {
            this.showMilestoneCelebration(milestone);
            this.setData({ lastMilestoneDay: milestone.day });
          }
          break;
        }
      }
    },

    // 显示里程碑庆祝
    showMilestoneCelebration(milestone) {
      this.setData({
        showMilestone: true,
        milestone: milestone
      });

      // 播放庆祝音效（如果需要）
      this.playCelebrationSound();
    },

    // 关闭庆祝弹窗
    closeCelebration() {
      this.setData({
        showMilestone: false,
        milestone: null
      });
    },

    // 播放庆祝音效
    playCelebrationSound() {
      // 可以在这里添加音效播放逻辑
      // 微信小程序可以使用 wx.createInnerAudioContext()
    }
  }
});