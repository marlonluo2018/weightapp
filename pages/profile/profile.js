// profile.js
const app = getApp();

Page({
  data: {
    profile: {
      nickname: '',
      avatar: '',
      height: 170,
      currentWeight: 65,
      targetWeight: 60,
      targetDate: '',
      planStartDate: '',
      plan: '',
      isFirstTime: false
    },
    originalProfile: {},
    hasChanges: false,
    joinTime: '',
    today: '',
    themeBackground: '#f8f8f8',
    bmi: {
      value: 0,
      category: '',
      categoryText: '',
      indicatorPosition: 0
    },
    goalProgress: {
      daysLeft: 0,
      weightToLose: 0,
      percentage: 0
    },
    showFirstTimeModal: false  // 添加首次使用模态框显示状态
  },

  onLoad: function() {
    console.log('Profile onLoad 开始');
    // 立即清理开发环境头像路径
    this.cleanupDevAvatarPaths();
    this.initPage();
    console.log('Profile onLoad 完成');
  },

  onShow: function() {
    console.log('Profile onShow 开始');
    // 每次显示页面时都清理开发环境头像路径
    this.cleanupDevAvatarPaths();
    this.loadProfile();
    console.log('Profile onShow 完成');
  },

  initPage: function() {
    var today = app.formatDate(new Date());
    this.setData({ today: today });

    // 设置加入时间
    try {
      var userData = app.getUserData();
      var profile = userData.profile || {};
      
      // 如果用户数据中没有加入时间，则设置今天为加入时间
      if (!profile.joinTime) {
        profile.joinTime = today;
        userData.profile = profile;
        app.saveUserData(userData);
      }
      
      this.setData({ joinTime: profile.joinTime || today });
    } catch (e) {
      console.error('设置加入时间失败', e);
    }

    this.loadProfile();
  },

  loadProfile: function() {
    try {
      var userData = app.getUserData();
      console.log('加载用户数据:', userData);

      // 从userData中获取profile，如果没有则使用默认值
      var profile = userData.profile || {};
      
      // 彻底清理开发环境的头像路径
      if (profile.avatar) {
        // 清理所有可能导致网络错误的路径
        if (profile.avatar.includes('127.0.0.1') ||
            profile.avatar.includes('__tmp__') ||
            profile.avatar.includes('dev_mock_avatar_selected')) {
          console.log('彻底清理开发环境的头像路径:', profile.avatar);
          profile.avatar = '';
          // 立即保存清理后的数据
          userData.profile = profile;
          app.saveUserData(userData);
        }
      }

      // 确保profile有所有必要的字段
      var defaultProfile = {
        nickname: '用户',
        avatar: '',
        height: 170,
        currentWeight: 65,
        targetWeight: 60,
        initialWeight: 70, // 添加初始体重字段
        targetDate: '',
        planStartDate: app.formatDate(new Date()), // 默认使用今天作为计划开始日期
        plan: '',
        isFirstTime: false
      };

      var finalProfile = {};
      for (var key in defaultProfile) {
        finalProfile[key] = profile[key] !== undefined ? profile[key] : defaultProfile[key];
      }

      console.log('最终个人资料:', finalProfile);

      this.setData({
        profile: finalProfile,
        originalProfile: JSON.parse(JSON.stringify(finalProfile))
      }, function() {
        console.log('数据设置完成，开始计算');
        this.calculateBMI();
        this.calculateGoalProgress();

        // 检查是否是首次使用，如果是则显示欢迎提示
        if (finalProfile.isFirstTime) {
          console.log('检测到首次使用用户，准备显示欢迎提示');
          // 使用防抖机制，确保只显示一次
          if (!this._hasShownWelcome) {
            this._hasShownWelcome = true;
            setTimeout(() => {
              this.showFirstTimeWelcome();
            }, 1000); // 稍微延迟，确保页面完全加载
          }
        }

        // 强制更新一次进度数据，确保显示
        setTimeout(function() {
          console.log('延迟计算进度');
          this.calculateGoalProgress();
        }.bind(this), 100);
      }.bind(this));

    } catch (e) {
      console.error('加载个人资料失败', e);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  saveProfile: function() {
    if (!this.validateProfile()) {
      return;
    }

    // 显示加载提示
    wx.showLoading({
      title: '保存中...',
      mask: true
    });

    try {
      var userData = app.getUserData();
      userData.profile = this.data.profile;
      
      // 如果是首次使用，保存后标记为非首次使用
      if (userData.profile.isFirstTime) {
        userData.profile.isFirstTime = false;
      }
      
      if (app.saveUserData(userData)) {
        console.log('个人资料保存成功');
        
        this.setData({
          originalProfile: JSON.parse(JSON.stringify(this.data.profile)),
          hasChanges: false
        });

        // 保存成功后重新计算所有数据
        this.calculateBMI();
        this.calculateGoalProgress();

        wx.hideLoading();
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });

        // 触发全局事件，通知其他页面用户信息已更新
        this.triggerUserInfoUpdate();
        this.notifyHomePageUpdate();

      } else {
        throw new Error('保存用户数据失败');
      }

    } catch (e) {
      console.error('保存个人资料失败', e);
      wx.hideLoading();
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      });
    }
  },

  validateProfile: function() {
    var profile = this.data.profile;

    if (!profile.height || profile.height < 100 || profile.height > 250) {
      wx.showToast({
        title: '请输入正确的身高',
        icon: 'error'
      });
      return false;
    }

    if (!profile.currentWeight || profile.currentWeight < 30 || profile.currentWeight > 200) {
      wx.showToast({
        title: '请输入正确的体重',
        icon: 'error'
      });
      return false;
    }

    if (!profile.targetWeight || profile.targetWeight < 30 || profile.targetWeight > 200) {
      wx.showToast({
        title: '请输入正确的目标体重',
        icon: 'error'
      });
      return false;
    }

    if (!profile.initialWeight || profile.initialWeight < 30 || profile.initialWeight > 300) {
      wx.showToast({
        title: '请输入正确的初始体重',
        icon: 'error'
      });
      return false;
    }

    return true;
  },

  calculateBMI: function() {
    var height = this.data.profile.height / 100; // 转换为米
    var weight = this.data.profile.currentWeight;
    var bmi = weight / (height * height);

    var category = '';
    var categoryText = '';
    var indicatorPosition = 0;

    if (bmi < 18.5) {
      category = 'underweight';
      categoryText = '偏瘦';
      indicatorPosition = (bmi / 18.5) * 25; // 0-25%
    } else if (bmi < 24) {
      category = 'normal';
      categoryText = '正常';
      indicatorPosition = 25 + ((bmi - 18.5) / (24 - 18.5)) * 50; // 25-75%
    } else if (bmi < 28) {
      category = 'overweight';
      categoryText = '偏胖';
      indicatorPosition = 75 + ((bmi - 24) / (28 - 24)) * 20; // 75-95%
    } else {
      category = 'obese';
      categoryText = '肥胖';
      indicatorPosition = Math.min(95, 95 + ((bmi - 28) / 10) * 5); // 95-100%
    }

    this.setData({
      'bmi.value': bmi.toFixed(1),
      'bmi.category': category,
      'bmi.categoryText': categoryText,
      'bmi.indicatorPosition': indicatorPosition
    });
  },

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

      var currentWeight = parseFloat(userInfo.currentWeight) || this.data.profile.currentWeight || 0;
      var targetWeight = parseFloat(userInfo.targetWeight) || this.data.profile.targetWeight || 0;
      var initialWeight = parseFloat(userInfo.initialWeight) || currentWeight || 0;

      console.log('计算进度 - 当前体重:', currentWeight, '目标体重:', targetWeight, '初始体重:', initialWeight);

      var lostWeight = Math.max(0, initialWeight - currentWeight);
      var targetLoss = initialWeight - targetWeight;
      var percentage = targetLoss > 0 ? Math.min(100, Math.round((lostWeight / targetLoss) * 100)) : 0;
      var weightToLose = Math.max(0, currentWeight - targetWeight);

      // 计算距离目标日期的天数
      var targetDate = userInfo.targetDate || this.data.profile.targetDate;
      var daysLeft = 0;
      if (targetDate) {
        var today = new Date();
        var target = new Date(targetDate);
        var timeDiff = target.getTime() - today.getTime();
        daysLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24))); // 转换为天数
      }

      var progressData = {
        'goalProgress.weightToLose': weightToLose.toFixed(1),
        'goalProgress.percentage': percentage,
        'goalProgress.daysLeft': daysLeft
      };

      console.log('进度数据:', progressData);

      this.setData(progressData);
    } catch (e) {
      console.error('计算进度失败', e);
      // 设置默认进度数据
      this.setData({
        'goalProgress.weightToLose': '0.0',
        'goalProgress.percentage': 0,
        'goalProgress.daysLeft': 0
      });
    }
  },

  onInputChange: function(e) {
    var field = e.currentTarget.dataset.field;
    var value = e.detail.value;

    this.setData({
      ['profile.' + field]: value,
      hasChanges: true
    }, function() {
      if (field === 'height' || field === 'currentWeight') {
        this.calculateBMI();
      }
      if (field === 'currentWeight' || field === 'targetWeight') {
        this.calculateGoalProgress();
      }
    }.bind(this));
  },


  resetProfile: function() {
    wx.showModal({
      title: '确认重置',
      content: '确定要重置所有个人资料吗？此操作不可恢复。',
      success: function(res) {
        if (res.confirm) {
          try {
            wx.removeStorageSync('userProfile');
            wx.removeStorageSync('joinTime');
            this.loadProfile();
            wx.showToast({
              title: '重置成功',
              icon: 'success'
            });
          } catch (e) {
            console.error('重置失败', e);
            wx.showToast({
              title: '重置失败',
              icon: 'error'
            });
          }
        }
      }.bind(this)
    });
  },

  clearAllData: function() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有数据吗？此操作不可恢复，包括运动记录、饮食记录、体重记录等所有数据。',
      success: function(res) {
        if (res.confirm) {
          try {
            wx.clearStorageSync();
            this.loadProfile();
            wx.showToast({
              title: '清空成功',
              icon: 'success'
            });
          } catch (e) {
            console.error('清空数据失败', e);
            wx.showToast({
              title: '清空失败',
              icon: 'error'
            });
          }
        }
      }.bind(this)
    });
  },


  onHeightInput: function(e) {
    var height = parseInt(e.detail.value) || 0;
    this.setData({
      'profile.height': height,
      hasChanges: true
    }, function() {
      this.calculateBMI();
    }.bind(this));
  },


  onTargetWeightInput: function(e) {
    var targetWeight = parseFloat(e.detail.value) || 0;
    this.setData({
      'profile.targetWeight': targetWeight,
      hasChanges: true
    }, function() {
      this.calculateGoalProgress();
    }.bind(this));
  },

  onInitialWeightInput: function(e) {
    var initialWeight = parseFloat(e.detail.value) || 0;
    this.setData({
      'profile.initialWeight': initialWeight,
      hasChanges: true
    }, function() {
      this.calculateGoalProgress();
    }.bind(this));
  },

  onPlanStartDateChange: function(e) {
    this.setData({
      'profile.planStartDate': e.detail.value,
      hasChanges: true
    });
  },

  onTargetDateChange: function(e) {
    this.setData({
      'profile.targetDate': e.detail.value,
      hasChanges: true
    }, function() {
      this.calculateGoalProgress();
    }.bind(this));
  },

  onPlanInput: function(e) {
    this.setData({
      'profile.plan': e.detail.value,
      hasChanges: true
    });
  },

  onNicknameInput: function(e) {
    this.setData({
      'profile.nickname': e.detail.value,
      hasChanges: true
    });
  },

  changeAvatar: function() {
    console.log('开始选择头像...');
    
    // 直接使用 wx.chooseImage，这是最稳定可靠的方法
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'], // 压缩图片
      sourceType: ['album', 'camera'],
      success: (res) => {
        console.log('选择图片成功:', res);
        var tempFilePath = res.tempFilePaths[0];
        console.log('临时文件路径:', tempFilePath);
        
        // 在开发环境中，完全禁止头像功能
        if (tempFilePath.includes('127.0.0.1') || tempFilePath.includes('__tmp__')) {
          console.log('开发环境，禁止头像功能以避免网络错误');
          wx.showToast({
            title: '开发环境暂不支持头像',
            icon: 'none',
            duration: 2000
          });
          // 在开发环境中，完全不进行任何头像操作
          return;
        } else {
          // 生产环境：正常显示和保存
          this.setData({
            'profile.avatar': tempFilePath,
            hasChanges: true
          });
          
          wx.showToast({
            title: '头像已选择',
            icon: 'success'
          });
          
          // 立即保存头像
          this.saveAvatarImmediately(tempFilePath);
        }
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showModal({
          title: '选择头像失败',
          content: '请检查权限设置或重试',
          showCancel: false
        });
      }
    });
  },

  // 立即保存头像
  saveAvatarImmediately: function(tempFilePath) {
    console.log('开始立即保存头像:', tempFilePath);
    
    // 显示加载提示
    wx.showLoading({
      title: '保存头像中...',
      mask: true
    });
    
    // 对于开发环境，直接使用临时路径，避免保存文件失败
    if (tempFilePath.includes('127.0.0.1') || tempFilePath.includes('__tmp__')) {
      console.log('开发环境，直接使用临时路径');
      // 直接保存临时路径到用户数据
      this.saveAvatarToUserData(tempFilePath);
      return;
    }
    
    // 生产环境：保存头像文件到本地
    wx.saveFile({
      tempFilePath: tempFilePath,
      success: (res) => {
        console.log('头像保存成功，新路径:', res.savedFilePath);
        
        // 更新头像路径
        this.setData({
          'profile.avatar': res.savedFilePath
        });
        
        // 立即保存到用户数据
        this.saveAvatarToUserData(res.savedFilePath);
      },
      fail: (err) => {
        console.error('保存头像文件失败:', err);
        // 即使保存失败，也尝试保存路径到用户数据
        this.saveAvatarToUserData(tempFilePath);
      }
    });
  },

  // 保存头像路径到用户数据
  saveAvatarToUserData: function(avatarPath) {
    try {
      var userData = app.getUserData();
      
      // 确保profile对象存在
      if (!userData.profile) {
        userData.profile = {};
      }
      
      // 在开发环境中，不保存会导致网络错误的临时路径
      if (avatarPath && (avatarPath.includes('127.0.0.1') || avatarPath.includes('__tmp__'))) {
        console.log('开发环境，不保存会导致网络错误的头像路径');
        userData.profile.avatar = ''; // 清空头像路径
      } else {
        userData.profile.avatar = avatarPath; // 正常保存头像路径
      }
      
      if (app.saveUserData(userData)) {
        console.log('头像数据保存成功');
        
        wx.hideLoading();
        wx.showToast({
          title: '头像保存成功',
          icon: 'success'
        });
        
        // 通知其他页面更新
        this.triggerUserInfoUpdate();
        this.notifyHomePageUpdate();
        
        // 更新原始数据
        this.setData({
          originalProfile: JSON.parse(JSON.stringify(this.data.profile)),
          hasChanges: false
        });
        
      } else {
        throw new Error('保存用户数据失败');
      }
    } catch (e) {
      console.error('保存头像数据失败:', e);
      wx.hideLoading();
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      });
    }
  },

  // 兼容性方案：使用 wx.chooseImage
  fallbackChooseImage: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'], // 压缩图片
      sourceType: ['album', 'camera'],
      success: function(res) {
        console.log('选择图片成功:', res);
        var tempFilePath = res.tempFilePaths[0];
        this.setData({
          'profile.avatar': tempFilePath,
          hasChanges: true
        });
        wx.showToast({
          title: '头像已选择',
          icon: 'success'
        });
      }.bind(this),
      fail: function(err) {
        console.error('选择图片失败:', err);
        wx.showModal({
          title: '选择头像失败',
          content: '请检查权限设置或重试',
          showCancel: false
        });
      }.bind(this)
    });
  },

  exportData: function() {
    try {
      var userData = wx.getStorageSync('userData');
      var dataStr = JSON.stringify(userData, null, 2);

      wx.showModal({
        title: '导出数据',
        content: '数据已准备导出（请在真机上测试完整功能）',
        showCancel: false
      });
    } catch (e) {
      console.error('导出数据失败', e);
      wx.showToast({
        title: '导出失败',
        icon: 'error'
      });
    }
  },

  clearData: function() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有数据吗？此操作不可恢复。',
      success: function(res) {
        if (res.confirm) {
          try {
            wx.clearStorageSync();
            this.loadProfile();
            wx.showToast({
              title: '清空成功',
              icon: 'success'
            });
          } catch (e) {
            console.error('清空数据失败', e);
            wx.showToast({
              title: '清空失败',
              icon: 'error'
            });
          }
        }
      }.bind(this)
    });
  },

  showAbout: function() {
    wx.showModal({
      title: '关于应用',
      content: '减肥记录小程序\n\n一个简单的体重管理工具，帮助您记录运动、饮食和体重变化，实现健康减肥目标。\n\n版本: 1.0.0',
      showCancel: false,
      confirmText: '确定'
    });
  },

  // 触发用户信息更新事件
  triggerUserInfoUpdate: function() {
    try {
      // 使用全局事件总线通知其他页面用户信息已更新
      if (typeof getApp === 'function') {
        var appInstance = getApp();
        if (appInstance && appInstance.globalData) {
          // 设置全局数据标志
          appInstance.globalData.userInfoUpdated = true;
          appInstance.globalData.lastUpdateTime = Date.now();
        }
      }

      // 触发自定义事件（如果其他页面监听）
      wx.event && wx.event.emit('userInfoUpdated', this.data.profile);
      
      console.log('用户信息更新事件已触发');
    } catch (e) {
      console.error('触发用户信息更新事件失败', e);
    }
  },

  // 通知首页更新用户信息
  notifyHomePageUpdate: function() {
    try {
      // 使用全局事件系统通知首页更新
      app.emit('userProfileUpdated', this.data.profile);
      console.log('已通知首页更新用户信息', this.data.profile);
      
      // 同时设置全局数据标志
      if (app.globalData) {
        app.globalData.userInfoUpdated = true;
        app.globalData.lastUpdateTime = Date.now();
      }
      
      // 强制刷新首页数据
      this.forceRefreshHomePage();
    } catch (e) {
      console.error('通知首页更新失败', e);
    }
  },

  // 头像保存完成后继续执行
  continueAfterAvatarSave: function() {
    try {
      console.log('头像保存完成，继续后续操作');
      
      this.setData({
        originalProfile: JSON.parse(JSON.stringify(this.data.profile)),
        hasChanges: false
      });

      // 保存成功后重新计算所有数据
      this.calculateBMI();
      this.calculateGoalProgress();

      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      // 触发全局事件，通知其他页面用户信息已更新
      this.triggerUserInfoUpdate();

      // 立即通知首页更新用户信息
      this.notifyHomePageUpdate();

      // 延迟执行以确保数据已保存
      setTimeout(function() {
        console.log('保存后重新加载数据');

        // 重新加载个人资料数据
        this.loadProfile();

        // 触发页面刷新，确保所有组件都获取最新数据
        this.onShow();
      }.bind(this), 200);
    } catch (e) {
      console.error('继续保存操作失败', e);
      wx.hideLoading();
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      });
    }
  },

  // 强制刷新首页数据
  forceRefreshHomePage: function() {
    try {
      // 获取首页页面实例
      const pages = getCurrentPages();
      const homePage = pages.find(page => page.route === 'pages/index/index');
      
      if (homePage) {
        console.log('找到首页实例，强制刷新数据');
        // 调用首页的刷新方法
        if (homePage.loadTodayRecords) {
          homePage.loadTodayRecords();
        }
        if (homePage.calculateGoalProgress) {
          homePage.calculateGoalProgress();
        }
        if (homePage.refreshUserProgressComponent) {
          homePage.refreshUserProgressComponent();
        }
        
        // 强制重新计算用户进度组件
        const userProgressComponent = homePage.selectComponent('.user-progress');
        if (userProgressComponent && userProgressComponent.calculateProgress) {
          userProgressComponent.calculateProgress();
          console.log('用户进度组件已强制刷新');
        }
      } else {
        console.log('首页未找到，可能未加载');
      }
    } catch (e) {
      console.error('强制刷新首页失败', e);
    }
  },

  // 显示首次使用欢迎提示
  showFirstTimeWelcome: function() {
    console.log('显示首次使用欢迎提示');
    
    // 使用标志位确保只显示一次
    if (this._welcomeModalShown) {
      console.log('欢迎提示已经显示过，跳过');
      return;
    }
    this._welcomeModalShown = true;
    
    // 立即标记为非首次使用，避免重复显示
    this.markAsNotFirstTime();
    
    wx.showModal({
      title: '欢迎使用减肥记录小程序',
      content: '欢迎！为了更好地为您服务，请先完善您的个人信息和减肥计划。\n\n请设置您的昵称、身高、体重和目标体重，这样我们可以为您提供更准确的减肥建议和进度跟踪。',
      showCancel: false,
      confirmText: '知道了',
      success: (res) => {
        if (res.confirm) {
          console.log('用户确认欢迎提示');
          // 用户确认后，不需要额外操作，因为已经标记为非首次使用
        }
      }
    });
  },

  // 标记为非首次使用
  markAsNotFirstTime: function() {
    try {
      var userData = app.getUserData();
      if (userData && userData.profile) {
        userData.profile.isFirstTime = false;
        app.saveUserData(userData);
        console.log('已标记为非首次使用');
      }
    } catch (e) {
      console.error('标记非首次使用失败', e);
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
          console.log('彻底清理开发环境的头像路径:', avatarPath);
          userData.profile.avatar = '';
          app.saveUserData(userData);
          console.log('开发环境头像路径已清理');
          
          // 同时更新当前页面的数据
          if (this.data.profile.avatar === avatarPath) {
            this.setData({
              'profile.avatar': ''
            });
          }
        }
      }
    } catch (e) {
      console.error('清理开发环境头像路径失败', e);
    }
  },
});