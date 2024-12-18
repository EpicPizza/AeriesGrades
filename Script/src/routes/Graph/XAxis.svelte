<script>
    import dnt from 'date-and-time';

    export let xScale;
    export let innerHeight;
    export let hoveredPoint;
    export let label;
    export let mode;

    const numberOfTicks = (pixelsAvailable, pixelsPerTick = 140) =>
        Math.floor(Math.abs(pixelsAvailable) / pixelsPerTick);

    $: [xMin, xMax] = xScale.range();

    $: ticks = xScale.ticks(numberOfTicks(xMax - xMin));
</script>

<g transform={`translate(0 ${innerHeight})`}>
    <line x1={xMin} x2={xMax} y1={0} y2={0} class="{mode == 'dark' ? 'stroke-zinc-700' : mode == 'light' ? 'stroke-zinc-400' : 'stroke-zinc-400 dark:stroke-zinc-700'}" />
    {#each ticks as tick}
        <g transform={`translate(${xScale(tick)} 0)`}>
            <line y1={0} y2={6} class={mode == 'dark' ? (hoveredPoint ? 'fill-zinc-600' : 'fill-zinc-300') : mode == 'light' ? (hoveredPoint ? 'fill-zinc-400' : 'fill-zinc-800') : (hoveredPoint ? 'fill-zinc-400 dark:fill-zinc-600' : 'fill-zinc-800 dark:fill-zinc-300')}  />
            <text
                y={10}
                dy="0.8em"
                text-anchor="middle"
                class={mode == 'dark' ? (hoveredPoint ? 'fill-zinc-600' : 'fill-zinc-300') : mode == 'light' ? (hoveredPoint ? 'fill-zinc-400' : 'fill-zinc-800') : (hoveredPoint ? 'fill-zinc-400 dark:fill-zinc-600' : 'fill-zinc-800 dark:fill-zinc-300')}
            >
                {dnt.format(new Date(tick), "MMM D")}
            </text>
        </g>
    {/each}
    <text x={xScale.range()[1] / 2} text-anchor="middle" y={45} class="{mode == 'dark' ? 'fill-zinc-300' : mode == 'light' ? 'fill-zinc-800' : 'fill-zinc-800 dark:fill-zinc-300'}">
        {label}
    </text>
</g>
