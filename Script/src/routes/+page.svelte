<script>
    import { writable } from "svelte/store";
    import Periods from "./Periods.svelte";
    import Period from "./Period.svelte";

    const started = writable(false);

    let current = "";

    function start() {
        current = document.querySelector(".AeriesFullPageParentNavSubLinkMenu > .CurrentPage").innerText;

        console.log("hi", current);

        $started = true;
    }

    /* adding tailwindcss and putting !important in everything breaks other things... so this tries to faithfully fix it with more tailwindcss lmao */
</script>

{#if !$started}
    <button style="display: none;" id="#start" on:click|preventDefault|stopPropagation={() => { start(); }}>Start</button>
{/if}

{#if current == "Gradebook"}
    <Periods started={started}></Periods>
{:else if current == "Gradebook Details"}
    <Period started={started}></Period>
{/if}