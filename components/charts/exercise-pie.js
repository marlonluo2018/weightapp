// exercise-pie.js - 运动类型分布饼图组件
Component({
  properties: {
    data: {
      type: Array,
      value: []
    }
  },

  data: {
    canvasId: 'exercisePieChart',
    processedData: []
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
        this.setData({ processedData: [] });
        return;
      }

      // 统计每种运动类型的总时长
      const exerciseMap = {};
      exerciseData.forEach(item => {
        const type = item.type || '运动';
        if (!exerciseMap[type]) {
          exerciseMap[type] = 0;
        }
        exerciseMap[type] += (item.duration || 0);
      });

      // 转换为饼图数据格式
      const processedData = Object.entries(exerciseMap).map(([type, duration]) => ({
        label: type,
        value: duration,
        percentage: 0
      }));

      // 计算百分比
      const total = processedData.reduce((sum, item) => sum + item.value, 0);
      processedData.forEach(item => {
        item.percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
      });

      this.setData({ processedData });
      this.drawPieChart();
    },

    drawPieChart() {
      const data = this.data.processedData;
      if (data.length === 0) return;

      const ctx = wx.createCanvasContext(this.data.canvasId, this);
      const canvasWidth = 300;
      const canvasHeight = 300;
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const radius = 100;

      // 清空画布
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // 颜色配置
      const colors = [
        '#07c160', '#5ac8fa', '#ff9500', '#ff6b35',
        '#9c27b0', '#e91e63', '#00bcd4', '#8bc34a'
      ];

      // 计算角度
      let currentAngle = -Math.PI / 2; // 从顶部开始
      const total = data.reduce((sum, item) => sum + item.value, 0);

      data.forEach((item, index) => {
        const angle = (item.value / total) * 2 * Math.PI;

        // 绘制扇形
        ctx.setFillStyle(colors[index % colors.length]);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
        ctx.closePath();
        ctx.fill();

        // 绘制边框
        ctx.setStrokeStyle('#ffffff');
        ctx.setLineWidth(2);
        ctx.stroke();

        // 绘制百分比标签（如果占比大于5%）
        if (item.percentage > 5) {
          const labelAngle = currentAngle + angle / 2;
          const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
          const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

          ctx.setFillStyle('#ffffff');
          ctx.setFontSize(20);
          ctx.setTextAlign('center');
          ctx.setTextBaseline('middle');
          ctx.fillText(item.percentage + '%', labelX, labelY);
        }

        currentAngle += angle;
      });

      // 绘制中心白色圆圈（甜甜圈效果）
      ctx.setFillStyle('#ffffff');
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI);
      ctx.fill();

      // 在中心显示总时长
      const totalMinutes = data.reduce((sum, item) => sum + item.value, 0);
      ctx.setFillStyle('#333333');
      ctx.setFontSize(24);
      ctx.setTextAlign('center');
      ctx.setTextBaseline('middle');
      ctx.fillText(totalMinutes, centerX, centerY - 10);
      ctx.setFontSize(16);
      ctx.fillText('分钟', centerX, centerY + 10);

      ctx.draw();
    }
  }
});