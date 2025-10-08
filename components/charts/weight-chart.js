// weight-chart.js - 体重趋势图表组件
Component({
  properties: {
    data: {
      type: Array,
      value: []
    },
    height: {
      type: Number,
      value: 200
    }
  },

  data: {
    canvasId: 'weightChart',
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

      // 按日期排序
      const sortedData = [...weightData].sort((a, b) => a.timestamp - b.timestamp);

      // 计算图表数据点
      const chartData = sortedData.map((item, index) => ({
        x: index,
        y: parseFloat(item.weight),
        date: item.date,
        label: this.formatDateLabel(item.date)
      }));

      this.setData({ chartData });
      this.drawChart();
    },

    formatDateLabel(dateStr) {
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    },

    drawChart() {
      const chartData = this.data.chartData;
      if (chartData.length === 0) return;

      const ctx = wx.createCanvasContext(this.data.canvasId, this);

      // 微信小程序中需要将rpx转换为px
      const systemInfo = wx.getSystemInfoSync();
      const pixelRatio = systemInfo.pixelRatio;
      const canvasWidth = this.data.height * 3; // 高度750rpx的3倍，因为实际显示宽度是750rpx
      const canvasHeight = this.data.height;

      const padding = 40;
      const chartWidth = canvasWidth - padding * 2;
      const chartHeight = canvasHeight - padding * 2;

      // 清空画布
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // 计算数据范围
      const weights = chartData.map(item => item.y);
      const minWeight = Math.min(...weights) - 1;
      const maxWeight = Math.max(...weights) + 1;
      const weightRange = maxWeight - minWeight;

      // 绘制坐标轴
      ctx.setStrokeStyle('#e0e0e0');
      ctx.setLineWidth(1);

      // Y轴
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, canvasHeight - padding);
      ctx.stroke();

      // X轴
      ctx.beginPath();
      ctx.moveTo(padding, canvasHeight - padding);
      ctx.lineTo(canvasWidth - padding, canvasHeight - padding);
      ctx.stroke();

      // 绘制Y轴刻度和标签
      ctx.setFontSize(20);
      ctx.setFillStyle('#666');
      for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        const weight = maxWeight - (weightRange / 5) * i;

        // 刻度线
        ctx.setStrokeStyle('#f0f0f0');
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvasWidth - padding, y);
        ctx.stroke();

        // 标签
        ctx.setFillStyle('#666');
        ctx.fillText(weight.toFixed(1) + 'kg', 5, y + 5);
      }

      // 绘制数据线
      if (chartData.length > 1) {
        const xStep = chartWidth / (chartData.length - 1);

        // 绘制渐变背景
        const gradient = ctx.createLinearGradient(0, padding, 0, canvasHeight - padding);
        gradient.addColorStop(0, 'rgba(7, 193, 96, 0.3)');
        gradient.addColorStop(1, 'rgba(7, 193, 96, 0.05)');

        ctx.setFillStyle(gradient);
        ctx.beginPath();
        ctx.moveTo(padding, this.getYPosition(chartData[0].y, minWeight, weightRange, chartHeight, padding));

        chartData.forEach((item, index) => {
          const x = padding + xStep * index;
          const y = this.getYPosition(item.y, minWeight, weightRange, chartHeight, padding);
          ctx.lineTo(x, y);
        });

        ctx.lineTo(padding + xStep * (chartData.length - 1), canvasHeight - padding);
        ctx.lineTo(padding, canvasHeight - padding);
        ctx.closePath();
        ctx.fill();

        // 绘制数据线
        ctx.setStrokeStyle('#07c160');
        ctx.setLineWidth(3);
        ctx.setLineCap('round');
        ctx.setLineJoin('round');
        ctx.beginPath();

        chartData.forEach((item, index) => {
          const x = padding + xStep * index;
          const y = this.getYPosition(item.y, minWeight, weightRange, chartHeight, padding);

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();

        // 绘制数据点
        chartData.forEach((item, index) => {
          const x = padding + xStep * index;
          const y = this.getYPosition(item.y, minWeight, weightRange, chartHeight, padding);

          // 外圆
          ctx.setFillStyle('#ffffff');
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, 2 * Math.PI);
          ctx.fill();

          // 内圆
          ctx.setFillStyle('#07c160');
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fill();
        });
      }

      // 绘制X轴日期标签
      if (chartData.length <= 7) {
        ctx.setFontSize(18);
        ctx.setFillStyle('#666');
        chartData.forEach((item, index) => {
          if (index % Math.ceil(chartData.length / 7) === 0) {
            const x = padding + (chartWidth / (chartData.length - 1)) * index;
            ctx.fillText(item.label, x - 15, canvasHeight - padding + 25);
          }
        });
      }

      ctx.draw();
    },

    getYPosition(weight, minWeight, weightRange, chartHeight, padding) {
      const normalized = (weight - minWeight) / weightRange;
      return padding + chartHeight - (normalized * chartHeight);
    }
  }
});