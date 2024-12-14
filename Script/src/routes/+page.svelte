<script>
    import { writable } from "svelte/store";
    import Periods from "./Periods.svelte";
    import Period from "./Period.svelte";
    import { fade } from "svelte/transition";
    import { persisted } from 'svelte-persisted-store'

    const started = writable(false);

    const defaultKeywords = { keywords: "final", version: "0.3.0" };
    export const settings = persisted('aeries-grades+-settings', { version: "0.3.0", zeros: "no", developer: "off", mode: "default", keywords: "final", edited: false });

    $: {
        if($settings.keywords != defaultKeywords.keywords && $settings.version == defaultKeywords.version) { 
            $settings.edited = true;
        }
    }

    $: {
        if($settings.version != defaultKeywords.version && $settings.edited == false) {
            $settings.keywords = defaultKeywords.keywords;
            $settings.version = defaultKeywords.version;
        }
    }

    let current = "";

    function start() {
        current = document.querySelector(".AeriesFullPageParentNavSubLinkMenu > .CurrentPage").innerText;

        $started = true;

        const main = document.getElementById("AeriesFullPageContent");

        onClassChange(main, () => {
            const page = document.getElementById("AeriesFullPageContent");

            open = page.className.includes("blur");
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
    <button transition:fade={{ duration: 100 }} on:click|preventDefault|stopPropagation={() => { main.click(); }} aria-label="Close Search" class="{$settings.mode == 'dark' ? 'bg-zinc-100 bg-opacity-25' : $settings.mode == 'light' ? 'bg-zinc-900 bg-opacity-25' : 'bg-zinc-900 dark:bg-zinc-100 bg-opacity-25 dark:bg-opacity-25 '} w-full h-full absolute z-10">

    </button>
{/if}

{#if current == "Gradebook"}
    <Periods started={started} {defaultKeywords} {settings}></Periods>
{:else if current == "Gradebook Details"}
    <Period started={started} {settings}></Period>
{/if}