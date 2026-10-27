
(() => {
  'use strict';

  // 手機版初次進站：固定從首頁頂端開始
  const isMobile = window.matchMedia('(max-width: 780px)').matches;

  if (isMobile) {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // 移除殘留的頁面錨點，例如 #contact
    if (location.hash) {
      history.replaceState(
        null,
        '',
        location.pathname + location.search
      );
    }

    // 初次進站停留在首頁，不影響使用者之後點擊導覽
    let initialPositionFixed = false;

    const resetInitialPosition = () => {
      if (initialPositionFixed) return;
      initialPositionFixed = true;

      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);

      requestAnimationFrame(() => {
        window.scrollTo(0, 0);

        setTimeout(() => {
          document.documentElement.style.scrollBehavior = 'auto';
          window.scrollTo(0, 0);
        }, 100);

        setTimeout(() => {
          document.documentElement.style.removeProperty('scroll-behavior');
        }, 200);
      });
    };

    // 等待 Safari 完成頁面載入
    if (document.readyState === 'complete') {
      resetInitialPosition();
    } else {
      window.addEventListener('load', resetInitialPosition, {
        once: true
      });
    }

    // Safari 從快取恢復頁面時重新定位
    window.addEventListener('pageshow', event => {
      if (event.persisted) {
        initialPositionFixed = false;
        resetInitialPosition();
      }
    });
  }

  const one = document.getElementById('stepOne');
  const two = document.getElementById('stepTwo');
  const result = document.getElementById('stepResult');

  const resolution = document.getElementById('resolutionCheck');
  const fov = document.getElementById('fovCheck');
  const unsure = document.getElementById('unsureCheck');

  const menuToggle = document.getElementById('menuToggle');
  const primaryNav = document.getElementById('primaryNav');

  let monthlyCases = 30;

  const caseLabels = {
    5: '不到 10 位（以約 5 位試算）',
    15: '10–20 位（以約 15 位試算）',
    30: '約 30 位',
    45: '40–50 位（以約 45 位試算）',
    60: '超過 50 位（以約 60 位試算）'
  };

  const fmt = n => Math.round(n).toLocaleString('en-US');

  function updateChoiceStyles() {
    document.querySelectorAll('.choice').forEach(label => {
      const input = label.querySelector('input');
      label.classList.toggle('selected', !!input.checked);
    });

    document.querySelectorAll('.spec-choice').forEach(label => {
      const input = label.querySelector('input');
      label.classList.toggle('checked', !!input.checked);
    });

    const unsureChoice = document.getElementById('unsureChoice');
    if (unsureChoice) {
      unsureChoice.classList.toggle('checked', unsure.checked);
    }
  }

  function setProgress(step) {
    document.querySelectorAll('[data-progress]').forEach(el => {
      const n = Number(el.dataset.progress);

      el.classList.toggle('active', n === step);
      el.classList.toggle('done', n < step);

      const icon = el.querySelector('i');
      if (icon) {
        icon.textContent = n < step
          ? '✓'
          : (n === 3 ? '✓' : String(n));
      }
    });
  }

  function showStep(step, scroll = false) {
    one.classList.toggle('hidden', step !== 1);
    two.classList.toggle('hidden', step !== 2);
    result.classList.toggle('hidden', step !== 3);

    setProgress(step);

    if (scroll) {
      document.getElementById('wizardCard').scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  // 第一題：每月病例數
  one.addEventListener('change', event => {
    if (event.target.name === 'cases') {
      monthlyCases = Number(event.target.value);
      updateChoiceStyles();
    }
  });

  one.addEventListener('submit', event => {
    event.preventDefault();

    const selected = one.querySelector(
      'input[name="cases"]:checked'
    );

    if (!selected) return;

    monthlyCases = Number(selected.value);
    updateChoiceStyles();
    showStep(2, true);
  });

  // 第二題：設備規格
  [resolution, fov].forEach(input => {
    input.addEventListener('change', () => {
      if (input.checked) unsure.checked = false;
      updateChoiceStyles();
    });
  });

  unsure.addEventListener('change', () => {
    if (unsure.checked) {
      resolution.checked = false;
      fov.checked = false;
    }

    updateChoiceStyles();
  });

  document.getElementById('backToOne')
    .addEventListener('click', () => showStep(1, true));

  two.addEventListener('submit', event => {
    event.preventDefault();
    renderResult();
    showStep(3, true);
  });

  document.getElementById('restartCalc')
    .addEventListener('click', () => showStep(1, true));

  // 計算每月潛在服務商機
  function renderResult() {
    // 示意假設：病例量的 50% 作為可能進一步評估的人數
    // 此假設不是經驗證的臨床需求比例
    const estimatedCandidates = Math.round(monthlyCases * 0.5);
    const exactValue = estimatedCandidates * 12000;

    document.getElementById('resultAmount').innerHTML =
      `${fmt(exactValue)}<small> 元</small>`;

    document.getElementById('resultRoundedNote').textContent =
      `約 ${(exactValue / 10000).toLocaleString('zh-TW')} 萬元／月`;

    document.getElementById('summaryCases').textContent =
      caseLabels[monthlyCases] || `約 ${monthlyCases} 位`;

    let specText;

    if (unsure.checked) {
      specText = '待專人協助確認';
    } else if (resolution.checked && fov.checked) {
      specText = '已勾選符合示意規格';
    } else if (resolution.checked || fov.checked) {
      specText = '部分規格已勾選，需確認';
    } else {
      specText = '尚未確認規格';
    }

    document.getElementById('summarySpecs').textContent = specText;

    document.getElementById('monthlyCasesResult').textContent =
      `約 ${fmt(monthlyCases)} 位`;

    document.getElementById('estimatedCandidates').textContent =
      `約 ${fmt(estimatedCandidates)} 位`;

    document.getElementById('exactAmount').textContent =
      `NT$ ${fmt(exactValue)}`;
  }

  // 手機導覽選單
  menuToggle.addEventListener('click', () => {
    const open = primaryNav.classList.toggle('open');

    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute(
      'aria-label',
      open ? '關閉導覽選單' : '開啟導覽選單'
    );
  });

  primaryNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      primaryNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // 將試算資訊帶入諮詢備註
  document.getElementById('resultContact')
    .addEventListener('click', () => {
      const notes = document.querySelector(
        '#contactForm textarea[name="notes"]'
      );

      if (!notes.value.trim()) {
        const spec = unsure.checked
          ? 'CBCT 規格需專人協助確認'
          : `CBCT 已確認規格：解析度${resolution.checked ? '已勾選' : '未勾選'}、FOV${fov.checked ? '已勾選' : '未勾選'}`;

        notes.value =
          `希望進一步了解氣道相關服務與 OPZ 雲端平台。` +
          `每月植牙／矯正病例：${caseLabels[monthlyCases]}；` +
          `中間值情境估算可能進一步評估約 ${Math.round(monthlyCases * 0.5)} 位。` +
          `${spec}。`;
      }
    });

  // 聯絡表單
  const contactForm = document.getElementById('contactForm');

  contactForm.addEventListener('submit', event => {
    event.preventDefault();

    if (!contactForm.reportValidity()) return;

    const success = document.getElementById('formSuccess');
    success.classList.remove('hidden');

    success.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  });

  // 頁尾年份與初始試算狀態
  document.getElementById('currentYear').textContent =
    new Date().getFullYear();

  updateChoiceStyles();
  showStep(1, false);
})();
