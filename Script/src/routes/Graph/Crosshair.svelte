<script>
    import dnt from "date-and-time";
    
    export let xAccessorScaled;
    export let yAccessorScaled;
    export let xLabel;
    export let yLabel;
    export let innerHeight;
    export let mode;

    import * as d3 from "d3";

    const formatYLabel = d3.format(",.2f");
</script>

<g transform={`translate(${xAccessorScaled} 0)`}>
    <text
        class="{mode == 'dark' ? 'stroke-zinc-900' : mode == 'light' ? 'stroke-zinc-100' : 'stroke-zinc-100 dark:stroke-zinc-900'} font-bold stroke-[8]"
        y={innerHeight + 10}
        dy="0.8em"
        text-anchor="middle"
    >
        {dnt.format(new Date(xLabel), "MMM D")}
    </text>
    <text class="{mode == 'dark' ? 'fill-blue-400' : mode == 'light' ? 'fill-blue-700' : 'fill-blue-700 dark:fill-blue-400'} font-bold" y={innerHeight + 10} dy="0.8em" text-anchor="middle">
        {dnt.format(new Date(xLabel), "MMM D")}
    </text>
    <line
        class="{mode == 'dark' ? 'stroke-zinc-900' : mode == 'light' ? 'stroke-zinc-100' : 'stroke-zinc-100 dark:stroke-zinc-900'} stroke-[3]"
        x1={0}
        x2={0}
        y1={yAccessorScaled}
        y2={innerHeight}
    />
    <line class="{mode == 'dark' ? 'stroke-blue-400' : mode == 'light' ? 'stroke-blue-700' : 'stroke-blue-700 dark:stroke-blue-400'} stroke-1" x1={0} x2={0} y1={yAccessorScaled} y2={innerHeight} />
</g>

<g transform={`translate(0 ${yAccessorScaled})`}>
    <text  class="{mode == 'dark' ? 'stroke-zinc-900' : mode == 'light' ? 'stroke-zinc-100' : 'stroke-zinc-100 dark:stroke-zinc-900'} stroke-[8] font-bold" dx={-10} dy="0.34em" text-anchor="end">
        {formatYLabel(yLabel)}
    </text>
    <text class="{mode == 'dark' ? 'fill-blue-400' : mode == 'light' ? 'fill-blue-700' : 'fill-blue-700 dark:fill-blue-400'} font-bold" dx={-10} dy="0.34em" text-anchor="end">
        {formatYLabel(yLabel)}
    </text>
    <line class="{mode == 'dark' ? 'stroke-zinc-900' : mode == 'light' ? 'stroke-zinc-100' : 'stroke-zinc-100 dark:stroke-zinc-900'} stroke-[3]" x1={xAccessorScaled} x2={0} y1={0} y2={0} />
    <line  class="{mode == 'dark' ? 'stroke-blue-400' : mode == 'light' ? 'stroke-blue-700' : 'stroke-blue-700 dark:stroke-blue-400'} stroke-1" x1={xAccessorScaled} x2={0} y1={0} y2={0} />
</g>
