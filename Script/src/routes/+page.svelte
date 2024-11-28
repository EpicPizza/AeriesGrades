<script>
    import { writable } from "svelte/store";
    import Periods from "./Periods.svelte";
    import Period from "./Period.svelte";
    import { fade } from "svelte/transition";

    const started = writable(false);

    let current = "";

    function start() {
        current = document.querySelector(".AeriesFullPageParentNavSubLinkMenu > .CurrentPage").innerText;

        console.log("hi", current);

        $started = true;

        const main = document.getElementById("AeriesFullPageContent");

        onClassChange(main, () => {
            open = !open;
        })
    }

    let open = false;
    
    function onClassChange(node, callback) {
        let lastClassString = node.classList.toString();

        const mutationObserver = new MutationObserver((mutationList) => {
            for (const item of mutationList) {
                if (item.attributeName == "class") {
                    const classString = node.classList.toString();

                    if (classString != lastClassString) {
                        callback(mutationObserver);
                        lastClassString = classString;
                        break;
                    }
                }
            }
        });

        mutationObserver.observe(node, { attributes: true });

        return mutationObserver;
    }
</script>

{#if !$started}
    <button style="display: none;" id="#start" on:click|preventDefault|stopPropagation={() => { start(); }}>Start</button>
{/if}

{#if open}
    <button transition:fade={{ duration: 100 }} on:click|preventDefault|stopPropagation={() => { main.click(); }} aria-label="Close Search" class="bg-black dark:bg-white w-full h-full bg-opacity-25 dark:bg-opacity-25 absolute z-10">

    </button>
{/if}

{#if current == "Gradebook"}
    <Periods started={started}></Periods>
{:else if current == "Gradebook Details"}
    <Period started={started}></Period>
{/if}