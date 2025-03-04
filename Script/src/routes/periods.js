export function scrapPeriods(doc) {
    const classes = [];
    const sets = [];

    doc.querySelectorAll(".CardWithPeriod").forEach((card, i) => {
        const period = {};

        for(let j = 0; j < card.childNodes.length; j++) {
            if(card.childNodes[j].nodeType == 3 && card.childNodes[j].nodeValue.replaceAll("\n", "").replaceAll("\t", "").trim() != "") {
                period.teacher = card.childNodes[j].nodeValue.replaceAll("\n", "").replaceAll("\t", "").trim();

                period.teacher = period.teacher.toLowerCase();
                period.teacher = period.teacher.replace("*", "");

                period.teacher = period.teacher.replace(period.teacher.charAt(0), period.teacher.charAt(0).toUpperCase());

                const segment = period.teacher.substring(period.teacher.indexOf(", "), period.teacher.indexOf(", ") + 3);

                period.teacher = period.teacher.replace(segment, segment.toUpperCase());
            }
        }

        period.term = card.parentElement.parentElement.previousElementSibling.children[3].innerText;
        period.number = card.parentElement.parentElement.previousElementSibling.children[4].innerText;

        for(let j = 0; j < card.children.length; j++) {
            const child = card.children[j];

            if(child == undefined) return;

            if(child.className.includes("Period") && 'innerText' in child) {
                period.number = child.innerText;
            }

            if(child.className.includes("RightSide") && 'innerText' in child.children[1]) {
                let info = child.children[1].innerText.replaceAll("\t", "").replaceAll("\n\n", "\n").replaceAll("\n\n", "\n").replaceAll("\n\n", "\n").replaceAll("\n\n", "\n").split("\n");

                info = info.filter((i) => i != "");

                if(info.length < 2) {
                    period.letter = "N/A";
                    period.grade = 0;
                } else {
                    period.letter = info[0];
                    period.grade = parseFloat(info[1].substring(1, info[1].length - 1));
                }
            }

            if(child.className.includes("TextHeading") && 'innerText' in child) {
                period.name = child.innerText;
            }

            if(child.className.includes("footer") && 'innerText' in child.children[1]) {

                period.missing = parseInt(child.children[1].innerText);
            }
        }

        const url = new URL(location.href.substring(0, location.href.lastIndexOf("/") + 1) + "GradebookDetails.aspx");
        url.searchParams.set("class", period.name);
        url.searchParams.set("term", period.term);
        url.searchParams.set("period", period.number);

        period.url = url.toString();

        classes.push(period);

    });

    let last = 0;
    let next = "Current Terms";

    doc.querySelectorAll(".SubHeaderRow").forEach((row) => {
        if(!row.id.includes("MainContent") || row.id.includes("01")) return;

        let index = parseInt(row.id.substring(row.id.indexOf("ails_ctl") + 8, row.id.indexOf("_tr"))) - 1;

        sets.push({
            label: next,
            classes: classes.slice(last, index),
        });

        last = index;
        next = row.innerText.trim();
    });

    sets.push({
        label: next,
        classes: classes.slice(last, classes.length),
    });

    return {
        classes: classes,
        sets: sets,
    }
}

let promise = null;

export async function getPeriods() {
    if(promise == null) {
        promise = fetchPeriods();
    }

    return await promise;
}  

export async function fetchPeriods() {
    let local = localStorage.getItem("classes");

    if(local != null) {
        local = JSON.parse(local);

        console.log(local);

        const name = await hashString(document.querySelector(".StudentName").innerText);
        const cachedName = local.name;

        if(new Date().valueOf() - local.timestamp < 60000 && name == cachedName) {
            return local.sets;
        }
    }

    const result = await fetch(location.href.substring(0, location.href.lastIndexOf("/") + 1) + "GradebookSummary.aspx");

    const data = await result.text();

    const parsed = scrapPeriods(new DOMParser().parseFromString(data, "text/html"));

    const name = await hashString(document.querySelector(".StudentName").innerText);

    localStorage.setItem("classes", JSON.stringify({
        sets: parsed.sets,
        timestamp: new Date().valueOf(),
        name: name,
    }));

    return parsed.sets;
}

async function hashString(str) {
    const utf8Encode = new TextEncoder();
    const data = utf8Encode.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((bytes) => bytes.toString(16).padStart(2, '0'))
      .join('');
    return hashHex;
}