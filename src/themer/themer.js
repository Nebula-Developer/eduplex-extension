

function fetchAndLoadServerTheme(path) {
    socket.emit('get', 'themes/' + path + '.json', (data) => {
        if (data.success) {
            loadTheme(data.data);
        } else {
            console.log("Failed to load theme:", data.error);
        }
    });
}

const domain_pages = {
    "educationperfect.com": "ep",
    "instructure.com": "canvas"
}

function loadTheme(data) {
    var domain = window.location.hostname;
    // Remove subdomain
    if (domain.indexOf(".") !== domain.lastIndexOf(".")) {
        domain = domain.substring(domain.indexOf(".") + 1);
    }

    if (domain in domain_pages) {
        console.log("%cLoading theme for domain " + domain_pages[domain], "color: #00ff00; font-size: 35px;");
    }
}

fetchAndLoadServerTheme('main');