// exercise.js
const app = getApp();

Page({
  data: {
    selectedType: '',
    exerciseType: '',
    duration: '',
    calories: '',
    notes: '',
    canSave: false,
    todayRecords: [],
    exerciseTypeMap: {
      'running': '跑步',
      'walking': '步行',
      'cycling': '骑行',
      'swimming': '游泳',
      'yoga': '瑜伽',
      'gym': '健身'
    },
    // 运动类型对应的卡路里消耗率（每分钟消耗的卡路里）
    calorieRateMap: {
      'running': 10,    // 跑步：约10卡路里/分钟
      'walking': 4,     // 步行：约4卡路里/分钟
      'cycling': 8,     // 骑行：约8卡路里/分钟
      'swimming': 11,   // 游泳：约11卡路里/分钟
      'yoga': 3,        // 瑜伽：约3卡路里/分钟
      'gym': 7          // 健身：约7卡路里/分钟
    }
  },

  onLoad() {
    this.loadTodayRecords();
  },

  onShow() {
    this.loadTodayRecords();
  },

  selectExerciseType(e) {
    const type = e.currentTarget.dataset.type;
    const typeName = this.data.exerciseTypeMap[type];
    
    this.setData({
      selectedType: type,
      exerciseType: typeName
    });
    
    // 获取当前运动类型的卡路里消耗率
    const calorieRate = this.data.calorieRateMap[type];
    
    // 显示卡路里计算公式提示
    wx.showToast({
      title: `${typeName}卡路里计算：${calorieRate}卡/分钟 × 运动时长`,
      icon: 'none',
      duration: 3000
    });
    
    // 如果有运动时长，自动计算卡路里
    if (this.data.duration) {
      const calculatedCalories = Math.round(parseInt(this.data.duration) * calorieRate);
      this.setData({ calories: calculatedCalories.toString() });
    }
    
    this.checkCanSave();
  },

  onExerciseTypeInput(e) {
    this.setData({
      exerciseType: e.detail.value,
      selectedType: ''
    });
    this.checkCanSave();
  },

  onDurationInput(e) {
    const duration = e.detail.value;
    this.setData({ duration });
    
    // 如果有选中的运动类型，自动计算卡路里
    if (this.data.selectedType && duration) {
      const calorieRate = this.data.calorieRateMap[this.data.selectedType];
      const calculatedCalories = Math.round(parseInt(duration) * calorieRate);
      this.setData({ calories: calculatedCalories.toString() });
      
      // 显示卡路里计算公式提示
      const typeName = this.data.exerciseTypeMap[this.data.selectedType];
      wx.showToast({
        title: `${typeName}卡路里计算：${calorieRate}卡/分钟 × ${duration}分钟 = ${calculatedCalories}卡`,
        icon: 'none',
        duration: 3000
      });
    }
    
    this.checkCanSave();
  },

  onCaloriesInput(e) {
    this.setData({
      calories: e.detail.value
    });
    this.checkCanSave();
  },

  onNotesInput(e) {
    this.setData({
      notes: e.detail.value
    });
  },

  checkCanSave() {
    const { exerciseType, duration, calories } = this.data;
    const canSave = exerciseType.trim() !== '' && 
                   duration.trim() !== '' && 
                   parseInt(duration) > 0 &&
                   calories.trim() !== '' &&
                   parseInt(calories) > 0;
    this.setData({ canSave });
  },

  saveExercise() {
    if (!this.data.canSave) {
      return;
    }

    const exerciseRecord = {
      type: this.data.exerciseType,
      duration: parseInt(this.data.duration),
      calories: parseInt(this.data.calories), // 移除可选判断，直接使用
      notes: this.data.notes,
      timestamp: Date.now()
    };

    const success = app.addRecord('exercise', exerciseRecord);

    if (success) {
      // 显示成功提示
      wx.showToast({
        title: '运动打卡成功！',
        icon: 'success',
        duration: 2000
      });

      // 清空表单
      this.setData({
        selectedType: '',
        exerciseType: '',
        duration: '',
        calories: '',
        notes: '',
        canSave: false
      });

      // 重新加载今日记录
      this.loadTodayRecords();

      // 延迟返回首页，让用户看到成功提示
      setTimeout(() => {
        this.returnToHome();
      }, 1500);
    } else {
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      });
    }
  },

  returnToHome() {
    console.log('运动打卡完成，返回首页');

    // 直接使用 switchTab 跳转到首页，避免 navigateBack 的 webviewId 问题
    this.navigateToHome();
  },

  navigateToHome() {
    try {
      wx.switchTab({
        url: '/pages/index/index',
        success: () => {
          console.log('跳转到首页成功');
        },
        fail: (err) => {
          console.error('跳转到首页失败:', err);
          // 如果 switchTab 失败，尝试使用 redirectTo 作为备用方案
          wx.redirectTo({
            url: '/pages/index/index',
            fail: (redirectErr) => {
              console.error('备用跳转方案也失败:', redirectErr);
              wx.showToast({
                title: '跳转失败',
                icon: 'error'
              });
            }
          });
        }
      });
    } catch (error) {
      console.error('导航异常:', error);
      wx.showToast({
        title: '导航异常',
        icon: 'error'
      });
    }
  },

  loadTodayRecords() {
    try {
      const userData = app.getUserData();
      const today = app.formatDate(new Date());

      if (userData && userData.records && userData.records.exercise) {
        const todayRecords = userData.records.exercise.filter(record => record.date === today);
        this.setData({ todayRecords });
      }
    } catch (e) {
      console.error('加载今日运动记录失败', e);
    }
  },

  deleteRecord(e) {
    const recordId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条运动记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteRecordById(recordId);
        }
      }
    });
  },

  deleteRecordById(recordId) {
    try {
      let userData = app.getUserData();

      if (userData && userData.records && userData.records.exercise) {
        userData.records.exercise = userData.records.exercise.filter(record => record.id !== recordId);
        app.saveUserData(userData);

        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });

        this.loadTodayRecords();
      }
    } catch (e) {
      console.error('删除记录失败', e);
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
    }
  }
});