chrome.webNavigation.onCommitted.addListener(async (details) => {
    const tab = details.tabId;

    let now = await chrome.tabs.get(tab);

    if(!(now.url.includes("GradebookSummary.aspx") || now.url.includes("GradebookDetails.aspx") || now.url.includes("Dashboard.aspx"))) return;

    chrome.scripting
        .executeScript({
        target : { tabId : tab },
            files : [ "script.js" ],
        })
        .then(() => console.log("script injected"));

    chrome.scripting
        .executeScript({
        target : { tabId : tab },
            files : [ "tailwindcss.js" ],
        })
        .then(() => console.log("tailwind injected"));
})