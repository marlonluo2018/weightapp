// simple-exercise-chart.js - 简化的运动类型分布组件
Component({
  properties: {
    data: {
      type: Array,
      value: []
    }
  },

  data: {
    chartData: []
  },

  lifetimes: {
    attached() {
      this.processData();
    }
  },

  observers: {
    'data': function(data) {
      if (data && data.length > 0) {
        this.processData();
      }
    }
  },

  methods: {
    processData() {
      const exerciseData = this.data.data;
      if (!exerciseData || exerciseData.length === 0) {
        this.setData({ chartData: [] });
        return;
      }

      // 统计每种运动类型的总时长
      const exerciseMap = {};
      let totalDuration = 0;

      exerciseData.forEach(item => {
        const type = item.type || '运动';
        const duration = item.duration || 0;

        if (!exerciseMap[type]) {
          exerciseMap[type] = 0;
        }
        exerciseMap[type] += duration;
        totalDuration += duration;
      });

      // 转换为图表数据格式并计算百分比
      const chartData = Object.entries(exerciseMap).map(([type, duration]) => ({
        type: type,
        duration: duration,
        percentage: totalDuration > 0 ? Math.round((duration / totalDuration) * 100) : 0,
        width: totalDuration > 0 ? (duration / totalDuration) * 100 : 0
      }));

      // 按时长排序
      chartData.sort((a, b) => b.duration - a.duration);

      this.setData({ chartData });
    }
  }
});