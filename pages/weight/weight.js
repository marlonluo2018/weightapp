// weight.js
const app = getApp();

Page({
  data: {
    currentWeight: 0,
    newWeight: '',
    recordDate: '',
    recordTime: '',
    notes: '',
    canSave: false,
    lastUpdateTime: '',
    weightHistory: [],
    targetWeight: 60,
    weekChange: 0,
    monthChange: 0,
    totalChange: 0,
    distanceToGoal: 0,
    hasTodayRecord: false,
    todayRecordWeight: 0
  },

  onLoad() {
    this.initPage();
  },

  onShow() {
    this.loadWeightData();
  },

  initPage() {
    const now = new Date();
    const today = app.formatDate(now);
    const currentTime = this.formatTime(now);

    this.setData({
      recordDate: today,
      recordTime: currentTime
    });

    this.loadWeightData();
  },

  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  loadWeightData() {
    try {
      const userData = app.getUserData();

      if (userData && userData.profile) {
        this.setData({
          targetWeight: userData.profile.targetWeight || 60
        });
      }

      if (userData && userData.records && userData.records.weight) {
        const weightRecords = userData.records.weight.sort((a, b) => b.timestamp - a.timestamp);

        this.setData({
          weightHistory: this.formatWeightHistory(weightRecords)
        });

        // 设置当前体重
        if (weightRecords.length > 0) {
          const latestRecord = weightRecords[0];
          this.setData({
            currentWeight: latestRecord.weight,
            lastUpdateTime: this.formatDateTime(latestRecord.timestamp)
          });

          // 更新用户档案中的当前体重
          this.updateCurrentWeightInProfile(latestRecord.weight);
        }

        // 检查今天是否有体重记录
        const today = app.formatDate(new Date());
        const todayRecord = weightRecords.find(record => record.date === today);
        if (todayRecord) {
          this.setData({
            hasTodayRecord: true,
            todayRecordWeight: todayRecord.weight
          });
        } else {
          this.setData({
            hasTodayRecord: false,
            todayRecordWeight: 0
          });
        }

        // 计算统计数据
        this.calculateWeightStats(weightRecords);
      }
    } catch (e) {
      console.error('加载体重数据失败', e);
    }
  },

  formatWeightHistory(records) {
    return records.map((record, index) => {
      const displayTime = this.formatDateTime(record.timestamp);
      let change = 0;

      if (index < records.length - 1) {
        change = record.weight - records[index + 1].weight;
      }

      return {
        ...record,
        displayTime,
        change: parseFloat(change.toFixed(1))
      };
    });
  },

  formatDateTime(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    if (date.toDateString() === today.toDateString()) {
      return `今天 ${this.formatTime(date)}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `昨天 ${this.formatTime(date)}`;
    } else {
      return `${app.formatDate(date)} ${this.formatTime(date)}`;
    }
  },

  updateCurrentWeightInProfile(weight) {
    try {
      const userData = app.getUserData();
      if (userData && userData.profile) {
        userData.profile.currentWeight = weight;
        app.saveUserData(userData);
      }
    } catch (e) {
      console.error('更新当前体重失败', e);
    }
  },

  calculateWeightStats(records) {
    if (records.length < 2) {
      return;
    }

    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    let weekChange = 0;
    let monthChange = 0;
    let totalChange = 0;

    // 计算周变化
    const weekRecord = records.find(record => record.timestamp >= oneWeekAgo);
    const oldestRecord = records[records.length - 1];

    if (weekRecord) {
      weekChange = records[0].weight - weekRecord.weight;
    }

    // 计算月变化
    const monthRecord = records.find(record => record.timestamp >= oneMonthAgo);
    if (monthRecord) {
      monthChange = records[0].weight - monthRecord.weight;
    }

    // 计算总体变化
    totalChange = records[0].weight - oldestRecord.weight;

    this.setData({
      weekChange: parseFloat(weekChange.toFixed(1)),
      monthChange: parseFloat(monthChange.toFixed(1)),
      totalChange: parseFloat(totalChange.toFixed(1)),
      distanceToGoal: parseFloat((records[0].weight - this.data.targetWeight).toFixed(1))
    });
  },

  onWeightInput(e) {
    this.setData({
      newWeight: e.detail.value
    });
    this.checkCanSave();
  },

  onDateChange(e) {
    this.setData({
      recordDate: e.detail.value
    });
  },

  onTimeChange(e) {
    this.setData({
      recordTime: e.detail.value
    });
  },

  onNotesInput(e) {
    this.setData({
      notes: e.detail.value
    });
  },

  checkCanSave() {
    const { newWeight, recordDate, recordTime } = this.data;
    const weight = parseFloat(newWeight);
    const canSave = !isNaN(weight) && weight > 0 && weight < 200 && recordDate && recordTime;
    this.setData({ canSave });
  },

  saveWeight() {
    if (!this.data.canSave) {
      return;
    }

    const weight = parseFloat(this.data.newWeight);
    const recordDateTime = new Date(`${this.data.recordDate} ${this.data.recordTime}`);

    const weightRecord = {
      weight: weight,
      notes: this.data.notes,
      timestamp: recordDateTime.getTime()
    };

    const success = app.addRecord('weight', weightRecord);

    if (success) {
      // 根据是否覆盖显示不同的成功提示
      const today = app.formatDate(new Date());
      const recordDate = app.formatDate(recordDateTime);
      
      if (this.data.hasTodayRecord && recordDate === today) {
        wx.showToast({
          title: '体重记录已更新！',
          icon: 'success',
          duration: 2000
        });
      } else {
        wx.showToast({
          title: '体重记录成功！',
          icon: 'success',
          duration: 2000
        });
      }

      // 清空表单
      this.setData({
        newWeight: '',
        notes: '',
        canSave: false
      });

      // 重新加载数据
      this.loadWeightData();

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
    console.log('体重记录完成，返回首页');

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

  deleteRecord(e) {
    const recordId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条体重记录吗？',
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

      if (userData && userData.records && userData.records.weight) {
        userData.records.weight = userData.records.weight.filter(record => record.id !== recordId);
        app.saveUserData(userData);

        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });

        this.loadWeightData();
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