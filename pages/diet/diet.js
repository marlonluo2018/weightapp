// diet.js
const app = getApp();

Page({
  data: {
    selectedMeal: '',
    mealTypeText: '',
    foodName: '',
    portion: '',
    calories: '',
    notes: '',
    canSave: false,
    todayRecords: [],
    groupedRecords: [],
    todaySummary: {
      totalRecords: 0,
      totalCalories: 0,
      mealTypes: 0
    },
    mealTypeMap: {
      'breakfast': '早餐',
      'lunch': '午餐',
      'dinner': '晚餐',
      'snack': '加餐'
    }
  },

  onLoad() {
    this.loadTodayRecords();
  },

  onShow() {
    this.loadTodayRecords();
  },

  selectMealType(e) {
    const mealType = e.currentTarget.dataset.meal;
    const mealTypeText = this.data.mealTypeMap[mealType];

    this.setData({
      selectedMeal: mealType,
      mealTypeText: mealTypeText
    });

    this.checkCanSave();
  },

  onFoodNameInput(e) {
    this.setData({
      foodName: e.detail.value
    });
    this.checkCanSave();
  },

  onPortionInput(e) {
    this.setData({
      portion: e.detail.value
    });
    this.checkCanSave();
  },

  onCaloriesInput(e) {
    this.setData({
      calories: e.detail.value
    });
  },

  onNotesInput(e) {
    this.setData({
      notes: e.detail.value
    });
  },

  checkCanSave() {
    const { mealTypeText, foodName, portion } = this.data;
    const canSave = mealTypeText.trim() !== '' &&
                   foodName.trim() !== '' &&
                   portion.trim() !== '' &&
                   parseInt(portion) > 0;
    this.setData({ canSave });
  },

  saveDiet() {
    if (!this.data.canSave) {
      return;
    }

    const dietRecord = {
      mealType: this.data.selectedMeal,
      mealTypeText: this.data.mealTypeText,
      foodName: this.data.foodName,
      portion: parseInt(this.data.portion),
      calories: this.data.calories ? parseInt(this.data.calories) : null,
      notes: this.data.notes,
      timestamp: Date.now()
    };

    const success = app.addRecord('diet', dietRecord);

    if (success) {
      // 显示成功提示
      wx.showToast({
        title: '饮食记录成功！',
        icon: 'success',
        duration: 2000
      });

      // 清空表单
      this.setData({
        selectedMeal: '',
        mealTypeText: '',
        foodName: '',
        portion: '',
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
    console.log('饮食记录完成，返回首页');

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

      if (userData && userData.records && userData.records.diet) {
        const todayRecords = userData.records.diet.filter(record => record.date === today);
        this.setData({ todayRecords });

        // 按餐次分组
        const groupedRecords = this.groupRecordsByMeal(todayRecords);
        this.setData({ groupedRecords });

        // 计算今日统计
        const todaySummary = this.calculateTodaySummary(todayRecords);
        this.setData({ todaySummary });
      }
    } catch (e) {
      console.error('加载今日饮食记录失败', e);
    }
  },

  groupRecordsByMeal(records) {
    const grouped = {};
    const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];

    records.forEach(record => {
      if (!grouped[record.mealType]) {
        grouped[record.mealType] = {
          mealType: record.mealType,
          mealTypeText: record.mealTypeText,
          records: [],
          totalCalories: 0
        };
      }
      grouped[record.mealType].records.push(record);
      if (record.calories) {
        grouped[record.mealType].totalCalories += record.calories;
      }
    });

    // 按餐次顺序排序
    const result = [];
    mealOrder.forEach(mealType => {
      if (grouped[mealType]) {
        result.push(grouped[mealType]);
      }
    });

    return result;
  },

  calculateTodaySummary(records) {
    const summary = {
      totalRecords: records.length,
      totalCalories: 0,
      mealTypes: new Set()
    };

    records.forEach(record => {
      if (record.calories) {
        summary.totalCalories += record.calories;
      }
      summary.mealTypes.add(record.mealType);
    });

    summary.mealTypes = summary.mealTypes.size;

    return summary;
  },

  deleteRecord(e) {
    const recordId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条饮食记录吗？',
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

      if (userData && userData.records && userData.records.diet) {
        userData.records.diet = userData.records.diet.filter(record => record.id !== recordId);
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