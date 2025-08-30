
/*
 * app.js - 杨辉三角可视化工具脚本
 * 功能：
 *   1. 渲染杨辉三角并支持组合数显示、数字显示切换
 *   2. 在底部显示二项式展开公式
 *   3. 在右侧信息面板显示当前选择的组合数公式与阶乘定义
 *   4. 支持连接线显示/隐藏和斜列规律显示
 *   5. 提供交互控制：行数调整、显示模式切换等
 */

// 全局状态对象 - 存储应用程序的当前状态
const state = {
  rows: 6,               // 当前显示的行数
  maxRows: 30,           // 最大可显示行数
  minRows: 1,            // 最小可显示行数
  showLines: false,      // 是否显示连接线
  useCombination: false, // 杨辉三角中显示组合数符号(C_n^k)还是数字
  useNumericCoeff: false,// 二项式展开系数显示为数字还是组合数符号
  showSymmetryLine: false, // 是否显示竖直对称线
  currentPattern: null,  // 当前显示的数学规律类型 (null, 'fibonacci', 'natural', 'triangular', 'tetrahedral')
  showSierpinski: false,  // 是否显示谢尔宾斯三角效果
  showRowSums: false,    // 是否显示行连接和总和
  showPrimes: false      // 是否显示素数高亮
};

// DOM元素引用对象 - 缓存常用的DOM元素引用，提高性能
const el = {};

/**
 * 初始化入口函数
 * 功能：获取DOM元素引用，绑定事件监听，设置初始状态并渲染界面
 */
function init() {
  // 获取主要DOM元素引用
  el.triangleContainer = document.getElementById('triangle-container'); // 杨辉三角容器
  el.svg = document.getElementById('connections-svg');                 // 连接线SVG容器
  el.rowsInput = document.getElementById('rows-input');                // 行数输入框
  el.toggleLinesBtn = document.getElementById('toggle-lines');         // 切换连接线按钮
  el.toggleNotationBtn = document.getElementById('toggle-notation');   // 切换组合数显示按钮
  el.toggleCoeffBtn = document.getElementById('toggle-coeff');         // 切换系数显示按钮
  el.expansionContent = document.getElementById('expansion-content');  // 底部二项式展开公式容器
  el.infoContent = document.getElementById('info-content');            // 右侧信息面板
  // 数学规律按钮
  el.fibonacciBtn = document.getElementById('fibonacci-btn');
  el.naturalBtn = document.getElementById('natural-btn');
  el.triangularBtn = document.getElementById('triangular-btn');
  el.tetrahedralBtn = document.getElementById('tetrahedral-btn');
  el.clearPatternBtn = document.getElementById('clear-pattern-btn');
  // 数学规律展示面板
  el.patternInfoPanel = document.getElementById('pattern-info-panel');
  // 竖直对称线按钮
  el.toggleSymmetryBtn = document.getElementById('toggle-symmetry');
  // 谢尔宾斯三角按钮
  el.toggleSierpinskiBtn = document.getElementById('toggle-sierpinski');
  
  // 行总和按钮
  el.toggleRowSumsBtn = document.getElementById('toggle-row-sums');
  
  // 素数高亮按钮
  el.togglePrimesBtn = document.getElementById('toggle-primes');

  // 执行初始化操作
  bindEvents();                   // 绑定事件监听
  el.rowsInput.value = state.rows; // 设置初始行数
  updateToggleButtons();          // 更新按钮文字
  render();                       // 首次渲染杨辉三角
}

/**
 * 绑定事件监听函数
 * 功能：为所有交互元素绑定事件处理函数，实现用户交互功能
 */
function bindEvents() {
  // 统一的功能状态管理函数
  function activateFeature(featureType) {
    // 关闭所有特殊功能
    state.currentPattern = null;
    state.showSymmetryLine = false;
    state.showSierpinski = false;
    state.showRowSums = false;
    state.showPrimes = false;
    
    // 根据传入的功能类型激活对应功能
    if (featureType === 'symmetry') {
      state.showSymmetryLine = true;
    } else if (featureType === 'sierpinski') {
      state.showSierpinski = true;
    } else if (featureType === 'rowSums') {
      state.showRowSums = true;
      // 显示行总和信息
      if (el.infoContent && el.patternInfoPanel) {
        el.infoContent.innerHTML = '杨辉三角中第n行所有数字的和等于2的n次方。例如：第3行的和是8，即2^3。';
        // 先渲染LaTeX公式
        const rowSumFormula = katex.renderToString('\\\\sum_{k=0}^{n} C(n,k) = 2^n', { throwOnError: false, displayMode: true });
        el.patternInfoPanel.innerHTML = `
          <div class="pattern-header rowSums-pattern">
            <h3>行总和</h3>
          </div>
          <div class="pattern-content">
            <p class="pattern-description">杨辉三角中第n行所有数字的和等于2的n次方。</p>
            <div class="pattern-formula">
              <p>${rowSumFormula}</p>
            </div>
            <p class="pattern-example">例如：第0行和为1=2^0，第1行和为2=2^1，第2行和为4=2^2，第3行和为8=2^3...</p>
          </div>
        `;
      }
    } else if (featureType === 'primes') {
      state.showPrimes = true;
      // 显示素数信息
      if (el.infoContent && el.patternInfoPanel) {
        el.infoContent.innerHTML = '素数是指大于1的自然数，且只能被1和它本身整除的数。';
        updatePatternInfoPanel('prime');
      }
    } else if (featureType) {
      // 如果是数学规律类型
      state.currentPattern = featureType;
    } else {
      // 如果取消所有功能，清空信息面板
      if (el.infoContent && el.patternInfoPanel) {
        el.infoContent.innerHTML = '<p>点击杨辉三角中的元素查看详细信息</p>';
        el.patternInfoPanel.innerHTML = '';
      }
    }
    
    // 更新所有按钮状态
    updateToggleButtons();
    updatePatternButtons();
    
    // 更新信息面板
    if (state.currentPattern) {//如果当前有数学规律类型
      updatePatternInfoPanel(state.currentPattern);//更新数学规律展示面板
    } else if (el.patternInfoPanel) {//清除规律
      el.patternInfoPanel.innerHTML = '';//清除规律展示面板内容
    }
    
    // 重新渲染
    render();
  }

  // 竖直对称线显示切换
  if (el.toggleSymmetryBtn) {
    el.toggleSymmetryBtn.onclick = () => {
      // 如果已经是激活状态，则取消激活；否则激活并关闭其他功能
      if (state.showSymmetryLine) {
        activateFeature(null);
      } else {
        activateFeature('symmetry');
      }
      
      // 更新按钮文字
      el.toggleSymmetryBtn.innerHTML = state.showSymmetryLine
          ? '<i class="fas fa-vertical-align-center"></i> 隐藏竖直对称线'
          : '<i class="fas fa-vertical-align-center"></i> 显示竖直对称线';
    };
  }

  // 谢尔宾斯三角效果显示切换
  if (el.toggleSierpinskiBtn) {
    el.toggleSierpinskiBtn.onclick = () => {
      // 添加或移除sierpinski-active类以控制行间距
      if (el.triangleContainer) {
        if (!state.showSierpinski) {
          el.triangleContainer.classList.add('sierpinski-active');
        } else {
          el.triangleContainer.classList.remove('sierpinski-active');
        }
      }
      
      // 如果已经是激活状态，则取消激活；否则激活并关闭其他功能
      if (state.showSierpinski) {
        activateFeature(null);
      } else {
        activateFeature('sierpinski');
      }
      
      // 更新按钮文字
      el.toggleSierpinskiBtn.innerHTML = state.showSierpinski
          ? '<i class="fas fa-caret-down"></i> 隐藏谢尔宾斯三角'
          : '<i class="fas fa-caret-down"></i> 显示谢尔宾斯三角';
    };
  }

  // 数学规律按钮事件
  el.fibonacciBtn.onclick = () => {
    if (state.currentPattern === 'fibonacci') {
      activateFeature(null);
    } else {
      activateFeature('fibonacci');
    }
  };
  
  el.naturalBtn.onclick = () => {
    if (state.currentPattern === 'natural') {
      activateFeature(null);
    } else {
      activateFeature('natural');
    }
  };
  
  el.triangularBtn.onclick = () => {
    if (state.currentPattern === 'triangular') {
      activateFeature(null);
    } else {
      activateFeature('triangular');
    }
  };
  
  el.tetrahedralBtn.onclick = () => {
    if (state.currentPattern === 'tetrahedral') {
      activateFeature(null);
    } else {
      activateFeature('tetrahedral');
    }
  };
  
  // 修复清除规律按钮，现在可以清除所有特殊功能
  el.clearPatternBtn.onclick = () => {
    activateFeature(null);
  };

  // 应用行数变化
  document.getElementById('apply-rows').onclick = () => {
    const v = parseInt(el.rowsInput.value, 10);
    // 验证输入的行数是否在有效范围内
    if (!isNaN(v) && v >= state.minRows && v <= state.maxRows) {
      state.rows = v;
      render();
    }
  };

  // 增加行数
  document.getElementById('add-row').onclick = () => {
    if (state.rows < state.maxRows) {
      state.rows++;
      el.rowsInput.value = state.rows;
      render();
    }
  };

  // 减少行数
  document.getElementById('remove-row').onclick = () => {
    if (state.rows > state.minRows) {
      state.rows--;
      el.rowsInput.value = state.rows;
      render();
    }
  };

  // 重置按钮
  document.getElementById('reset-btn').onclick = () => {
    // 重置所有状态到初始值
    state.rows = 6;
    state.showLines = false;
    state.useCombination = false;
    state.useNumericCoeff = false;
    state.currentPattern = null;
    state.showSierpinski = false;
    state.showRowSums = false;
    state.showPrimes = false;
    
    el.rowsInput.value = state.rows;
    updateToggleButtons();
    updatePatternButtons();
    el.expansionContent.innerHTML = '点击上方的数字查看公式';
    el.infoContent.innerHTML = '<p>点击杨辉三角中的元素查看详细信息</p>';
    if (el.patternInfoPanel) {
      el.patternInfoPanel.innerHTML = '';
    }
    render();
  };

  // 切换连接线显示
  el.toggleLinesBtn.onclick = () => {
    state.showLines = !state.showLines;
    updateToggleButtons();
    render();
  };

  // 切换组合数显示
  el.toggleNotationBtn.onclick = () => {
    state.useCombination = !state.useCombination;
    updateToggleButtons();
    render();
  };

  // 切换系数显示
  el.toggleCoeffBtn.onclick = () => {
    state.useNumericCoeff = !state.useNumericCoeff;
    updateToggleButtons();
    // 如果之前有点击过的单元格，重新触发点击事件以更新显示
    if(el.lastClicked) onCellClick(...el.lastClicked);
  };
  
  // 切换行连接和总和显示
  if (el.toggleRowSumsBtn) {
    el.toggleRowSumsBtn.onclick = () => {
      // 如果已经是激活状态，则取消激活；否则激活并关闭其他功能
      if (state.showRowSums) {
        activateFeature(null);
      } else {
        activateFeature('rowSums');
      }
      updateToggleButtons();
    };
  }
  
  // 切换素数高亮显示
  if (el.togglePrimesBtn) {
    el.togglePrimesBtn.onclick = () => {
      // 如果已经是激活状态，则取消激活；否则激活并关闭其他功能
      if (state.showPrimes) {
        activateFeature(null);
      } else {
        activateFeature('primes');
      }
      updateToggleButtons();
    };
  }

  // 窗口大小变化时更新连接线（使用防抖函数优化性能）
  window.addEventListener('resize', debounce(() => {
    if (state.showLines) drawConnections();
  }, 120));

  // 滚动时更新连接线（使用防抖函数优化性能）
  document.getElementById('triangle-wrapper').addEventListener('scroll', debounce(() => {
    if (state.showLines) drawConnections();
  }, 80));
}

/**
 * 检查一个数是否为素数
 * @param {number} num - 要检查的数字
 * @returns {boolean} - 如果是素数返回true，否则返回false
 */
function isPrime(num) {
  // 特殊情况处理
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  
  // 只需检查到sqrt(num)，并且可以跳过偶数和3的倍数
  const sqrtNum = Math.sqrt(num);
  for (let i = 5; i <= sqrtNum; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
}

/**计算组合数 C(n,k)
 * 
 * @param {number} n - 总数
 * @param {number} k - 选取个数
 * @returns {number} - 组合数结果
 */
function combination(n, k) {
  // 特殊情况处理：C(n,0) = C(n,n) = 1
  if (k === 0 || k === n) return 1;
  
  let result = 1;
  // 使用迭代方式计算组合数，避免大数运算和递归
  for (let i = 1; i <= k; i++) {
    result = result * (n - i + 1) / i;
  }
  return result;
}

/**生成杨辉三角数据
 * 
 * @param {number} rows - 要生成的行数
 * @returns {Array<Array<number>>} - 二维数组，包含杨辉三角的数值数据
 */
function generatePascalTriangle(rows) {
  const triangle = [];
  
  // 逐行生成杨辉三角数据
  for (let n = 0; n < rows; n++) {
    triangle[n] = [];
    for (let k = 0; k <= n; k++) {
      triangle[n][k] = combination(n, k);
    }
  }
  
  return triangle;
}

/**生成二项式展开的LaTeX字符串
 * 
 * @param {number} row - 杨辉三角的行数，对应二项式的幂次
 * @returns {string} - 二项式展开的LaTeX表达式
 */
function showBinomialExpansion(row) {
  let expansion = `(a+b)^{${row}} = `;
  
  // 生成每一项的表达式
  for (let k = 0; k <= row; k++) {
    if (k > 0) expansion += " + "; // 项之间添加加号
    
    const coeff = combination(row, k);
    // 根据状态选择显示数字系数还是组合数符号
    if (state.useNumericCoeff) {
      // 系数为1时省略不显示
      if (coeff !== 1) expansion += `${coeff}`;
    } else {
      expansion += `C_{${row}}^{${k}}`;
    }
    
    // 添加a的幂次
    const aExp = row - k;
    if (aExp > 0) {
      expansion += `a${aExp > 1 ? `^{${aExp}}` : ''}`; // 指数为1时省略
    }
    
    // 添加b的幂次
    const bExp = k;
    if (bExp > 0) {
      expansion += `b${bExp > 1 ? `^{${bExp}}` : ''}`; // 指数为1时省略
    }
  }
  
  return expansion;
}

/**
 * 渲染杨辉三角到页面
 * 功能：清空容器，生成并创建DOM元素，应用样式，并根据状态显示连接线和斜列规律
 */
function render() {
  // 清空容器
  console.log('开始渲染杨辉三角，行数:', state.rows);
  el.triangleContainer.innerHTML = '';
  clearSVG();
  
  // 生成杨辉三角数据
  const triangle = generatePascalTriangle(state.rows);
  
  // 逐行创建DOM元素
  triangle.forEach((row, n) => {
    const lineEl = document.createElement('div');
    lineEl.className = 'pascal-line';
    
    // 创建行标签
    const label = document.createElement('div');
    label.className = 'row-label';
    label.textContent = `第 ${n} 行`;
    lineEl.appendChild(label);
    
    // 创建行内容容器
    const rowEl = document.createElement('div');
    rowEl.className = 'pascal-row';
    
    // 创建每个单元格
    row.forEach((value, k) => {
      const cell = document.createElement('div');
      cell.className = 'pascal-number';
      cell.dataset.n = n;      // 存储行索引
      cell.dataset.k = k;      // 存储列索引
      cell.dataset.value = value; // 存储数值
      
      // 如果启用了谢尔宾斯三角效果，且数值为奇数，则应用三角形样式
      if (state.showSierpinski && value % 2 === 1) {
        cell.classList.add('triangle');
      }
      
      // 如果启用了素数高亮，且数值为素数，则应用圆角方形样式
      if (state.showPrimes && isPrime(value)) {
        cell.classList.add('rounded-square');
      }
      
      // 根据状态选择显示组合数符号还是数字
      const latex = state.useCombination ? `C_{${n}}^{${k}}` : `${value}`;
      cell.innerHTML = katex.renderToString(latex, {throwOnError: false});
      cell.title = `C_{${n}}^{${k}} = ${value}`; // 悬停提示
      
      // 绑定点击事件
      cell.onclick = () => {
        // 添加点击高亮效果
        cell.classList.add('highlight');
        setTimeout(() => cell.classList.remove('highlight'), 900);
        
        // 处理点击事件，更新信息显示
        onCellClick(n, k, value);
      };
      
      rowEl.appendChild(cell);
    });
    
    lineEl.appendChild(rowEl);
    el.triangleContainer.appendChild(lineEl);
  });
  
  // 如果需要显示连接线，使用requestAnimationFrame确保DOM更新完成后再绘制
  if (state.showLines) {
    requestAnimationFrame(() => requestAnimationFrame(drawConnections));
  }
  
  // 如果需要显示行连接和总和
  if (state.showRowSums) {
    requestAnimationFrame(() => requestAnimationFrame(drawRowSums));
  }
  
  // 如果需要显示竖直对称线
  if (state.showSymmetryLine) {
    drawVerticalSymmetryLine();
  }

  // 显示数学规律
  if (state.currentPattern) {
    highlightPatternCells(state.currentPattern);
    updatePatternInfoPanel(state.currentPattern);
  } else if (el.patternInfoPanel) {
    el.patternInfoPanel.innerHTML = '';
  }
}

/**
 * 点击杨辉三角单元格时的处理函数
 * 功能：更新底部二项式展开公式和右侧信息面板的内容
 * @param {number} n - 行索引
 * @param {number} k - 列索引
 * @param {number} value - 单元格数值
 */
function onCellClick(n, k, value) {
  // 记录最后点击的单元格信息，用于后续可能的更新
  el.lastClicked = [n, k, value];
  
  // 更新底部显示的二项式展开公式
  const binomLaTeX = showBinomialExpansion(n);
  el.expansionContent.innerHTML = katex.renderToString(binomLaTeX, {
    throwOnError: false,
    displayMode: true
  });
  
  // 更新右侧信息面板，显示当前选择的组合数和公式
  const combLaTeX = `C_{${n}}^{${k}} = ${value}`;
  const combFormula = `C_{n}^{k} = \\frac{n!}{k!(n-k)!}`;
  
  el.infoContent.innerHTML = `
      <div><strong>当前选择：</strong> 第 ${n} 行, 第 ${k} 个元素</div>
      <div style="margin-top:8px">${katex.renderToString(combLaTeX, {throwOnError: false, displayMode: true})}</div>
      <div style="margin-top:8px; font-size:0.95rem;">${katex.renderToString(combFormula, {throwOnError: false, displayMode: true})}</div>
  `;
}

/**
 * 绘制竖直对称线，从杨辉三角第一个元素的中点画一条竖直向下的直线
 * 功能：找到这条竖直线上的所有元素，将它们变为圆角方形，并画一条竖直的线连接这些元素
 */
function drawVerticalSymmetryLine() {
  const svg = el.svg;
  const containerRect = document.getElementById('triangle-wrapper').getBoundingClientRect();
  
  // 定义对称线颜色
  const symmetryColor = '#2ecc71';
  
  // 获取容器的高度，用于确定线条的终点
  const containerHeight = containerRect.height;
  
  // 找到第一个元素（顶点）
  const firstCell = el.triangleContainer.querySelector(`.pascal-number[data-n='0'][data-k='0']`);
  
  if (firstCell) {
    // 计算第一个元素中心点相对于容器的坐标
    const firstRect = firstCell.getBoundingClientRect();
    const verticalLineX = firstRect.left + firstRect.width / 2 - containerRect.left;
    const firstPointY = firstRect.top + firstRect.height / 2 - containerRect.top;
    
    // 将第一个元素变为圆角方形
    firstCell.classList.add('rounded-square');
    
    // 存储竖直线上的元素
    const verticalLineCells = [firstCell];
    
    // 遍历每一行，找到竖直线上的元素
    for (let n = 0; n < state.rows; n+=2) {
      // 获取当前行的所有元素
      const rowCells = el.triangleContainer.querySelectorAll(`.pascal-number[data-n='${n}']`);
      let closestCell = null;
      let minDistance = Infinity;
      
      // 找出该行中离竖直线最近的元素
      rowCells.forEach(cell => {
        const rect = cell.getBoundingClientRect();
        const cellCenterX = rect.left + rect.width / 2 - containerRect.left;
        const distance = Math.abs(cellCenterX - verticalLineX);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestCell = cell;
        }
      });
      
      // 如果找到符合条件的元素，将其变为圆角方形
      if (closestCell) {
        closestCell.classList.add('rounded-square');
        verticalLineCells.push(closestCell);
        
        // 在元素中心添加小圆点标记
        const rect = closestCell.getBoundingClientRect();
        const cellCenterX = rect.left + rect.width / 2 - containerRect.left;
        const cellCenterY = rect.top + rect.height / 2 - containerRect.top;
        
        const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
        circle.setAttribute('cx', cellCenterX);
        circle.setAttribute('cy', cellCenterY);
        circle.setAttribute('r', '6');
        circle.setAttribute('fill', symmetryColor);
        circle.setAttribute('opacity', '0.9');
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '2');
        svg.appendChild(circle);
      }
    }
    
    // 绘制从第一个元素中点竖直向下的直线
    const line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
    line.setAttribute('x1', verticalLineX);
    line.setAttribute('y1', firstPointY);
    line.setAttribute('x2', verticalLineX);
    line.setAttribute('y2', containerHeight); // 延伸到容器底部
    line.setAttribute('stroke', symmetryColor);
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-opacity', '0.7');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('stroke-dasharray', '5,3'); // 虚线效果
    svg.appendChild(line);
  }
}

/**
 * 绘制行连接和显示行总和
 * 功能：为每一行的所有元素绘制一条连接线，并在末端显示该行的总和公式 2^n = 总和
 */
function drawRowSums() {
  const svg = el.svg;
  const containerRect = document.getElementById('triangle-wrapper').getBoundingClientRect();
  const lines = Array.from(el.triangleContainer.querySelectorAll('.pascal-line'));
  
  // 定义行连接和总和显示的颜色
  const sumLineColor = '#3498db';
  const sumTextColor = '#2980b9';
  
  // 遍历每一行
  lines.forEach((line, n) => {
    const cells = Array.from(line.querySelectorAll('.pascal-number'));
    
    if (cells.length > 0) {
      // 计算该行所有元素的和（应该是2^n）
      const rowSum = cells.reduce((sum, cell) => sum + parseInt(cell.dataset.value), 0);
      
      // 获取第一个和最后一个元素的位置
      const firstRect = cells[0].getBoundingClientRect();
      const lastRect = cells[cells.length - 1].getBoundingClientRect();
      
      // 计算连线的起点和终点坐标
      const startX = firstRect.left - containerRect.left;
      const startY = firstRect.top + firstRect.height / 2 - containerRect.top;
      const endX = lastRect.right - containerRect.left;
      const endY = lastRect.top + lastRect.height / 2 - containerRect.top;
      
      // 绘制连接整行的水平线
      const rowLine = document.createElementNS("http://www.w3.org/2000/svg", 'line');
      rowLine.setAttribute('x1', startX);
      rowLine.setAttribute('y1', startY);
      rowLine.setAttribute('x2', endX);
      rowLine.setAttribute('y2', endY);
      rowLine.setAttribute('stroke', sumLineColor);
      rowLine.setAttribute('stroke-width', '2');
      rowLine.setAttribute('stroke-opacity', '0.8');
      rowLine.setAttribute('stroke-linecap', 'round');
      svg.appendChild(rowLine);
      
      // 绘制从最后一个元素到总和标签的连接线
      const connectLineX1 = endX;
      const connectLineY1 = endY;
      const connectLineX2 = endX + 60; // 向右延伸60像素
      const connectLineY2 = endY;
      
      const connectLine = document.createElementNS("http://www.w3.org/2000/svg", 'line');
      connectLine.setAttribute('x1', connectLineX1);
      connectLine.setAttribute('y1', connectLineY1);
      connectLine.setAttribute('x2', connectLineX2);
      connectLine.setAttribute('y2', connectLineY2);
      connectLine.setAttribute('stroke', sumLineColor);
      connectLine.setAttribute('stroke-width', '2');
      connectLine.setAttribute('stroke-opacity', '0.8');
      connectLine.setAttribute('stroke-linecap', 'round');
      connectLine.setAttribute('stroke-dasharray', '3,2');
      svg.appendChild(connectLine);
      
      // 显示总和公式：2^n = 行和
      const sumLabel = `2^${n} = ${rowSum}`;
      displayRowSumLabel(svg, connectLineX2 + 10, connectLineY2, sumLabel, sumTextColor);
    }
  });
}

/**
 * 在指定位置显示行总和公式标签
 * @param {SVGElement} svg - SVG容器元素
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {string} label - 要显示的标签文本
 * @param {string} color - 文本颜色
 */
function displayRowSumLabel(svg, x, y, label, color = '#2980b9') {
  const ns = "http://www.w3.org/2000/svg";
  
  // 使用KaTeX渲染公式
  const span = document.createElement('span');
  try {
    katex.render(label, span, { throwOnError: false });
  } catch (e) {
    span.textContent = label;
  }
  
  // 估算文本宽度
  const textLength = (label.length * 9) + 10;
  
  // 创建背景矩形
  const rect = document.createElementNS(ns, 'rect');
  rect.setAttribute('x', x);
  rect.setAttribute('y', y - 12);
  rect.setAttribute('width', textLength);
  rect.setAttribute('height', '24');
  rect.setAttribute('rx', '12');
  rect.setAttribute('fill', 'white');
  rect.setAttribute('stroke', color);
  rect.setAttribute('stroke-width', '1');
  rect.setAttribute('opacity', '0.95');
  svg.appendChild(rect);
  
  // 创建文本元素
  const text = document.createElementNS(ns, 'text');
  text.setAttribute('x', x + 5);
  text.setAttribute('y', y + 4);
  text.setAttribute('font-size', '14');
  text.setAttribute('fill', color);
  text.setAttribute('font-weight', 'bold');
  text.textContent = label;
  svg.appendChild(text);
}

/**
 * 绘制杨辉三角中单元格之间的连接线
 * 功能：为每一行的每个单元格与其下一行的对应单元格之间绘制连接线
 */
function drawConnections() {
  clearSVG(); // 先清空现有的连接线
  
  const svg = el.svg;
  const containerRect = document.getElementById('triangle-wrapper').getBoundingClientRect();
  const lines = Array.from(el.triangleContainer.querySelectorAll('.pascal-line'));
  
  // 遍历每一行，除了最后一行
  for (let i = 0; i < lines.length - 1; i++) {
    const curNums = Array.from(lines[i].querySelectorAll('.pascal-number'));
    const nextNums = Array.from(lines[i+1].querySelectorAll('.pascal-number'));
    
    // 为当前行的每个单元格绘制到下一行对应单元格的连接线
    curNums.forEach((cell, j) => {
      const cRect = cell.getBoundingClientRect();
      // 计算当前单元格中心点相对容器的坐标
      const cX = cRect.left + cRect.width/2 - containerRect.left;
      const cY = cRect.top + cRect.height/2 - containerRect.top;
      
      // 绘制到下一行左侧单元格的连接线
      if (j < nextNums.length) {
        const leftRect = nextNums[j].getBoundingClientRect();
        drawSVGLine(
          svg, 
          cX, cY, 
          leftRect.left + leftRect.width/2 - containerRect.left, 
          leftRect.top + leftRect.height/2 - containerRect.top
        );
      }
      
      // 绘制到下一行右侧单元格的连接线
      if (j+1 < nextNums.length) {
        const rightRect = nextNums[j+1].getBoundingClientRect();
        drawSVGLine(
          svg, 
          cX, cY, 
          rightRect.left + rightRect.width/2 - containerRect.left, 
          rightRect.top + rightRect.height/2 - containerRect.top
        );
      }
    });
  }
}

/**
 * 在SVG中绘制单条线
 * @param {SVGElement} svg - SVG容器元素
 * @param {number} x1 - 起始点x坐标
 * @param {number} y1 - 起始点y坐标
 * @param {number} x2 - 结束点x坐标
 * @param {number} y2 - 结束点y坐标
 */
function drawSVGLine(svg, x1, y1, x2, y2) {
  const ns = "http://www.w3.org/2000/svg";
  const line = document.createElementNS(ns, 'line');
  
  // 设置线的属性
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke', '#e74c3c');       // 线的颜色
  line.setAttribute('stroke-width', '3');       // 线的宽度
  line.setAttribute('stroke-opacity', '0.85');  // 线的透明度
  line.setAttribute('stroke-linecap', 'round'); // 线的端点样式
  
  svg.appendChild(line);
}

/**
 * 清空SVG容器中的所有内容
 */
function clearSVG() {
  // 确保el.svg存在且有子元素
  while (el.svg && el.svg.firstChild) {
    el.svg.removeChild(el.svg.firstChild);
  }
}

/**
 * 高亮显示特定的数学规律相关的单元格
 * @param {string} pattern - 数学规律类型
 */
function highlightPatternCells(pattern) {
  const cells = el.triangleContainer.querySelectorAll('.pascal-number');
  const patternCells = [];
  
  // 移除所有之前的高亮
  cells.forEach(cell => {
    cell.classList.remove('highlight-fibonacci', 'highlight-natural', 
                         'highlight-triangular', 'highlight-tetrahedral');
  });
  
  // 根据不同的规律类型，筛选需要高亮的单元格
  switch(pattern) {
    case 'fibonacci':
      // 斐波那契数列：沿对角线方向相加
      patternCells.push(...getFibonacciCells());
      break;
    case 'natural':
      // 自然数：第0列和第1列的斜列
      patternCells.push(...getNaturalNumberCells());
      break;
    case 'triangular':
      // 三角数：第2列的斜列
      patternCells.push(...getTriangularNumberCells());
      break;
    case 'tetrahedral':
      // 四面体数：第3列的斜列
      patternCells.push(...getTetrahedralNumberCells());
      break;
  }
  
  // 添加高亮类和动画效果
  animatePatternCells(patternCells, pattern);
}

/**
 * 为高亮的单元格添加动画效果
 * @param {Array<HTMLElement>} cells - 要添加动画的单元格数组
 * @param {string} pattern - 数学规律类型
 */
function animatePatternCells(cells, pattern) {
  const highlightClass = `highlight-${pattern}`;
  
  // 按顺序为单元格添加高亮效果，创建动画序列
  cells.forEach((cell, index) => {
    setTimeout(() => {
      cell.classList.add(highlightClass);
      // 添加轻微的动画效果
      const animation = cell.animate([
        { transform: 'scale(1)', opacity: '1' },
        { transform: 'scale(1.05)', opacity: '0.9' },
        { transform: 'scale(1)', opacity: '1' }
      ], {
        duration: 600,
        easing: 'ease-out'
      });
    }, index * 150); // 每个单元格间隔150ms，创建流动效果
  });
}

/**
 * 获取组成斐波那契数列的单元格
 * 斐波那契数列规律：沿对角线方向的数字之和
 * @returns {Array<HTMLElement>} 斐波那契数列相关的单元格
 */
function getFibonacciCells() {
  const cells = [];
  const svg = el.svg;
  const containerRect = document.getElementById('triangle-wrapper').getBoundingClientRect();
  
  // 定义斐波那契数列颜色
  const fibColor = '#e74c3c';
  
  // 计数，这是第几个斐波那契数
  let countNum = 1;
  
  // 计算并绘制斐波那契数列的对角线
  for (let m = 0; m < state.rows; m++) {
    const diagonalCells = [];
    let sum = 0;
    
    for (let i = 0; i <= m; i++) {
      const n = m - i;
      const k = i;
      const cell = el.triangleContainer.querySelector(`.pascal-number[data-n='${n}'][data-k='${k}']`);
      if (cell) {
        diagonalCells.push(cell);
        sum += parseInt(cell.dataset.value);
      }
    }
    
    // 如果有对角线单元格，将它们加入结果数组
    if (diagonalCells.length > 0) {
      // 设置同一对角线上所有单元格的颜色
      diagonalCells.forEach(cell => {
        // 存储原始背景色，以便后续可能的恢复
        if (!cell.dataset.originalBg) {
          cell.dataset.originalBg = cell.style.backgroundColor || '';
        }
        // 应用新的背景色
        cell.style.backgroundColor = fibColor + '30'; // 带透明度的颜色
        cells.push(cell);
      });
      
      // 为对角线添加连接线
      if (svg && diagonalCells.length > 0) {
        const lastRect = diagonalCells[diagonalCells.length - 1].getBoundingClientRect();
        
        // 绘制连续的对角线，使元素看起来连成一条直线
        if (diagonalCells.length > 1) {
          // 获取对角线的起点和终点坐标
          const firstRect = diagonalCells[0].getBoundingClientRect();
          const lastRect = diagonalCells[diagonalCells.length - 1].getBoundingClientRect();
          
          const startX = firstRect.left + firstRect.width/2 - containerRect.left;
          const startY = firstRect.top + firstRect.height/2 - containerRect.top;
          const endX = lastRect.left + lastRect.width/2 - containerRect.left;
          const endY = lastRect.top + lastRect.height/2 - containerRect.top;
          
          // 绘制一条连续的直线连接整个对角线
          const line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
          line.setAttribute('x1', startX);
          line.setAttribute('y1', startY);
          line.setAttribute('x2', endX);
          line.setAttribute('y2', endY);
          line.setAttribute('stroke', fibColor);
          line.setAttribute('stroke-width', '3');
          line.setAttribute('stroke-opacity', '0.6');
          line.setAttribute('stroke-linecap', 'round');
          svg.appendChild(line);
          
          // 在直线上添加小圆点标记每个单元格的位置
          diagonalCells.forEach(cell => {
            const rect = cell.getBoundingClientRect();
            const dotX = rect.left + rect.width/2 - containerRect.left;
            const dotY = rect.top + rect.height/2 - containerRect.top;
            
            const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
            circle.setAttribute('cx', dotX);
            circle.setAttribute('cy', dotY);
            circle.setAttribute('r', '5');
            circle.setAttribute('fill', fibColor);
            circle.setAttribute('opacity', '0.8');
            svg.appendChild(circle);
          });
        }
        
        // 绘制延伸到右侧的线，根据斐波那契数列元素的序号绘制不同的连接线
        const xStart = lastRect.left + lastRect.width/2 - containerRect.left;
        const yStart = lastRect.top + lastRect.height/2 - containerRect.top;
        
        let xEnd, yEnd;
        
        if(countNum === 1){
          // 第一个元素"1"的连接线直接向右延伸100
          xEnd = xStart + 100;
          yEnd = yStart-20;
        } else if(countNum === 2){
          const midX1 = xStart + 51;
          const midY1 = yStart - 60;
          xEnd = midX1 + 90;
          yEnd = midY1-30;
        } else {
          // 第3个元素及以后的所有元素都使用主延伸线直接延伸出来
          // 如果是偶数序数的元素，多向右上80像素

          if(countNum%2===0){//如果是偶数序数元素
            xEnd = xStart+120;
            yEnd = yStart-105;
          }else{
            xEnd = xStart+70;
            yEnd = yStart-57;
          }
        }
        
        // 绘制主延伸线 - 确保所有第三个元素及以后的元素（包括偶数序数）都沿着这条直线延伸
        const extendLine = document.createElementNS("http://www.w3.org/2000/svg", 'line');
        extendLine.setAttribute('x1', xStart);
        extendLine.setAttribute('y1', yStart);
        extendLine.setAttribute('x2', xEnd);
        extendLine.setAttribute('y2', yEnd);
        extendLine.setAttribute('stroke', fibColor);
        extendLine.setAttribute('stroke-width', '2');
        extendLine.setAttribute('stroke-opacity', '0.5');
        extendLine.setAttribute('stroke-linecap', 'round');
        extendLine.setAttribute('stroke-dasharray', '4,2');
        svg.appendChild(extendLine);
        
        // 在延伸线的末端显示总和
        displaySumLabel(svg, xEnd + 10, yEnd, sum, fibColor);
        
        // 增加斐波那契数列计数
        countNum++;
      }
    }
  }
  
  return cells;
}

/**
 * 获取自然数对应的单元格
 * 自然数：第0列和第1列的斜列
 * @returns {Array<HTMLElement>} 自然数相关的单元格
 */
function getNaturalNumberCells() {
  const cells = [];
  // 第0列和第1列的数字就是自然数序列
  for (let n = 0; n < state.rows; n++) {
    // 第1列（n >= 1）
    if (n >= 1) {
      const cell = el.triangleContainer.querySelector(`.pascal-number[data-n='${n}'][data-k='1']`);
      if (cell) {
        cell.classList.add('hexagon'); // 添加六边形样式
        cells.push(cell);
      }
    }
  }
  return cells;
}

/**
 * 获取三角数对应的单元格
 * 三角数：第2列的斜列（C(n,2)）
 * @returns {Array<HTMLElement>} 三角数相关的单元格
 */
function getTriangularNumberCells() {
  const cells = [];
  // 三角数出现在第2列（k=2）
  for (let n = 2; n < state.rows; n++) {
    const cell = el.triangleContainer.querySelector(`.pascal-number[data-n='${n}'][data-k='2']`);
    if (cell) {
      cell.classList.add('hexagon'); // 添加六边形样式
      cells.push(cell);
    }
  }
  return cells;
}

/**
 * 获取四面体数对应的单元格
 * 四面体数：第3列的斜列（C(n,3)）
 * @returns {Array<HTMLElement>} 四面体数相关的单元格
 */
function getTetrahedralNumberCells() {
  const cells = [];
  // 四面体数出现在第3列（k=3）
  for (let n = 3; n < state.rows; n++) {
    const cell = el.triangleContainer.querySelector(`.pascal-number[data-n='${n}'][data-k='3']`);
    if (cell) {
      cell.classList.add('hexagon'); // 添加六边形样式
      cells.push(cell);
    }
  }
  return cells;
}



/**
 * 绘制延伸到右侧的连接线
 * @param {SVGElement} svg - SVG容器元素
 * @param {number} x1 - 起始点x坐标
 * @param {number} y1 - 起始点y坐标
 * @param {number} x2 - 结束点x坐标
 * @param {number} y2 - 结束点y坐标
 * @param {string} color - 线条颜色
 */
function drawExtendedLine(svg, x1, y1, x2, y2, color = '#9b59b6') {
  const ns = "http://www.w3.org/2000/svg";
  const line = document.createElementNS(ns, 'line');
  
  // 设置延伸线的属性
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', '2');
  line.setAttribute('stroke-opacity', '0.5');
  line.setAttribute('stroke-linecap', 'round');
  line.setAttribute('stroke-dasharray', '3,2'); // 更密集的虚线
  
  svg.appendChild(line);
}

/**
 * 在延伸线末端显示总和标签
 * @param {SVGElement} svg - SVG容器元素
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {number} sum - 对角线元素的和
 * @param {string} color - 文本颜色
 */
function displaySumLabel(svg, x, y, sum, color = '#9b59b6') {
  const ns = "http://www.w3.org/2000/svg";
  
  // 创建背景矩形
  const rect = document.createElementNS(ns, 'rect');
  const textLength = (sum.toString().length * 12) + 10; // 估算文本宽度
  rect.setAttribute('x', x - 5);
  rect.setAttribute('y', y - 12);
  rect.setAttribute('width', textLength);
  rect.setAttribute('height', '24');
  rect.setAttribute('rx', '12');
  rect.setAttribute('fill', 'white');
  rect.setAttribute('stroke', color);
  rect.setAttribute('stroke-width', '1');
  rect.setAttribute('opacity', '0.9');
  svg.appendChild(rect);
  
  // 创建文本元素
  const text = document.createElementNS(ns, 'text');
  text.setAttribute('x', x + textLength/2 - 5);
  text.setAttribute('y', y + 4);
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('font-size', '14');
  text.setAttribute('fill', color);
  text.setAttribute('font-weight', 'bold');
  text.textContent = sum.toString();
  svg.appendChild(text);
}

/**
 * 更新数学规律信息面板
 * @param {string} pattern - 数学规律类型
 */
function updatePatternInfoPanel(pattern) {
  if (!el.patternInfoPanel) return;
  
  let title = '';
  let description = '';
  let formula = '';
  let detailedFormula = '';
  let example = '';
  let colorClass = '';
  
  // 根据不同的规律类型，设置不同的信息和样式
  switch(pattern) {
    case 'fibonacci':
      title = '斐波那契数列';
      description = '斐波那契数列是指这样一个数列：0，1，1，2，3，5，8，13，21，34，55，89……这个数列从第3项开始 ，每一项都等于前两项之和。';
      formula = 'F(1) = 1, F(2) = 1, F(n) = F(n-1) + F(n-2)';
      detailedFormula = `F_{n} = \\frac{\\phi^{n} - \\psi^{n}}{\\sqrt{5}}`;
      example = 'F₁ = 1, F₂ = 1, F₃ = 2, F₄ = 3, F₅ = 5, F₆ = 8, F₇ = 13, F₈ = 21...';
      colorClass = 'fibonacci-pattern';
      el.infoContent.innerHTML = `斐波那契数列是指这样一个数列：0，1，1，2，3，5，8，13，21，34，55，89……这个数列从第3项开始 ，每一项都等于前两项之和`;
      break;
    case 'natural':
      title = '自然数';
      description = '自然数就是没有负数的整数';
      formula = 'N(n) = n';
      detailedFormula = 'N_{n} = n';
      example = '1, 2, 3, 4, 5, 6, 7, 8, 9, 10...';
      colorClass = 'natural-pattern';
      el.infoContent.innerHTML = `自然数就是没有负数的整数`;
      break;
    case 'triangular':
      title = '三角数';
      description = '杨辉三角的第2列（k=2）的数字构成了三角数序列。三角数表示可以排列成三角形的点的数量，在几何和组合数学中有重要应用。';
      formula = 'T(n) = \C_{2}^{n+1}=\\frac{n(n+1)}{2}';
      detailedFormula = `T_{n} = \\binom{n+1}{2} = \\frac{n(n+1)}{2}`;
      example = '1, 3, 6, 10, 15, 21, 28, 36...';
      colorClass = 'triangular-pattern';
      el.infoContent.innerHTML = `杨辉三角的第2列（k=2）的数字构成了三角数序列。三角数表示可以排列成三角形的点的数量，在几何和组合数学中有重要应用。`;
      break;
    case 'tetrahedral':
      title = '四面体数';
      description = '杨辉三角的第3列（k=3）的数字构成了四面体数序列。四面体数表示可以排列成四面体的点的数量，是三维空间中的三角数。';
      formula = 'Te(n) = \C_{3}^{n+2} = \\frac{n(n+1)(n+2)}{6}';
      detailedFormula = `Te_{n} = \\binom{n+2}{3} = \\frac{n(n+1)(n+2)}{6}`;
      example = '1, 4, 10, 20, 35, 56, 84, 120...';
      colorClass = 'tetrahedral-pattern';
      el.infoContent.innerHTML = `杨辉三角的第3列（k=3）的数字构成了四面体数序列。四面体数表示可以排列成四面体的点的数量，是三维空间中的三角数。`;
      break;
      case 'prime':
        title ='素数';
        description ='素数是指大于1的自然数，且只能被1和它本身整除的数。';
        formula ='P(n) = n';
        detailedFormula ='p_{n} = \\text{第}n\\text{个素数}'
        example ='2, 3, 5, 7, 11, 13, 17, 19...';
        colorClass ='prime-pattern';
        el.infoContent.innerHTML =`素数是指大于1的自然数，且只能被1和它本身整除的数。`;
        break;
  }
  
  // 渲染LaTeX公式
  const renderedFormula = katex.renderToString(formula, { throwOnError: false, displayMode: false });
  const renderedDetailedFormula = katex.renderToString(detailedFormula, { throwOnError: false, displayMode: true });
  
  // 更新信息面板内容，应用不同的样式类
  el.patternInfoPanel.innerHTML = `
    <div class="pattern-header ${colorClass}">
      <h3>${title}</h3>
    </div>
    <div class="pattern-content">
      <p class="pattern-description">${description}</p>
      <div class="pattern-formula">
        <strong>递推公式：</strong>
        <div class="katex-display">${renderedFormula}</div>
      </div>
      <div class="pattern-detailed-formula">
        <strong>通项公式：</strong>
        <div class="katex-display">${renderedDetailedFormula}</div>
      </div>
      <div class="pattern-example">
        <strong>示例：</strong>
        <span>${example}</span>
      </div>
    </div>
  `;
}

/**
 * 更新切换按钮的显示文字
 * 功能：根据当前状态更新各个切换按钮的文字内容
 */
function updateToggleButtons() {
  el.toggleLinesBtn.textContent = state.showLines ? '隐藏连接线' : '显示连接线';
  el.toggleNotationBtn.textContent = state.useCombination ? '用数字表示' : '用组合数表示';
  el.toggleCoeffBtn.textContent = state.useNumericCoeff ? '系数用组合数' : '系数用数字';
  if (el.toggleRowSumsBtn) {
    el.toggleRowSumsBtn.textContent = state.showRowSums ? '隐藏行总和' : '显示行总和';
  }
  if (el.togglePrimesBtn) {
    el.togglePrimesBtn.textContent = state.showPrimes ? '隐藏素数高亮' : '显示素数高亮';
  }
}

/**
 * 更新数学规律按钮的显示状态
 * 功能：根据当前选中的数学规律更新按钮的样式和文字
 */
function updatePatternButtons() {
  if (!el.fibonacciBtn) return;
  
  // 更新按钮样式
  el.fibonacciBtn.classList.toggle('active', state.currentPattern === 'fibonacci');
  el.naturalBtn.classList.toggle('active', state.currentPattern === 'natural');
  el.triangularBtn.classList.toggle('active', state.currentPattern === 'triangular');
  el.tetrahedralBtn.classList.toggle('active', state.currentPattern === 'tetrahedral');
  
  // 更新按钮文字
  el.fibonacciBtn.textContent = state.currentPattern === 'fibonacci' ? '隐藏斐波那契数列' : '显示斐波那契数列';
  el.naturalBtn.textContent = state.currentPattern === 'natural' ? '隐藏自然数' : '显示自然数';
  el.triangularBtn.textContent = state.currentPattern === 'triangular' ? '隐藏三角数' : '显示三角数';
  el.tetrahedralBtn.textContent = state.currentPattern === 'tetrahedral' ? '隐藏四面体数' : '显示四面体数';
}

/**
 * 防抖函数
 * 功能：限制函数在短时间内的重复执行，用于优化性能
 * @param {Function} fn - 要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} - 防抖处理后的函数
 */
function debounce(fn, wait = 100) {
  let timeout = null;
  return function(...args) {
    // 清除之前的定时器
    if (timeout) clearTimeout(timeout);
    // 设置新的定时器
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * 页面加载完成后初始化应用
 */
document.addEventListener('DOMContentLoaded', init);
