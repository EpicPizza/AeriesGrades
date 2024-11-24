<script>
    import { getContext } from "svelte";
    import dnt from 'date-and-time';
    import { slide } from "svelte/transition";

    export let started;

    $: {
        if($started) {
            start();
        }
    }

    let edit = false;

    let categories = [];

    let period = {
        name: "",
        teacher: "",
        email: "",
        slot: "",
        letter: "",
        grade: 0,
        edit: 0,
    }

    function start() {
        if(localStorage.getItem("navigating") != "true"){
            document.location.href = location.href.substring(0, location.href.lastIndexOf("/") + 1) + "GradebookSummary.aspx";
            return;
        } else {
            localStorage.setItem("navigating", "false");
        }

        //ungodly scrapping
        period.name = document.querySelector('#ctl00_MainContent_subGBS_dlGN > [selected="selected"]').innerText;
        period.name = period.name.substring(period.name.indexOf("-") + 2);
        period.slot = period.name.substring(period.name.indexOf("-") + 2);
        period.name = period.name.substring(0, period.name.indexOf("-"));
        period.teacher = document.querySelector('#ctl00_MainContent_subGBS_lblTeacherName').innerText;
        period.teacher = period.teacher.toLowerCase();
        period.teacher = period.teacher.replace(period.teacher.charAt(0), period.teacher.charAt(0).toUpperCase());
        const segment = period.teacher.substring(period.teacher.indexOf(", "), period.teacher.indexOf(", ") + 3);
        period.teacher = period.teacher.replace(segment, segment.toUpperCase());
        period.email = document.querySelector('#ctl00_MainContent_subGBS_EMailTeacher').innerText;

        const assignments = [];

        document.querySelectorAll(".Card").forEach((card, i) => {
            const assignment = {};

            for(let j = 0; j < card.children.length; j++) {
                try {

                const child = card.children[j];

                if(child == undefined) return;

                if(child.className.includes("TextHeading") && 'innerText' in child) {
                    const title = child.innerText;

                    assignment.id = title.substring(0, title.indexOf("-") - 1);
                    assignment.name = title.substring(title.indexOf("-") + 2);
                }

                if(child.className.includes("TextSubSectionCategory") && 'innerText' in child) {
                    assignment.category = child.innerText.trim();
                }

                if(child.className.includes("InlineData") && 'innerText' in child) {
                    const section = child.innerText.replaceAll("\t", "").replaceAll("\n", "");

                    if(section.includes("Completed")) {
                        assignment.completed = section.substring(section.indexOf(":") + 2);
                    } else if(section.includes("Due")) {
                        assignment.due = section.substring(section.indexOf(":") + 2);
                    } 
                }

                if(child.className.includes("TextSubSection") && 'innerText' in child && 'innerText' in card) {
                    assignment.graded = card.innerText.includes("True");
                }

                if(child.className.includes("FullWidth") && 'innerText' in child && child.innerText.includes("Assigned")) {
                    const section = child.innerText.replaceAll("\t", "").replaceAll("\n", "");

                    assignment.assigned = section.substring(section.indexOf(":") + 2, section.indexOf("Due")).trim();
                }

                if(child.className.includes("FullWidth") && 'innerText' in child && child.children[0].title == "Long Description") {
                    assignment.description = child.innerText;
                }

                if(child.className.includes("RightSide") && 'innerText' in child) {
                    const scores = child.innerText.replaceAll("\t", "").replaceAll("\n\n", "\n").replaceAll("\n\n", "\n").replaceAll("\n\n", "\n").replaceAll("\n\n", "\n").replaceAll("\n\n", "\n").split("\n").filter((i) => i != '');

                    console.log(scores);

                    if(scores.length < 7 || scores[1].trim() == "" || scores[1].trim() == "NA") {
                        assignment.weighted = { score: 0, total: 0 };
                        assignment.actual = { score: 0, total: 0 };
                        assignment.edit = { score: null, total: 0 };
                        assignment.missing = false;

                        assignment.percent = -1;
                    } else if(scores[1].trim() == "Missing") {
                        assignment.weighted = { score: 0, total: 0 };
                        assignment.missing = true;
                        assignment.actual = { score: parseFloat(scores[5].trim()), total: 0 };
                        assignment.edit = { score: 0, total: 0 };

                        assignment.percent = 0;
                    } else {
                        assignment.weighted = { score: parseFloat(scores[1].trim()), total: 0 };
                        assignment.missing = false;
                        assignment.actual = { score: parseFloat(scores[5].trim()), total: 0 };
                        assignment.edit = { score: parseFloat(scores[1].trim()), total: 0 };

                        assignment.percent = parseFloat(scores[8].substring(0, scores[8].length - 1));
                    }

                    if(scores.length > 7) {
                        assignment.weighted.total = parseFloat(scores[3].trim());
                        assignment.actual.total = parseFloat(scores[7].trim());
                        assignment.edit.total = parseFloat(scores[3].trim());
                    }
                }

                } catch(e) {
                    console.log(e);
                }
            }

            assignment.open = false;

            assignment.fake = false;

            assignments.push(assignment);
        });

        for(let i = 0; i < assignments.length; i++) {
            const assignment = assignments[i];

            assignments[i].due = typeof assignment.due == 'string' && assignment.due != "" ? dnt.parse(assignment.due, "MM/DD/YYYY") : "n/a";
            assignments[i].completed = typeof assignment.completed == 'string' && assignment.completed != "" ? dnt.parse(assignment.completed, "MM/DD/YYYY") : "n/a";
            assignments[i].assigned = typeof assignment.assigned == 'string' && assignment.assigned != "" ? dnt.parse(assignment.assigned, "MM/DD/YYYY") : "n/a";
        }

        const sorting = new Map();

        assignments.forEach(assignment => {
            const category = sorting.get(assignment.category);

            if(category == undefined) {
                const newCategory = new Array();

                newCategory.push(assignment);

                sorting.set(assignment.category, newCategory);
            } else {
                category.push(assignment);
            }
        });

        if(document.querySelector("#ctl00_MainContent_subGBS_assignmentsView").children.length < 3) return;

        const table = document.querySelector("#ctl00_MainContent_subGBS_assignmentsView").children[3].children[0].children;

        for(let i = 0; i < table.length; i++) {
            const row = table[i]; 

            if(!row.id.includes("MainContent_subGBS_DataSummary")) continue;

            if(row.children[0].innerText.trim() == "Total") {
                period.letter = row.children[5].innerText.trim();
                period.grade = parseFloat(row.children[4].innerText.trim().substring(0, row.children[4].innerText.length - 1));
                period.edit = parseFloat(row.children[4].innerText.trim().substring(0, row.children[4].innerText.length - 1));;
            } else {
                const category = {
                    name: row.children[0].innerText.trim(),
                    weight: parseFloat(row.children[1].innerText.trim().substring(0, row.children[1].innerText.trim().length - 1)),
                    points: parseFloat(row.children[2].innerText.trim()),
                    total: parseFloat(row.children[3].innerText.trim()),
                    percent: parseFloat(row.children[4].innerText.trim().substring(0, row.children[4].innerText.trim().length - 1)),
                    letter: row.children[5].innerText.trim(),
                    assignments: sorting.get(row.children[0].innerText.trim()) ?? new Array(),
                    fake: false,
                };

                category.edit = {
                    points: category.points,
                    total: category.total,
                    weight: category.weight,
                    percent: category.percent,
                }

                categories.push(category);
            }
        }
    }

    let width = 0;

    $: {
        let percent = 0;
        let totalPercent = 0;

        categories.forEach((category, i) => {
            let points = 0;
            let total = 0;

            category.assignments.forEach(assignment => {
                //type coerce strikes again
                if((assignment.edit.score || assignment.edit.score === 0) && assignment.edit.total) {
                    points += parseFloat(assignment.edit.score);
                    total += parseFloat(assignment.edit.total);
                } else if(assignment.edit.score && assignment.edit.total === 0) {
                    points += parseFloat(assignment.edit.score);
                }
            });

            categories[i].edit.points = points;
            categories[i].edit.total = total;
            categories[i].edit.percent = points / total * 100;

            const weight = parseFloat(category.edit.weight);

            if(total != 0) {
                percent += (points / total) * (weight / 100);
                totalPercent += (weight / 100);
            }
        })

        period.edit = (percent / totalPercent) * 100;
    }
</script>

<div bind:clientWidth={width} class="p-8 bg-white dark:bg-black text-black dark:text-white h-full w-full">
    <div class="flex items-center justify-between">
        <a class="px-4 py-3 rounded-md bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10 " href={location.href.substring(0, location.href.lastIndexOf("/") + 1) + "GradebookSummary.aspx"}>
            <div class="inline-block -mt-2 translate-y-2 scale-90 mr-1 fill-black dark:fill-white">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z"/></svg>
            </div>
            All Grades
        </a>
        <button on:click|preventDefault={() => { edit = !edit; }} class="px-4 py-3 transition-all rounded-md bg-black dark:bg-white {edit ? "text-white dark:text-black" : "bg-opacity-10 dark:bg-opacity-10"}">
            <div class="inline-block translate-y-2 -mt-2 scale-75 mr-1 {edit ? "fill-white dark:fill-black" : "fill-black dark:fill-white"}">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
            </div>
            Edit
        </button>
    </div>

    <div class="flex items-center justify-between mb-2 mt-8">
        <h1 class="text-3xl">{period.name}</h1>
        {#if edit}
            <div class="flex items-center">
                {#if Math.floor(period.edit * 100) / 100 != period.grade}
                    <div class="scale-[.65] fill-black dark:fill-white">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
                    </div>
                {/if}
                <p class="text-2xl font-bold {period.edit >= 90 ? "text-green-700 dark:text-green-400" : period.edit >= 80 ? "text-yellow-700 dark:text-yellow-400" : period.edit >= 70 ? "text-orange-500 dark:text-orange-400" : period.edit > 0 ? "text-red-700 dark:text-red-400" : "text-black dark:text-white" }">{Math.floor(period.edit * 100) / 100}%</p>
            </div>
        {:else}
            <p class="text-2xl font-bold {period.grade >= 90 ? "text-green-700 dark:text-green-400" : period.grade >= 80 ? "text-yellow-700 dark:text-yellow-400" : period.grade >= 70 ? "text-orange-500 dark:text-orange-400" : period.grade > 0 ? "text-red-700 dark:text-red-400" : "text-black dark:text-white" }">{period.letter} ({period.grade}%)</p>
        {/if}   
    </div>

    <div class="flex flex-wrap items-center mb-4">
        <p>{period.slot}</p>
        <div class="h-1.5 w-1.5 bg-black dark:bg-white rounded-full mx-2"></div>
        <p>{period.teacher}</p>
        <div class="h-1.5 w-1.5 bg-black dark:bg-white rounded-full mx-2"></div>
        <p>{period.email}</p>
    </div>

    <!-- Cannot use .grid since it will collide with another grid with class .grid aeries uses for dashboard. -->
    {#each categories as category, j}
        {#if category.fake == false || edit}
            <div class="border-b z-10 sticky top-0 px-4 bg-white dark:bg-black border-border-light dark:border-border-dark border-gray-300 dark:border-gray-700 p-5 pt-4">
                <div class="mb-3 flex -ml-4 -mr-4 items-center justify-between h-8">
                    {#if edit}
                        <div class="flex items-center">
                            <h1 class="text-xl font-extrabold tracking-wide">
                                {#if category.fake}
                                    <input bind:value={category.name} placeholder="Untitled" class="w-48 px-2 rounded-md py-1 -my-1 mr-1 text-left bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10">(
                                {:else}
                                    {category.name} (
                                {/if}
                                <input bind:value={category.edit.weight} class="w-16 px-2 rounded-md py-1 -my-1 text-center bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10">
                            /%)</h1>
                            {#if category.fake}
                                <button aria-label="Delete" on:click|preventDefault|stopPropagation={() => { categories.splice(j, 1); categories = categories; }} class="scale-75 fill-black dark:fill-white -my-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                                </button>
                            {:else if category.weight != category.edit.weight}
                                <button aria-label="Reset" on:click|preventDefault|stopPropagation={() => { category.edit.weight = category.weight; }} class="scale-75 fill-black dark:fill-white -my-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg>
                                </button>
                            {/if}
                        </div>
                    {:else}
                        <h1 class="text-xl font-extrabold tracking-wide">{category.name} ({category.weight}%)</h1>
                    {/if}
                    <div class="text-right">
                        {#if isNaN(category.edit.percent)}
                            <p class="text-lg font-bold text-black dark:text-white">No Grade</p>
                        {:else if category.edit.total == 0}
                            <p class="text-lg font-bold text-black dark:text-white">Invalid</p>
                        {:else}
                            {#if edit}
                                <div class="flex items-center">
                                    {#if category.edit.points != category.points || category.edit.total != category.total}
                                        <div class="scale-[.65] fill-black dark:fill-white">
                                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
                                        </div>
                                    {/if}
                                    <p class="text-lg font-bold {category.edit.percent >= 90 ? "text-green-700 dark:text-green-400" : category.edit.percent >= 80 ? "text-yellow-700 dark:text-yellow-400" : category.edit.percent >= 70 ? "text-orange-500 dark:text-orange-400" : category.edit.percent > 0 ? "text-red-700 dark:text-red-400" : "text-black dark:text-white" }">{category.edit.percent.toFixed(2)}% ({category.edit.points}/{category.edit.total})</p>
                                </div>
                            {:else}     
                                <p class="text-lg font-bold {category.percent >= 90 ? "text-green-700 dark:text-green-400" : category.percent >= 80 ? "text-yellow-700 dark:text-yellow-400" : category.percent >= 70 ? "text-orange-500 dark:text-orange-400" : category.percent > 0 ? "text-red-700 dark:text-red-400" : "text-black dark:text-white" }">{category.percent}% ({category.points}/{category.total})</p>
                            {/if}
                        {/if}
                    </div>
                </div>
                <div class="opacity-75 flex items-center -mb-2.5">
                    {#if width > 1000}
                        <p class="w-[40%]">Name</p>
                        <p class="w-[15%]">Due</p>
                        <p class="w-[15%]">Completed</p>
                        <p class="w-[10%]">Percent</p>
                        <p class="w-[20%]">
                            Score
                            {#if !edit}
                                <span class="text-sm opacity-80 ml-0.5">(Actual)</span>
                            {/if}
                        </p>
                    {:else if width > 800}
                        <p class="w-1/3">Name</p>
                        <p class="w-1/5">Due</p>
                        <p class="w-1/6">Percent</p>
                        <p class="w-1/6">
                            Score
                            {#if !edit}
                                <span class="text-sm opacity-80 ml-0.5">(Actual)</span>
                            {/if}
                        </p>
                    {:else if width > 640}
                        <p class="w-1/2">Name</p>
                        <p class="w-1/6">Perecent</p>
                        <p class="w-2/6">
                            Score
                            {#if !edit}
                                <span class="text-sm opacity-80 ml-0.5">(Actual)</span>
                            {/if}
                        </p>
                    {:else}
                        <p class="w-[62%]">Name</p>
                        <p class="w-[38%]">
                            Score
                            {#if !edit}
                                <span class="text-sm opacity-80 ml-0.5">(Actual)</span>
                            {/if}
                        </p>
                    {/if}
                </div>
            </div>
            
            <div class="mb-8">
                {#each category.assignments as assignment, i}
                    {#if assignment.fake == false}
                        <button on:click|preventDefault|stopPropagation={() => { assignment.open = !assignment.open; }} class="w-full px-4 text-left mt-2 {assignment.missing && (!edit || (assignment.edit.score == 0)) ? "bg-red-500 dark:bg-red-500 bg-opacity-20 dark:bg-opacity-20" : "bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10"} rounded-md p-3">
                            <div class="flex items-center">
                                {#if width > 1000}
                                    <p class="w-[40%] pr-4">{assignment.name}{assignment.missing && (!edit || (assignment.edit.score == 0)) ? " - Missing" : ""}</p>
                                    <p class="w-[15%]">{assignment.due == "n/a" ? "" : dnt.format(assignment.due, "MM/DD/YYYY")}</p>
                                    <p class="w-[15%]">{assignment.completed == "n/a" ? "" : dnt.format(assignment.completed, "MM/DD/YYYY")}</p>
                                    <p class="w-[10%]">
                                        {#if edit}
                                            {!(assignment.edit.score || assignment.edit.score === 0) || !assignment.edit.total ? "" : (assignment.edit.score / assignment.edit.total * 100).toFixed(2) + "%"}
                                        {:else}
                                            {assignment.percent == -1 || assignment.weighted.total == 0 ? "" : assignment.percent + "%"}
                                        {/if}
                                    </p>
                                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                    <div on:click|stopPropagation|preventDefault class="w-[20%] {edit ? "p-1.5 -my-1.5" : ""}">
                                        {#if edit}
                                            <div class="flex items-center">
                                                <div class="bg-black w-fit h-full dark:bg-white bg-opacity-10 dark:bg-opacity-10 rounded-md">
                                                    <input bind:value={assignment.edit.score} class="w-10 text-right mx-[0.22rem] bg-white bg-opacity-0">/
                                                    <input bind:value={assignment.edit.total} class="w-10 text-left mr-[0.22rem] bg-white bg-opacity-0">
                                                </div>
                                                {#if ((assignment.edit.score != assignment.weighted.score && assignment.percent != -1) || (assignment.edit.score > 0 && assignment.percent == -1)) || assignment.edit.total != assignment.weighted.total }
                                                    <!-- svelte-ignore node_invalid_placement_ssr -->
                                                    <button aria-label="Reset" on:click={() => {
                                                        if(assignment.percent != -1) {
                                                            assignment.edit.score = assignment.weighted.score; 
                                                            assignment.edit.total = assignment.weighted.total;
                                                        } else {
                                                            assignment.edit.score = "";
                                                            assignment.edit.total = assignment.weighted.total;
                                                        }
                                                    }} class="scale-75 mr-2 fill-black dark:fill-white -my-0.5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg>
                                                    </button>
                                                {/if}
                                            </div>
                                        {:else}
                                            {#if assignment.percent == -1 && assignment.weighted.total == 0}
                                                - / -
                                            {:else}
                                                {assignment.percent == -1 ? "-" : assignment.weighted.score}/{assignment.weighted.total}
                                                {#if assignment.weighted.total != assignment.actual.total}
                                                    <span class="text-sm opacity-80 ml-0.5">
                                                        ({assignment.percent == -1 ? "-" : assignment.actual.score}/{assignment.actual.total})      
                                                    </span>
                                                {/if}
                                            {/if}
                                        {/if}
                                    </div>
                                {:else if width > 800}
                                    <p class="w-1/3 pr-4">{assignment.name}{assignment.missing && (!edit || (assignment.edit.score == 0)) ? " - Missing" : ""}</p>
                                    <p class="w-1/5">{assignment.due == "n/a" ? "" : dnt.format(assignment.due, "MM/DD/YYYY")}</p>
                                    <p class="w-1/6">
                                        {#if edit}
                                            {!(assignment.edit.score || assignment.edit.score === 0) || !assignment.edit.total ? "" : (assignment.edit.score / assignment.edit.total * 100).toFixed(2) + "%"}
                                        {:else}
                                            {assignment.percent == -1 || assignment.weighted.total == 0 ? "" : assignment.percent + "%"}
                                        {/if}
                                    </p>
                                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                    <div on:click|stopPropagation|preventDefault class="w-1/5 {edit ? "p-1.5 -my-1.5" : ""}">
                                        {#if edit}
                                            <div class="flex items-center">
                                                <div class="bg-black w-fit h-full dark:bg-white bg-opacity-10 dark:bg-opacity-10 rounded-md">
                                                    <input bind:value={assignment.edit.score} class="w-10 text-right mx-[0.22rem] bg-white bg-opacity-0">/
                                                    <input bind:value={assignment.edit.total} class="w-10 text-left mr-[0.22rem] bg-white bg-opacity-0">
                                                </div>
                                                {#if ((assignment.edit.score != assignment.weighted.score && assignment.percent != -1) || (assignment.edit.score > 0 && assignment.percent == -1)) || assignment.edit.total != assignment.weighted.total }
                                                    <!-- svelte-ignore node_invalid_placement_ssr -->
                                                    <button aria-label="Reset" on:click={() => {
                                                        if(assignment.percent != -1) {
                                                            assignment.edit.score = assignment.weighted.score; 
                                                            assignment.edit.total = assignment.weighted.total;
                                                        } else {
                                                            assignment.edit.score = "";
                                                            assignment.edit.total = assignment.weighted.total;
                                                        }
                                                    }} class="scale-75 mr-2 fill-black dark:fill-white -my-0.5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg>
                                                    </button>
                                                {/if}
                                            </div>
                                        {:else}
                                            {#if assignment.percent == -1 && assignment.weighted.total == 0}
                                                - / -
                                            {:else}
                                                {assignment.percent == -1 ? "-" : assignment.weighted.score}/{assignment.weighted.total}
                                                {#if assignment.weighted.total != assignment.actual.total}
                                                    <span class="text-sm opacity-80 ml-0.5">
                                                        ({assignment.percent == -1 ? "-" : assignment.actual.score}/{assignment.actual.total})      
                                                    </span>
                                                {/if}
                                            {/if}
                                        {/if}
                                    </div>
                                {:else if width > 640}
                                    <p class="w-1/2 pr-4">{assignment.name}{assignment.missing && (!edit || (assignment.edit.score == 0)) ? " - Missing" : ""}</p>
                                    <p class="w-1/6">
                                        {#if edit}
                                            {!(assignment.edit.score || assignment.edit.score === 0) || !assignment.edit.total ? "" : (assignment.edit.score / assignment.edit.total * 100).toFixed(2) + "%"}
                                        {:else}
                                            {assignment.percent == -1 || assignment.weighted.total == 0 ? "" : assignment.percent + "%"}
                                        {/if}
                                    </p>
                                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                    <div on:click|stopPropagation|preventDefault class="w-2/6 {edit ? "p-1.5 -my-1.5" : ""}">
                                        {#if edit}
                                            <div class="flex items-center">
                                                <div class="bg-black w-fit h-full dark:bg-white bg-opacity-10 dark:bg-opacity-10 rounded-md">
                                                    <input bind:value={assignment.edit.score} class="w-10 text-right mx-[0.22rem] bg-white bg-opacity-0">/
                                                    <input bind:value={assignment.edit.total} class="w-10 text-left mr-[0.22rem] bg-white bg-opacity-0">
                                                </div>
                                                {#if ((assignment.edit.score != assignment.weighted.score && assignment.percent != -1) || (assignment.edit.score > 0 && assignment.percent == -1)) || assignment.edit.total != assignment.weighted.total }
                                                    <!-- svelte-ignore node_invalid_placement_ssr -->
                                                    <button aria-label="Reset" on:click={() => {
                                                        if(assignment.percent != -1) {
                                                            assignment.edit.score = assignment.weighted.score; 
                                                            assignment.edit.total = assignment.weighted.total;
                                                        } else {
                                                            assignment.edit.score = "";
                                                            assignment.edit.total = assignment.weighted.total;
                                                        }
                                                    }} class="scale-75 mr-2 fill-black dark:fill-white -my-0.5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg>
                                                    </button>
                                                {/if}
                                            </div>
                                        {:else}
                                            {#if assignment.percent == -1 && assignment.weighted.total == 0}
                                                - / -
                                            {:else}
                                                {assignment.percent == -1 ? "-" : assignment.weighted.score}/{assignment.weighted.total}
                                                {#if assignment.weighted.total != assignment.actual.total}
                                                    <span class="text-sm opacity-80 ml-0.5">
                                                        ({assignment.percent == -1 ? "-" : assignment.actual.score}/{assignment.actual.total})      
                                                    </span>
                                                {/if}
                                            {/if}
                                        {/if}
                                    </div>
                                {:else}
                                    <p class="w-[62%] pr-4">{assignment.name}{assignment.missing && (!edit || (assignment.edit.score == 0)) ? " - Missing" : ""}</p>
                                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                    <div on:click|stopPropagation|preventDefault class="w-[38%] {edit ? "p-1.5 -my-1.5" : ""}">
                                        {#if edit}
                                            <div class="flex items-center">
                                                <div class="bg-black w-fit h-full dark:bg-white bg-opacity-10 dark:bg-opacity-10 rounded-md">
                                                    <input bind:value={assignment.edit.score} class="w-10 text-right mx-[0.22rem] bg-white bg-opacity-0">/
                                                    <input bind:value={assignment.edit.total} class="w-10 text-left mr-[0.22rem] bg-white bg-opacity-0">
                                                </div>
                                                {#if ((assignment.edit.score != assignment.weighted.score && assignment.percent != -1) || (assignment.edit.score > 0 && assignment.percent == -1)) || assignment.edit.total != assignment.weighted.total }
                                                    <!-- svelte-ignore node_invalid_placement_ssr -->
                                                    <button aria-label="Reset" on:click={() => {
                                                        if(assignment.percent != -1) {
                                                            assignment.edit.score = assignment.weighted.score; 
                                                            assignment.edit.total = assignment.weighted.total;
                                                        } else {
                                                            assignment.edit.score = "";
                                                            assignment.edit.total = assignment.weighted.total;
                                                        }
                                                    }} class="scale-75 mr-2 fill-black dark:fill-white -my-0.5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg>
                                                    </button>
                                                {/if}
                                            </div>
                                        {:else}
                                            {#if assignment.percent == -1 && assignment.weighted.total == 0}
                                                - / -
                                            {:else}
                                                {assignment.percent == -1 ? "-" : assignment.weighted.score}/{assignment.weighted.total}
                                                {#if assignment.weighted.total != assignment.actual.total}
                                                    <span class="text-sm opacity-80 ml-0.5">
                                                        ({assignment.percent == -1 ? "-" : assignment.actual.score}/{assignment.actual.total})      
                                                    </span>
                                                {/if}
                                            {/if}
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                            {#if assignment.open}
                                <div transition:slide>
                                    <div class="w-full h-2"></div>
                                    <hr class="border-gray-300 dark:border-gray-700">
                                    <div class="flex flex-wrap items-center mt-2">
                                        {#if assignment.assigned != "n/a"}
                                            <p>Assigned {dnt.format(assignment.assigned, "MM/DD/YYYY")}</p>
                                            {#if width <= 1000} 
                                                <div class="h-1.5 w-1.5 bg-black dark:bg-white rounded-full mx-2"></div>
                                            {/if}
                                        {/if}
                                        {#if assignment.due != "n/a" && width < 1000}
                                            <p>Due {dnt.format(assignment.due, "MM/DD/YYYY")}</p>
                                            {#if width <= 800} 
                                                <div class="h-1.5 w-1.5 bg-black dark:bg-white rounded-full mx-2"></div>
                                            {/if}
                                        {/if}
                                        {#if assignment.completed != "n/a" && width <= 800}
                                            <p>Completed {dnt.format(assignment.completed, "MM/DD/YYYY")}</p>
                                            {#if width <= 640} 
                                                <div class="h-1.5 w-1.5 bg-black dark:bg-white rounded-full mx-2"></div>
                                            {/if}
                                        {/if}
                                        {#if assignment.percent != -1 && width <= 640}
                                            <p>Scored {assignment.percent + "%"}</p>
                                        {/if}
                                    </div>
                                    {#if assignment.description.trim() != ""}
                                        <p class="pt-2">
                                            {assignment.description}
                                        </p>
                                    {/if}
                                </div>
                            {/if}
                        </button>
                    {:else if edit}
                        <div class="w-full px-4 text-left mt-2 flex bg-black dark:bg-white rounded-md bg-opacity-10 dark:bg-opacity-10 p-3">
                            {#if width > 1000}
                                <p class="w-[40%]">
                                    <input bind:value={assignment.name} placeholder="Untitled" class="w-full bg-white bg-opacity-0">
                                </p>
                                <div class="w-[15%]"></div>
                                <div class="w-[15%]"></div>
                                <p class="w-[10%]">
                                    {!assignment.edit.score || (assignment.edit.total == "0" || assignment.edit.total == 0) ? "" : (assignment.edit.score / assignment.edit.total * 100).toFixed(2) + "%"}
                                </p>
                                <div class="w-[20%] pl-2 flex items-center justify-between">
                                    <div class="bg-black w-fit h-full flex dark:bg-white bg-opacity-10 dark:bg-opacity-10 rounded-md">
                                        <input bind:value={assignment.edit.score} class="w-10 text-right mx-[0.22rem] bg-white bg-opacity-0">/
                                        <input bind:value={assignment.edit.total} class="w-10 text-left mx-[0.22rem] bg-white bg-opacity-0">
                                    </div>
                                    <button aria-label="Delete" on:click|preventDefault|stopPropagation={() => { category.assignments.splice(i, 1); categories = categories; }} class="scale-75 fill-black dark:fill-white -my-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                                    </button>
                                </div>
                            {:else if width > 800}
                                <p class="w-1/3">
                                    <input bind:value={assignment.name} placeholder="Untitled" class="w-full bg-white bg-opacity-0">
                                </p>
                                <div class="w-1/5"></div>
                                <p class="w-1/6">
                                    {!assignment.edit.score || (assignment.edit.total == "0" || assignment.edit.total == 0) ? "" : (assignment.edit.score / assignment.edit.total * 100).toFixed(2) + "%"}
                                </p>
                                <div class="w-[30%] pl-2 flex items-center justify-between">
                                    <div class="bg-black w-fit h-full flex dark:bg-white bg-opacity-10 dark:bg-opacity-10 rounded-md">
                                        <input bind:value={assignment.edit.score} class="w-10 text-right mx-[0.22rem] bg-white bg-opacity-0">/
                                        <input bind:value={assignment.edit.total} class="w-10 text-left mx-[0.22rem] bg-white bg-opacity-0">
                                    </div>
                                    <button aria-label="Delete" on:click|preventDefault|stopPropagation={() => { category.assignments.splice(i, 1); categories = categories; }} class="scale-75 fill-black dark:fill-white -my-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                                    </button>
                                </div>
                            {:else if width > 640}
                                <p class="w-1/2">
                                    <input bind:value={assignment.name} placeholder="Untitled" class="w-full bg-white bg-opacity-0">
                                </p>
                                <p class="w-1/6">
                                    {!assignment.edit.score || (assignment.edit.total == "0" || assignment.edit.total == 0) ? "" : (assignment.edit.score / assignment.edit.total * 100).toFixed(2) + "%"}
                                </p>
                                <div class="w-1/3 pl-2 flex items-center justify-between">
                                    <div class="bg-black w-fit h-full flex dark:bg-white bg-opacity-10 dark:bg-opacity-10 rounded-md">
                                        <input bind:value={assignment.edit.score} class="w-10 text-right mx-[0.22rem] bg-white bg-opacity-0">/
                                        <input bind:value={assignment.edit.total} class="w-10 text-left mx-[0.22rem] bg-white bg-opacity-0">
                                    </div>
                                    <button aria-label="Delete" on:click|preventDefault|stopPropagation={() => { category.assignments.splice(i, 1); categories = categories; }} class="scale-75 fill-black dark:fill-white -my-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                                    </button>
                                </div>
                            {:else}
                                <p class="w-[62%]">
                                    <input bind:value={assignment.name} placeholder="Untitled" class="w-full bg-white bg-opacity-0">
                                </p>
                                <div class="w-[38%] pl-2 flex items-center justify-between">
                                    <div class="bg-black w-fit h-full flex dark:bg-white bg-opacity-10 dark:bg-opacity-10 rounded-md">
                                        <input bind:value={assignment.edit.score} class="w-10 text-right mx-[0.22rem] bg-white bg-opacity-0">/
                                        <input bind:value={assignment.edit.total} class="w-10 text-left mx-[0.22rem] bg-white bg-opacity-0">
                                    </div>
                                    <button aria-label="Delete" on:click|preventDefault|stopPropagation={() => { category.assignments.splice(i, 1); categories = categories; }} class="scale-75 fill-black dark:fill-white -my-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                                    </button>
                                </div>
                            {/if}
                        </div>
                    {/if}
                {:else}
                    {#if !edit}
                        <p class="mt-4 text-lg font-bold text-red-700 dark:text-red-400">No Assignments</p>
                    {/if}
                {/each}
                {#if edit}
                    <button on:click|preventDefault|stopPropagation={() => { category.assignments.push({ edit: { score: 0, total: 0 }, percent: -1, name: "", fake: true }); categories = categories; }} class="w-full px-4 text-left mt-2 flex gap-1 bg-black dark:bg-white rounded-md bg-opacity-10 dark:bg-opacity-10 p-3">
                        <div class="scale-[.85] fill-black dark:fill-white">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>
                        </div>
                        Add
                    </button>
                {/if}
            </div>
        {/if}
    {/each}

    {#if edit}
        <button on:click|preventDefault|stopPropagation={() => { categories.push({ name: "", edit: { weight: 0, points: 0, total: 0, percent: 0}, assignments: [], fake: true  }); categories = categories; }} class="w-full px-4 text-left mt-12 flex gap-1 bg-black dark:bg-white rounded-md bg-opacity-10 dark:bg-opacity-10 p-3">
            <div class="scale-[.85] fill-black dark:fill-white">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>
            </div>
            Add Category
        </button>
    {/if}

    <div class="flex justify-between">
        <p class="mt-6 text-sm opacity-75">Please report any issues <a href="https://docs.google.com/forms/d/e/1FAIpQLScMri2JCO1lXSXup-gbzKg-5OaOeiDh8e_R09Zh0EU8z7J8qg/viewform" class="underline">here</a>.</p>
        <p class="mt-6 text-sm opacity-75">Aeries Grades+</p>
    </div>
</div>