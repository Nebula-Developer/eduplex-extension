

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
    console.log(pageConfig, data);

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
            if (!configKey || !Array.isArray(configKey)) {
                console.log("No config for key:", key);
                continue;
            } else {
                console.log("Config for key:", key, "=", configKey);
            }
    
            for (var i = 0; i < configKey.length; i++) {
                var config = configKey[i];
                var type = config.type;
                var name = config.name;
                var value = data[key];
                if (!type || !name) continue;
                document.documentElement.style.setProperty("--eduplex-" + key, value);
    
                if (type == "variable") {
                    if (Array.isArray(name)) {
                        for (var j = 0; j < name.length; j++) {
                            var elements = document.querySelectorAll("[style*='var(--" + name[j] + ")']");
                            for (var k = 0; k < elements.length; k++) {
                                var element = elements[k];
                                var style = element.style;
                                var newStyle = style.cssText.replace("var(--" + name[j] + ")", "var(--eduplex-" + key + ")");
                                element.style = newStyle;
                            }
                        }
                    } else {
                        var elements = document.querySelectorAll("[style*='var(--" + name + ")']");
                        for (var j = 0; j < elements.length; j++) {
                            var element = elements[j];
                            var style = element.style;
                            var newStyle = style.cssText.replace("var(--" + name + ")", "var(--eduplex-" + key + ")");
                            element.style = newStyle;
                        }
                    }
                } else if (type == "element") {
                    if (Array.isArray(name)) {
                        for (var j = 0; j < name.length; j++) {
                            var elements = document.querySelectorAll(name[j]);
                            var css = config.css;
                            if (css && !Array.isArray(css)) continue;
        
                            for (var k = 0; k < elements.length; k++) {
                                var element = elements[k];
    
                                if (css) {
                                    for (var l = 0; l < css.length; l++) {
                                        element.style.setProperty(css[l], "var(--eduplex-" + key + ")");
                                    }
                                }
    
                                if (config.custom_css) {
                                    for (var customKey in config.custom_css) {
                                        var customValue = config.custom_css[customKey];
                                        element.style.setProperty(customKey, customValue);
                                        console.log(customKey, customValue);
                                    }
                                }
                            }
                        }
                    } else {
                        var elements = document.querySelectorAll(name);
                        var css = config.css;
                        if (css && !Array.isArray(css)) continue;
        
                        for (var j = 0; j < elements.length; j++) {
                            var element = elements[j];
                            if (css) {
                                for (var k = 0; k < css.length; k++) {
                                    element.style.setProperty(css[k], "var(--eduplex-" + key + ")");
                                }
                            }
    
                            if (config.custom_css) {
                                for (var customKey in config.custom_css) {
                                    var customValue = config.custom_css[customKey];
                                    element.style.setProperty(customKey, customValue);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

fetchAndLoadServerTheme('main');