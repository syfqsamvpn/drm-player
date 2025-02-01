document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const player = new shaka.Player(video);

    // Play button functionality
    window.playVideo = function () {
        video.play();
    };

    // Pause button functionality
    window.pauseVideo = function () {
        video.pause();
    };

    // Restart button functionality
    window.restartVideo = function () {
        video.currentTime = 0;
        video.play();
    };

    // Load video functionality
    window.loadVideo = function () {
        const manifestUrl = document.getElementById('manifestUrl').value.trim();
        const keysInput = document.getElementById('keys').value.trim();
        const proxyInput = document.getElementById('proxy').value.trim();
        const headersInput = document.getElementById('headers').value.trim();

        if (!manifestUrl) {
            alert('Please enter a valid Manifest URL.');
            return;
        }

        const clearKeys = {};
        if (keysInput) {
            keysInput.split('\n').forEach(line => {
                const [kid, key] = line.split(':').map(item => item.trim());
                if (kid && key) clearKeys[kid] = key;
            });
        }

        let customHeaders = {};
        try {
            if (headersInput) {
                customHeaders = JSON.parse(headersInput);
            }
        } catch (error) {
            alert('Invalid JSON format for headers.');
            return;
        }

        let proxyConfig = {};
        if (proxyInput) {
            const proxyRegex = /^(http|https):\/\/(([^:]+):([^@]+)@)?([^:]+):(\d+)$/;
            const match = proxyRegex.exec(proxyInput);

            if (match) {
                const [_, protocol, username, password, host, port] = match;
                proxyConfig = {
                    protocol,
                    host,
                    port
                };

                if (username && password) {
                    const authHeader = btoa(`${username}:${password}`);
                    customHeaders["Proxy-Authorization"] = `Basic ${authHeader}`;
                }
            } else {
                alert('Invalid proxy format. Use http://ip:port or http://username:password@ip:port');
                return;
            }
        }

        player.configure({
            drm: { clearKeys: clearKeys },
            streaming: {
                retryParameters: { maxAttempts: 3 },
                customHeaders: customHeaders
            },
            networking: {
                proxyConfig: proxyConfig
            }
        });

        player.load(manifestUrl).then(() => {
            console.log('Video loaded successfully.');
            video.play();
        }).catch(error => {
            console.error('Error loading video:', error);
            alert('Failed to load video. Check the Manifest URL, DRM configuration, proxy, or headers.');
        });
    };
});