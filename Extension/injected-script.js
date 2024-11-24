setInterval(() => {
    const element = document.querySelector(".CLICKNOW");

    if(element == undefined) return;

    element.classList.remove("CLICKNOW");

    const value = element.href;
    
    const parameter = value.substring(value.indexOf("('") + 2, value.indexOf("',''"));

    localStorage.setItem("navigating", "true");

    window.__doPostBack(parameter, '');
}, 100)