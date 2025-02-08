const darkModeToggle = document.getElementById('darkModeToggle');
const htmlElement = document.documentElement;
if (localStorage.getItem('darkMode') === 'true') {
    htmlElement.classList.add('dark');
}
darkModeToggle.addEventListener('click', () => {
    htmlElement.classList.toggle('dark');
    localStorage.setItem('darkMode', htmlElement.classList.contains('dark'));
});

function onPlayerErrorEvent(errorEvent) {
    onPlayerError(errorEvent.detail);
}
function onPlayerError(error) {
    console.error('Error code', error.code, 'object', error);
    alert('Error loading video: ' + error.message);
}
function onUIErrorEvent(errorEvent) {
    onPlayerError(errorEvent.detail);
}
function initFailed(errorEvent) {
    console.error('Unable to load the UI library!', errorEvent);
}

async function loadVideo() {
    const manifestUri = document.getElementById('manifestUrl').value.trim();
    const keysValue = document.getElementById('keys').value.trim();
    let clearKeys = {};
    if (keysValue && keysValue.includes(':')) {
        const [keyId, key] = keysValue.split(':').map(s => s.trim());
        if (keyId && key) {
            clearKeys[keyId] = key;
        }
    }
    const proxyUrl = document.getElementById('proxy').value.trim();
    const headersText = document.getElementById('headers').value.trim();
    let headers = {};
    if (headersText) {
        try {
            headers = JSON.parse(headersText);
        } catch (e) {
            headersText.split('\n').forEach(line => {
                const [headerKey, headerValue] = line.split(':').map(s => s.trim());
                if (headerKey && headerValue) headers[headerKey] = headerValue;
            });
        }
    }

    const video = document.getElementById('video');
    const ui = video['ui'];
    const controls = ui.getControls();
    const player = controls.getPlayer();
    window.player = player;
    window.ui = ui;

    player.setTextTrackVisibility(true);

    player.configure({
        drm: {
            clearKeys: clearKeys,
        },
        preferredTextLanguage: 'ms',
        abr: {
            defaultBandwidthEstimate: 7578,
            enabled: true,
            restrictions: {
                minHeight: 359,
                maxHeight: 1080
            }
        },
    });

    player.getNetworkingEngine().registerRequestFilter(function (type, request) {
        if (type === shaka.net.NetworkingEngine.RequestType.MANIFEST) {
            if (proxyUrl) {
                request.uris = [proxyUrl + encodeURIComponent(request.uris[0])];
            }
            Object.entries(headers).forEach(([headerKey, headerValue]) => {
                request.headers[headerKey] = headerValue;
            });
        }
    });

    player.addEventListener('error', onPlayerErrorEvent);
    controls.addEventListener('error', onUIErrorEvent);

    try {
        await player.load(manifestUri);
        console.log('The video has now been loaded!');
    } catch (error) {
        onPlayerError(error);
    }
}

function playVideo() {
    document.getElementById('video').play();
}
function pauseVideo() {
    document.getElementById('video').pause();
}
function restartVideo() {
    const video = document.getElementById('video');
    video.currentTime = 0;
    video.play();
}
