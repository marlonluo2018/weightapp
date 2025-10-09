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
    },
    // AI识图相关数据
    aiStatus: '',
    aiResults: [],
    selectedImage: '',
    // 百度AI接口配置
    baiduApi: {
      url: 'https://aip.baidubce.com/rest/2.0/image-classify/v2/dish',
      accessToken: 'bce-v3/ALTAK-A1ir1foI663XXlcg2wVUz/e297ccb90c8d54534a80275553732d7c28c3bf68'
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
    this.checkCanSave();
  },

  onNotesInput(e) {
    this.setData({
      notes: e.detail.value
    });
  },

  checkCanSave() {
    const { mealTypeText, foodName, calories } = this.data;
    const canSave = mealTypeText.trim() !== '' &&
                   foodName.trim() !== '' &&
                   calories.trim() !== '' &&
                   parseInt(calories) > 0;
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
      portion: this.data.portion ? parseInt(this.data.portion) : null, // 处理可选情况
      calories: parseInt(this.data.calories),
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
        canSave: false,
        aiStatus: '',
        aiResults: [],
        selectedImage: ''
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
  },

  // 拍照功能
  takePhoto() {
    this.setData({ aiStatus: '正在启动相机...' });
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({ 
          selectedImage: tempFilePath,
          aiStatus: '正在识别食物...'
        });
        this.recognizeFood(tempFilePath);
      },
      fail: (err) => {
        console.error('拍照失败', err);
        this.setData({ aiStatus: '拍照失败，请重试' });
      }
    });
  },

  // 选择图片功能
  chooseImage() {
    this.setData({ aiStatus: '正在选择图片...' });
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({ 
          selectedImage: tempFilePath,
          aiStatus: '正在识别食物...'
        });
        this.recognizeFood(tempFilePath);
      },
      fail: (err) => {
        console.error('选择图片失败', err);
        this.setData({ aiStatus: '选择图片失败，请重试' });
      }
    });
  },

  // 识别食物功能
  recognizeFood(imagePath) {
    // 检查图片大小
    wx.getFileInfo({
      filePath: imagePath,
      success: (fileInfo) => {
        const fileSize = fileInfo.size;
        const maxSize = 4 * 1024 * 1024; // 4MB
        
        if (fileSize > maxSize) {
          this.setData({ aiStatus: '图片太大，请选择小于4MB的图片' });
          return;
        }
        
        // 检查图片尺寸
        wx.getImageInfo({
          src: imagePath,
          success: (imageInfo) => {
            const { width, height } = imageInfo;
            const minSize = 15; // 最短边至少15px
            const maxSize = 4096; // 最长边最大4096px
            
            // 检查最短边
            if (Math.min(width, height) < minSize) {
              this.setData({ aiStatus: '图片尺寸太小，最短边至少需要15px' });
              return;
            }
            
            // 检查最长边
            if (Math.max(width, height) > maxSize) {
              this.setData({ aiStatus: '图片尺寸太大，最长边不能超过4096px' });
              return;
            }
            
            // 检查图片格式
            const validFormats = ['jpg', 'jpeg', 'png', 'bmp'];
            const format = imageInfo.type.toLowerCase();
            if (!validFormats.includes(format)) {
              this.setState({ aiStatus: '图片格式不支持，请使用jpg/png/bmp格式的图片' });
              return;
            }
            
            // 压缩图片
            this.compressImage(imagePath);
          },
          fail: (err) => {
            console.error('获取图片信息失败', err);
            this.setData({ aiStatus: '图片处理失败，请重试' });
          }
        });
      },
      fail: (err) => {
        console.error('获取文件信息失败', err);
        this.setData({ aiStatus: '图片处理失败，请重试' });
      }
    });
  },

  // 检查网络状态
  checkNetworkStatus() {
    return new Promise((resolve, reject) => {
      // 获取网络类型
      wx.getNetworkType({
        success: (res) => {
          const networkType = res.networkType;
          this.setData({ networkType });
          
          // 如果没有网络
          if (networkType === 'none') {
            this.setData({ 
              apiStatus: '网络不可用',
              errorMessage: '设备未连接网络，请检查网络设置'
            });
            reject(new Error('网络不可用'));
            return;
          }
          
          // 如果是2G或3G网络，提示可能较慢
          if (networkType === '2g' || networkType === '3g') {
            this.setData({ 
              apiStatus: '网络较慢',
              errorMessage: `当前使用${networkType.toUpperCase()}网络，连接可能较慢`
            });
          }
          
          // 检查是否为开发者工具环境
          const isDevTool = typeof wx.getSystemInfoSync === 'function' && 
                           wx.getSystemInfoSync().platform === 'devtools';
          
          if (isDevTool) {
            // 开发者工具环境：测试网络连接
            wx.request({
              url: 'https://aip.baidubce.com/rest/2.0/image-classify/v2/dish',
              method: 'GET',
              timeout: 5000,
              success: () => {
                this.setData({ apiStatus: '网络正常' });
                resolve();
              },
              fail: (err) => {
                this.setData({ 
                  apiStatus: '网络连接失败',
                  errorMessage: `无法连接到服务器: ${err.errMsg || '未知错误'}`
                });
                reject(err);
              }
            });
          } else {
            // 真机环境：完全跳过网络连接测试，直接假设网络可用
            this.setData({ 
              apiStatus: '网络正常',
              errorMessage: '真机环境，已跳过网络连接测试'
            });
            console.log('真机环境，跳过网络连接测试，直接调用百度AI接口');
            resolve();
          }
        },
        fail: (err) => {
          this.setData({ 
            networkType: 'unknown',
            apiStatus: '网络状态未知',
            errorMessage: `获取网络状态失败: ${err.errMsg || '未知错误'}`
          });
          reject(err);
        }
      });
    });
  },

  // 切换调试信息显示
  toggleDebugInfo() {
    const showDebugInfo = !this.data.showDebugInfo;
    this.setData({ showDebugInfo });
    
    if (showDebugInfo) {
      // 获取网络类型
      wx.getNetworkType({
        success: (res) => {
          this.setData({ networkType: res.networkType });
        }
      });
    }
  },

  // 压缩图片
  compressImage(imagePath) {
    // 先获取图片信息
    wx.getImageInfo({
      src: imagePath,
      success: (imageInfo) => {
        const { width, height } = imageInfo;
        const maxSize = 4096; // 最长边最大4096px
        
        // 如果图片尺寸超过限制，计算压缩比例
        let compressedWidth = width;
        let compressedHeight = height;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          compressedWidth = Math.floor(width * ratio);
          compressedHeight = Math.floor(height * ratio);
        }
        
        // 压缩图片
        wx.compressImage({
          src: imagePath,
          quality: 80,
          compressedWidth: compressedWidth,
          compressedHeight: compressedHeight,
          success: (res) => {
            this.imageToBase64(res.tempFilePath);
          },
          fail: (err) => {
            console.error('压缩图片失败', err);
            // 如果压缩失败，尝试直接转换原图
            this.imageToBase64(imagePath);
          }
        });
      },
      fail: (err) => {
        console.error('获取图片信息失败', err);
        // 如果获取图片信息失败，尝试直接压缩
        wx.compressImage({
          src: imagePath,
          quality: 80,
          success: (res) => {
            this.imageToBase64(res.tempFilePath);
          },
          fail: (compressErr) => {
            console.error('压缩图片失败', compressErr);
            // 如果压缩失败，尝试直接转换原图
            this.imageToBase64(imagePath);
          }
        });
      }
    });
  },

  // 图片转Base64
  imageToBase64(imagePath) {
    wx.getFileSystemManager().readFile({
      filePath: imagePath,
      encoding: 'base64',
      success: (res) => {
        const base64Data = res.data;
        
        // 检查是否为开发者工具环境
        const isDevTool = typeof wx.getSystemInfoSync === 'function' && 
                         wx.getSystemInfoSync().platform === 'devtools';
        
        if (isDevTool) {
          // 开发者工具环境：检查网络状态
          this.setData({ aiStatus: '正在检查网络连接...' });
          this.checkNetworkStatus()
            .then(() => {
              this.setData({ aiStatus: '正在识别食物...' });
              this.callBaiduApi(base64Data);
            })
            .catch((err) => {
              console.error('网络检查失败', err);
              this.setData({ aiStatus: '网络连接失败，请检查网络设置' });
            });
        } else {
          // 真机环境：跳过网络检查，直接调用百度AI接口
          console.log('真机环境，跳过网络检查，直接调用百度AI接口');
          this.setData({ 
            aiStatus: '正在识别食物...',
            apiStatus: '跳过网络检查，直接调用API'
          });
          this.callBaiduApi(base64Data);
        }
      },
      fail: (err) => {
        console.error('图片转Base64失败', err);
        this.setData({ 
          aiStatus: '图片处理失败，请重试',
          errorMessage: `图片转Base64失败: ${err.errMsg || '未知错误'}`
        });
      }
    });
  },

  // 调用百度AI接口
  callBaiduApi(base64Data) {
    // 对Base64数据进行URL编码
    const encodedImage = encodeURIComponent(base64Data);
    
    // 更新调试信息
    this.setData({ apiStatus: '正在调用百度AI接口...' });
    
    wx.request({
      url: this.data.baiduApi.url,
      method: 'POST',
      header: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${this.data.baiduApi.accessToken}`
      },
      data: `image=${encodedImage}&top_num=5`,
      timeout: 10000, // 设置10秒超时
      success: (res) => {
        console.log('百度AI接口返回结果', res.data);
        
        // 检查HTTP状态码
        if (res.statusCode < 200 || res.statusCode >= 300) {
          this.setData({ 
            apiStatus: `请求失败: HTTP ${res.statusCode}`,
            errorMessage: `服务器返回错误状态码: ${res.statusCode}`
          });
          this.setData({ aiStatus: '服务器错误，请稍后重试' });
          return;
        }
        
        // 检查百度API返回的错误码
        if (res.data.error_code) {
          let errorMsg = '识别失败';
          switch (res.data.error_code) {
            case 6: // 无权限
              errorMsg = 'API密钥无效或已过期';
              break;
            case 17: // 每日调用量超限
              errorMsg = '今日API调用次数已达上限';
              break;
            case 18: // QPS超限
              errorMsg = '请求过于频繁，请稍后重试';
              break;
            case 100: // 无效参数
              errorMsg = '请求参数错误';
              break;
            case 111: // Access token失效
              errorMsg = '访问令牌失效，请更新密钥';
              break;
            case 282000: // 内部错误
              errorMsg = '服务器内部错误，请稍后重试';
              break;
            default:
              errorMsg = `识别失败: ${res.data.error_msg || '未知错误'}`;
          }
          
          this.setData({ 
            apiStatus: `API错误: ${res.data.error_code}`,
            errorMessage: errorMsg
          });
          this.setData({ aiStatus: errorMsg });
          return;
        }
        
        // 检查返回结果
        if (res.data && res.data.result && res.data.result.length > 0) {
          this.setData({ 
            apiStatus: '识别成功',
            errorMessage: ''
          });
          this.handleAiResults(res.data.result);
        } else {
          this.setData({ 
            apiStatus: '识别结果为空',
            errorMessage: '未能识别出食物，可能图片不清晰或不在识别范围内'
          });
          this.setData({ aiStatus: '未能识别食物，请重试或手动输入' });
        }
      },
      fail: (err) => {
        console.error('调用百度AI接口失败', err);
        
        // 直接显示原始错误信息
        this.setData({ 
          apiStatus: 'API调用失败',
          errorMessage: err.errMsg || '未知错误'
        });
        this.setData({ aiStatus: err.errMsg || '识别失败，请检查网络连接' });
      }
    });
  },

  // 处理AI识别结果
  handleAiResults(results) {
    this.setData({ 
      aiResults: results,
      aiStatus: '识别成功！请选择食物'
    });
    
    // 显示识别结果供用户选择
    this.showFoodSelection(results);
  },

  // 显示食物选择弹窗
  showFoodSelection(results) {
    const items = results.map(item => {
      return `${item.name} (${item.calorie}卡路里)`;
    });
    
    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        const selectedFood = results[res.tapIndex];
        this.setData({
          foodName: selectedFood.name,
          calories: selectedFood.calorie,
          aiStatus: `已选择: ${selectedFood.name}`
        });
        this.checkCanSave();
      },
      fail: (err) => {
        console.log('用户取消选择', err);
        this.setData({ aiStatus: '请手动输入食物信息' });
      }
    });
  }
});