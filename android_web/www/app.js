const state = {
    selectedFile: null,
    subtitles: [],
    llmConfig: {
        enabled: false,
        provider: 'deepseek',
        apiKey: '',
        apiBase: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat'
    }
};

const elements = {
    fileDrop: document.getElementById('fileDrop'),
    fileInput: document.getElementById('fileInput'),
    selectedFile: document.getElementById('selectedFile'),
    fileName: document.getElementById('fileName'),
    removeFile: document.getElementById('removeFile'),
    languageSelect: document.getElementById('languageSelect'),
    modelSelect: document.getElementById('modelSelect'),
    llmStatus: document.getElementById('llmStatus'),
    llmDot: document.getElementById('llmDot'),
    llmText: document.getElementById('llmText'),
    llmConfigBtn: document.getElementById('llmConfigBtn'),
    progressSection: document.getElementById('progressSection'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    generateBtn: document.getElementById('generateBtn'),
    subtitlesSection: document.getElementById('subtitlesSection'),
    subtitlesList: document.getElementById('subtitlesList'),
    addSubtitleBtn: document.getElementById('addSubtitleBtn'),
    deleteSelectedBtn: document.getElementById('deleteSelectedBtn'),
    saveSrtBtn: document.getElementById('saveSrtBtn'),
    llmModal: document.getElementById('llmModal'),
    llmModalClose: document.getElementById('llmModalClose'),
    llmCancelBtn: document.getElementById('llmCancelBtn'),
    llmSaveBtn: document.getElementById('llmSaveBtn'),
    llmEnabled: document.getElementById('llmEnabled'),
    llmProvider: document.getElementById('llmProvider'),
    llmApiKey: document.getElementById('llmApiKey'),
    llmApiBase: document.getElementById('llmApiBase'),
    llmModel: document.getElementById('llmModel'),
    successModal: document.getElementById('successModal'),
    successMessage: document.getElementById('successMessage'),
    successOkBtn: document.getElementById('successOkBtn'),
    errorModal: document.getElementById('errorModal'),
    errorMessage: document.getElementById('errorMessage'),
    errorOkBtn: document.getElementById('errorOkBtn')
};

function formatTimestamp(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds - Math.floor(seconds)) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
}

function saveConfig() {
    localStorage.setItem('llmConfig', JSON.stringify(state.llmConfig));
}

function loadConfig() {
    const saved = localStorage.getItem('llmConfig');
    if (saved) {
        state.llmConfig = { ...state.llmConfig, ...JSON.parse(saved) };
    }
    updateLLMStatus();
}

function updateLLMStatus() {
    if (state.llmConfig.enabled) {
        elements.llmDot.classList.add('enabled');
        elements.llmText.classList.add('enabled');
        elements.llmText.textContent = `LLM: 已启用 (${state.llmConfig.provider})`;
    } else {
        elements.llmDot.classList.remove('enabled');
        elements.llmText.classList.remove('enabled');
        elements.llmText.textContent = 'LLM: 未启用';
    }
}

function handleFileSelect(file) {
    state.selectedFile = file;
    elements.fileName.textContent = file.name;
    elements.selectedFile.style.display = 'flex';
    elements.fileDrop.style.display = 'none';
    elements.generateBtn.disabled = false;
}

function clearFile() {
    state.selectedFile = null;
    elements.fileInput.value = '';
    elements.selectedFile.style.display = 'none';
    elements.fileDrop.style.display = 'block';
    elements.generateBtn.disabled = true;
    elements.subtitlesSection.style.display = 'none';
}

function updateProgress(value, step) {
    const steps = {
        starting: '准备中...',
        extracting: '提取音频...',
        transcribing: '识别语音...',
        creating_srt: '生成字幕...',
        editing: '编辑字幕...',
        completed: '完成!'
    };
    elements.progressBar.style.width = `${value}%`;
    elements.progressText.textContent = `${steps[step] || '处理中...'} (${value}%)`;
}

async function generateSubtitles() {
    elements.progressSection.style.display = 'block';
    elements.generateBtn.disabled = true;
    elements.subtitlesSection.style.display = 'none';

    updateProgress(0, 'starting');
    await sleep(500);

    updateProgress(20, 'extracting');
    await sleep(800);

    updateProgress(40, 'transcribing');
    await sleep(1500);

    state.subtitles = [
        { id: 1, start: 0, end: 3, text: '这是第一段字幕', selected: false },
        { id: 2, start: 3.5, end: 6, text: '这是第二段字幕', selected: false },
        { id: 3, start: 6.5, end: 10, text: '这是第三段字幕', selected: false }
    ];

    updateProgress(70, 'creating_srt');
    await sleep(500);

    updateProgress(80, 'editing');
    elements.progressSection.style.display = 'none';
    renderSubtitles();
    elements.subtitlesSection.style.display = 'block';
}

function renderSubtitles() {
    elements.subtitlesList.innerHTML = '';
    state.subtitles.forEach((sub, index) => {
        const item = document.createElement('div');
        item.className = `subtitle-item ${sub.selected ? 'selected' : ''}`;
        item.innerHTML = `
            <input type="checkbox" class="subtitle-checkbox" ${sub.selected ? 'checked' : ''} data-id="${sub.id}">
            <div class="subtitle-content">
                <div class="subtitle-time">${formatTimestamp(sub.start)} → ${formatTimestamp(sub.end)}</div>
                <input type="text" class="subtitle-text-input" value="${sub.text}" data-id="${sub.id}">
            </div>
        `;
        elements.subtitlesList.appendChild(item);
    });
}

function addSubtitle() {
    const lastEnd = state.subtitles.length > 0 ? state.subtitles[state.subtitles.length - 1].end : 0;
    const newSub = {
        id: Date.now(),
        start: lastEnd,
        end: lastEnd + 3,
        text: '新字幕',
        selected: false
    };
    state.subtitles.push(newSub);
    renderSubtitles();
}

function deleteSelected() {
    state.subtitles = state.subtitles.filter(s => !s.selected);
    renderSubtitles();
}

function generateSrtContent() {
    let srt = '';
    state.subtitles.forEach((sub, index) => {
        if (sub.text.trim()) {
            srt += `${index + 1}\n`;
            srt += `${formatTimestamp(sub.start)} --> ${formatTimestamp(sub.end)}\n`;
            srt += `${sub.text.trim()}\n\n`;
        }
    });
    return srt;
}

function downloadSrt() {
    const srtContent = generateSrtContent();
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fileName = state.selectedFile ? state.selectedFile.name.replace(/\.[^/.]+$/, '') + '.srt' : 'subtitles.srt';
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('字幕文件已保存！');
}

function showSuccess(message) {
    elements.successMessage.textContent = message;
    elements.successModal.style.display = 'flex';
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorModal.style.display = 'flex';
}

function openLLMModal() {
    elements.llmEnabled.checked = state.llmConfig.enabled;
    elements.llmProvider.value = state.llmConfig.provider;
    elements.llmApiKey.value = state.llmConfig.apiKey;
    elements.llmApiBase.value = state.llmConfig.apiBase;
    elements.llmModel.value = state.llmConfig.model;
    updateModelOptions();
    elements.llmModal.style.display = 'flex';
}

function closeLLMModal() {
    elements.llmModal.style.display = 'none';
}

function saveLLMConfig() {
    state.llmConfig.enabled = elements.llmEnabled.checked;
    state.llmConfig.provider = elements.llmProvider.value;
    state.llmConfig.apiKey = elements.llmApiKey.value;
    state.llmConfig.apiBase = elements.llmApiBase.value;
    state.llmConfig.model = elements.llmModel.value;
    saveConfig();
    updateLLMStatus();
    closeLLMModal();
}

function updateModelOptions() {
    const provider = elements.llmProvider.value;
    const models = {
        deepseek: ['deepseek-chat', 'deepseek-coder'],
        openai: ['gpt-4', 'gpt-3.5-turbo']
    };
    const apiBases = {
        deepseek: 'https://api.deepseek.com/v1',
        openai: 'https://api.openai.com/v1'
    };
    elements.llmApiBase.value = apiBases[provider] || '';
    elements.llmModel.innerHTML = '';
    (models[provider] || []).forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        elements.llmModel.appendChild(option);
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function initEventListeners() {
    elements.fileDrop.addEventListener('click', () => elements.fileInput.click());
    elements.fileDrop.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.fileDrop.classList.add('drag-over');
    });
    elements.fileDrop.addEventListener('dragleave', () => {
        elements.fileDrop.classList.remove('drag-over');
    });
    elements.fileDrop.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.fileDrop.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
    elements.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });
    elements.removeFile.addEventListener('click', clearFile);
    elements.generateBtn.addEventListener('click', generateSubtitles);
    elements.addSubtitleBtn.addEventListener('click', addSubtitle);
    elements.deleteSelectedBtn.addEventListener('click', deleteSelected);
    elements.saveSrtBtn.addEventListener('click', downloadSrt);
    elements.llmConfigBtn.addEventListener('click', openLLMModal);
    elements.llmModalClose.addEventListener('click', closeLLMModal);
    elements.llmCancelBtn.addEventListener('click', closeLLMModal);
    elements.llmSaveBtn.addEventListener('click', saveLLMConfig);
    elements.llmProvider.addEventListener('change', updateModelOptions);
    elements.successOkBtn.addEventListener('click', () => {
        elements.successModal.style.display = 'none';
    });
    elements.errorOkBtn.addEventListener('click', () => {
        elements.errorModal.style.display = 'none';
    });
    elements.subtitlesList.addEventListener('change', (e) => {
        if (e.target.classList.contains('subtitle-checkbox')) {
            const id = parseInt(e.target.dataset.id);
            const sub = state.subtitles.find(s => s.id === id);
            if (sub) {
                sub.selected = e.target.checked;
                renderSubtitles();
            }
        }
    });
    elements.subtitlesList.addEventListener('input', (e) => {
        if (e.target.classList.contains('subtitle-text-input')) {
            const id = parseInt(e.target.dataset.id);
            const sub = state.subtitles.find(s => s.id === id);
            if (sub) {
                sub.text = e.target.value;
            }
        }
    });
    elements.llmModal.addEventListener('click', (e) => {
        if (e.target === elements.llmModal) {
            closeLLMModal();
        }
    });
    elements.successModal.addEventListener('click', (e) => {
        if (e.target === elements.successModal) {
            elements.successModal.style.display = 'none';
        }
    });
    elements.errorModal.addEventListener('click', (e) => {
        if (e.target === elements.errorModal) {
            elements.errorModal.style.display = 'none';
        }
    });
}

function init() {
    loadConfig();
    initEventListeners();
}

init();
