// ===== PPT预览器主逻辑 =====

class PPTPreviewer {
  constructor(data) {
    this.data = data;
    this.currentSlide = 0;
    this.charts = {};
    this.init();
  }

  init() {
    this.renderTopbar();
    this.renderSidebar();
    this.renderRightPanel();
    this.renderSlide(0);
    this.bindEvents();
  }

  renderTopbar() {
    const titleEl = document.querySelector('.topbar-title');
    if (titleEl) {
      titleEl.textContent = this.data.meta.title;
    }
  }

  renderSidebar() {
    const thumbList = document.querySelector('.thumb-list');
    if (!thumbList) return;

    thumbList.innerHTML = this.data.slides.map((slide, index) => `
      <div class="thumb-item ${index === 0 ? 'active' : ''}" data-index="${index}">
        <span class="thumb-num">${index + 1}</span>
        ${slide.title || '第' + (index + 1) + '页'}
      </div>
    `).join('');
  }

  renderRightPanel() {
    this.renderAuditPanel();
    this.renderQuestionPanel();
  }

  renderAuditPanel() {
    const auditSection = document.querySelector('#audit-section .panel-content');
    if (!auditSection || !this.data.audit) return;

    const checks = this.data.audit.checks || [];
    auditSection.innerHTML = checks.map(check => {
      const icon = check.status === 'pass' ? '✓' : (check.status === 'warn' ? '!' : '✗');
      const cls = check.status === 'pass' ? 'pass' : (check.status === 'warn' ? 'warn' : 'fail');
      return `
        <div class="audit-item">
          <div class="audit-icon ${cls}">${icon}</div>
          <div class="audit-text">${check.name}</div>
        </div>
      `;
    }).join('');

    const countEl = document.querySelector('#audit-section .badge-count');
    if (countEl) countEl.textContent = checks.length;
  }

  renderQuestionPanel() {
    const questionSection = document.querySelector('#question-section .panel-content');
    if (!questionSection || !this.data.questions) return;

    const questions = this.data.questions || [];
    questionSection.innerHTML = questions.map(q => `
      <div class="question-item ${q.level.toLowerCase()}">
        <span class="question-level">${q.level}</span>
        <span class="question-text">${q.text}</span>
      </div>
    `).join('');

    const countEl = document.querySelector('#question-section .badge-count');
    if (countEl) countEl.textContent = questions.length;
  }

  renderSlide(index) {
    if (index < 0 || index >= this.data.slides.length) return;
    
    this.currentSlide = index;
    const slide = this.data.slides[index];
    const slideContainer = document.querySelector('#slide-container');
    if (!slideContainer) return;

    this.disposeCharts();

    slideContainer.innerHTML = this.generateSlideHTML(slide, index);

    this.initCharts(slide.charts);
    this.initMermaid(slide.mermaid);
    this.updateThumbActive();
    this.updatePageIndicator();
  }

  generateSlideHTML(slide, index) {
    const type = slide.type || 'data';
    let bodyHTML = '';

    switch (type) {
      case 'cover':
        bodyHTML = this.generateCoverHTML(slide);
        break;
      case 'overview':
        bodyHTML = this.generateOverviewHTML(slide);
        break;
      case 'data':
        bodyHTML = this.generateDataHTML(slide);
        break;
      case 'rootcause':
        bodyHTML = this.generateRootcauseHTML(slide);
        break;
      case 'highlights':
        bodyHTML = this.generateHighlightsHTML(slide);
        break;
      case 'cost':
        bodyHTML = this.generateCostHTML(slide);
        break;
      case 'goals':
        bodyHTML = this.generateGoalsHTML(slide);
        break;
      case 'project':
        bodyHTML = this.generateProjectHTML(slide);
        break;
      default:
        bodyHTML = this.generateDataHTML(slide);
    }

    const logicHTML = slide.logic ? this.generateLogicHTML(slide.logic) : '';
    const noteHTML = slide.dataNote ? this.generateDataNoteHTML(slide.dataNote) : '';

    return `
      <div class="slide-header">
        <span class="slide-type-tag">${this.getTypeLabel(slide.type)}</span>
        <h1 class="slide-title">${slide.title || ''}</h1>
        ${slide.subtitle ? `<p class="slide-subtitle">${slide.subtitle}</p>` : ''}
      </div>
      <div class="slide-body">
        ${bodyHTML}
        ${logicHTML}
        ${noteHTML}
      </div>
      <div class="slide-footer">
        <span>TCL实业 · 计划物流部</span>
        <span class="page-indicator">${index + 1} / ${this.data.slides.length}</span>
      </div>
    `;
  }

  getTypeLabel(type) {
    const labels = {
      cover: '封面页',
      overview: '总览页',
      data: '数据页',
      rootcause: '根因分析页',
      highlights: '亮点展示页',
      cost: '降本成果页',
      goals: '目标分解页',
      project: '项目进展页'
    };
    return labels[type] || '内容页';
  }

  generateCoverHTML(slide) {
    return `
      <div style="text-align:center; padding: 60px 20px;">
        <div style="font-size: 18px; color: var(--tcl-red); margin-bottom: 20px; font-weight: 500;">
          ${slide.badge || 'H1总结 & H2规划'}
        </div>
        <div style="font-size: 48px; font-weight: 700; color: var(--navy); margin-bottom: 16px;">
          ${slide.title || ''}
        </div>
        <div style="font-size: 20px; color: var(--gray-500); margin-bottom: 48px;">
          ${slide.subtitle || ''}
        </div>
        <div style="font-size: 14px; color: var(--gray-600);">
          <span>${slide.presenter || '汇报人'}</span>
          <span style="margin: 0 12px; color: var(--gray-300);">|</span>
          <span>${slide.date || ''}</span>
        </div>
      </div>
    `;
  }

  generateOverviewHTML(slide) {
    const kpis = slide.kpis || [];
    return `
      <div class="kpi-grid">
        ${kpis.map(kpi => `
          <div class="kpi-card ${kpi.status || ''}">
            <div class="kpi-label">${kpi.label}</div>
            <div class="kpi-value">${kpi.value}</div>
            <div class="kpi-delta">
              <span class="delta-${kpi.deltaDirection || 'down'}">
                ${kpi.deltaDirection === 'down' ? '↓' : '↑'} ${kpi.delta || ''}
              </span>
              <span class="delta-compare">${kpi.compare || ''}</span>
            </div>
            <div class="kpi-chart" id="kpi-chart-${kpi.id || Math.random()}"></div>
          </div>
        `).join('')}
      </div>
      <div class="content-list">
        <h4>核心要点</h4>
        <ol>
          ${(slide.keyPoints || []).map(p => `<li>${p}</li>`).join('')}
        </ol>
      </div>
    `;
  }

  generateDataHTML(slide) {
    const chartHTML = slide.charts && slide.charts.length > 0 ? `
      <div class="chart-row">
        <div class="chart-box">
          <div class="chart-title">数据对比</div>
          <div class="chart-container" id="chart-${slide.charts[0].id}"></div>
        </div>
      </div>
    ` : '';

    const tableHTML = slide.table ? this.generateTableHTML(slide.table) : '';
    const insightHTML = slide.insight ? `<div class="insight-box"><strong>关键洞察：</strong>${slide.insight}</div>` : '';
    const pointsHTML = slide.keyPoints ? `
      <div class="content-list">
        <h4>正文要点</h4>
        <ol>
          ${slide.keyPoints.map(p => `<li>${p}</li>`).join('')}
        </ol>
      </div>
    ` : '';

    return chartHTML + tableHTML + insightHTML + pointsHTML;
  }

  generateTableHTML(table) {
    const headers = table.headers || [];
    const rows = table.rows || [];
    return `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map((cell, i) => {
                  const isLast = i === row.length - 1;
                  if (typeof cell === 'object' && cell !== null) {
                    return `<td class="${cell.class || ''}">${cell.text || ''}</td>`;
                  }
                  return `<td>${cell}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  generateRootcauseHTML(slide) {
    const layers = slide.layers || [];
    return `
      <div class="three-layer">
        ${layers.map((layer, i) => `
          <div class="layer layer-${i + 1}">
            <div class="layer-header">
              <span class="layer-num">0${i + 1}</span>
              <h3>${layer.title || ''}</h3>
            </div>
            <div class="layer-content">
              <p style="margin-bottom: 8px; color: var(--gray-700);">${layer.description || ''}</p>
              <ul>
                ${(layer.items || []).map(item => `<li>${item}</li>`).join('')}
              </ul>
              ${layer.responsible ? `<div class="responsible">责任主体：${layer.responsible}</div>` : ''}
            </div>
          </div>
          ${i < layers.length - 1 ? '<div class="layer-arrow">→</div>' : ''}
        `).join('')}
      </div>
    `;
  }

  generateHighlightsHTML(slide) {
    const chartHTML = slide.charts && slide.charts.length > 0 ? `
      <div class="chart-row">
        <div class="chart-box">
          <div class="chart-title">多维度指标达成</div>
          <div class="chart-container" id="chart-${slide.charts[0].id}"></div>
        </div>
      </div>
    ` : '';

    const factorsHTML = slide.factors ? `
      <div class="content-list">
        <h4>驱动因素</h4>
        <ul style="padding-left: 20px; line-height: 2.2; color: var(--gray-700);">
          ${slide.factors.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    return chartHTML + factorsHTML;
  }

  generateCostHTML(slide) {
    const chartHTML = slide.charts && slide.charts.length > 0 ? `
      <div class="chart-row">
        <div class="chart-box">
          <div class="chart-title">降本贡献拆解</div>
          <div class="chart-container" id="chart-${slide.charts[0].id}"></div>
        </div>
      </div>
    ` : '';

    const tableHTML = slide.table ? this.generateTableHTML(slide.table) : '';
    const summaryHTML = slide.summary ? `
      <div class="insight-box"><strong>降本总结：</strong>${slide.summary}</div>
    ` : '';

    return chartHTML + tableHTML + summaryHTML;
  }

  generateGoalsHTML(slide) {
    const chartHTML = slide.charts && slide.charts.length > 0 ? `
      <div class="chart-row">
        <div class="chart-box">
          <div class="chart-title">目标对比</div>
          <div class="chart-container" id="chart-${slide.charts[0].id}"></div>
        </div>
      </div>
    ` : '';

    const risksHTML = slide.risks ? `
      <div class="content-list">
        <h4>风险预警</h4>
        <ul style="padding-left: 20px; line-height: 2.2; color: var(--gray-700);">
          ${slide.risks.map(r => `<li><span class="badge warning">风险</span> ${r}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    return chartHTML + risksHTML;
  }

  generateProjectHTML(slide) {
    const chartHTML = slide.charts && slide.charts.length > 0 ? `
      <div class="chart-row">
        <div class="chart-box">
          <div class="chart-title">项目进度</div>
          <div class="chart-container" id="chart-${slide.charts[0].id}"></div>
        </div>
      </div>
    ` : '';

    const milestonesHTML = slide.milestones ? `
      <div class="content-list">
        <h4>关键里程碑</h4>
        <ul style="padding-left: 20px; line-height: 2.2; color: var(--gray-700);">
          ${slide.milestones.map(m => `<li>${m}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    return chartHTML + milestonesHTML;
  }

  generateLogicHTML(logic) {
    return `
      <div class="logic-flow">
        <div class="logic-item">
          <div class="logic-label">上页承接</div>
          <div class="logic-text">${logic.prev || '-'}</div>
        </div>
        <div class="logic-arrow">→</div>
        <div class="logic-item">
          <div class="logic-label">本页核心</div>
          <div class="logic-text">${logic.current || '-'}</div>
        </div>
        <div class="logic-arrow">→</div>
        <div class="logic-item">
          <div class="logic-label">下页预告</div>
          <div class="logic-text">${logic.next || '-'}</div>
        </div>
      </div>
    `;
  }

  generateDataNoteHTML(note) {
    return `
      <div class="data-note">
        <strong>数据标注：</strong>${note}
      </div>
    `;
  }

  initCharts(charts) {
    if (!charts || !window.echarts) return;

    charts.forEach(chartData => {
      const el = document.getElementById(`chart-${chartData.id}`);
      if (!el) return;

      const chart = echarts.init(el);
      chart.setOption(chartData.option || {});
      this.charts[chartData.id] = chart;
    });

    window.addEventListener('resize', this.resizeCharts.bind(this));
  }

  initMermaid(mermaidData) {
    if (!mermaidData || !window.mermaid) return;

    mermaid.initialize({ startOnLoad: false, theme: 'default' });
    
    document.querySelectorAll('.mermaid-code').forEach((el, i) => {
      const id = `mermaid-${i}-${Date.now()}`;
      mermaid.render(id, mermaidData).then(svgCode => {
        el.innerHTML = svgCode.svg;
      });
    });
  }

  disposeCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart && chart.dispose) chart.dispose();
    });
    this.charts = {};
  }

  resizeCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart && chart.resize) chart.resize();
    });
  }

  updateThumbActive() {
    document.querySelectorAll('.thumb-item').forEach((el, i) => {
      el.classList.toggle('active', i === this.currentSlide);
    });
  }

  updatePageIndicator() {
    const indicator = document.querySelector('.page-indicator');
    if (indicator) {
      indicator.textContent = `${this.currentSlide + 1} / ${this.data.slides.length}`;
    }
  }

  nextSlide() {
    if (this.currentSlide < this.data.slides.length - 1) {
      this.renderSlide(this.currentSlide + 1);
    }
  }

  prevSlide() {
    if (this.currentSlide > 0) {
      this.renderSlide(this.currentSlide - 1);
    }
  }

  togglePanel() {
    const panel = document.querySelector('.right-panel');
    const main = document.querySelector('.main-content');
    if (panel) panel.classList.toggle('collapsed');
    if (main) main.classList.toggle('panel-collapsed');
    setTimeout(() => this.resizeCharts(), 300);
  }

  bindEvents() {
    document.querySelectorAll('.thumb-item').forEach(el => {
      el.addEventListener('click', () => {
        const index = parseInt(el.dataset.index);
        this.renderSlide(index);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        this.nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.prevSlide();
      }
    });

    const prevBtn = document.querySelector('#prev-btn');
    const nextBtn = document.querySelector('#next-btn');
    const panelBtn = document.querySelector('#panel-btn');

    if (prevBtn) prevBtn.addEventListener('click', () => this.prevSlide());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextSlide());
    if (panelBtn) panelBtn.addEventListener('click', () => this.togglePanel());
  }
}
