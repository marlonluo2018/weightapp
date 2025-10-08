// simple-weight-chart.js - 简化的体重趋势图表组件
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
      const weightData = this.data.data;
      if (!weightData || weightData.length === 0) {
        this.setData({ chartData: [] });
        return;
      }

      // 按日期排序，只取最近7条数据
      const sortedData = [...weightData]
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-7);

      // 计算数据范围和百分比
      const weights = sortedData.map(item => parseFloat(item.weight));
      const minWeight = Math.min(...weights);
      const maxWeight = Math.max(...weights);
      const range = maxWeight - minWeight || 1;

      const chartData = sortedData.map((item, index) => ({
        date: item.date,
        weight: parseFloat(item.weight),
        height: ((parseFloat(item.weight) - minWeight) / range * 80) + 10, // 10-90%的高度
        label: this.formatDateLabel(item.date),
        index: index
      }));

      this.setData({ chartData });
    },

    formatDateLabel(dateStr) {
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  }
});