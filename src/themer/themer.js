

function fetchAndLoadServerTheme(path) {
    socket.emit('get', 'themes/' + path + '.json', (data) => {
        if (data.success) {
            loadTheme(JSON.parse(data.data));
        } else {
            console.log("Failed to load theme:", data.error);
        }
    });
}

const domain_pages = {
    "educationperfect.com": "ep",
    "instructure.com": "canvas"
}

async function loadTheme(data) {
    var domain = window.location.hostname;
    // Remove subdomain
    if (domain.indexOf(".") !== domain.lastIndexOf(".")) {
        domain = domain.substring(domain.indexOf(".") + 1);
    }

    if (!domain in domain_pages) {
        console.log("No page config for domain:", domain);
        return;
    }
    var pageConfig = await new Promise((resolve, reject) => {
        socket.emit('get', 'pages/' + domain_pages[domain] + '.json', (data) => {
            if (data.success) {
                resolve(data.data);
            } else {
                reject(data.error);
            }
        });
    }).catch((err) => {
        console.log("Failed to load page config:", err);
    });

    pageConfig = JSON.parse(pageConfig);

    if (pageConfig.css) {
        var css = document.createElement("style");
        var cssText = "";
        
        for (var key in pageConfig.css) {
            var value = pageConfig.css[key];
            var cssKey = "";

            cssText += key + " {";
            
            for (var vKey in value) {
                var vValue = value[vKey];
                cssText += vKey + ": " + vValue + ";";
            }

            cssText += "}";
        }

        css.innerHTML = cssText;
        document.head.appendChild(css);
    }

    if (pageConfig.bindings) {
        for (var key in data) {
            var configKey = pageConfig.bindings[key];
            if (!configKey || !Array.isArray(configKey)) continue;
    
            for (var i = 0; i < configKey.length; i++) {
                var config = configKey[i];
                var type = config.type;
                var name = config.name;
                var value = data[key];
                if (!type || !name) return;

                document.documentElement.style.setProperty("--eduplex-" + key, value);
    
                if (type == "variable") {
                    runForOptionalArray(name, (n) => {
                        document.documentElement.style.setProperty(n, "var(--eduplex-" + key + ")");
                    });
                } else if (type == "element") {
                    runForOptionalArray(name, (n) => {
                        var css = config.css;

                        if (css)
                            runForOptionalArray(css, (c) => {
                                var cssKey = n + " {" + c + ": " + "var(--eduplex-" + key + ") !important; }";
                                var cssElement = document.createElement("style");
                                cssElement.innerHTML = cssKey;
                                document.head.appendChild(cssElement);
                                if (config.hard_override === true) {
                                    var elements = document.querySelectorAll(n);
                                    for (var i = 0; i < elements.length; i++) {
                                        elements[i].style.setProperty(c, value + " !important");
                                        console.log(elements[i], c, value)
                                    }
                                }
                            });

                        if (config.custom_css && Array.isArray(config.custom_css))
                            for (var cssKey in config.custom_css) {
                                var cssElement = document.createElement("style");
                                cssElement.innerHTML = n + " {" + cssKey + ": " + config.custom_css[cssKey] + " !important; }";
                                document.head.appendChild(cssElement);
                            }
                    });
                }
            }
        }
    }
}

fetchAndLoadServerTheme('mellow');

function runForOptionalArray(array, func) {
    if (!array || (!Array.isArray(array) && typeof array !== "string")) return;
    if (Array.isArray(array)) {
        for (var i = 0; i < array.length; i++) {
            func(array[i]);
        }
    } else {
        func(array);
    }
}

socket.emit('list', 'themes', (res) => {
    if (!res.success) return;

    const themes = res.data;
    var dropdown = $("<select></select>");
    for (var i = 0; i < themes.length; i++) {
        var theme = themes[i].replace(".json", "");
        var option = $("<option></option>");
        option.text(theme[0].toUpperCase() + theme.substring(1));
        option.val(theme);
        dropdown.append(option);
    }

    dropdown.css("position", "absolute");
    dropdown.css("top", "0");
    dropdown.css("right", "0");
    dropdown.css("z-index", "999");
    dropdown.css("background", "white");
    dropdown.css("padding", "5px");
    dropdown.css("border", "1px solid black");
    dropdown.css("border-radius", "5px");
    dropdown.css("font-size", "16px");
    dropdown.css("font-family", "sans-serif");
    dropdown.css("cursor", "pointer");

    dropdown.change(() => {
        fetchAndLoadServerTheme(dropdown.val());
    });

    $("body").append(dropdown);
});
