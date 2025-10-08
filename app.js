// app.js
App({
  onLaunch: function() {
    console.log('App onLaunch 开始');
    this.initLocalStorage();
    console.log('App onLaunch 完成');
  },

  initLocalStorage: function() {
    // 初始化本地数据存储
    console.log('initLocalStorage 开始');
    try {
      var userData = wx.getStorageSync('userData');
      if (!userData) {
        console.log('创建新的用户数据');
        userData = {
          profile: {
            nickname: '用户',
            avatar: '',
            targetWeight: 60,
            currentWeight: 65,
            initialWeight: 70,
            height: 170,
            targetDate: '',
            plan: '',
            planStartDate: this.formatDate(new Date()),
            isFirstTime: true  // 添加首次使用标志
          },
          records: {
            exercise: [],
            diet: [],
            weight: []
          }
        };
        wx.setStorageSync('userData', userData);
        console.log('用户数据保存完成');
      } else {
        console.log('用户数据已存在');
      }
    } catch (e) {
      console.error('初始化本地存储失败', e);
    }
    console.log('initLocalStorage 完成');
  },

  getUserData: function() {
    try {
      return wx.getStorageSync('userData') || {};
    } catch (e) {
      console.error('获取用户数据失败', e);
      return {};
    }
  },

  saveUserData: function(userData) {
    try {
      wx.setStorageSync('userData', userData);
      return true;
    } catch (e) {
      console.error('保存用户数据失败', e);
      return false;
    }
  },

  setUserData: function(userData) {
    // 保持向后兼容，调用 saveUserData
    return this.saveUserData(userData);
  },

  addRecord: function(type, record) {
    try {
      var userData = this.getUserData();
      record.id = Date.now();
      record.date = this.formatDate(new Date(record.timestamp));
      
      // 特殊处理体重记录：每天只能有一条记录，新记录覆盖旧记录
      if (type === 'weight') {
        // 检查今天是否已经有体重记录
        const today = record.date;
        const existingRecords = userData.records[type] || [];
        const todayRecordIndex = existingRecords.findIndex(r => r.date === today);
        
        if (todayRecordIndex >= 0) {
          // 如果今天已经有记录，直接覆盖（不显示确认提示）
          existingRecords.splice(todayRecordIndex, 1);
          existingRecords.unshift(record);
          userData.records[type] = existingRecords;
          this.saveUserData(userData);
          
          // 更新当前体重到用户档案
          this.updateCurrentWeightInProfile(record.weight);
          
          return true;
        } else {
          // 今天没有记录，正常添加
          existingRecords.unshift(record);
          userData.records[type] = existingRecords;
          this.saveUserData(userData);
          
          // 更新当前体重到用户档案
          this.updateCurrentWeightInProfile(record.weight);
          
          return true;
        }
      } else {
        // 其他类型记录正常添加
        userData.records[type].unshift(record);
        this.saveUserData(userData);
        return true;
      }
    } catch (e) {
      console.error('添加记录失败', e);
      return false;
    }
  },

  updateCurrentWeightInProfile: function(weight) {
    try {
      var userData = this.getUserData();
      if (userData && userData.profile) {
        userData.profile.currentWeight = weight;
        this.saveUserData(userData);
      }
    } catch (e) {
      console.error('更新当前体重失败', e);
    }
  },

  formatDate: function(date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();

    if (month < 10) {
      month = '0' + month;
    }
    if (day < 10) {
      day = '0' + day;
    }

    return year + '-' + month + '-' + day;
  },

  globalData: {
    userInfo: null,
    userInfoUpdated: false,
    lastUpdateTime: 0
  },

  // 全局事件系统
  events: {},

  // 监听事件
  on: function(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  },

  // 触发事件
  emit: function(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error('事件回调执行失败', e);
        }
      });
    }
  },

  // 移除事件监听
  off: function(event, callback) {
    if (this.events[event]) {
      const index = this.events[event].indexOf(callback);
      if (index > -1) {
        this.events[event].splice(index, 1);
      }
    }
  }
});
