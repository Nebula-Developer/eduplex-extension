

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
                if (!type || !name) continue;
                document.documentElement.style.setProperty("--eduplex-" + key, value);
    
                if (type == "variable") {
                    runForOptionalArray(name, (n) => {
                        document.documentElement.style.setProperty(n, "var(--eduplex-" + key + ")");
                    });
                } else if (type == "element") {
                    runForOptionalArray(name, (n) => {
                        // var elements = document.querySelectorAll(n);
                        var css = config.css;
                        if (css && !Array.isArray(css)) return;
    
                        // for (var k = 0; k < elements.length; k++) {
                        //     var element = elements[k];

                        //     if (css)
                        //         for (var l = 0; l < css.length; l++)
                        //             // element.style.setProperty(css[l], "var(--eduplex-" + key + ")");
                        //             document.documentElement.style.setProperty(css[l], "var(--eduplex-" + key + ") !important");

                        //     if (config.custom_css)
                        //         for (var cssKey in config.custom_css)
                        //             // element.style.setProperty(cssKey, config.custom_css[cssKey]);
                        //             document.documentElement.style.setProperty(cssKey, config.custom_css[cssKey]);
                        // }

                        if (css)
                            for (var l = 0; l < css.length; l++) {
                                var cssKey = n + " {" + css[l] + ": " + "var(--eduplex-" + key + ") !important; }";
                                var cssElement = document.createElement("style");
                                cssElement.innerHTML = cssKey;
                                console.log(cssKey);
                                document.head.appendChild(cssElement);
                            }

                        if (config.custom_css)
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

fetchAndLoadServerTheme('main');

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