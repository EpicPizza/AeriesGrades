<script>
    //@ts-nocheck

    let classes = [];

    function start() {
        console.log("running?");

        document.querySelectorAll(".CardWithPeriod").forEach((card, i) => {
            console.log(card);

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

            for(let j = 0; j < card.children.length; j++) {
                const child = card.children[j];

                if(child == undefined) return;

                if(child.className.includes("Period") && 'innerText' in child) {
                    period.number = child.innerText;
                }

                if(child.className.includes("RightSide") && 'innerText' in child.children[1]) {
                    const info = child.children[1].innerText.split("\n");

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

                    child.id = "grabbing-eeeeeeeee-" + i;

                    period.grabber = "grabbing-eeeeeeeee-" + i;
                }

                

                if(child.className.includes("footer") && 'innerText' in child.children[1]) {

                    period.missing = parseInt(child.children[1].innerText);
                }
            }

            classes.push(period);

        });

        classes = classes.filter(period => period.letter != "N/A" );
    }
    
</script>

<div class="p-8 bg-white h-full w-full">
    <h1 class="mb-6 text-3xl">Gradebook</h1>

    <button style="display: none;" id="#start" on:click|preventDefault|stopPropagation={() => { start(); }}>Start</button>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
        {#each classes as period}
            <button on:click|preventDefault|stopPropagation={() => { document.getElementById(period.grabber).classList.add("CLICKNOW"); }} class="bg-black bg-opacity-10 rounded-lg p-6 w-full flex gap-2 text-left">
                <div class="w-full">
                    <p class="text-xl mb-2">{period.name}</p>
                    <p class="opacity-75 mb-1">{period.teacher}</p>
                    <p class="opacity-75">Missing Assignments: {period.missing}</p>
                </div>
                <div class="flex flex-col justify-around min-h-full">
                    <div class="flex flex-col items-center w-12 {period.grade >= 90 ? "text-green-600" : period.grade >= 80 ? "text-yellow-600" : period.grade > 0 ? "text-red-600" : "text-black" }">
                        <p class="text-2xl font-extrabold">{period.letter}</p>
                        <p class="font-bold">{period.grade}</p>
                    </div>
                </div>
            </button>
        {/each}
    </div>

    <div class="flex justify-between">
        <p class="mt-6 text-sm opacity-75">Please report any issues <span class="underline">here</span>.</p>
        <p class="mt-6 text-sm opacity-75">Aeries Grades+</p>
    </div>
</div>