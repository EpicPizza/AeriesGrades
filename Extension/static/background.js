chrome.webNavigation.onCompleted.addListener(async (details) => {
    const tab = details.tabId;

    let now = await chrome.tabs.get(tab);

    if(!(now.url.startsWith("https://fremontusd.aeries.net/student/GradebookSummary.aspx") || now.url.startsWith("https://fremontusd.aeries.net/student/GradebookDetails.aspx"))) return;

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
        .then(() => console.log("script injected"));
})