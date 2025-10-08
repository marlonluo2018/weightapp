// statistics.js
const app = getApp();

Page({
  data: {
    activeTab: 'week',
    overviewStats: {
      exercise: {
        totalMinutes: 0,
        sessions: 0
      },
      diet: {
        totalRecords: 0,
        totalCalories: 0
      },
      weight: {
        change: 0,
        records: 0
      }
    },
    exerciseStats: [],
    weightHistory: [],
    weightChart: {
      yAxis: [],
      xAxis: [],
      gridLines: [],
      dataPoints: []
    },
    dietAnalysis: {
      mealTypes: []
    },
    calendarData: [],
    achievements: [],
    currentMonthDisplay: '',
    currentDisplayMonth: null,
    earliestMonth: null,
    latestMonth: null,
    canGoPrevious: false,
    canGoNext: false
  },

  onLoad() {
    console.log('Statistics onLoad 开始');
    this.loadBasicStatistics();
    console.log('Statistics onLoad 完成');
  },

  onShow() {
    console.log('Statistics onShow 开始');
    this.loadBasicStatistics();
    console.log('Statistics onShow 完成');
  },

  loadBasicStatistics() {
    try {
      console.log('开始加载基本统计数据');
      this.loadStatisticsData();
    } catch (e) {
      console.error('加载统计数据失败', e);
    }
  },

  onPullDownRefresh() {
    this.loadStatisticsData();
    wx.stopPullDownRefresh();
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });

    // 如果切换到"全部"标签页，重置到最新月份
    if (tab === 'all') {
      this.setData({ currentDisplayMonth: null });
    }

    this.loadStatisticsData();
  },

  loadStatisticsData() {
    // 防抖处理，避免频繁调用
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
    }

    this.loadingTimer = setTimeout(() => {
      this.doLoadStatisticsData();
    }, 100);
  },

  doLoadStatisticsData() {
    try {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });

      const userData = app.getUserData();
      if (!userData || !userData.records) {
        wx.hideLoading();
        return;
      }

      const filteredData = this.filterDataByTimeRange(userData.records);

      // 分批处理数据，避免长时间阻塞
      this.calculateOverviewStats(filteredData);

      setTimeout(() => {
        this.calculateExerciseStats(filteredData.exercise);
        this.calculateWeightStats(filteredData.weight);
        this.calculateDietAnalysis(filteredData.diet);
      }, 50);

      setTimeout(() => {
        this.generateWeightChart(filteredData.weight);
        this.generateCalendarHeatmap(filteredData);
      }, 100);

      setTimeout(() => {
        this.calculateAchievements(filteredData);
        wx.hideLoading();
      }, 150);

    } catch (e) {
      console.error('加载统计数据失败', e);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  filterDataByTimeRange(records) {
    const now = new Date();
    let startDate;

    switch (this.data.activeTab) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(0); // 从最开始
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const filtered = {
      exercise: records.exercise ? records.exercise.filter(record => record.timestamp >= startDate.getTime()) : [],
      diet: records.diet ? records.diet.filter(record => record.timestamp >= startDate.getTime()) : [],
      weight: records.weight ? records.weight.filter(record => record.timestamp >= startDate.getTime()) : []
    };

    return filtered;
  },

  calculateOverviewStats(data) {
    const exerciseTotal = data.exercise.reduce((sum, record) => sum + (record.duration || 0), 0);
    const exerciseSessions = data.exercise.length;
    const dietRecords = data.diet.length;
    const dietCalories = data.diet.reduce((sum, record) => sum + (record.calories || 0), 0);
    const weightRecords = data.weight.length;

    let weightChange = 0;
    if (data.weight.length >= 2) {
      const sorted = data.weight.sort((a, b) => a.timestamp - b.timestamp);
      weightChange = sorted[sorted.length - 1].weight - sorted[0].weight;
      weightChange = parseFloat(weightChange.toFixed(1));
    }

    this.setData({
      overviewStats: {
        exercise: {
          totalMinutes: exerciseTotal,
          sessions: exerciseSessions
        },
        diet: {
          totalRecords: dietRecords,
          totalCalories: dietCalories
        },
        weight: {
          change: weightChange >= 0 ? `+${weightChange}kg` : `${weightChange}kg`,
          records: weightRecords
        }
      }
    });
  },

  calculateExerciseStats(exerciseRecords) {
    const stats = {};
    const totalMinutes = exerciseRecords.reduce((sum, record) => sum + (record.duration || 0), 0);

    exerciseRecords.forEach(record => {
      if (!stats[record.type]) {
        stats[record.type] = {
          type: record.type,
          count: 0,
          totalDuration: 0,
          totalCalories: 0
        };
      }
      stats[record.type].count++;
      stats[record.type].totalDuration += record.duration || 0;
      stats[record.type].totalCalories += record.calories || 0;
    });

    const statsArray = Object.values(stats).map(stat => {
      return {
        type: stat.type,
        count: stat.count,
        totalDuration: stat.totalDuration,
        totalCalories: stat.totalCalories,
        percentage: totalMinutes > 0 ? Math.round((stat.totalDuration / totalMinutes) * 100) : 0
      };
    }).sort((a, b) => b.totalDuration - a.totalDuration);

    this.setData({ exerciseStats: statsArray });
  },

  calculateWeightStats(weightRecords) {
    const sorted = weightRecords.sort((a, b) => b.timestamp - a.timestamp);
    this.setData({ weightHistory: sorted });
  },

  calculateDietAnalysis(dietRecords) {
    const mealStats = {};
    const totalCalories = dietRecords.reduce((sum, record) => sum + (record.calories || 0), 0);

    dietRecords.forEach(record => {
      if (!mealStats[record.mealType]) {
        mealStats[record.mealType] = {
          mealType: record.mealType,
          mealTypeText: record.mealTypeText,
          count: 0,
          totalCalories: 0
        };
      }
      mealStats[record.mealType].count++;
      mealStats[record.mealType].totalCalories += record.calories || 0;
    });

    const mealStatsArray = Object.values(mealStats).map(stat => {
      return {
        mealType: stat.mealType,
        mealTypeText: stat.mealTypeText,
        count: stat.count,
        totalCalories: stat.totalCalories,
        percentage: totalCalories > 0 ? Math.round((stat.totalCalories / totalCalories) * 100) : 0
      };
    });

    this.setData({
      dietAnalysis: {
        mealTypes: mealStatsArray
      }
    });
  },

  generateWeightChart(weightRecords) {
    // 即使只有一条记录，也显示图表
    if (weightRecords.length === 0) {
      this.setData({
        weightChart: {
          yAxis: [],
          xAxis: [],
          gridLines: [],
          dataPoints: []
        }
      });
      return;
    }

    const sorted = [...weightRecords].sort((a, b) => a.timestamp - b.timestamp);
    const weights = sorted.map(record => record.weight);
    const minWeight = Math.min(...weights) - 1;
    const maxWeight = Math.max(...weights) + 1;
    const range = maxWeight - minWeight || 2; // 防止除零，如果只有一条记录则范围设为2

    // 生成Y轴标签
    const yAxisSteps = 5;
    const yAxis = [];
    for (let i = 0; i <= yAxisSteps; i++) {
      const value = minWeight + (range * i / yAxisSteps);
      yAxis.push(value.toFixed(1));
    }

    // 生成数据点
    const dataPoints = sorted.map((record, index) => {
      // 如果只有一条记录，x坐标设为50%（中间）
      const x = sorted.length === 1 ? 50 : (index / (sorted.length - 1)) * 100;
      const y = ((record.weight - minWeight) / range) * 100;
      return {
        x: x.toFixed(1),
        y: y.toFixed(1),
        weight: record.weight.toFixed(1),
        date: app.formatDate(new Date(record.timestamp))
      };
    });

    // 生成X轴标签（简化显示）
    const xSteps = Math.min(6, sorted.length);
    const xAxis = [];
    const step = Math.floor(sorted.length / xSteps);
    for (let i = 0; i < sorted.length; i += step) {
      const date = new Date(sorted[i].timestamp);
      xAxis.push(`${date.getMonth() + 1}/${date.getDate()}`);
    }

    // 生成网格线
    const gridLines = Array(yAxisSteps).fill('');

    this.setData({
      weightChart: {
        yAxis,
        xAxis,
        gridLines,
        dataPoints
      }
    });
  },

  generateCalendarHeatmap(filteredData) {
    const today = new Date();
    let startDate, weeksToShow;

    // 根据当前标签确定日历范围
    switch (this.data.activeTab) {
      case 'week':
        // 显示本周（7天）
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay()); // 从本周日开始
        weeksToShow = 1;
        break;
      case 'month':
        // 显示当月（最多6周）
        startDate = new Date(today.getFullYear(), today.getMonth(), 1); // 本月1号
        // 调整到本月第一个星期日
        startDate.setDate(startDate.getDate() - startDate.getDay());
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // 下月1号
        const daysInMonth = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        weeksToShow = Math.ceil(daysInMonth / 7);
        break;
      case 'all':
        // 按月显示数据
        if (filteredData.exercise.length > 0 || filteredData.diet.length > 0 || filteredData.weight.length > 0) {
          // 找到最早的记录日期和最晚的记录日期
          const allDates = [];
          const allDatesMax = [];

          if (filteredData.exercise.length > 0) {
            const earliestExercise = filteredData.exercise.reduce((min, record) =>
              min.date < record.date ? min : record, filteredData.exercise[0]);
            const latestExercise = filteredData.exercise.reduce((max, record) =>
              max.date > record.date ? max : record, filteredData.exercise[0]);
            allDates.push(new Date(earliestExercise.date));
            allDatesMax.push(new Date(latestExercise.date));
          }

          if (filteredData.diet.length > 0) {
            const earliestDiet = filteredData.diet.reduce((min, record) =>
              min.date < record.date ? min : record, filteredData.diet[0]);
            const latestDiet = filteredData.diet.reduce((max, record) =>
              max.date > record.date ? max : record, filteredData.diet[0]);
            allDates.push(new Date(earliestDiet.date));
            allDatesMax.push(new Date(latestDiet.date));
          }

          if (filteredData.weight.length > 0) {
            const earliestWeight = filteredData.weight.reduce((min, record) =>
              min.date < record.date ? min : record, filteredData.weight[0]);
            const latestWeight = filteredData.weight.reduce((max, record) =>
              max.date > record.date ? max : record, filteredData.weight[0]);
            allDates.push(new Date(earliestWeight.date));
            allDatesMax.push(new Date(latestWeight.date));
          }

          const earliestDate = new Date(Math.min(...allDates));
          const latestDate = new Date(Math.max(...allDatesMax));

          // 设置最早和最晚月份
          const earliestMonth = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
          const latestMonth = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);

          // 如果是首次进入或者当前显示月份不在有效范围内，重置到最新月份
          let currentDisplayMonth = this.data.currentDisplayMonth;
          if (!currentDisplayMonth || currentDisplayMonth > latestMonth || currentDisplayMonth < earliestMonth) {
            currentDisplayMonth = new Date(latestMonth);
          }

          // 显示当前选择的月份
          startDate = new Date(currentDisplayMonth.getFullYear(), currentDisplayMonth.getMonth(), 1);
          // 调整到该月第一个星期日
          startDate.setDate(startDate.getDate() - startDate.getDay());

          const monthEnd = new Date(currentDisplayMonth.getFullYear(), currentDisplayMonth.getMonth() + 1, 0);
          const daysInMonth = Math.ceil((monthEnd - startDate) / (1000 * 60 * 60 * 24));
          weeksToShow = Math.ceil(daysInMonth / 7);

          // 更新月份显示和按钮状态
          this.updateMonthDisplay(currentDisplayMonth, earliestMonth, latestMonth);
        } else {
          // 没有数据时，显示当前月份
          const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          startDate = new Date(currentMonth);
          startDate.setDate(startDate.getDate() - startDate.getDay());
          const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
          const daysInMonth = Math.ceil((monthEnd - startDate) / (1000 * 60 * 60 * 24));
          weeksToShow = Math.ceil(daysInMonth / 7);

          // 更新月份显示，但禁用翻阅按钮
          this.updateMonthDisplay(currentMonth, currentMonth, currentMonth);
        }
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 4 * 7);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        weeksToShow = 4;
    }

    // 预处理数据，按日期分组以提高性能
    const exerciseByDate = this.groupRecordsByDate(filteredData.exercise);
    const dietByDate = this.groupRecordsByDate(filteredData.diet);
    const weightByDate = this.groupRecordsByDate(filteredData.weight);

    const calendarData = [];
    let currentDate = new Date(startDate);

    // 按周组织数据
    for (let week = 0; week < weeksToShow; week++) {
      const weekData = { days: [] };

      for (let day = 0; day < 7; day++) {
        const dateStr = app.formatDate(currentDate);
        const dayData = this.getDayActivityOptimized(dateStr, exerciseByDate, dietByDate, weightByDate);
        weekData.days.push({
          date: dateStr,
          day: currentDate.getDate(),
          className: this.getHeatmapClass(dayData.activity),
          activity: dayData.activity,
          isToday: dateStr === app.formatDate(today)
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      calendarData.push(weekData);
    }

    this.setData({ calendarData });
  },

  groupRecordsByDate(records) {
    const grouped = {};
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (!grouped[record.date]) {
        grouped[record.date] = [];
      }
      grouped[record.date].push(record);
    }
    return grouped;
  },

  getDayActivityOptimized(dateStr, exerciseByDate, dietByDate, weightByDate) {
    let activity = 0;

    // 检查运动记录 - 使用对象查找，O(1)时间复杂度
    if (exerciseByDate[dateStr]) {
      activity += exerciseByDate[dateStr].length * 2;
    }

    // 检查饮食记录
    if (dietByDate[dateStr]) {
      activity += dietByDate[dateStr].length;
    }

    // 检查体重记录
    if (weightByDate[dateStr]) {
      activity += weightByDate[dateStr].length * 3;
    }

    return { activity };
  },

  getDayActivity(dateStr, data) {
    let activity = 0;

    // 优化：使用find而不是filter，一旦找到匹配就停止
    // 检查运动记录
    for (let i = 0; i < data.exercise.length; i++) {
      if (data.exercise[i].date === dateStr) {
        activity += 2;
        // 继续检查是否还有同一天的记录
        while (++i < data.exercise.length && data.exercise[i].date === dateStr) {
          activity += 2;
        }
        break;
      }
    }

    // 检查饮食记录
    for (let i = 0; i < data.diet.length; i++) {
      if (data.diet[i].date === dateStr) {
        activity += 1;
        // 继续检查是否还有同一天的记录
        while (++i < data.diet.length && data.diet[i].date === dateStr) {
          activity += 1;
        }
        break;
      }
    }

    // 检查体重记录
    for (let i = 0; i < data.weight.length; i++) {
      if (data.weight[i].date === dateStr) {
        activity += 3;
        // 继续检查是否还有同一天的记录
        while (++i < data.weight.length && data.weight[i].date === dateStr) {
          activity += 3;
        }
        break;
      }
    }

    return { activity };
  },

  getHeatmapClass(activity) {
    if (activity === 0) return 'level-0';
    if (activity <= 2) return 'level-1';
    if (activity <= 4) return 'level-2';
    if (activity <= 6) return 'level-3';
    return 'level-4';
  },

  calculateAchievements(filteredData) {
    const achievements = [
      {
        id: 'exercise_week',
        name: '运动达人',
        description: '本周运动超过3次',
        icon: '🏃',
        unlocked: filteredData.exercise.length >= 3
      },
      {
        id: 'diet_consistent',
        name: '饮食规律',
        description: '连续7天记录饮食',
        icon: '🍽️',
        unlocked: this.checkConsecutiveDays(filteredData.diet, 7)
      },
      {
        id: 'weight_tracker',
        name: '体重管理',
        description: '记录体重超过10次',
        icon: '⚖️',
        unlocked: filteredData.weight.length >= 10
      },
      {
        id: 'calorie_burner',
        name: '燃脂高手',
        description: '累计消耗2000卡路里',
        icon: '🔥',
        unlocked: this.calculateTotalCalories(filteredData.exercise) >= 2000
      }
    ];

    this.setData({ achievements });
  },

  checkConsecutiveDays(records, days) {
    if (records.length < days) return false;

    const dates = Array.from(new Set(records.map(record => record.date))).sort();
    let consecutive = 0;
    let expectedDate = new Date();

    for (let i = dates.length - 1; i >= 0; i--) {
      const recordDate = new Date(dates[i]);
      const expectedDateStr = app.formatDate(expectedDate);

      if (dates[i] === expectedDateStr) {
        consecutive++;
        if (consecutive >= days) return true;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        consecutive = 0;
        expectedDate = new Date(recordDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
      }
    }

    return false;
  },

  calculateTotalCalories(exerciseRecords) {
    return exerciseRecords.reduce((sum, record) => sum + (record.calories || 0), 0);
  },

  showDayDetail(e) {
    const date = e.currentTarget.dataset.date;
    const dayData = this.getDayActivity(date, this.filterDataByTimeRange(app.getUserData().records));

    if (dayData.activity > 0) {
      wx.showModal({
        title: `${date} 活动详情`,
        content: `活动指数: ${dayData.activity}`,
        showCancel: false
      });
    }
  },

  // 更新月份显示和按钮状态
  updateMonthDisplay(currentMonth, earliestMonth, latestMonth) {
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const monthDisplay = `${currentMonth.getFullYear()}年 ${monthNames[currentMonth.getMonth()]}`;

    const canGoPrevious = currentMonth > earliestMonth;
    const canGoNext = currentMonth < latestMonth;

    this.setData({
      currentMonthDisplay: monthDisplay,
      currentDisplayMonth: currentMonth,
      earliestMonth: earliestMonth,
      latestMonth: latestMonth,
      canGoPrevious: canGoPrevious,
      canGoNext: canGoNext
    });
  },

  // 前一个月
  previousMonth() {
    if (!this.data.canGoPrevious) return;

    const newMonth = new Date(this.data.currentDisplayMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);

    this.setData({
      currentDisplayMonth: newMonth
    }, () => {
      this.loadBasicStatistics();
    });
  },

  // 后一个月
  nextMonth() {
    if (!this.data.canGoNext) return;

    const newMonth = new Date(this.data.currentDisplayMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);

    this.setData({
      currentDisplayMonth: newMonth
    }, () => {
      this.loadBasicStatistics();
    });
  }
});